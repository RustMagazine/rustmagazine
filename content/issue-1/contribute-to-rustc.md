# I Learn Rust By Contributing To Rust Compiler

---

I spent a lot of my spare time contributing to the Rust compiler in the second half of 2022, and I learned a lot from such a friendly and vibrant community, not only about Rust, but about the core skills of software engineering and, most importantly, the I got a lot of fun from programming in Rust.

I finished about [70+ PRs](https://github.com/rust-lang/rust/pulls?q=is%3Apr+author%3Achenyukang+is%3Aclosed) in this period of time, and my recent milestone was receiving a [Project Grant from the Rust Foundation](https://foundation.rust-lang.org/news/community-grants-program-awards-announcement-introducing-our-latest-project-grantees/).

Here, I'd like to share my Rust experience with you.

## My Background and How I started

I have more than ten years of programming experience, the book [Essentials of Programming Languages](https://github.com/chenyukang/eopl) tiggered my interests in programming languages and implementation.

In 2014, I found Rust in Github, in that period of time, I was intested in OCaml, and Rust compiler was initially implemented in OCaml.

I spent some time to play with it, and then I begin to write some simple programs in Rust. I remember my first impression of Rust was that the language was too complex, with several kinds of pointers!

From 2015 to 2020, I didn't spend much time on Rust, but I didn't completely ignore it either. Because I was using Ruby in my daily work and I like OCaml, the syntax of Rust is familiar to me. I've used Rust for some small personal hobby projects and practiced Rust with [exercism](https://exercism.org/).

In 2020, when I started another personal project called [gomoku](https://github.com/chenyukang/gomoku), I just realized that Rust's toolchain had become so great, and programming in Rust was a joy, and I only need to focus on the coding logic, the dependency management, testing, and documentation tools were all ready for me. From that time, I began to contribute to Rust projects in WebAssembly and containers, such as [wasmerio/wasmer](https://github.com/wasmerio/wasmer),[containers/youki](https://github.com/containers/youki),[second-state/dapr-wasm](https://github.com/second-state/dapr-wasm).

My [first PR](https://github.com/rust-lang/rust/pull/88493) for Rust compiler was in September 2021, this was a compiler issue that I found in development, some diagnostics from compiler may duplicated. I was curious about the root cause, so I clone the compiler's code and begin to debug. In fact, I underestimated the difficulty of getting started, this problem took me almost a week of my spare time, I spent a lot of time reading documents, I also tried to use gdb to follow some parts of code.

Finishing my first PR was fulfilling, but then I went on to other things. It wasn't until August 2022 that I inadvertently clicked on the link [Rust is Beautiful #100000](https://github.com/rust-lang/rust/issues/100000), I stopped by to look at a few issues and found some issues related to the parser and error messages that seemed easy to solved, so I started contributing to the compiler again. The next two weeks were Microsoft hackthon, where we could learn new things that interested me, so I spent most of my time on Rust, and now I contribute to regularly.

## You don't need to be a compiler expert

Contributing to a compiler is not easy, but it is not as difficult as many people think. Rust was created and developed on Github, and the design documents and all code are public, in a transparent manner. Rust was not designed by a small elite group they call a standardization committee, instead Rust was built by people from different backgrounds, and everyone can submit a PR or RFC to change it.

Furthermore, Rust has a very active open-source community, a group of friendly Rustaceans, so in my experience, contributing to Rust is not as difficult as other widely used programming language.

Of course, it's harder to change the semantics of the language, but there are enough engineering challenges within the compiler itself for beginners.

You don't have to be an expert in Rust, as long as you can understand most of Rust's syntax and have enough patience, you can have a try to read the source code of Rust compiler, or try to make any change which may make it better.

However, knowing some aspects about compilers will help you a lot, and if you are interested in compilers, these books and projects will help you:

- [Crafting Interpreters](http://craftinginterpreters.com/)
- [Essentials of Programming Languages](https://eopl3.com/)
- [9cc: A Small C Compiler](https://github.com/rui314/9cc)
- [r9cc: Toy C compiler](https://github.com/utam0k/r9cc)

## The Workflow

The Rust compiler repository contains tens of thousands of test cases. Whether you are fixing bugs or working on some new feature, you'd better prepare some minimal test cases first, then keep modifying the code, compiling, and testing, repeat the iteration until all the cases pass.

![](https://catcoding.me/images/ob_pasted-image-20230117125646.png)

The biggest disadvantage of compiled languages is that we lose the fun of interactive programming, especially with Rust, which is a particularly time-consuming compiled language. The good thing is that after the coding phase is done, we don't have any more errors.

To reduce the number of compilations, my solution is to add more logging.

The most time-consuming part of the process is probably the code review phase, PR may need several weeks for reviewing. The community is currently discussing how to solve this problem [Did we start reviewing PRs slower?](https://internals.rust-lang.org/t/did-we-start-reviewing-prs-slower/18033).

You need to spend a lot of time communicating and discussing with others, so writing skills are important.

## How to begin

Start with the [Guide to Rustc Development](https://rustc-dev-guide.rust-lang.org/getting-started.html), this document may not be up to date, but it is very helpful to get an overview of the various topics of the compiler.

At first, you can find some relatively simple issues to solve from labels like [E-mentor](https://github.com/rust-lang/rust/issues?q=is%3Aissue+is%3Aopen+label%3AE-mentor), [E-easy](https://github.com/rust-lang/rust/issues?q=is%3Aissue+is%3Aopen+label%3AE-easy), [E-help-wanted](https://github.com/rust-lang/rust/issues?q=is%3Aissue+is%3Aopen+label%3AE-help-wanted). But if you can't find the right one, you can also find random problems that you can understand and try to solve them.

Issues labeled with [A-diagnostics](https://github.com/rust-lang/rust/issues?q=is%3Aissue+is%3Aopen+label%3AA-diagnostics) are mostly about improving or fixing error diagnostics from compiler, which may suitable for beginners. A large amount of code exists in the Rust compiler to provide developers with the most useful and friendly diagnostics, Rust's focus and investment in this area is more than most programming languages, as [estebank](https://github.com/estebank) writes:

> We spent decades trying to invent a sufficiently smart compiler when we should have been inventing a sufficiently empathetic one.

To solve such kind of issue, we need to understand the AST, infer the user's coding intent, and dig all the useful things from the type system, as well as the various data structures in the compiler, to provide the best possible help, even pretty error messages. We can find the code corresponding to the error message by searching for keywords, but not all of these issues are easy to solve.

Some [ICE](https://github.com/rust-lang/rust/issues?q=is%3Aissue+is%3Aopen+label%3AI-ICE) issues are also relatively easy to solve, such as some corner cases that have not been covered, usually there is a simple and direct solution, but choosing the best one from various fixing solutions is also an art.

An important shift in doing compiler development is to move from being a user of a language to being a contributor.

I saw this on Twitter the other day, and my first question was why the compiler would have two suggestions at the same time, the first one apparently only for cases that care about returning result:

![](https://catcoding.me/images/ob_pasted-image-20230117005319.png)

So I created an issue to track it and subsequently landed a PR to fix it [Properly handle postfix inc/dec](https://github.com/rust-lang/rust/pull/104875).

I also try to fix those issues that I encounter during development. For example, I found that if I missed a '}' in typing, the compiler may not be able to point out the delimiter mismatch in right span, and if the source file is long, it may report a lot of unrelated errors, so I made another [PR to fix it](https://github.com/rust-lang/rust/pull/104012).

## Some random tips

Rust has a not-quite-complete [Reference](https://doc.rust-lang.org/reference/), which is helpful if you can't understand some part of the code, probably because you don't know the terminology.

In the development of rustc, `x.py` is a frequently used command, I wrote my  requently used commands as a [justfile configuration file](https://github.com/chenyukang/share/blob/main/justfile), so it will be easier to run testing, check logs, rebase, etc.

Logging and reading code is more useful than `gdb` during debugging. By reading the code, printing logs at key steps, and verifying our guesses with runtime logs, we can get the flow and structure of the code in our mind, whereas it is easy to get lost in the specifics with gdb tracing.

Reading Rust code is easy with `rust-analyzer`, and the `show call hierarchy` is particularly useful for understanding function calls.

If you run into trouble in development, you can post a topic at [t-compiler/help](https://rust-lang.zulipchat.com/#narrow/stream/182449-t-compiler.2Fhelp). `zulip` is a discussion tool used by Rust compiler developers, and the Rust experts are friendly for newcomers.

Another great way to learn is to review other's PRs. It's okay if you can't understand every change at first, but you can try to grasp the general idea. If I'm interested in an issue but don't have time to work on it, or I would like to learn something in that topic, I'll subscribe to notifications so if the issue is closed I'll get an email and I'll probably go to have a look at the PR.

## Summary

Rust is growing rapidly in Infra, WebAssembly and Web development, embedded, games, security, and more.

I'm not an expert on Rust, but I've found that contributing to the Rust compiler is the best way to learn Rust. This may not be for everyone, but maybe you can try it too.

And contributing to Rust is not limited to programming, reporting issues, improving the documentation and translations, and joining discussions are all community contributions.

Hope my sharing can help you, Happy Rust Coding🦀!

