[backon](https://github.com/Xuanwo/backon) is a Rust error retry library, and this article aims to share some techniques I used in implementing it.

```urlpreview
https://github.com/Xuanwo/backon
```

## Origin

When implementing the RetryLayer for [OpenDAL](https://github.com/datafuselabs/opendal), I needed to provide a backoff mechanism to implement features such as exponential backoff and jitter.

> Backoff is a technique used in computer science and networking to handle errors or congestion in a more efficient way. The basic idea is to progressively increase the time between retries when encountering an error or congestion, so that the system has time to recover and handle the issue without overwhelming it with requests.

Although I found [`backoff`](https://github.com/ihrwein/backoff) through a simple search, I wasn't quite satisfied. First, I noticed that the maintenance status of the library didn't seem to be good, with 4 unmerged PRs, and the main branch was last updated in 2021. Secondly, I didn't like the API it provided:

```rust
async fn fetch_url(url: &str) -> Result<String, reqwest::Error> {
    retry(ExponentialBackoff::default(), || async { fetch().await }).await
}
```

Backoff implementation isn't complicated, so why not make one that feels comfortable to use?

## Design

My first idea was to use an `Iterator<Item = Duration>` to represent the backoff. Any iterator that can return a `Duration` type can be used as backoff. Using an iterator to represent backoff has a very direct and clear meaning, and users can easily understand and implement it without reading every function's comments. Secondly, I wanted to provide a usage experience for backoff similar to Rust's native functions:

```rust
async fn fetch_url(url: &str) -> Result<String, reqwest::Error> {
  	fetch.retry(ExponentialBackoff::default()).await
}
```

It looks great: simple and direct, doesn't disrupt the user's reading order, and allows the user to locate the business logic position at a glance. Let's get started implementing it!

## Implementation

First of all, what we need to understand is that async functions in Rust are essentially generators. These generators capture variables from the current environment and generate an anonymous Future. To retry an async function, we need to call the generator again to generate a brand new Future to execute.

I once went down the wrong path with a failed demo for retry: [we can't retry a future directly](https://github.com/Xuanwo/backon/pull/1). At that time, I naively tried to retry a TryFuture directly:

```rust
pub trait Retryable<B: Policy, F: Fn(&Self::Error) -> bool>: TryFuture + Sized {
    fn retry(self, backoff: B, handle: F) -> Retry<Self, B, F>;
}
```

Now I understand that this approach is incorrect. Once a `Future` enters the `Poll::Ready` state, we should not poll it again, as documented:

> Once a future has completed (returned `Ready` from `poll`), calling its `poll` method again may panic, block forever, or cause other kinds of problems

Next, I needed to adjust my thinking and focus on implementing for `|| -> impl Future<Result<T>>`. First, I defined a `Retryable` trait and implemented it for all `FnMut() -> Fut` types:

```rust
pub trait Retryable<
    B: BackoffBuilder,
    T,
    E,
    Fut: Future<Output = Result<T, E>>,
    FutureFn: FnMut() -> Fut,
>
{
    /// Generate a new retry
    fn retry(self, builder: &B) -> Retry<B::Backoff, T, E, Fut, FutureFn>;
}

impl<B, T, E, Fut, FutureFn> Retryable<B, T, E, Fut, FutureFn> for FutureFn
where
    B: BackoffBuilder,
    Fut: Future<Output = Result<T, E>>,
    FutureFn: FnMut() -> Fut,
{
    fn retry(self, builder: &B) -> Retry<B::Backoff, T, E, Fut, FutureFn> {
        Retry::new(self, builder.build())
    }
}
```

This trait involves the following type parameters:

- `B: BackoffBuilder`: the backoff builder passed in by the user, which specifies different backoff parameters
- `FutureFn: FnMut() -> Fut`: indicates that its type is a function that returns a `Fut`
- `Fut: Future<Output = Result<T, E>>`: represents a Future that returns a `Result<T, E>`

The returned Retry struct wraps all of the above types:

```rust
pub struct Retry<B: Backoff, T, E, Fut: Future<Output = Result<T, E>>, FutureFn: FnMut() -> Fut> {
    backoff: B,
    retryable: fn(&E) -> bool,
    notify: fn(&E, Duration),
    future_fn: FutureFn,

    #[pin]
    state: State<T, E, Fut>,
}
```

Apart from `backoff` and `future_fn`, we introduced `retryable` and `notify` to implement retryable error checking and notification functions. Once the type system is clear, the next step is to implement the correct `Future` trait for `Retry`, and the details will not be elaborated:

```rust
impl<B, T, E, Fut, FutureFn> Future for Retry<B, T, E, Fut, FutureFn>
where
    B: Backoff,
    Fut: Future<Output = Result<T, E>>,
    FutureFn: FnMut() -> Fut,
{
    type Output = Result<T, E>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        ...
    }
}
```

In addition, there are some transactional tasks that need to be completed: we need to let users define which errors can be retried, and provide custom notification for retrying.

Finally, the combined effect is as follows:

```rust
#[tokio::main]
async fn main() -> Result<()> {
    let content = fetch
        .retry(&ExponentialBuilder::default())
  		.when(|e| e.to_string() == "EOF")
        .notify(|err, dur| {
            println!("retrying error {:?} with sleeping {:?}", err, dur);
        })
        .await?;

    Ok(())
}
```

Looks perfect!

## One More Thing

Oh, wait a minute, backon doesn't support synchronous functions yet! No problem, we just need to apply the same approach:

```rust
pub trait BlockingRetryable<B: BackoffBuilder, T, E, F: FnMut() -> Result<T, E>> {
    /// Generate a new retry
    fn retry(self, builder: &B) -> BlockingRetry<B::Backoff, T, E, F>;
}

impl<B, T, E, F> BlockingRetryable<B, T, E, F> for F
where
    B: BackoffBuilder,
    F: FnMut() -> Result<T, E>,
{
    fn retry(self, builder: &B) -> BlockingRetry<B::Backoff, T, E, F> {
        BlockingRetry::new(self, builder.build())
    }
}
```

Due to the unavailability of the [`fn_traits`](https://github.com/rust-lang/rust/issues/29625) feature, which is still unstable, I chose to add a new function to `BlockingRetry` instead:

```rust
impl<B, T, E, F> BlockingRetry<B, T, E, F>
where
    B: Backoff,
    F: FnMut() -> Result<T, E>,
{
  pub fn call(mut self) -> Result<T, E> {
	...
  }
}
```

It feels great to perform retry operations in the call function, and it also has a similar beauty to the Async version.

```rust
fn main() -> Result<()> {
    let content = fetch
        .retry(&ExponentialBuilder::default())
  		.when(|e| e.to_string() == "EOF")
        .notify(|err, dur| {
            println!("retrying error {:?} with sleeping {:?}", err, dur);
        })
        .call()?;

    Ok(())
}
```

In this article, I have shared the design and implementation of `backon`. Throughout the process, I have mainly used Rust's generics mechanisms, namely `FnMut() -> Fut` and `FnMut() -> Result<T, E>`, to create custom traits and add new functionality. I hope this implementation can inspire you to design more user-friendly library APIs.

Thank you for reading!
