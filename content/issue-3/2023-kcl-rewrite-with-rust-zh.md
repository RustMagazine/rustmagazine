# 前言

Rust 已经悄然成为了最受欢迎的编程语言之一。作为一门新兴底层系统语言，Rust 拥有着内存安全性机制、接近于 C/C++ 语言的性能优势、出色的开发者社区和体验出色的文档、工具链和 IDE 等诸多特点。本文将介绍笔者使用 Rust 重写项目并逐步落地生产环境的过程，以及在重写过程选择 Rust 的原因、遇到的问题以及使用 Rust 重写带来的成果。

我们目前正在使用 Rust 开发的项目叫做 [KCL](https://github.com/KusionStack/KCLVM)，目前全部实现代码已经在 Github 上开源。KCL 是一个基于约束的记录及函数领域编程语言，致力于通过成熟的编程语言技术和实践来改进特领域如云原生 kubernetes 领域的大量繁杂配置编写和安全策略校验等，致力于构建围绕配置的更好的模块化、扩展性和稳定性，更简单的逻辑编写，以及更快的自动化集成和良好的生态延展性。更具体的 KCL 使用场景请访问 [KCL 网站](https://kcl-lang.github.io/)，本文中不再过多赘述。

KCL 之前是使用 Python 编写的，出于用户使用体验、性能和稳定性的考虑，决定用 Rust 语言进行重写，并获得了以下好处：

- 更少的 Bug，源于 Rust 强大的编译检查和错误处理方式
- 语言端到端编译执行性能提升了 66%
- 语言前端解析器性能提升了 20 倍
- 语言中端语义分析器性能提升了 40 倍
- 语言编译器编译过程平均内存使用量变为原来 Python 版本的一半

# 我们遇到了什么问题

就像社区中同类型项目 [deno](https://github.com/denoland/deno), [swc](https://github.com/swc-project/swc), [turbopack](https://github.com/vercel/turbo), [rustc](https://github.com/rust-lang/rust) 等编译器、构建系统或者运行时在技术上使用 Rust 做的事情类似，我们使用 Rust 完整构建了编译器的前中端和运行时，取得了一定的阶段性成果，但是我们大约在一年前并不是这个样子的。

一年前，我们使用 Python 语言构建了整个 KCL 语言编译器的实现，虽然在一开始的时候运行良好，Python 简单易上手，生态丰富，团队的研发效率也很高，但是随着代码库的扩张和工程师人数的增加，代码维护起来愈加困难，尽管我们在项目中强制编写 Python 类型注解，采用更严格的 lint 工具，代码测试行覆盖率也达到了 90% 以上，但是仍然会出现很多诸如 Python None 空对象，属性未找到等运行时才会出现错误，并且重构 Python 代码时也需要小心翼翼，反应到 KCL 语言上就是一个接一个的 bug, 严重影响用户使用体验。

此外，当 KCL 使用对象是广大开发者用户时，编程语言或者说编译器内部实现出现任何错误都是不可容忍的，这些也给我们的用户使用体验带来了一系列问题，使用 Python 编写的程序启动速度较慢，性能无法满足自动化系统在线编译和执行的效率诉求，因为在我们的场景中，用户修改 KCL 代码后需要能很快的展示编译结果，显然使用 Python 编写的编译器并不能很好地满足使用需求。

# 为什么选择 Rust

笔者所在团队基于如下原因选择了 Rust

- 使用 Go, Python, Rust 三种语言实现了简单的编程语言栈式虚拟机并作了性能对比，Go 和 Rust 在这个场景下性能接近，Python 有较大性能差距，综合考虑下采用了 Rust，具体三种语言实现的栈式虚拟机代码细节在 [https://github.com/Peefy/StackMachine](https://github.com/Peefy/StackMachine)，感兴趣的同学可以前往浏览
- 越来越多的编程语言的编译器或运行时特别是前端基础设施项目采用 Rust 编写或重构，此外基础设施层，数据库、搜索引擎、网络设施、云原生、UI 层和嵌入式等领域都有 Rust 的出现，至少在编程语言领域实现方面经过了可行性和稳定性验证
- 考虑到后续的项目发展会涉及区块链和智能合约方向，而社区中大量的区块链和智能合约项目采用 Rust 编写
- 通过 Rust 获得更好的性能和稳定性，让系统更容易维护、更加健壮的同时，可以通过 FFI 暴露 C API 供多语言使用和扩展，方便生态扩展与集成
- Rust 对 WASM 的支持比较友好，社区中大量 WASM 生态是由 Rust 构建，KCL 语言和编译器可以借助 Rust 编译到 WASM 并在浏览器中运行

基于以上原因综合考虑选择了 Rust 而不是 Go，整个重写过程下来发现 Rust 综合素质确实过硬（第一梯队的性能，足够的抽象程度），虽然在一些语言特性特别是生命周期等上手成本有一些，生态上还不够丰富，总之编程语言可以做的事情，Rust 均可以做，具体可能还是要根据具体的场景和问题来做选择。同时如果想要使用好 Rust, 还需要深入理解内存、堆栈、引用、变量作用域等这些其它高级语言往往不会深入接触的内容。

# 使用 Rust 过程中遇到了哪些困难

虽然决定了使用 Rust 重写整个 KCL 项目，其实团队成员大部分成员是没有使用 Rust 编写一定代码体量项目的经验，包括笔者个人自己也仅仅学习过 [《The Rust Programming Language》](https://doc.rust-lang.org/book/) 中的部分内容，依稀记得学习到 `Rc` 和 `RefCell` 等智能指针内容就放弃了，那时没想到 Rust 中还能有与 C++ 中类似的东西。

使用 Rust 前预估的风险主要是 Rust 语言接触和学习的成本，这个确实在各种 Rust 的文章博客中均有提到，因为 KCL 项目整体架构并未发生太大变化，只是部分模块设计和代码编写针对 Rust 作了优化，因此整个重写是在边学边实践中进行。确实在刚开始使用 Rust 编写整个项目的时候花费在知识查询、编译排错的时间还是很多的，不过随着项目的进行渐入佳境，笔者个人经验使用 Rust 遇到的困难主要是心智转换和开发效率两方面:

## 心智转换

首先 Rust 的语法语义很好地吸收和融合了函数式编程中类型系统相关的概念，比如抽象代数类型 ADT 等，并且 Rust 中并无“继承”等相关概念，如果不能很好地理解甚至连其他语言中稀松平常的结构定义在 Rust 中可能都需要花费不少时间，比如如下的 Python 代码可能在 Rust 中的定义是这个样子的。

- Python

```python
from dataclasses import dataclass

class KCLObject:
    pass

@dataclass
class KCLIntObject(KCLObject):
    value: int

@dataclass
class KCLFloatObject(KCLObject):
    value: float
```

- Rust

```rust
enum KCLObject {
    Int(u64),
    Float(f64),
}
```

当然更多的时间是在与 Rust 编译器本身的报错作斗争，Rust 编译器会经常使开发人员"碰壁"，比如借用检查报错等，特别是对于编译器来讲，它处理的核心结构是抽象语法树 AST，这是一个递归和嵌套的树结构，在 Rust 中有时很难兼顾变量可变性与借用检查的关系，就如 KCL 编译器作用域 `Scope` 的结构定义结构那样，对于存在循环引用的场景，用于需要显示意识到数据的相互依赖关系，而大量使用 `Rc`, `RefCell` 和 `Weak` 等 Rust 中常用的智能指针结构。

```rust
/// A Scope maintains a set of objects and links to its containing
/// (parent) and contained (children) scopes. Objects may be inserted
/// and looked up by name. The zero value for Scope is a ready-to-use
/// empty scope.
#[derive(Clone, Debug)]
pub struct Scope {
    /// The parent scope.
    pub parent: Option<Weak<RefCell<Scope>>>,
    /// The child scope list.
    pub children: Vec<Rc<RefCell<Scope>>>,
    /// The scope object mapping with its name.
    pub elems: IndexMap<String, Rc<RefCell<ScopeObject>>>,
    /// The scope start position.
    pub start: Position,
    /// The scope end position.
    pub end: Position,
    /// The scope kind.
    pub kind: ScopeKind,
}
```

## 开发效率

Rust 的开发效率可以用先抑后扬来形容。在刚开始上手写项目时，如果团队成员没有接触过函数式编程相关概念以及相关的编程习惯，开发速度将显著慢于 Python、Go 和 Java 等语言，不过一旦开始熟悉 Rust 标准库常用的方法、最佳实践以及常见 Rust 编译器报错修改，开发效率将大幅提升，并且原生就能写出高质量、安全、高效的代码。

比如笔者个人当初遇到一个如下代码所示的与生命周期错误前前后后排查了很久的时间才发现原来是忘记标注生命参数导致生命周期不匹配。此外 Rust 的生命周期与类型系统、作用域、所有权、借用检查等概念耦合在一起，导致了较高的理解成本和复杂度，且报错信息往往不像类型错误那么明显，生命周期不匹配错误报错信息有时也略显呆板，可能会导致较高的排错成本，当然熟悉相关概念写多了之后效率会提高不少。

```rust
struct Data<'a> {
    b: &'a u8,
}
// func1 和 func2 一个省略了生命周期参数，一个没有省略
// 对于 func2 的生命周期会由编译器缺省推导为 '_，可能导致生命周期不匹配错误
impl<'a> Data<'a> {
    fn func1(&self) -> Data<'a> {Data { b: &0 }}
    fn func2(&self) -> Data {Data { b: &0 }}
}
```

# 使用 Rust 重写收益比

经过团队几个人花费几个月时间使用 Rust 完全重写并稳定落地生产环境几个月后，回顾整个过程感觉这件事情的收获非常大，从技术角度层面来看，重写的过程不仅仅锻炼了快速学习一门新的编程语言、编程知识并将其付诸实践，并且整个重写过程让我们又反思了 KCL 编译器中设计不合理的部分并进行修改，对一个编程语言而言，这是一个长周期的项目，我们收获的是编译器系统更加稳定、安全，且代码清晰，bug 更少、性能更好的技术产品服务于用户，虽然没有全部模块得到高达 40 倍的性能，因为部分模块如 KCL 运行时的性能瓶颈在于内存深拷贝操作，但笔者个人认为仍然是值得的。且当 Rust 使用时间到达一定时长后，心智和开发效率不再是限制因素，就像学车那样，拿到驾照后更多是上路实践和总结。

# 结语

笔者个人觉得使用 Rust 重写项目后最重要的是不是我学会了一门新的编程语言，也不是 Rust 很流行很火因此我们在项目中采用一下，或者使用 Rust 编写了多少炫技的代码，是真真正正地使得语言和编译器本身更加稳定，能够在生产环境平稳落地并长期使用，启动速度和自动化效率不再受困扰，性能优于社区其他同类型领域编程语言，使我们语言和工具的用户感受到体验提升，这些都得益于 Rust 的无 GC、高性能、更好的错误处理内存管理、零抽象等特性。总之作为用户，他们才是最大的受益者。

在后续的文章中，我们会逐步揭秘性能提升的 Benchmark 数据以及使用 Rust 重写后给 KCL 带来了什么，敬请期待！最后，如果大家喜欢 KCL 语言这个项目，或想使用体验 KCL 用于自己的场景，或想使用 Rust 语言参与一个开源项目，欢迎大家访问 [https://github.com/KusionStack/community](https://github.com/KusionStack/community) 加入我们的社区一起参与讨论和共建 👏👏👏。

# 参考

- https://github.com/KusionStack/KCLVM
- https://github.com/Peefy/StackMachine
- https://doc.rust-lang.org/book/
- https://github.com/sunface/rust-course
- https://www.influxdata.com/blog/rust-can-be-difficult-to-learn-and-frustrating-but-its-also-the-most-exciting-thing-in-software-development-in-a-long-time/
