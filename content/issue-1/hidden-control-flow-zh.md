本文主要介绍了一个在 [GreptimeDB](https://github.com/GreptimeTeam/greptimedb) 中遇到的一个关于异步取消 (async cancellation) 的“奇怪”[问题](https://github.com/GreptimeTeam/greptimedb/issues/350)。

The Issue
=========

针对这个问题，我们首先描述一个简化的场景：在一个长时间运行的测试中存在元信息损坏的问题，有一个应该单调递增的序列号出现了重复。

序列号的更新逻辑非常简单：从一个原子变量中读取当前值，然后通过异步 I/O 方法 `persist_number()` 将新值写入文件里，最后更新这个原子变量。整个流程都是串行化的（`file` 是一个独占引用）。

``` rust
async fn update_metadata(file: &mut File, counter: AtomicU64) -> Result<()> {
    let next_number = counter.load(Ordering::Relaxed) + 1;
    persist_number(file, next_number).await?;
    counter.fetch_add(1, Ordering::Relaxed);
}
```

由于一些原因，我们在这里使用了 `load` 函数而非 `fetch_add`（虽然单就这里来说可以用 `fetch_add`，并且用了还不会引发这次的问题🤪）。当这个更新流程在中间出现错误时，我们不希望更新内存中的计数器。我们清楚如果 `persist_number()` 写入文件时失败就能够从 ? 提前返回，并且会提早结束执行来传播错误，所以编码的时候会注意这些问题。

但是到了 `.await` 这里事情就变得奇妙了起来，因为 async cancellation 带来了一个隐藏的控制流。

# Async Cancellation
## async task and runtime
如果这时候你已经猜到了到底是什么引发了这个问题，可以跳过这一章节。如果没有，就让我从一些伪代码开始解释在 await point 那里到底发生了什么，以及 runtime 是如何参与其中的。

### poll_future
首先是 `poll_future` ，对应到 `Future` 的 [`poll`](https://doc.rust-lang.org/std/future/trait.Future.html#tymethod.poll) 方法。我们写的异步方法都会被转化成类似这样子的一个匿名的 `Future` 实现。

``` rust
fn poll_future() -> FutureOutput {
    match status_of_the_task {
        Ready(output) => {
            // the task is finished, and we have it output.
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

`async` 块通常包含其他的异步方法，比如 `update_metadata` 和 `persist_number`。这里把 `persist_number` 称为 `update_metadata` 的子异步任务。每个 `.await` 都会被展开成类似 `poll_future` 的东西，等待子任务的结果并继续执行。在这个例子中就是等待 `persist_number` 的结果返回 `Ready` 再更新计数器，否则不更新。

### runtime

第二段伪代码是一个简化的 runtime，它负责轮询 (poll) 异步任务直到它们完成（考虑到接下来的文章内容，“直到……完成”这种表述并不适合于所有情况）。在 GreptimeDB 中我们使用 [`tokio`](https://docs.rs/tokio/latest/tokio/) 作为 runtime。现在的异步 runtime 可能有很多特性和功能，其中最基础的就是轮询这些任务。

``` rust
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

通过结合上述两个简化的 future 和 runtime 模型，我们得到如下这个循环（真实的 runtime 非常复杂，这里为了内容集中省略了很多）。

``` rust
fn run() -> Output {
    loop {
        if let Ready(result) = task.poll() {
            return result;
        }
    }
}
```

需要强调的是，每个 `.await` 都代表着一个或者多个函数调用 (调用到 `poll()` 或者说是 `poll_future()`)。这就是标题中“隐藏的控制流”，以及 cancellation 发生的地方。

我们再看一段简单的程序来探测 runtime 的行为（可以直接在 [playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=40220605392e951e833a0b45719ed1e1) 里面运行这段代码)：
``` rust
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

只要花几分钟时间猜测一下上方代码的输出结果，如果和下面的一致，相信你已经知道问题出在哪里。

```
val is 1
1 is done
timeout
exitprint(2).await
```

`println!("1 is done");` 之后的语句都因为超时而被 runtime 取消执行了。

这个问题其中的原理并不复杂，但是（对我来说）能够定位到它并不轻易。在把其他问题都排除掉之后我知道问题就发生在这里，在这个 `.await` 上。也许是太多次成功的异步函数调用麻痹了注意，亦或是我的心智模型中没有把这两点联系起来，联想到这点着实费了一番心思。

## Cancellation
目前为止的内容是问题复盘的标准流程，接下来，让我们来展开讨论一下 cancellation，它是与 runtime 的行为相关的。


虽然 Rust 中的很多 runtime 都有类似的行为，但是这不是一个必须的特性，比如这个自己写的 [runtime](https://github.com/waynexia/texn) 就不支持 cancellation。因为问题发生在 tokio 上，因此这里会以它为例，而其他的 runtime 也是类似的。在 tokio 中，可以使用 [`JoinHandle::abort()`](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html#method.abort) 来取消一个 task。task 结构中有一个“cancel marker bit”来跟踪一个任务是否被取消了。如果它发现一个 task 被取消了，就会停止执行这个 task。

# Current Solution
## Explicit Detach

现在是否有手段能防止 task 被取消呢？在 tokio 中我们可以通过 drop `JoinHandle` 来 detach 一个任务到后台。一个 detached task 意味着没有前台的 handle 来控制这个任务，从某种意义上来说也就使得其他人不能在外面套一层 `timeout` 或 `select`，从而间接地使它不会被取消执行。并且开头提到的问题就是通过这种方式解决的。

> JoinHandle **detaches** the associated task when it is dropped, which means that there is no longer any handle to the task, and no way to `join` on it.

不过虽然有办法能够实现这个功能，是否像 [`glommio`](https://docs.rs/glommio/0.7.0/glommio/struct.Task.html#method.detach) 一样有一个显式的 `detach` 方法，类似一个不返回 `JoinHandle` 的 `spawn` 方法会更好。但这些都是琐碎的事情，一个 runtime 通常不会完全没有理由就取消一个 task，并且在大多数情况下都是出于用户的要求，只不过有时候可能没有注意到，就像 `select` 中的那些“未选中的分支”或者 `tonic` 中请求处理的逻辑那样。所以如果我们确定一个 task 是不能被取消的话，显式地 `detach` 可能能预防某些悲剧的发生。

目前为止所有问题都清晰了，让我们开始修复这个 bug 吧！

首先，为什么我们的 future 会被取消呢？通过函数调用链路很容易就能发现整个处理过程都是在 `tonic` 的请求执行逻辑中就地执行的，而对于一个网络请求来说有一个超时行为是很常见的。解决方案也很简单，就是将服务器处理逻辑提交到另一个 runtime 中执行，从而防止它被取消。只需要[几行代码](https://github.com/GreptimeTeam/greptimedb/pull/376/files#diff-9756dcef86f5ba1d60e01e41bf73c65f72039f9aaa057ffd03f3fc2f7dadfbd0R46-R54)就能完成。

``` Diff
@@ -30,12 +40,24 @@ impl BatchHandler {
            }
            batch_resp.admins.push(admin_resp);

-        for db_req in batch_req.databases {
-            for obj_expr in db_req.exprs {
-                let object_resp = self.query_handler.do_query(obj_expr).await?;
-                db_resp.results.push(object_resp);
+        let (tx, rx) = oneshot::channel();
+        let query_handler = self.query_handler.clone();
+        let _ = self.runtime.spawn(async move {
+            // execute request in another runtime to prevent the execution from being cancelled unexpected by tonic runtime.
+            let mut result = vec![];
+            for db_req in batch_req.databases {
+                for obj_expr in db_req.exprs {
+                    let object_resp = query_handler.do_query(obj_expr).await;
+
+                    result.push(object_resp);
+                }
                }
```

这个问题到这里就修复完了，不过并不是从根本上解决 async cancellation 带来的 bug，而是采用间接手段去规避任务由于超时而被提前取消的问题，毕竟我们的这些异步逻辑还是需要被完整执行的。

但是这样的处理会放大另外一些问题，比如我们也无法提前取消掉对于已经不用执行或资源消耗特别大的任务，从而导致系统资源的浪费。这些是我们之后需要持续改进的地方。接下来会就这方面继续展开，从 async 生态的方面讨论有哪些可能能提升 async cancellation 的使用体验。

# Runtime Behavior

## Market Trait
首先，我们自然希望 runtime 不要无条件地取消我的 task，而是尝试通过类型系统来变得更友好，比如借助类似 `CancelSafe` 的 marker trait 。对于 cancellation safety 这个词，tokio 在它的[文档](https://docs.rs/tokio/latest/tokio/macro.select.html#cancellation-safety)中有提到：

> To determine whether your own methods are cancellation safe, look for the location of uses of  `.await` . This is because when an asynchronous method is cancelled, that always happens at an  `.await`. If your function behaves correctly even if it is restarted while waiting at an  `.await`, then it is cancellation safe.

简单来说就是用来描述一个 task 是否可以安全地被取消掉，这是 async task 的属性之一。tokio 维护了一个很长的列表，列出了哪些是安全的以及哪些是不安全的。看起来这和 [`UnwindSafe`](https://doc.rust-lang.org/std/panic/trait.UnwindSafe.html) 这个 marker trait 很像。两者都是描述“这种控制流程并不总是被预料到的”，并且“有可能导致一些微妙的 bug” 的这样一种属性。

如果有这样一个 `CancelSafe` 的 trait，我们就有途径可以告诉 runtime 我们的异步任务是否可以安全地被取消掉，同时也是一种方式让用户承诺 cancelling 这个控制流程是被仔细处理过的。如果发现没有实现这个 trait，那就意味着我们不希望这个 task 被取消掉，简单而清晰。以 `timeout`为例：

``` rust
/// The marker trait
trait CancelSafe {}

/// Only cancellable task can be timeout-ed
pub fn timeout<F>(duration: Duration, future: F) -> Timeout<F> where
    F: Future + CancelSafe
{}
```

## Volunteer Cancel

另一个方式是让任务自愿地取消。就像 Kotlin 中的 [cooperative cancellation](https://kotlinlang.org/docs/cancellation-and-timeouts.html#cancellation-is-cooperative) 一样，它有一个 `isActive` 方法来检查一个 task 是否被取消掉。这只是一个检测方法，是否要取消完全取决于 task 本身。下面是 Kotlin 文档中的一个例子, cooperative cancellation 发生在第 5 行。这种方式把“隐藏的控制流程”放在了明面上，让我们能以一种更自然的方式来考虑和处理 cancellation，就像 `Option` 或 `Result` 一样。

``` Kotlin
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

并且我认为这也不难实现，Tokio 现在已经有了 `Cancelled bit` 和 `CancellationToken`，只是看起来和期望的还有点不一样。最后还是需要 runtime 把 cancellation 的权利交给 task，否则情况可能没有什么大的不同。

----
### 关于 Greptime
Greptime 格睿科技于2022年创立，目前正在完善和打造时序性数据库 GreptimeDB 和格睿云 Greptime Cloud 这两款产品。GreptimeDB 是款用 Rust 语言编写的时序数据库。具有分布式，开源，云原生，兼容性强等特点，帮助企业实时读写，处理和分析时序数据的同时降低长期存储的成本。

- 官网: <https://greptime.com/>
- GitHub: <https://github.com/GreptimeTeam/greptimedb>
- 文档：<https://docs.greptime.com/>
- Twitter: <https://twitter.com/Greptime>
- Slack: <https://greptime.com/slack>
- LinkedIn: <https://www.linkedin.com/company/greptime/>
