I am currently working on a personal project called the [JavaScript Oxidation Compiler](https://github.com/Boshen/oxc).
The compiler has a fast linter that can process around 1000 files per 100 milliseconds.
I am also in the process of developing a minifier. See the project README for more details.

```urlpreview
https://github.com/Boshen/oxc
```

# Personal Background

My journey with Rust began a few years back when [@Brooooooklyn](https://github.com/Brooooooklyn) was still sitting beside me.
He was banging his head against the wall and kept mumbling about this new language called Rust which he could not understand.

Two years later at a different company, I was handed a crumbling node.js API server that was demanded with high throughput.
I decided to rewrite it in Rust and it succeeded. The server handled unimaginable throughput without any problems.

I was convinced after this experience. I told myself that I wanted to become a full-time Rust developer.

So eventually I started wandering around the internet looking for interesting open-source projects. The [Rome project](https://rome.tools) caught my attention -
[Rome will be written in Rust](https://rome.tools/blog/2021/09/21/rome-will-be-rewritten-in-rust/).

Although I had previously looked at JavaScript tools as black boxes and never studied how they work, I decided to dive in and learn anyway.
I read everything about compilers and started participating in the Rome project.
But one day it hit me - "impostor syndrome". I know nothing about parsers nor compilers or anything about Rust.

> For the things we have to learn before we can do them, we learn by doing them — Aristotle

I started writing my own compiler in Rust to fully understand everything.

## On Performance

After two years of writing Rust, performance has become an ingrained discipline for me - it boils down to
**allocate less memory** and **use fewer CPU cycles**.

However, achieving optimal performance can be difficult without the knowledge of the problem domain or awareness of potential solutions.

I will take you on my journey of performance and optimization in the following sections.
My preferred method of learning is through a combination of research, trial, and error,
so the following sections will be organized as such.

# Parsing

Oxc is a standard compiler that includes an abstract syntax tree (AST), a lexer, and a recursive descent parser.

## Abstract Syntax Tree (AST)

The first architectural design for a compiler is its AST.

All JavaScript tools work on the AST level, for example:

- A linter (e.g. ESLint) checks the AST for errors
- A formatter (e.g.prettier) prints the AST back to JavaScript text
- A minifier (e.g. terser) transforms the AST
- A bundler connects all import and export statements between ASTs from different files

It will be painful to build these tools if the AST is not user-friendly.

For JavaScript, the most used AST specification is [estree](https://github.com/estree/estree).
My first AST version replicates estree:

```rust
pub struct Program {
    pub node: Node,
    pub body: Vec<Statement>,
}

pub enum Statement {
    VariableDeclarationStatement(VariableDeclaration),
}

pub struct VariableDeclaration {
    pub node: Node,
    pub declarations: Vec<VariableDeclarator>,
}
```

In Rust, declaring a tree is relatively straightforward, as it involves using structs and enums.

### Memory Allocation

I worked on this version of AST for a couple of months while writing the parser.
And one day I decided to profile it. The profiler showed the program was spending a lot of time calling `drop`.

💡 Nodes of the AST are allocated on the heap via `Box` or `Vec`, they are allocated individually so they are dropped in sequential order.

Is there a solution to mitigate this?

So while working on the parser I studied some of the other JavaScript parsers written in Rust,
mainly [ratel](https://github.com/ratel-rust/ratel-core) and [jsparagus](https://github.com/mozilla-spidermonkey/jsparagus).

Both of these parsers declare their AST with a lifetime annotation,

```rust
pub enum Statement<'ast> {
    Expression(ExpressionNode<'ast>),
}
```

and they have an accompanying file called `arena.rs`.

I did not understand what it does so I neglected them until I started reading about their usage of memory arenas:
[bumpalo](https://docs.rs/bumpalo/latest/bumpalo/) and [toolshed](https://docs.rs/toolshed/latest/toolshed/struct.Arena.html).

In summary, memory arena allocates memory upfront in chunks or pages and deallocate altogether when the arena is dropped.
The AST is allocated on the arena so dropping the AST is a fast operation.

Another nice side effect that comes with this is that,
the AST is constructed in a specific order, and tree traversal also follows the same order, resulting in linear memory access during the visitation process.
This access pattern will be efficient since all nearby memory will be read into the CPU cache in pages, resulting in faster access times.

Unfortunately it can be challenging for Rust beginners to use memory arenas because all data structures and relevant functions need to be parameterized by lifetime annotations.
It took me five attempts to allocate the AST inside `bumpalo`.

Changing to a memory arena for the AST resulted around 20% performance improvement.

### Enum Sizes

Due to the recursive nature of ASTs, we need to define the types in a way to avoid the "recursive without indirection" error:

```
error[E0072]: recursive types `Enum` and `Variant` have infinite size
 --> crates/oxc_linter/src/lib.rs:1:1
  |
1 | enum Enum {
  | ^^^^^^^^^
2 |     Variant(Variant),
  |             ------- recursive without indirection
3 | }
4 | struct Variant {
  | ^^^^^^^^^^^^^^
5 |     field: Enum,
  |            ---- recursive without indirection
  |
help: insert some indirection (e.g., a `Box`, `Rc`, or `&`) to break the cycle
  |
2 ~     Variant(Box<Variant>),
3 | }
4 | struct Variant {
5 ~     field: Box<Enum>,
```

There are two ways to do this. Either box the enum in the enum variant or box the struct field.

I found the same question in the Rust forum back in 2017,
[Is there a better way to represent an abstract syntax tree?](https://users.rust-lang.org/t/is-there-a-better-way-to-represent-an-abstract-syntax-tree/9549/4)

Aleksey (matklad) told us to box the enum variants to keep the `Expression` enum small. But what does this mean?

As it turns out, the memory layout of a Rust enum is dependent on the sizes of all its variants, its total byte size dependents on the largest variant.
For example, the following enum will take up 56 bytes (1 byte for the tag, 48 bytes for the payload, and 8 bytes for alignment).

```rust
enum Enum {
    A, // 0 byte payload
    B(String), // 24 byte payload
    C { first: String, last: String }, // 48 byte payload
}
```

In a typical JavaScript AST, the `Expression` enum holds 45 variants and the `Statement` enum holds 20 variants. They take up more than 200 bytes if not boxed by enum variants.
These 200 bytes have to be passed around, and also accessed every time we do a `matches!(expr, Expression::Variant(_))` check, which is not very cache friendly for performance.

So to make memory access efficient, it is best to box the enum variants.

The [perf-book](https://nnethercote.github.io/perf-book/type-sizes.html) describes additional info on how to find large types.

I also copied the test for restricting small enum sizes.

```rust
#[cfg(all(target_arch = "x86_64", target_pointer_width = "64"))]
#[test]
fn no_bloat_enum_sizes() {
    use std::mem::size_of;
    use crate::ast::*;
    assert_eq!(size_of::<Statement>(), 16);
    assert_eq!(size_of::<Expression>(), 16);
    assert_eq!(size_of::<Declaration>(), 16);
}
```

Boxing the enum variants resulted around 10% speed-up.

### Span

Occasionally, we may not realize that a smaller memory footprint is possible until we spend some extra time examining the data structures.

In this instance, the leaf of all AST nodes contains a small data structure called the "span", which is used for storing the byte offset from the source text and comprises two `usize`s.

```rust
pub struct Node {
    pub start: usize,
    pub end: usize,
}
```

It was [pointed out to me](https://github.com/Boshen/oxc/pull/4#pullrequestreview-1294538874) that I can safely change `usize` to `u32`
to reduce peak memory because larger than `u32` is a 4GB file.

Changing to `u32` improved the performance [up to 5% performance on large files](https://github.com/Boshen/oxc/pull/31).

### Strings and Identifiers

Inside the AST, one may attempt to use a string reference to the source text for identifier names and string literals.

```rust
pub struct StringLiteral<'a> {
    pub value: &'a str,
}

pub struct Identifier<'a> {
    pub name: &'a str,
}
```

But unfortunately in JavaScript, strings and identifiers can have [escape sequences](https://mathiasbynens.be/notes/javascript-escapes),
i.e. `'\251'`, `'\xA9'` and `'©'` are the same for the copyright symbol.

This implies that we must compute the escaped values and allocate a new `String`.

### String interning

When there are lots of heap-allocated strings,
a technique called [string interning](https://en.wikipedia.org/wiki/String_interning) can be used to reduce total memory by storing only one copy of each distinct string value.

[string-cache](https://crates.io/crates/string_cache) is a popular and widely used library published by the servo team.
Initially, I used the `string-cache` library for identifiers and strings in the AST.
The performance of the parser was fast in a single thread,
but when I started implementing the linter where there are multiples parser running parallel with rayon,
CPU utilization was at about 50% of all cores.

Upon profiling, a method called `parking_lot::raw_mutex::RawMutex::lock_slow` showed up on the top of the execution time.
I did not know much about locks and multi-core programming,
but a global lock was just strange to start with,
so I decided to remove the `string-cache` library to enable full CPU utilization.

Removing `string-cache` from the AST improved the performance of parallel parsing by about 30%.

#### string-cache

Half a year later, while working on another performance-critical project,
the `string-cache` library resurfaced again. It was blocking all the threads during parallel text parsing.

I decided to study what `string-cache` does because I am
prepared this time after reading the book [Rust Atomics and Locks](https://marabos.nl/atomics/) by Mara Bos.

Here are the
[relevant](https://github.com/servo/string-cache/blob/6c044c91bb3d8212dae931152a7895f498574f71/src/dynamic_set.rs#L41-L42)
[code](https://github.com/servo/string-cache/blob/6c044c91bb3d8212dae931152a7895f498574f71/src/atom.rs#L204)
around the lock. Please note that the code was written eight years ago in 2015.

```rust
pub(crate) static DYNAMIC_SET: Lazy<Mutex<Set>> = Lazy::new(|| {
    Mutex::new({

// ... in another place
let ptr: std::ptr::NonNull<Entry> =
    DYNAMIC_SET.lock().insert(string_to_add, hash.g);
```

So this is straightforward. It locks the data structure `Set` every time a string is being inserted.
As this routine is called frequently within a parser, its performance is impacted negatively by synchronization.

Now let's take a look at the [`Set` data structure](https://github.com/servo/string-cache/blob/6c044c91bb3d8212dae931152a7895f498574f71/src/dynamic_set.rs#L53-L86)
and see what it does:

```rust
pub(crate) fn insert(&mut self, string: Cow<str>, hash: u32) -> NonNull<Entry> {
    let bucket_index = (hash & BUCKET_MASK) as usize;
    {
        let mut ptr: Option<&mut Box<Entry>> = self.buckets[bucket_index].as_mut();

        while let Some(entry) = ptr.take() {
            if entry.hash == hash && *entry.string == *string {
                if entry.ref_count.fetch_add(1, SeqCst) > 0 {
                    return NonNull::from(&mut **entry);
                }
                entry.ref_count.fetch_sub(1, SeqCst);
                break;
            }
            ptr = entry.next_in_bucket.as_mut();
        }
    }
    debug_assert!(mem::align_of::<Entry>() >= ENTRY_ALIGNMENT);
    let string = string.into_owned();
    let mut entry = Box::new(Entry {
        next_in_bucket: self.buckets[bucket_index].take(),
        hash,
        ref_count: AtomicIsize::new(1),
        string: string.into_boxed_str(),
    });
    let ptr = NonNull::from(&mut *entry);
    self.buckets[bucket_index] = Some(entry);

    ptr
}
```

It looks like it is looking for a bucket to store the string and it inserts the string if it is not in the bucket.

💡 Is this linear probing? If this is linear probing then this `Set` is just a `HashMap` without saying it is a `HashMap`.
💡 If this is a `HashMap`, then `Mutex<HashMap>` is a concurrent hashmap.

Although the solution may seem straightforward when we know what to look for, it took me a month to figure this out because I was unaware of the issue.
When it became evident that this is just a concurrent hashmap, applying the Mutex to the buckets instead of the entire hashmap was a clear and logical solution.
Within an hour of implementing this change, I submitted a pull request and was happy with the outcome 😃.

```urlpreview
https://github.com/servo/string-cache/pull/268
```

It is worth mentioning that string interning is a battlefield within the Rust community.
For the example shown in [this blog post](https://dev.to/cad97/string-interners-in-rust-797),
there are single-threaded libraries such `string-interner`, `lasso`, `lalrpop-intern`, `intaglio` and `strena`.

Since we are parsing files in parallel, an option is to utilize a multi-threaded string interner library such as [`ustr`](https://crates.io/crates/ustr).
However, after profiling both `ustr` and the enhanced version of `string-cache`, it became apparent that the performance was still below expectations compared to the approach I am going to explain below.

Some preliminary guesses for the sub-par performance are:

- Hashing - the interners need to hash the string for deduplication
- Indirection - we need to read the string value from a "far away" heap, which is not cache friendly

### String Inlining

So we are back to the initial problem of having to allocate lots of strings.
Fortunately, there is a partial solution to this problem if we look at what kind of data we are dealing with:
short JavaScript variable names and some short strings.
There is a technique called string inlining,
where we store all of the bytes of a string on the stack.

In essence, we want the following enum to store our string.

```rust
enum Str {
    Static(&'static str),
    Inline(InlineReprensation),
    Heap(String),
}
```

To minimize the size of the enum, `InlineRepresentation` should have the same size as `String`.

```rust
#[cfg(all(target_arch = "x86_64", target_pointer_width = "64"))]
#[test]
fn test_size() {
    use std::mem::size_of;
    assert_eq!(size_of::<String>(), size_of::<InlineReprensation>());
}
```

Many crates in the Rust community aim to optimize memory usage. This is yet another battlefield within the community.
The most popular ones are

- [smol_str](https://crates.io/crates/smol_str)
- [smartstring](https://crates.io/crates/smartstring)
- [compact_str](https://crates.io/crates/compact_str)
- [flexstr](https://crates.io/crates/flexstr)

Each of these crates have unique characteristics and approaches to achieving memory optimization, leading to a variety of trade-offs and considerations when choosing which one to use.
For example `smol_str` and `flexstr` clones are O(1).
`flexstr` can store 22 bytes, `smol_str` and `smartstring` can store 23 bytes, and `compact_str` can store 24 bytes on 64-bit systems.

[https://fasterthanli.me](https://fasterthanli.me) has a [deep dive](https://fasterthanli.me/articles/small-strings-in-rust) on this topic.

Changing `String` to `compact_str::CompactStr` reduced memory allocations by a large amount.

## Lexer

### Token

The job of the lexer (also known as tokenizer) is to turn source text into structured data called a token.

```rust
pub struct Token {
    pub kind: Kind,
}
```

To make it easier to work with, a token kind is typically defined as an enum in Rust. The variants of the enums hold the corresponding data for each token.

```rust
pub enum Kind {
    // Keywords
    For,
    While,
    ...
    // Literals
    String(String),
    Num(f64),
    ...
}
```

This enum currently uses 32 bytes, and a lexer often need to construct millions of this token `Kind`.
Every time it constructs a `Kind::For` or `Kind::While`, it has to allocate 32 bytes of memory on the stack.

A clever way to improve this is to break up the enum variant to keep `Kind` to a single byte and move the values into another enum,

```rust
pub struct Token<'a> {
    pub kind: Kind,
    pub value: TokenValue
}

pub enum TokenValue {
    None,
    String(String),
    Num(f64),
}
```

Since we control all the parsing code, it is our job to keep this safe by always declaring the corresponding token value to its kind.

While a `TokenValue` of 32 bytes is already quite small, it may still have a negative impact on performance because it is allocated frequently.

Let's take a look at the `String` type and see what we can find, by using the "go-to definition" in our code editors,
we'll go through `String` -> `Vec` -> `RawVec`:

```rust
pub struct String {
    vec: Vec<u8>,
}

pub struct Vec {
    buf: RawVec<T, A>,
    len: usize,
}

pub struct RawVec {
    ptr: Unique<T>,
    cap: usize,
    alloc: A,
}
```

As advertised, a `String` is just a `Vec` of `u8`s, and a `Vec` has a length and a capacity field.
Since we are never going to mutate this string, an optimization in terms of memory usage would be to drop the cap field and use a string slice (`&str`) instead.

```rust
pub enum TokenValue<'a> {
    None,
    String(&'a str),
    Num(f64),
}
```

`TokenValue` becomes 24 bytes.

While using a string slice instead of String in `TokenValue` would reduce memory usage, it does come with the downside of adding a lifetime annotation.
This can lead to issues with the borrow checker and the lifetime annotation will propagate to the rest of the codebase, making our code somewhat difficult to manage.
I lost the borrow checking game 8 months ago but [finally won](https://github.com/Boshen/oxc/pull/174) when I revisited this.

When it makes sense, we can always go for the owned version of the immutable data instead of using references.
For example `Box<str>` for `String` and `Box<[u8]>` for `Vec<u8>`.

In summary, we can always come up with tricks to keep our data structures small,
and it will sometimes reward us performance improvement.

### Cow

I first encountered the term `Cow` when I was studying jsparagus's code,
it has an infrastructure called [`AutoCow`](https://github.com/mozilla-spidermonkey/jsparagus/blob/212f6bdbc2cae909e7d5cfebf36284560c3c4ef4/crates/parser/src/lexer.rs#L2256).

I vaguely understood what the code was doing.
When a JavaScript string is being tokenized,
it allocates a new string when it encounters an escaped sequence or it returns the original string slice if it doesn't:

```rust
fn finish(&mut self, lexer: &Lexer<'alloc>) -> &'alloc str {
    match self.value.take() {
        Some(arena_string) => arena_string.into_bump_str(),
        None => &self.start[..self.start.len() - lexer.chars.as_str().len()],
    }
}
```

This is clever because 99.9% of the time it will not allocate a new string because escaped strings are rare.

But the term `Cow` or "clone-on-write smart pointer" never made sense to me.

> The type Cow is a smart pointer providing clone-on-write functionality: it can enclose and provide immutable access to borrowed data, and clone the data lazily when mutation or ownership is required. The type is designed to work with general borrowed data via the Borrow trait.

If you are new to Rust (like I was), then this description just doesn't help (I still don't understand what it is talking about).

It was [pointed out to me](https://twitter.com/zack_overflow/status/1620387950264713216) that `clone-on-write` is
just a use case of this data structure. A better name should be called `RefOrOwned` because it is a type that contains either
owned data or a reference.

### SIMD

When I was going through the old Rust blogs, the [Announcing the Portable SIMD Project Group](https://blog.rust-lang.org/inside-rust/2020/09/29/Portable-SIMD-PG.html)
caught my attention.
I always wanted to play around with SIMD but never got the chance.
After some research, I found a use case that may apply to a parser:
[How quickly can you remove spaces from a string?](https://lemire.me/blog/2017/01/20/how-quickly-can-you-remove-spaces-from-a-string) by Daniel Lemire.
So it turns out this has been done before, in a JSON parser called RapidJSON,
which [uses SIMD to remove whitespaces](https://rapidjson.org/md_doc_internals.html#SkipwhitespaceWithSIMD).

So eventually with the help of portable-SIMD and RapidJSON's code,
not only did I manage to [skip whitespaces](https://github.com/Boshen/oxc/pull/26),
I also managed to [skip multi-line comments](https://github.com/Boshen/oxc/pull/23) as well.

Both changes improved the performance by a few percent.

### Keyword match

At the top of the performance profile,
there is a hot code path that takes about 1 - 2% of the total execution time.

It tries to match a string to a JavaScript keyword:

```rust
fn match_keyword(s: &str) -> Self {
    match s {
        "as" => As,
        "do" => Do,
        "if" => If,
        ...
        "constructor" => Constructor,
        _ => Ident,
    }
}
```

With the addition of TypeScript, there are 84 strings for us to match from.
After some research, I found a blog from V8 [Blazingly fast parsing, part 1: optimizing the scanner](https://v8.dev/blog/scanner),
it describes its [keyword matching code](https://source.chromium.org/chromium/chromium/src/+/main:v8/src/parsing/keywords-gen.h) in detail.

> Since the list of keywords is static, we can compute a perfect hash function that for each identifier gives us at most one candidate keyword. V8 uses gperf to compute this function. The result computes a hash from the length and first two identifier characters to find the single candidate keyword. We only compare the identifier with the keyword if the length of that keyword matches the input identifier length.

So a quick hash plus an integer comparison should be faster than 84 string comparisons.
But we tried [again](https://github.com/Boshen/oxc/pull/140) and [again](https://github.com/Boshen/oxc/pull/171) to no avail.

As it turns out, [LLVM already optimized our code](https://github.com/Boshen/oxc/issues/151#issuecomment-1464818336).
By using `--emit=llvm-ir` on `rustc`, we find the relevant code:

```
  switch i64 %s.1, label %bb6 [
    i64 2, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit.i"
    i64 3, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit280.i"
    i64 4, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit325.i"
    i64 5, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit380.i"
    i64 6, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit450.i"
    i64 7, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit540.i"
    i64 8, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit590.i"
    i64 9, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit625.i"
    i64 10, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit655.i"
    i64 11, label %"_ZN4core5slice3cmp81_$LT$impl$u20$core..cmp..PartialEq$LT$$u5b$B$u5d$$GT$$u20$for$u20$$u5b$A$u5d$$GT$2eq17h46d405acb5da4997E.exit665.i"
  ], !dbg !191362
```

`%s` is the string, `%s.1` is its length ... it is branching on the string length! The compiler is smarter than us 😃.

(Yes, we got so serious with this so we started looking at LLVM IR and assembly code.)

Later on, [@strager](https://twitter.com/strager) posted a very educational YouTube video [Faster than Rust and C++: the PERFECT hash table ](https://www.youtube.com/watch?v=DMQ_HcNSOAI) on this topic.
The video taught us a systematic approach to reasoning about fine-tuning performance problems

In the end, we concluded that the simple keyword match is enough for us since it was only about 1 - 2% of the performance,
and the effort is not worth it after spending a few days on it - Rust does not have all the pieces we need to build this perfect hashmap.

## Linter

A linter is a program that analyzes the source code for problems.

The simplest linter visits each AST node and checks for rules.
[The visitor pattern](https://rust-unofficial.github.io/patterns/patterns/behavioural/visitor.html) can be used:

```rust
pub trait Visit<'a>: Sized {
    // ... lots of visit functions

    fn visit_debugger_statement(&mut self, stmt: &'a DebuggerStatement) {
        // report error
    }
}
```

### Parent Pointing Tree

It is easy to go down the AST by using visitors, but what if we want to go up the tree to collect some information?

This problem is particularly challenging to solve in Rust, because it is not possible to add a pointer to the nodes of the AST.

Let's forget about ASTs for a second and focus on generic trees with the property of a node having a pointer to its parent.
To build a generic tree, each tree node needs to be the same type `Node`, we can reference their parent by using `Rc`:

```rust
struct Node {
    parent: Option<Rc<Node>>,
}
```

It is tedious to work with this pattern if we need mutation, and
it is not performant because the nodes have to be dropped at different times.

A more efficient solution is to use a `Vec` as its backing storage and use indexes for pointers.

```rust
struct Tree {
    nodes: Vec<Node>
}

struct Node {
    parent: Option<usize> // index into `nodes`
}
```

[`indextree`](https://crates.io/crates/indextree) is a nice library for this task.

Back to our AST, we can build a `indextree` by having the nodes point to an enum that wraps every single kind of AST node.
We call this the untyped AST.

```rust
struct Node<'a> {
    kind: AstKind<'a>
}

enum AstKind<'a> {
    BlockStatement(&'a BlockStatement<'a>),
    // ...
    ArrayExpression(&'a ArrayExpression<'a>),
    // ...
    Class(&'a Class<'a>),
    // ...
}
```

The last missing piece is to have callbacks inside the visitor pattern that builds this tree.

```rust
pub trait Visit<'a> {
    fn enter_node(&mut self, _kind: AstKind<'a>) {}
    fn leave_node(&mut self, _kind: AstKind<'a>) {}

    fn visit_block_statement(&mut self, stmt: &'a BlockStatement<'a>) {
        let kind = AstKind::BlockStatement(stmt);
        self.enter_node(kind);
        self.visit_statements(&stmt.body);
        self.leave_node(kind);
    }
}

impl<'a> Visit<'a> for TreeBuilder<'a> {
    fn enter_node(&mut self, kind: AstKind<'a>) {
        self.push_ast_node(kind);
    }

    fn leave_node(&mut self, kind: AstKind<'a>) {
        self.pop_ast_node();
    }
}
```

The final data structure becomes `indextree::Arena<Node<'a>>` where each `Node` has a pointer to an `AstKind<'a>`.
`indextree::Node::parent` can be called to get the parent of any node.

The nice benefit of making this parent pointing tree is that it becomes convenient to visit AST nodes without having to implement any visitors.
A linter becomes a simple loop over all the nodes inside the `indextree`:

```rust
for node in nodes {
    match node.get().kind {
        AstKind::DebuggerStatement(stmt) => {
        // report error
        }
        _ => {}
    }
}
```

A full example is provided [here](https://github.com/Boshen/oxc/blob/main/crates/oxc_linter/examples/linter.rs).

At first glance, this process may seem slow and inefficient.
However, visiting the typed AST through a memory arena and pushing a pointer into `indextree` are efficient linear memory access patterns.
The current benchmark indicates that this approach is 84 times faster than ESLint, so it is certainly fast enough for our purposes.

### Processing files in parallel

The linter uses the [ignore](https://crates.io/crates/ignore) crate for directory traversal,
it supports `.gitignore` and adds additional ignore files such as `.eslintignore`.

A small problem with this crate is that it does not have a parallel interface,
There is no `par_iter` for `ignore::Walk::new(".")`.

Instead, [primitives need to be used](https://github.com/Boshen/oxc/blob/b51c2df3cc43b9f7d57380acc1552fac7db75fab/crates/oxc_cli/src/lint/runner.rs#L116-L139)

```rust
let walk = Walk::new(&self.options);
rayon::spawn(move || {
    walk.iter().for_each(|path| {
        tx_path.send(path).unwrap();
    });
});

let linter = Arc::clone(&self.linter);
rayon::spawn(move || {
    while let Ok(path) = rx_path.recv() {
        let tx_error = tx_error.clone();
        let linter = Arc::clone(&linter);
        rayon::spawn(move || {
            if let Some(diagnostics) = Self::lint_path(&linter, &path) {
                tx_error.send(diagnostics).unwrap();
            }
            drop(tx_error);
        });
    }
});
```

This unlocks a useful feature where we can print all diagnostics in a single thread, which leads us to the final topic of this article.

### Printing is slow

Printing the diagnostics was fast, but I have been working on this project for so long that it felt like an eternity to print thousands of diagnostic messages every time I run the linter on huge monorepos.
So I started searching through the Rust GitHub issues and eventually found the relevant ones:

- [io::Stdout should use block buffering when appropriate](https://github.com/rust-lang/rust/issues/60673)
- [stdin and stdout performance considerations are not documented](https://github.com/rust-lang/rust/issues/106133)

In summary, a `println!` call will lock `stdout` every time it encounters a newline, this is called line buffering.
To make things print faster, we need to opt-in for block buffering which is [documented here](https://rust-cli.github.io/book/tutorial/output.html#a-note-on-printing-performance).

```rust
use std::io::{self, Write};

let stdout = io::stdout(); // get the global stdout entity
let mut handle = io::BufWriter::new(stdout); // optional: wrap that handle in a buffer
writeln!(handle, "foo: {}", 42); // add `?` if you care about errors here
```

Or acquire the lock on stdout.

```rust
let stdout = io::stdout(); // get the global stdout entity
let mut handle = stdout.lock(); // acquire a lock on it
writeln!(handle, "foo: {}", 42); // add `?` if you care about errors here
```

---

At the moment of this writing,
development of Oxc is slowing down because I am currently considering the bigger picture of this project:

- an HIR (high-level intermediate representation) of the AST for scopes and symbols
- a unified semantic model for building more sophisticated features, including a control flow graph
- a performant Google Closure advanced compilation mode
- partnership with the [ezno](https://github.com/kaleidawave/ezno) experimental type checker

So please stay tuned.

---

If you found this article helpful, please give me a star to help keep me motivated.

```urlpreview
https://github.com/Boshen/oxc
```

Thank you for reading.
