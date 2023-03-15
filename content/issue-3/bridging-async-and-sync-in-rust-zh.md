> 在同步的 Rust 方法中调用异步代码经常会导致一些问题，特别是对于不熟悉异步 Rust runtime 底层原理的初学者。在本文中，我们将讨论我们遇到的一个特殊问题，并分享我们采取的解决方法的经验。

## 背景和问题

最近在做我们的 [GreptimeDB](https://greptime.com/) 项目的时候遇到一个关于在同步 Rust 方法中调用异步代码的问题。经过一系列故障排查后，我们弄清了问题的原委，这大大加深了对异步 Rust 的理解，因此在这篇文章中分享给大家，希望能给被相似问题困扰的 Rust 开发者一些启发。

我们的整个项目是基于 [Tokio](https://tokio.rs/) 这个异步 Rust runtime 的，它将协作式的任务运行和调度方便地封装在 `.await` 调用中，非常简洁优雅。但是这样也让不熟悉 Tokio 底层原理的用户一不小心就掉入到坑里。

我们遇到的问题是，需要在一个第三方库的 trait 实现中执行一些异步代码，而这个 trait 是同步的 `:sweat_smile:`，我们无法修改这个 trait 的定义。

```rust
trait Sequencer {
    fn generate(&self) -> Vec<i32>;
}
```

我们用一个`PlainSequencer` 来实现这个 trait ，而在实现 `generate` 方法的时候依赖一些异步的调用（比如这里的 `PlainSequencer::generate_async`）：

```rust
impl PlainSequencer {
    async fn generate_async(&self)->Vec<i32>{
        let mut res = vec![];
        for i in 0..self.bound {
            res.push(i);
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
        res
    }
}

impl Sequencer for PlainSequencer {
    fn generate(&self) -> Vec<i32> {
        self.generate_async().await
    }
}
```

这样就会出现问题，因为 `generate` 是一个同步方法，里面是不能直接 await 的。

```latex
error[E0728]: `await` is only allowed inside `async` functions and blocks
  --> src/common/tt.rs:32:30
   |
31 | /     fn generate(&self) -> Vec<i32> {
32 | |         self.generate_async().await
   | |                              ^^^^^^ only allowed inside `async` functions and blocks
33 | |     }
   | |_____- this is not `async`
```

我们首先想到的是，Tokio 的 runtime 有一个 `Runtime::block_on` 方法，可以同步地等待一个 future 完成。

```rust
impl Sequencer for PlainSequencer {
    fn generate(&self) -> Vec<i32> {
        RUNTIME.block_on(async{
            self.generate_async().await
        })
    }
}

#[cfg(test)]
mod tests{
    #[tokio::test]
    async fn test_sync_method() {
        let sequencer = PlainSequencer {
            bound: 3
        };
        let vec = sequencer.generate();
        println!("vec: {:?}", vec);
    }
}
```

编译可以通过，但是运行时直接报错：

```latex
thread 'tests::test_sync_method' panicked at 'Cannot start a runtime
from within a runtime. This happens because a function (like `block_on`)
attempted to block the current thread while the thread is being used
to drive asynchronous tasks.'
```

提示不能从一个执行中一个 runtime 直接启动另一个异步 runtime。看来 Tokio 为了避免这种情况特地在 `Runtime::block_on` 入口做了检查。
既然不行那我们就再看看其他的异步库是否有类似的异步转同步的方法。果然找到一个 `futures::executor::block_on`。

```rust
impl Sequencer for PlainSequencer {
    fn generate(&self) -> Vec<i32> {
        futures::executor::block_on(async {
            self.generate_async().await
        })
    }
}
```

编译同样没问题，但是运行时代码直接直接 hang 住不返回了。

```latex
cargo test --color=always --package tokio-demo --bin tt tests::test_sync_method --no-fail-fast -- --format=json --exact -Z unstable-options --show-output
   Compiling tokio-demo v0.1.0 (/Users/lei/Workspace/Rust/learning/tokio-demo)
    Finished test [unoptimized + debuginfo] target(s) in 0.39s
     Running unittests src/common/tt.rs (target/debug/deps/tt-adb10abca6625c07)
{ "type": "suite", "event": "started", "test_count": 1 }
{ "type": "test", "event": "started", "name": "tests::test_sync_method" }

# the execution just hangs here :(
```

明明 `generate_async` 方法里面只有一个简单的 `sleep()` 调用，但是为什么 future 一直没完成呢？

并且吊诡的是，同样的代码，在 `tokio::test` 里面会 hang 住，但是在 `tokio::main` 中则可以正常执行完毕：

```rust
#[tokio::main]
pub async fn main() {
    let sequencer = PlainSequencer {
        bound: 3
    };
    let vec = sequencer.generate();
    println!("vec: {:?}", vec);
}
```

执行结果：

```latex
cargo run --color=always --package tokio-demo --bin tt
    Finished dev [unoptimized + debuginfo] target(s) in 0.05s
     Running `target/debug/tt`
vec: [0, 1, 2]
```

> 其实当初真正遇到这个问题的时候定位到具体在哪里 hang 住并没有那么容易。真实代码中 async 执行的是一个远程的 gRPC 调用，当初怀疑过是否是 gRPC server 的问题，动用了网络抓包等等手段最终发现是 client 侧的问题。这也提醒了我们在**出现 bug 的时候，抽象出问题代码的执行模式并且做出一个最小可复现的样例（Minimal Reproducible Example）是非常重要的**。

## Catchup

在 Rust 中，一个异步的代码块会被 [`make_async_expr`](https://github.com/rust-lang/rust/blob/7e966bcd03f6d0fae41f58cf80bcb10566ab971a/compiler/rustc_ast_lowering/src/expr.rs#L585) 编译为一个实现了 `std::future::Future` 的 generator。

```Rust
#[tokio::test]
async fn test_future() {
    let future = async {
        println!("hello");
    };

    // the above async block won't get executed until we await it.
    future.await;
}
```

而 `.await` 本质上是一个语法糖，则会被 [lower_expr_await](https://github.com/rust-lang/rust/blob/7e966bcd03f6d0fae41f58cf80bcb10566ab971a/compiler/rustc_ast_lowering/src/expr.rs#L717) 编译成类似于下面的一个语法结构：

```Rust
// pseudo-rust code
match ::std::future::IntoFuture::into_future(<expr>) {
    mut __awaitee => loop {
        match unsafe { ::std::future::Future::poll(
            <::std::pin::Pin>::new_unchecked(&mut __awaitee),
            ::std::future::get_context(task_context),
        ) } {
            ::std::task::Poll::Ready(result) => break result,
            ::std::task::Poll::Pending => {}
        }
        task_context = yield ();
    }
}
```

在上面这个去掉了语法糖的伪代码中，可以看到有一个循环不停地检查 generator 的状态是否为已完成（`std::future::Future::poll`）。

自然地，必然存在一个组件来做这件事。这里就是 Tokio 和 [async-std](https://async.rs/) 这类异步运行时发挥作用的地方了。Rust 在设计之初就特意将异步的语法（async/await）和异步运行时的实现分开，在上述的示例代码中，poll 的操作是由 Tokio 的 executor 执行的。

## 问题分析

回顾完背景知识，我们再看一眼方法的实现：

```rust
fn generate(&self) -> Vec<i32> {
    futures::executor::block_on(async {
        self.generate_async().await
    })
}
```

调用 `generate` 方法的肯定是 Tokio 的 executor，那么 block_on 里面的 `self.generate_async().await` 这个 future 又是谁在 poll 呢？

一开始我以为，`futures::executor::block_on` 会有一个内部的 runtime 去负责 `generate_async` 的 poll。于是点进去[代码](https://docs.rs/futures-executor/0.3.6/src/futures_executor/local_pool.rs.html#77-104)（主要是`futures_executor::local_pool::run_executor`这个方法）：

```rust
fn run_executor<T, F: FnMut(&mut Context<'_>) -> Poll<T>>(mut f: F) -> T {
    let _enter = enter().expect(
        "cannot execute `LocalPool` executor from within \
         another executor",
    );

    CURRENT_THREAD_NOTIFY.with(|thread_notify| {
        let waker = waker_ref(thread_notify);
        let mut cx = Context::from_waker(&waker);
        loop {
            if let Poll::Ready(t) = f(&mut cx) {
                return t;
            }
            let unparked = thread_notify.unparked.swap(false, Ordering::Acquire);
            if !unparked {
                thread::park();
                thread_notify.unparked.store(false, Ordering::Release);
            }
        }
    })
}
```

立刻嗅到了一丝不对的味道，虽然这个方法名为 `run_executor`，但是整个方法里面貌似没有任何 spawn 的操作，只是在当前线程不停的循环判断用户提交的 future 的状态是否为 ready 啊！

这意味着，当 Tokio 的 runtime 线程执行到这里的时候，会立刻进入一个循环，在循环中不停地判断用户的的 future 是否 ready，如果还是 pending 状态，则将当前线程 park 住。

假设，用户 future 的异步任务也是交给了当前线程去执行，`futures::executor::block_on` 等待用户的 future ready，而用户 future 等待 `futures::executor::block_on` 释放当前的线程资源，那么不就死锁了？

这个推论听起来很有道理，让我们来验证一下。既然不能在当前 runtime 线程 block，那就重新开一个 runtime block：

```rust
impl Sequencer for PlainSequencer {
    fn generate(&self) -> Vec<i32> {
        let bound = self.bound;
        futures::executor::block_on(async move {
            RUNTIME.spawn(async move {
                let mut res = vec![];
                for i in 0..bound {
                    res.push(i);
                    tokio::time::sleep(Duration::from_millis(100)).await;
                }
                res
            }).await.unwrap()
        })
    }
}
```

果然可以了。

```
cargo test --color=always --package tokio-demo \
           --bin tt tests::test_sync_method \
           --no-fail-fast -- --format=json \
           --exact -Z unstable-options --show-output
    Finished test [unoptimized + debuginfo] target(s) in 0.04s
     Running unittests src/common/tt.rs (target/debug/deps/tt-adb10abca6625c07)
vec: [0, 1, 2]
```

值得注意的是，在 `futures::executor::block_on` 里面，额外使用了一个 `RUNTIME` 来 spawn 我们的异步代码。其原因还是刚刚所说，这个异步任务需要一个 runtime 来驱动状态的变化。

如果我们删除 `RUNTIME`，而为 `futures::executor::block_on` 生成一个新的线程，虽然死锁问题得到了解决，但 `tokio::time::sleep` 方法的调用会报错"no reactor is running"，这是因为 Tokio 的功能运作需要一个 runtime：

```
called `Result::unwrap()` on an `Err` value: Any { .. }
thread '<unnamed>' panicked at 'there is no reactor running, must be called from the context of a Tokio 1.x runtime',
...
```

### `tokio::main` 和 `tokio::test`

在分析完上面的原因之后，“为什么 `tokio::main` 中不会 hang 住而 `tokio::test` 会 hang 住”这个问题也很清楚了，他们两者所使用的的 runtime 并不一样。`tokio::main` 使用的是多线程的 runtime，而 `tokio::test` 使用的是单线程的 runtime，而在单线程的 runtime 下，当前线程被 `futures::executor::block_on` 卡死，那么用户提交的异步代码是一定没机会执行的，从而必然形成上面所说的死锁。

## Best practice

经过上面的分析，结合 Rust 基于 generator 的协作式异步特性，我们可以总结出 Rust 下桥接异步代码和同步代码的一些注意事项：

- 将异步代码与同步代码结合使用可能会导致阻塞，因此不是一个明智的选择。

- 在同步的上下文码调用异步代码时，请使用 `futures::executor::block_on` 并将异步代码 spawn 到另一个专用的 runtime 中执行 ，因为前者会阻塞当前线程。

- 如果必须从异步的上下文中调用有可能阻塞的同步代码（比如文件 IO 等），则建议使用 `tokio::task::spawn_blocking` 在专门处理阻塞操作的 executor 上执行相应的代码。

## 参考

- [Async: What is blocking?](https://ryhl.io/blog/async-what-is-blocking/)
- [Generators and async/await](https://cfsamson.github.io/books-futures-explained/4_generators_async_await.html)
- [Async and Await in Rust: a full proposal](https://news.ycombinator.com/item?id=17536441)
- [calling futures::executor::block_on in block_in_place may hang](https://github.com/tokio-rs/tokio/issues/2603)
- [tokio@0.2.14 + futures::executor::block_on causes hang](https://github.com/tokio-rs/tokio/issues/2376)

---
