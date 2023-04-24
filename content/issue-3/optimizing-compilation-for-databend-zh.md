![](/static/issue-3/optimizing-compilation-for-databend/2.png)

# 背景

时至今日，Databend 已经成长为一个大型、复杂、完备的数据库系统。团队维护着数十万行代码，每次发布十几个编译产物，并且还提供基于 Docker 的一些构建工具以改善开发者 / CI 的体验。

之前的文章介绍过 [使用 PGO 优化 Databend 二进制构建](https://www.databend.cn/blog/2023/02/24/build-databend-with-pgo) ，用户可以根据自己的工作负载去调优 Databend 的编译。再早些时候，还有一些介绍 Databend [开发环境](https://www.databend.cn/blog/setup-databend-dev-env) 和 [构建](https://www.databend.cn/blog/build-and-run-databend) 的文章。

对于 Databend 这样的中大型 Rust 程序而言，编译实在算不上是一件轻松的事情：

![](/static/issue-3/optimizing-compilation-for-databend/3.png)

- 一方面，在复杂的项目依赖和样板代码堆积之下，Rust 的编译时间显得不那么理想，前两年 [Brian Anderson 的文章](https://cn.pingcap.com/blog/rust-compilation-model-calamity) 中也提到“Rust 糟糕的编译时间”这样的描述。
- 另一方面，为了维护构建结果，不得不引入一些技巧来维护编译流水线的稳定，这并不是一件“一劳永逸”的事情，随着 Workflow 复杂性的提高，就不得不陷入循环之中。

为了优化编译体验，Databend 陆陆续续做过很多优化工作，今天的文章将会和大家一同回顾 Databend 中改善编译时间的一些优化。

# 可观测性

可观测性并不是直接作用于编译优化的手段，但可以帮助我们识别当前编译的瓶颈在什么地方，从而对症下药。

## cargo build --timings

这一命令有助于可视化程序的编译过程。

在 1.59 或更早版本时可以使用 `cargo +nightly build -Ztimings` 。

在浏览器中打开结果 HTML 可以看到一个甘特图，其中展示了程序中各个 crate 之间的依赖关系，以及程序的编译并行程度和代码生成量级。
通过观察图表，我们可以决定是否要提高某一模块的代码生成单元数目，或者要不要进一步拆解以优化整个编译流程。

![](/static/issue-3/optimizing-compilation-for-databend/4.png)

## cargo-depgraph

这个工具其实不太常用，但可以拿来分析依赖关系。有助于找到一些潜在的优化点，特别是需要替换某些同类依赖或者优化 crates 组织层次的时候。

![](/static/issue-3/optimizing-compilation-for-databend/5.png)

# 无痛优化，从调整配置开始

改善编译体验的第一步其实并不是直接对代码动手术，很多时候，只需要变更少数几项配置，就能够获得很大程度上的改善。

## Bump, Bump, Booooooooom

前面提到过 Rust 团队的成员们也很早就意识到，编译时间目前还并不理想。所以编译器团队同样会有计划去不断进行针对性的优化。经常可以看到在版本更新说明中有列出对编译的一些改进工作。

```toml
[toolchain]
channel = "nightly-2023-03-10"
components = ["rustfmt", "clippy", "rust-src", "miri"]
```

另外，上游项目同样可能会随着时间的推移去改善过去不合理的设计，很多时候这些改进也最终会反映在对编译的影响上。

![](/static/issue-3/optimizing-compilation-for-databend/6.png)

一个改善编译时间的最简单的优化方式就是始终跟进上游的变更，并且秉着“上游优先”的理念去参与到生态建设之中。Databend 团队从一开始就是 Rust nightly 的忠实簇拥，并且为更新工具链和依赖关系提供了简明的指导。

## 缓存，转角遇到 sccache

缓存是一种常见的编译优化手段，思路也很简单，只需要把预先构建好的产物存储起来，在下次构建的时候继续拿过来用。

早期 Databend 使用 `rust-cache` 这个 action 在 CI 中加速缓存，获得了不错的效果。但是很遗憾，我们不得不经常手动更新 key 来清理缓存，以避免构建时的误判。而且，Rust 早期对增量构建的支持也很差劲，有那么一段时间可能会考虑如何配置流水线来进行一些权衡。

随着时间的推移，一切变得不同了起来。

```urlpreview
https://github.com/mozilla/sccache
```

首先是 Sccache 恢复了活力，而 OpenDAL 也成功打入其内部，成为支撑 Rust 编译缓存生态的重要组件，尽管在本地构建时使用它常常无法展现出真正的威力，但是放在 CI 中，还是能够带来很大惊喜的。

另一个重要的改变是，Rust 社区意识到增量编译对于 CI 来讲并不能很好 Work 。

> CI builds often are closer to from-scratch builds, as changes are typically much bigger than from a local edit-compile cycle. For from-scratch builds, incremental adds an extra dependency-tracking overhead. It also significantly increases the amount of IO and the size of ./target, which make caching less effective.

# 轻装上阵，将冷气传递给每一个依赖

Rust 生态里面有一个很有意思的项目是 [mTvare6/hello-world.rs](https://github.com/mTvare6/hello-world.rs) ，它尽可能给你展现了如何让一个 Rust 项目变得尽可能糟糕。

![](/static/issue-3/optimizing-compilation-for-databend/8.png)

特别是：

> in a few lines of code with few(1092) dependencies

Rust 自身是不太能很好自动处理这一点的，它需要把所有依赖一股脑下载下来编译一通。所以避免无用依赖的引入就成为一件必要的事情了。

最开始的时候，Databend 引入 cargo-udeps 来检查无用的依赖，大多数时候都工作很良好，但最大的缺点在于，每次使用它检查依赖就相当于要编译一遍，在 CI 中无疑是不划算的。

[sundy-li](https://github.com/sundy-li) 发现了另外一个快速好用的工具，叫做 cargo-machete 。

![](/static/issue-3/optimizing-compilation-for-databend/9.png)

一个显著的优点是它很快，因为一切只需要简单的正则表达式来处理。而且也支持了自动修复，这意味着我们不再需要挨个检索文件再去编辑。

不过 machete 并不是完美的工具，由于只是进行简单的正则处理，有一些情况无法准确识别，不过 ignore 就好了，总体上性价比还是很高的。

## 稀疏索引

为了确定 crates.io 上存在哪些 crates，Cargo 需要下载并读取 crates.io-index ，该索引位于托管在 GitHub 上的 git 存储库中，其中列出了所有 crates 的所有版本。

然而，随着时间推移，由于索引已经大幅增长，初始获取和更新变得很慢。RFC 2789 引入了稀疏索引来改进 Cargo 访问索引的方式，并使用 https://index.crates.io/ 进行托管。

```toml
[registries.crates-io]
protocol = "sparse"
```

## linker

如果项目比较大，而且依赖繁多，那么可能在链接时间上会比较浪费。特别是在你只改了几行代码，但编译却花了很久的时候。

最简单的办法就是选择比默认链接器更快的链接器。

![](/static/issue-3/optimizing-compilation-for-databend/10.png)

lld 或者 mold 都可以改善链接时间，Databend 最后选择使用 mold 。其实在 Databend 这个量级的程序上，两个链接器的差距并不明显，但是，使用 mold 的一个潜在好处是能够节约一部分编译时候消耗的内存。

```toml
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=/path/to/mold"]
```

## 编译相关配置

先看一个常见的 split-debuginfo，在 MacOS 上，rustc 会运行一个名为 dsymutil 的工具，该工具会分析二进制文件，然后构建调试信息目录。配置 split-debuginfo，可以跳过 dsymutil ，从而加快构建速度。

```toml
split-debuginfo = "unpacked"
```

另外的一个例子是 codegen-units，Databend 在编译时使用 codegen-units = 1 来增强优化，并且克制二进制体积大小。但是考虑到部分依赖在编译时会有特别长的代码生成时间（因为重度依赖宏），所以需要针对性放开一些限制。

```toml
[profile.release.package]
arrow2 = { codegen-units = 4 }
common-functions = { codegen-units = 16 }
databend-query = { codegen-units = 4 }
databend-binaries = { codegen-units = 4 }
```

# 重新思考，更合理的代码组织

前面是一些配置上的调整，接下来将会探讨重构对代码编译时间的一些影响。

## 拆分到更合理的 crates 规模

对于一个大型的 All in One 式的 Crate 而言，拆分 crates 算是一个比较有收益的重构。一方面可以显著改善并行度。另一方面，通过解耦交叉依赖/循环依赖，可以帮助 Rust 更快地处理代码编译。

```urlpreview
https://github.com/datafuselabs/databend/issues/6180
```

同时，还有一个潜在的好处，就是拆分以后，由于代码的边界更为清晰，维护起来也会省力一些。

## 单元式测试与集成式测试的界限

单元测试的常见组织形式包括在 src 中维护 tests mod ，和在 tests 目录下维护对应的测试代码。

根据 Delete Cargo Integration Tests 的建议，Databend 很早就从代码中剥离了所有的单元测试，并组织成类似这样的形式

```
tests/
  it/
    main.rs
    foo.rs
    bar.rs
```

这种形式避免将 `tests/` 下面的每个文件都编译成一个单独的二进制文件，从而减轻对编译时间的影响。

另外，Rust 编译时处理 tests mod 和 docs tests 也需要花费大量时间，特别是 docs tests 还需要另外构建目标，在采用上面的组织形式之后，就可以在配置中关掉。

但是，这种形式并不十分优雅，不得不为所有需要测试的内容设置成 public ，容易破坏代码之间的模块化组织，在使用前建议进行深入评估。

## 更优雅的测试方法

对应到编译时间上，可以简单认为，单元测试里需要编译的代码越多，编译时间自然就会越慢。

另外，对于 Databend 而言，有相当一部分测试都是对输入输出的端到端测试，如果硬编码在单元测试中需要增加更多额外的格式相关的工作，维护也会比较费力。

![](/static/issue-3/optimizing-compilation-for-databend/12.png)

Databend 巧妙运用 golden files 测试和 SQL logic 测试，替换了大量内嵌在单元测试中的 SQL 查询测试和输出结果检查，从而进一步改善了编译时间。

# 遗珠之憾

## cargo nextest

cargo nextest 让测试也可以快如闪电，并且提供更精细的统计和优雅的视图。Rust 社区中有不少项目通过引入 cargo nextest 大幅改善测试流水线的时间。

![](/static/issue-3/optimizing-compilation-for-databend/13.png)

但 Databend 目前还无法迁移到这个工具上。一方面，配置相关的测试暂时还不被支持，如果再针对去单独跑 cargo test 还要重新编译。另一方面，有一部分与超时相关的测试设定了执行时间，必须等待执行完成。

## cargo hakari

改善依赖项的编译，典型的例子其实是 workspace-hack ，将重要的公共依赖放在一个目录下，这样这些依赖就不需要反复编译了。Rust 社区中的 cargo-hakari，可以用来自动化管理 workspace-hack 。

![](/static/issue-3/optimizing-compilation-for-databend/14.png)

Databend 这边则是由于有大量的 common 组件，主要二进制程序都建立在 common 组件上，暗中符合这一优化思路。另外，随着 workspace 支持依赖继承之后，维护压力也得到减轻。

# 总结

这篇文章介绍了 Databend 团队在改善 Rust 项目编译时间上做的一些探索和努力，从配置优化和代码重构这两个角度，提供了一些能够优化编译时间的一些建议。

# 参考资料

- [Fast Rust Builds](https://matklad.github.io/2021/09/04/fast-rust-builds.html)
- [Delete Cargo Integration Tests](https://matklad.github.io/2021/02/27/delete-cargo-integration-tests.html)
- [Better support of Docker layer caching in Cargo](https://hackmd.io/@kobzol/S17NS71bh)
- [2023-04: 为什么你该试试 Sccache？](https://xuanwo.io/reports/2023-04/)
- [The Rust Performance Book - Compile Times](https://nnethercote.github.io/perf-book/compile-times.html)
- [Cargo Registry 稀疏索引的一些介绍](https://blog.dcjanus.com/posts/cargo-registry-index-in-http/)
