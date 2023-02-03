# The Issue

This article highlights a [unique issue](https://github.com/GreptimeTeam/greptimedb/issues/350) our engineering team encountered while developing [GreptimeDB](https://github.com/greptimeteam/greptimedb), our time series database built in Rust, related to asynchronous programming. During a long-running test, we noticed a discrepancy in the metadata where a series number was duplicated instead of being incrementally increased as intended. The update process involved the following straightforward steps - loading values from an in-memory atomic counter, asynchronously persisting the updated series number to a file through an I/O function, and updating the in-memory counter. The entire process is serialized (`file` being a mutable reference), as demonstrated in the code snippet below:

```rust
async fn update_metadata(file: &mut File, counter: AtomicU64) -> Result<()> {
    let next_number = counter.load(Ordering::Relaxed) + 1;
    persist_number(file, next_number).await?;
    counter.fetch_add(1, Ordering::Relaxed);
}
```

Given that some functions may terminate prematurely, the `fetch_add` method is not utilized here and instead, the `load` method is employed. Updating the in-memory counter is not necessary if a previous task fails mid-execution, such as if the `persist_number()` function call results in failure. In this case, an early return (as indicated by the `?` symbol) is used to propagate the error. Our team takes extra precautions when coding as we are aware that certain function calls may result in similar failures.


# Async Cancellation

## Async Task and Runtime

This section provides an explanation of the interaction between the `async` task and the runtime environment. If you have already understood the underlying mechanics, feel free to skip this section.

### poll_future

Every `async fn` you write is desugared into an anonymous `Future` implementation that has a [`poll`](https://doc.rust-lang.org/std/future/trait.Future.html#tymethod.poll) method. The `poll` function is used to check the status of the task. Here is an example of a simplified `poll` function in pseudocode:

```rust
fn poll_future() -> FutureOutput {
    match status_of_the_task {
        Ready(output) => {
            // the task is finished, and we have its output.
            // some logic
            return our_output;
        },
        Pending => {
            // it is not ready, we don't have the output.
            // thus we cannot make progress and need to wait
            return Pending;
        }
    }
}
```

An async block typically contains other async functions, like `update_metadata` and `persist_number`. In this example, we treat `persist_number` as a subtask of `update_metadata`. Each `.await` point expands to a call to `poll_future` to wait for the subtask's output and execute the next step only when the subtask is ready. For example, we need to wait for `persist_number` to return `Ready` before updating the counter.

### Runtime

The main function of an asynchronous runtime is to poll tasks, meaning it keeps running unfinished tasks until they are completed (as described later in this article, "until" may not be an accurate description). In GreptimeDB, the [`tokio`](https://docs.rs/tokio/latest/tokio/) library is used as the runtime. The following pseudocode demonstrates the basic features of a runtime:

```rust
fn runtime(&self) {
    loop {
        let future_tasks: Vec<Task> = self.get_tasks();
        for task in tasks {
            match task.poll_future(){
                Ready(output) => {
                    // this task is finished. wake it with the result
                    task.wake(output);
                },
                Pending => {
                    // this task needs some time to run. poll it later
                    self.poll_later(task);
                }
            }
        }
    }
}
```

These are basic illustrations of what `Future` and `runtime` do. By combining these two functions, you can see that the runtime acts as a loop (note that many technical details have been omitted). The bottom line is that each `.await` results in one or more function calls (calls to `poll()` or `poll_future()`). These are what the **"hidden control flow"** in the title refers to and the places where "cancellation" occurs.


```rust
fn run() -> Output {
    loop {
        if let Ready(result) = task.poll() {
            return result;
        }
    }
}
```

Let's look at another piece of code to understand the behaviours of runtime (you can run the code in this [playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=40220605392e951e833a0b45719ed1e1)

```rust
use tokio::time::{sleep, Duration, timeout};

#[tokio::main]
async fn main() {
    let f = async {
        print(1).await;
        println!("1 is done");
        print(2).await;
        println!("2 is done");
        print(3).await;
        println!("3 is done");
    };

    if let Err(_) = timeout(Duration::from_millis(150), f).await {
        println!("timeout");
    }

    sleep(Duration::from_millis(300)).await;
    println!("exit")
}

async fn print(val: u32) {
    sleep(Duration::from_millis(100)).await;
    println!("val is {}", val);
}
```

You can take a few minutes to figure out the result, and if it is consistent with the following, I believe you already know what the problem is.

```
val is 1
1 is done
timeout
exit
```

The code after `print(2).await` is all cancelled due to timeout.

Though it is not difficult to understand the underlying principle, identifying the problem was not as simple (at least for me in this case). I stared at these lines for a long time after I narrowed the scope down to the first code snippet. I knew the problem was definitely in the `.await`, but I didn't know whether too many successful async calls have clouded my thinking or I didn't think of connecting these two points, I was stuck at this issue for quite some time and couldn't move forward.

## Cancellation

So far, I have presented the problem and my thought processes, which leads to our next discussions on "cancellation", since it is affected by the behaviors of `runtime`. Although many `runtime` in Rust have similar behaviors, "cancellation" is not a required feature, and for example, my [toy runtime](https://github.com/waynexia/texn) does not support "cancellation". I use tokio here as an example because it is where the issues happen, and other `runtime` may have similar issues.

In tokio, one can use [`JoinHandle::abort()`](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html#method.abort) to cancel a task. Tasks have a "cancel marker bit" which tracks whether it's cancelled or not. And if the runtime finds a task is cancelled, it will kill that task (code from [here](https://github.com/tokio-rs/tokio/blob/00bf5ee8a855c28324fa4dff3abf11ba9f562a85/tokio/src/runtime/task/state.rs#L283-L291)):

```rust
// If the task is running, we mark it as cancelled. The thread
// running the task will notice the cancelled bit when it
// stops polling and it will kill the task.
//
// The set_notified() call is not strictly necessary but it will
// in some cases let a wake_by_ref call return without having
// to perform a compare_exchange.
snapshot.set_notified();
snapshot.set_cancelled();
```

The logic behind async cancellation is not hard to follow: runtime gives up polling your tasks even it's not yet finished, like what `?` does but sometimes it's even more difficult because we can't catch this "cancellation" like `Err`. But does it mean that we need to worry about every single `.await` being cancelled at any time? It would be very irritating. We will take updating of the metadata as an example in this post. If we use "cancellation", then we need to check if the file is consistent with the memory state first, otherwise we need to rollback the persisted changes, etc. The bad news is that in some cases, the answer is "yes" because runtime can do almost anything to your `future`, but the good news is that most of them are well-behaved.

# Current Solution

## Explicit Detach

So currently, do we have any means to force the runtime not to cancel our tasks? In tokio, we can actually "detach" a task to the background by dropping the `JoinHandle`. As a detached task, there's no foreground handle to cancel the task, and disabling others to wrap a `timeout` or `select` over it, thus making it un-cancellable.

The problem we highlighted in the very beginning is solved in this way.

> A `JoinHandle` _detaches_ the associated task when it is dropped, which means that there is no longer any handle to the task, and no way to `join` on it.

Though the functionality is already out there, I'm wondering if it's better to have an explicit "detach" method like [`glommio`](https://docs.rs/glommio/0.7.0/glommio/struct.Task.html#method.detach), or even a `detach` method in the runtime like `spawn`, which doesn't return the `JoinHandle`.

It's comforting to know that a runtime won't cancel a task for no reason, as in most cases it is required by the users. However, sometimes users won't notice this, like those "unselect branches" in `select`, or the logic in `tonic`'s request handler. So if we are sure that a task cannot be cancelled, explicit detach may prevent some of the issues from happening.

Now that everything is clear, let's fix this bug!

First, we need to figure out why the future is cancelled. By looking at the function call graph, we can easily find that the entire procedure is executed in place in `tonic`'s request listening runtime.

Since it's common for an network request timeout, the future may be cancelled because of this. The solution is also simple: detaching the server processing logic into another runtime to prevent it from being cancelled with the request. Only [a few lines](https://github.com/GreptimeTeam/greptimedb/pull/376/files#diff-9756dcef86f5ba1d60e01e41bf73c65f72039f9aaa057ffd03f3fc2f7dadfbd0R46-R54) need to be modified here:

```diff
impl BatchHandler {
-        for db_req in batch_req.databases {
-            for obj_expr in db_req.exprs {
-                let object_resp = self.query_handler.do_query(obj_expr).await?;
-                db_resp.results.push(object_resp);
+        let (tx, rx) = oneshot::channel();
+        let query_handler = self.query_handler.clone();
+        let _ = self.runtime.spawn(async move {
+            // execute the request in another runtime to prevent its execution from being cancelled unexpectedly by tonic runtime.
+            let mut result = vec![];
+            for db_req in batch_req.databases {
+                for obj_expr in db_req.exprs {
+                    let object_resp = query_handler.do_query(obj_expr).await;
+
+                    result.push(object_resp);
+                }
}
```

This workaround does not fundamentally address the bug caused by async cancellation. By using runtime to avoid tasks being cancelled early due to timeouts—our asynchronous logic will still be executed nevertheless in the end. Such processing will accentuate other problems, for instance, we cannot cancel tasks that are no longer required or consume a lot of resources in advance, which will lead to a waste of system resources. These are the areas where we look to improve in the future.

For our next step, we will continue to explore this aspect, to improve the use of the async cancellation experience.

# Runtime Behavior

This section presents and discusses our expected results of a runtime.

## Marker Trait

Instead of seeing the runtime cancel my tasks without restrictions, it will be better to check if the task can be cancelled using the type system of Rust. For example, use a marker trait in "CancelSafe" mentioned [here](https://docs.rs/tokio/latest/tokio/macro.select.html#cancellation-safety) in tokio:

> To determine whether your own methods are cancellation safe, look for the location of uses of `.await` . This is because when an asynchronous method is cancelled, that always happens at an `.await`. If your function behaves correctly even if it is restarted while waiting at an `.await`, then it is cancellation safe.

Using a marker trait similar to "CancelSafe" gives programmers control of telling runtime when it's time to cancel tasks, and this is also one of the key considerations of async programming. In the doc above, tokio provides a long list of which actions are safe and which are not. Same as this marker trait here [`UnwindSafe`](https://doc.rust-lang.org/std/panic/trait.UnwindSafe.html), they both describe cases when the outcome of the control flow is unexpected and causes unknown bugs.

```rust
/// The marker trait
trait CancelSafe {}

/// Only cancellable tasks can be timeout-ed
pub fn timeout<F>(duration: Duration, future: F) -> Timeout<F> where
    F: Future + CancelSafe
{}
```

## Volunteer Cancel

Another approach is to make the tasks cancelled voluntarily. Like the [cooperative cancellation](https://kotlinlang.org/docs/cancellation-and-timeouts.html#cancellation-is-cooperative) in Kotlin which has an [`isActive`](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/is-active.html) method for a task to check if it's cancelled.

However, this method acts only as a tester and it should be the task itself that determines whether or not to be cancelled. Below shows an example from Kotlin's document, the "cooperative cancellation" happens in line 5. In this way, it brings the "hidden control flow" to the table and makes it more natural to handle the cancellation just like `Option` or `Result`.

```Kotlin
val startTime = System.currentTimeMillis()
val job = launch(Dispatchers.Default) {
    var nextPrintTime = startTime
    var i = 0
    while (isActive) { // cancellable computation loop
        // print a message twice a second
        if (System.currentTimeMillis() >= nextPrintTime) {
            println("job: I'm sleeping ${i++} ...")
            nextPrintTime += 500L
        }
    }
}
delay(1300L) // delay a bit
println("main: I'm tired of waiting!")
job.cancelAndJoin() // cancels the job and waits for its completion
println("main: Now I can quit.")
```

In my opinion, the above expectation is not hard to achieve. Though it looks a bit different, Tokio already has the [`Cancelled bit`](https://github.com/tokio-rs/tokio/blob/00bf5ee8a855c28324fa4dff3abf11ba9f562a85/tokio/src/runtime/task/state.rs#L41) and [`CancellationToken`](https://docs.rs/tokio-util/latest/tokio_util/sync/struct.CancellationToken.html). Above all, we need runtime to give the cancellation right back to our tasks.
