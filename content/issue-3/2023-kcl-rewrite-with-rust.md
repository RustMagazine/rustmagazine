# Introduction

Rust has quietly become one of the most popular programming languages. As an popular emerging system language, Rust has many great characteristics, such as its memory security mechanism, performance close to that of C/C++, an excellent development community and helpful documentation, tool chains and IDEs. In this blog, we will introduce the process of using Rust for a rewrite and gradually implementing the production environment, as well as the reasons for choosing Rust, any issues we have encountered, and the results of the rewrite.

The project we are using Rust to develop is called [KCL](https://github.com/KusionStack/KCLVM). KCL is an open-source, constraint-based record and functional programming language. It leverages mature programming language technology and practice to facilitate the writing of many complex configurations. KCL is designed to improve modularity, scalability, and stability around configuration, simplify logic writing, speed up automation and create a thriving extension ecosystem. To learn more about specific KCL usage scenarios, please refer to the [KCL website](https://kcl-lang.github.io/). This blog will not go into too much detail about that.

KCL was written in Python before. After carefully evaluating the user experience, performance and stability, we decided to rewrite KCL in Rust, and the following benefits were obtained:

+ Rust's powerful compilation checks and error handling led to fewer bugs.
+ There was a 66% improvement in end-to-end compilation and execution performance.
+ The language front-end parser performance improved by up to 20 times.
+ The language semantic analyzer performance improved by up to 40 times.
+ The average memory usage of the language compiler during compilation was roughly half of the original Python version.

# What issues have we encountered

The compiler, build system or runtime uses Rust to do similar things in technology like projects of the same type in the community [deno](https://github.com/denoland/deno), [swc](https://github.com/swc-project/swc), [turbopack](https://github.com/vercel/turbo), [rustc](https://github.com/rust-lang/rust). We used Rust to completely build the front, middle and runtime of the compiler, and achieved some results, but we did not do this about a year ago.

A year ago, we used Python to build the entire KCL compiler implementation, which initially ran well due to Python’s ease of use, rich ecosystem, and the team's high research and development efficiency. However, as the codebase and number of engineers grew, code maintenance became increasingly difficult. To counter this, we enforced the usage of Python type annotations and employed stricter linting tools, as well as achieving >90% code test coverage. Yet, runtime errors such as empty Python objects and missing attributes remained, and refactoring had to be done with caution.

As KCL users are mostly developers, any mishaps in the language or compiler internals were unacceptable, leading to a range of issues with user experience. Furthermore, programs written in Python had slow startup times, and their performance did not meet the efficiency demands of automating the online compilation and execution. Therefore, a compiler written in Python was unable to adequately meet use requirements.

Consequently, we decided to rewrite KCL in Rust to not only improve user experience, but to also benefit from Rust’s powerful compilation checks and error handling. This led to a 66% improvement in end-to-end compilation and execution performance, as well as a 20- and 40-fold improvement in the language front-end and semantic analyser performance, respectively. The average memory usage of the compiler during compilation was also roughly halved.

# Why use Rust

We chose Rust for the following reasons:

+ We implemented a simple programming language stack virtual machine in Python, Go, and Rust and conducted a performance comparison, Rust was adopted under comprehensive consideration as Go and Rust had similar performance whereas Python had a large performance gap. The details of the stack virtual machine code implemented by the three languages are here: [https://github.com/Peefy/StackMachine](https://github.com/Peefy/StackMachine).
+ Rust has been widely utilized for compilers or runtimes of programming languages, especially in front-end infrastructure projects, and is present in various fields such as infrastructure, database, search engine, network, cloud-native, UI, and embedded systems, ensuring its feasibility and stability.
+ Considering that the subsequent project development will involve the direction of blockchain and smart contract, and a large number of blockchain and smart contract projects in the community are written by Rust.
+ Rust provides better performance and stability, making the system easier to maintain and more robust, while allowing developers to expose C APIs through FFI for multilingual use and expansion.
+ Rust's friendly support for Web Assembly (WASM) is extremely beneficial for the development of blockchain and smart contract projects.

Based on the above reasons, we chose Rust instead of Go. In the whole rewriting process, we found that Rust's comprehensive quality is impressive because it not only provides high performance but also a sufficient abstraction, although there is some cost in certain language features such as lifetime. Nevertheless, its ecology is not as rich as other languages.

# What are the difficulties in using Rust

Although we decided to rewrite the entire KCL project with Rust, most team members have no experience in writing a certain project with Rust, and I has only learned [The Rust Programming Language](https://doc.rust-lang.org/book/). I vaguely remember that I gave up when I learned about intelligent pointers such as `Rc` and `RefCell`. At that time, I didn't expect that there would be anything similar to C++ in Rust.

The risk of utilizing Rust is mainly the expense of learning the language, which is evidently discussed in a multitude of Rust blogs. Seeing that the overall structure of the KCL project had not been altered considerably, and some modules' designs and their code had been greatly improved for Rust, the entire rewrite was accomplished through a process of mastering Rust whilst practicing. When we set out to use Rust to create the whole project, time was spent on knowledge querying, compilation and debugging. As the project advanced, however, the main challenges that arose from utilizing Rust were mainly the transformation of our mindsets, as well as the efficiency of development.

## Mental transformation

First of all, the syntax and semantics of Rust well absorb and integrate the concepts related to the type system in functional programming, such as the Abstract Algebraic Type (ADT). In addition, there is no concept related to "inheritance" in Rust. If you can't understand it well, even ordinary structure definitions in other languages may take a lot of time in Rust. For example, the following Python code may be defined like this in Rust.

+ Python

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

+ Rust

```rust
enum KCLObject {
    Int(u64),
    Float(f64),
}
```

Of course, more time is spent fighting against the error reports of the Rust compiler itself. The Rust compiler will often cause developers to "run into a wall", such as borrowing check errors. Especially for the KCL compiler, its core structure is the Abstract Syntax Tree (AST), which is a recursive and nested tree structure.

It is sometimes difficult to give consideration to the relationship between variable variability and borrowing check in Rust, Just like the scope structure `Scope` defined in KCL compiler, for scenarios with circular references, it is used to display the interdependence of data that needs to be aware of, while making extensive use of intelligent pointer structures commonly used in Rust such as `Rc`, `RefCell` and `Weak`.

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

## Development efficiency

The efficiency of utilizing Rust may appear low at first, but it will become substantially high upon gaining familiarity with it. Initially, if the team members have not been exposed to concepts such as functional programming and related coding practices, the development speed will be much slower than that of languages such as Python, Go, and Java. Nevertheless, once they become familiarized with the conventional methods and best practices of the Rust standard library, as well as the common fixes for Rust compiler errors, the development efficiency will be dramatically boosted, and they will be able to compose high-quality, safe, and efficient code naturally.

For instance, I ran into a Rust lifetime error in the following code. After troubleshooting for a lengthy duration, it became apparent that the lifetime inconsistency was due to neglecting to label lifetime parameters. Additionally, Rust’s lifetime is combined with concepts such as type system, scope, ownership, and borrowing inspection, resulting in a higher cost and complexity of understanding, with error reporting information often not as clear-cut as type errors. The lifetime inconsistency error reporting information can sometimes be somewhat inflexible, which may lead to a costly troubleshooting procedure. Of course, efficiency will be improved with increasing familiarity with the pertinent concepts.

```rust
struct Data<'a> {
    b: &'a u8,
}

// func2 omit lifecycle parameters, and func2 does not.
// The lifecycle of func2 will be deduced as '_ by the Rust compiler by default,
// which may lead to lifetime mismatch error.
impl<'a> Data<'a> {
    fn func1(&self) -> Data<'a> {Data { b: &0 }}
    fn func2(&self) -> Data {Data { b: &0 }}
}
```

# Rewrite revenue ratio using Rust

After spending several months using Rust to completely rewrite and steadily deploy the KCL project into a production environment, we have looked back on the whole process and found it highly rewarding.

From a technical point of view, the rewrite process not only trained us to quickly learn a new programming language and its associated knowledge, but it also enabled us to put them into practice. The whole rewrite process also made us reflect on the unrational design of the KCL compiler and modify it accordingly. For a programming language, this is a long-cycle project. We have learned that such a compiler system should be more stable, and secure, with legible code, fewer bugs, and better performance.

Although not all modules achieved a 40-fold improvement in performance (due to memory deep copy operations being the main bottleneck of some modules, such as the KCL runtime), I still think it is particularly beneficial. With enough experience in Rust, mental and development efficiency are no longer limiting factors.

Overall, although our team encountered obstacles while using Rust to rewrite the KCL project, we eventually succeeded. We have acquired invaluable knowledge and experience in the process, which will be immensely beneficial in the future.

# Conclusion

I personally think that the most important thing after using Rust to rewrite the project is whether I have learned a new programming language or whether Rust is very popular and we have written many fancy codes using Rust. The stability, startup-time, and automation-efficiency of the KCL compiler and language is significantly improved. Furthermore, with Rust's non-GC, high-performance, improved error handling, memory management, and lack of abstraction, the performance of KCL improves substantially as compared to other languages in similar fields. In short, the users of KCL are the biggest beneficiaries of the improvements made possible by Rust.

In future, we will gradually reveal the performance improvement of benchmark and what it will bring to KCL after rewriting using Rust. Please look forward to it! At last, if you are interested in the KCL project, wish to use KCL for your personal use cases, or want to use Rust to participate in an open-source project, welcome to visit [https://github.com/KusionStack/community](https://github.com/KusionStack/community) to join our community to participate in discussion and co construction 👏👏👏。

# Reference

+ https://github.com/KusionStack/KCLVM
+ https://github.com/Peefy/StackMachine
+ https://doc.rust-lang.org/book/
+ https://github.com/sunface/rust-course
+ https://www.influxdata.com/blog/rust-can-be-difficult-to-learn-and-frustrating-but-its-also-the-most-exciting-thing-in-software-development-in-a-long-time/
