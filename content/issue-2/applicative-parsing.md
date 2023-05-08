# Programming is hard, looking for better abstractions

If you ever wrote a program bigger than a few lines of code you probably know that the bigger
the program gets - the harder it gets to ensure it does exactly what you meant, due to how
different parts can interact. Over time, programmers and computer scientists discovered various
ways to manage this complexity. Programming went from physically wiring the instructions, to
writing them as mnemonics with assembly languages, to abstractions with variables, labels,
functions, and so on.

[Functional Programming](https://en.wikipedia.org/wiki/Functional_programming)
is one of the paradigms for managing complexity. Its main idea is to abstract code as a set of
functions, and using those functions to pass values around rather than imperatively
to mutate data.

The main goal of this tutorial is to explain the idea of Applicative Functors, what its methods do,
and why you may want to use them. The code shown here is going to be similar but slightly different
from what you would use in a full featured command line argument parsing library - for
production you would want better error messages, help generation, dynamic completion and so
on. The main operations however, stay the same. Applicative Functors are not even limited to arg parsing
and you can try to follow this tutorial to get some ideas for your own problems.

Imagine you want to create an argument parser that parses your arguments into a struct like this:

```rust
struct Args {
    bin: String,
    jobs: u32,
}
```

If you want to write an argument parser purely imperatively, look at the horrors that entails,
think about how to scale and maintain this:

```rust
fn parse() -> Args {
    let mut bin = None;
    let mut jobs = None;

    let mut args = std::env::args();
    while let (Some(arg), Some(value)) = (args.next(), args.next()){
        if arg == "--bin" {
            bin = Some(value.to_string());
        }
        if arg == "--jobs" {
            jobs = Some(value.parse::<u32>.unwrap()),
        }
    };

    Args {
        bin: bin.expect("'--bin' not given"),
        jobs: jobs.expect("'--jobs' not given"),
    }
}
```

What if you could use functional programming to just describe what you want:

```rust
fn parse() -> Args {
    let bin = Arg("--bin").parse(|n| n.to_string());
    let jobs = Arg("--jobs").parse(|a| a.parse::<u32>);
    let Args = bin
      .zip(jobs)
      .map(|(bin, jobs)| Args { bin, jobs })
      .run()
      .unwrap()
}
```

Now lets see how we get there.

# Parsing command line options

If you used `cargo` you are probably familiar with expressions like this:

```console
$ cargo build --bin hello  # build a binary "hello"
$ cargo build --jobs 4     # build everything using 4 cpu jobs
```

Parsing command line options in general is a wide problem and to make it more manageable this
tutorial is going to look only at option arguments with a long name: `--bin hello` and
`--jobs 4` parts. This approach however can parse pretty much anything,
[`bpaf`](https://crates.io/crates/bpaf) is a finished library that uses it.

```urlpreview
https://crates.io/crates/bpaf
```

## Humble beginning

Let's start with some magical handwavey way, taking things from `std::env::args()` and placing
them in a container, that introduces a simple way of taking them out again.

```rust
// a magical container with a value already inside
struct Magic(&'static str);
impl Magic {
    // a way to get a value out of the container
    fn run(self) -> String {
        self.0.into()
    }
}

#[test]
fn sample() {
    // --bin hello
    let bin = Magic("hello");
    let result = bin.run();
    assert_eq!(result, "hello");
}
```

At this point the parser can represent single string arguments using `Magic` and extract them via `Magic::run`.

## Adding more types

Next step would be to allow it to have arguments of different types. Consider `--jobs` argument.
For some applications passing "4" to the consumer is valid, but in most cases consumer would
prefer to use its numeric value. To be able to pass a number like `4u32` the parser needs a way
to represent it in the first place. This can be achieved by making `Magic` a generic datatype:

```rust
struct Magic<T>(T);
impl<T> Magic<T> {
    fn run(self) -> T {
        self.0
    }
}
```
Generics allow us to represent and extract values of any type, but since our handwavy magic only creates variables of
type `Magic<&'static str>`, the parser still needs a way to change the type to another such as `Magic<u32>`.

For that [Category Theory](https://en.wikipedia.org/wiki/Category_theory) gives an abstraction called
[`Functor`](<https://en.wikipedia.org/wiki/Functor_(functional_programming)>).
A functor allows us to change a value inside of a generic context to some other value with the same
or a different type but without changing the context. Sounds scary, but `Option::map` does more
or less the same thing:

```rust
impl<T> Magic<T> {
    fn map<R, F: Fn(T) -> R>(self, f: F) -> Magic<R> {
        Magic(f(self.0))
    }
}

#[test]
fn sample() {
    use std::path::PathBuf;
    // --jobs 4
    let jobs = Magic("4"); // Magic<&str>
    let jobs = jobs.map(|s| u32::from_str(s).unwrap()); // Magic<u32>
    let result = jobs.run();
    assert_eq!(result, 4);
}
```

Every valid `Functor` implementation must satisfy a two laws - preserving identity functions
(Functor mapped with a function that changes nothing stays the same) and preserving composition
of functions (functor transformed with two functions should give the same result as the same
functor transformed with a composition of those two functions). For as long as it only changes
the values in a context without affecting the context itself - implementation should be valid.

At this point the parser can represent arguments of any type and provides a way to map between types.

## Handling failures

Supporting mapping that can't fail is easy with just the `Functor` abstraction, but it can't
handle failures well - consider parsing numeric information:

```
$ app --jobs 42
$ app --jobs Forty-two
```

A parser using `map`, `FromStr::from_str` and `unwrap` can parse the first line but panics
with a bad error message for the second one. To handle parsing failures `Magic` needs to be
able to represent them. The usual approach for dealing with failing computations in Rust is
with help from the `Result` type.

```rust
struct Magic<T>(Result<T, String>);
impl<T> Magic<T> {
    fn run(self) -> Result<T, String> {
        self.0
    }

    fn parse<R, F: Fn(T) -> Result<R, String>>(self, f: F) -> Magic<R> {
        match self.0 {
            Ok(x) => Magic(f(x)),
            Err(err) => Magic(Err(err)),
        }
    }
}
```

The `parse` method applies a failing computation on a value inside `Magic` if one exists or keeps
the error message untouched otherwise. The change in the representation of `Magic` also
requires to change `map`, but after that, fallible conversions are now possible:

```rust
impl<T> Magic<T> {
    fn map<R, F: Fn(T) -> R>(self, f: F) -> Magic<R> {
        self.parse(|x| Ok(f(x)))
    }
}

#[test]
fn sample() {
    use std::str::FromStr;
    // --jobs 42
    let jobs = Magic(Ok("42"));
    let result = jobs
        .parse(|n| u32::from_str(n).map_err(|e| e.to_string()))
        .run();
    assert_eq!(result, Ok(42));

    let jobs = Magic(Ok("Forty-two"));
    let result = jobs
        .parse(|n| u32::from_str(n).map_err(|e| e.to_string()))
        .run();
    assert_eq!(result, Err("invalid digit found in string".to_owned()))
}
```

At this point the parser can represent arguments of any type and failures too.
Alas, `parse` is an ad-hoc thing and isn't coming from Category Theory.

## Composing failing computations

`run` makes it easy to check if computation is successful and to proceed only when it is, but
it also adds a new corner case: consider an app that takes a name and the answer, checks if the
answer is correct and reports to the user:

```rust
let bin = bin.run().expect("You need to specify --bin");

// println!("Building binary {bin}!") // (1)

let jobs = jobs.run().expect("You need to specify --jobs");

// println!("Building binary {bin}!") // (2)

compile(bin, jobs);
```

The greeting code can go in one of two position: (1) and (2). In the first position it executes
before all the arguments are validated. In this example a failure to validate the first
argument results in a confusing message to user, but it's easy imagine a situation where,
instead of writing a message, an app might perform some harder to undo actions. Because of
this, a good argument parser needs to have a way to make sure all the arguments are validated
before proceeding.

An abstraction from the Category Theory called [`Applicative
Functor`](https://en.wikipedia.org/wiki/Applicative_functor) can help with this
scenario.

> Applicative functors allow us to run functorial computations in a sequence (unlike
> plain functors), but don't allow us to use results from prior computations in the definition of
> subsequent ones.

Sounds scary but `Option::zip` does something similar for `Option` and a variant for `Magic` looks
like this:

```rust
impl<T> Magic<T> {
    fn zip<R>(self, other: Magic<R>) -> Magic<(T, R)> {
        match (self.0, other.0) {
            (Ok(t), Ok(r)) => Magic(Ok((t, r))),
            (_, Err(err)) | (Err(err), _) => Magic(Err(err)),
        }
    }
}
```

This helps to combine the two independent computations for _bin_ and _jobs_ into a single
computation for both arguments:

```rust
let args = bin.zip(jobs);
let args = match args.run() {
    Ok(ok) => ok,
    Err(err) => panic!("There's a problem with your arguments: {err}"),
}

println!("Building binary {}!", args.0)
compile(args.0, args.1);
```

While `zip` can combine only two parsers you can chain it multiple times to create things like
`Magic<(A, (B, (C, D)))>` and flatten it later with `map` to `Magic<(A, B, C, D)>` or pack into a
struct like `Magic<Struct>`. A simple macro can take care of those transformations.

At this point the parser can deal with any number of arguments of any type while making sure they are all
present and valid.

## Composing failing computations in a different way

In some cases there can be more than one way to represent some information and for as long as
one of the representations is valid the alternatives may fail. To give an example an app might
expect user to specify either their nick name or a full name:

```console
app --nick Bob
app --fullname "Bob the Magnificent"
```

and work with whatever version the user prefers. For this style of composition Category Theory offers an
abstraction called
[`Alternative Functor`](https://en.wikibooks.org/wiki/Haskell/Alternative_and_MonadPlus).

It extends the parser with a single function that takes two values in contexts and picks one
that succeeds:

```rust
impl<T> Magic<T> {
    /// if first computation fails - pick the second one
    fn alt(self, other: Self) -> Self {
        match self.0 {
            Ok(t) => Magic(Ok(t)),
            Err(_) => other,
        }
    }
}
```

And a program that takes either a full or a nick name might look like this:

```rust
let nick = Magic(Err("No nick name given".to_string()));
let fullname = Magic(Ok("Bob the Magnificent"));
let name = nick.alt(fullname);

println!("Hello {}!", name.run().unwrap());
```

Since `zip` isn't constrained by argument types for as long as they are the same - it can pick
between whole different computation trees or different operations with multiple simple parsers
each.

At this point parser can deal with any number of arguments of any types allowing to pick valid
combinations.

## Failing intentionally and succeeding unconditionally

While an app might require users to specify some arguments, for other arguments there might be
a valid default value. Alternatively, for some cases a parser might provide better error
messages than a generic "argument --foo is missing". The `alt` method helps with both cases,
when composed with either an always failing (`fail`) or always succeeding (`pure`) parser:

```rust
impl<T> Magic<T> {
    /// put a value into a minimal valid context
    fn pure(val: T) -> Self {
        Magic(Ok(val))
    }

    /// produce a failing computation with custom error message
    fn fail(msg: &str) -> Self {
        Magic(Err(msg.to_owned()))
    }
}
```

Customizing error messages:

```rust
let name = nick.alt(fullname).alt(fail("You need to pass --nick or --fullname"));
```

Fallback to some default value:

```rust
let name = nick.alt(fullname).alt(pure("Anonymous"));
```

## Defined operations summary

Operations defined so far are sufficient to express arbitrary computations on command line
arguments:

```rust
struct Magic<T>(Result<T, String>);
impl<T> Magic<T> {
    /// a way to run a computation
    fn run(self) -> Result<T, String> {
        self.0
    }

    /// apply a pure transformation to a contained value
    fn map<R, F: Fn(T) -> R>(self, f: F) -> Magic<R> {
        self.parse(|x| Ok(f(x)))
    }

    /// apply a failing transformation to a contained value
    fn parse<R, F: Fn(T) -> Result<R, String>>(self, f: F) -> Magic<R> {
        match self.0 {
            Ok(x) => Magic(f(x)),
            Err(err) => Magic(Err(err)),
        }
    }

    /// compose two computations into a single one requiring both to succeed
    fn zip<R>(self, other: Magic<R>) -> Magic<(T, R)> {
        match (self.0, other.0) {
            (Ok(t), Ok(r)) => Magic(Ok((t, r))),
            (Err(err), _) | (_, Err(err)) => Magic(Err(err)),
        }
    }

    /// compose two computations, picking succeeding one
    fn alt(self, other: Self) -> Self {
        match self.0 {
            Ok(t) => Magic(Ok(t)),
            Err(_) => other,
        }
    }

    /// create an unconditionally succeeding computation
    fn pure(val: T) -> Self {
        Magic(Ok(val))
    }

    /// create an unconditionally failing computation
    fn fail(msg: &str) -> Self {
        Magic(Err(msg.to_owned()))
    }
}
```

Those seven operations serve as a base for the parser. They allow us to compose primitive argument
parsers in many ways to create a very wide range of computations and there's no mutations in the
API itself so it fits perfectly with a functional programming style.

There are a few examples of useful operations implemented in terms of this base API.

Optional command line arguments:

```rust
fn optional(magic: Magic<T>) -> Magic<Option<T>> {
    // if magic contains a value - wrap it in Some, otherwise use None
    // this will also consume any errors that can be inside, but we'll address
    // this problem later
    magic.map(Some).alt(pure(None))
}
```

Validating values with a function:

```rust
fn guard(magic: Magic<T>, check: impl Fn(&T) -> bool, msg: &str) -> Magic<T> {
    magic.parse(|val| {
        if check(&val) {
            Ok(val)
        } else {
            Err(msg.into())
        }
    })
}
```

# Back to the practical implementation

Now that the parser has all the basic building blocks the next step is to reimplement them
without `Magic<T>`, since current internal representation relies on handwavy magic to provide
`Magic` containers for arguments on a command line.

An obvious way to represent a specific flag would be by keeping its name around:

```rust
struct Arg(&'static str);
```

One way to represent all name-argument-pairs is to store them in a `BTreeMap<String,
String>` (for simplicity this parser assumes there is only a single argument per name).
With this, an invocation of

```console
$ app --bin hello --jobs 4
```

would create a map looking like this:

```json
{
  "bin": "hello",
  "jobs": "4"
}
```

Since `Arg`, as defined above, only represents a name and doesn't have a value
until the execution phase, the parser needs to use other data types to represent remaining
operations. In Rust, `trait`s are used to describe the same set of operations for different data types.

```rust
struct Arg(&'static str);

trait Parser<T> {
    fn run(self, args: &mut BTreeMap<&str, &str>) -> Result<T, String>;
}

impl Parser<String> for Arg {
    fn run(self, args: &mut BTreeMap<&str, &str>) -> Result<String, String> {
        // remove takes care about only consuming each argument at most once
        match args.remove(self.0) {
            Some(val) => Ok(val.to_owned()),
            None => Err(format!("{} is not found", self.0)),
        }
    }
}
```

With `Magic<T>` it's possible to apply the `map` transformation immediately, with `Arg` the
value isn't available until later so `map` needs to stash both the parser it changes and the
transformation it applies until later. A simple struct like `ParseMap` can do just that:

```rust
struct ParseMap<P, F, T, R> {
    // inner parser
    inner: P,
    inner_type: PhantomData<T>,
    // transformation function
    mapper: F,
    mapper_result: PhantomData<R>,
}
```

`PhantomData` here is something required by the Rust type system to allow us to implement `Parser`
trait for `ParseMap`. Since `ParseMap` doesn't need to know what exact parser it works on.
As long as types align - `map` can go directly into the trait as a default implementation.

```rust
trait Parser<T>
where
    Self: Sized,
{
    ...
    fn map<R, F>(self, f: F) -> ParseMap<Self, F, T, R>
    where
        F: Fn(T) -> R,
    {
        ParseMap {
            inner: self,
            inner_type: PhantomData,
            mapper: f,
            mapper_result: PhantomData,
        }
    }
}
```

`run` for `ParseMap` simply runs the inner parser and applies the transformation if inner
parser succeeded.

```rust
impl<F, P, R, T> Parser<T> for ParseMap<P, F, T, R>
where
    P: Parser<R>,
    F: Fn(R) -> T,
{
    fn run(self, args: &mut BTreeMap<&str, &str>) -> Result<T, String> {
        let p = self.inner.run(args)?;
        Ok((self.mapper)(p))
    }
}
```

`parse`'s implementation is almost identical to `map`, but instead of wrapping the result in `Ok`
it uses what `mapper` returns.

```rust
struct ParseParse<P, F, T, R> {
    // inner parser
    inner: P,
    inner_type: PhantomData<T>,
    // transformation function
    mapper: F,
    mapper_result: PhantomData<R>,
}

impl<F, P, R, T> Parser<T> for ParseParse<P, F, T, R>
where
    P: Parser<R>,
    F: Fn(R) -> Result<T, String>,
{

    fn run(self, args: &mut BTreeMap<&str, &str>) -> Result<T, String> {
        let p = self.inner.run(args)?;
        (self.mapper)(p)
    }
}
```

`zip` is close too, but instead of a single inner parser it holds two of them and runs them
sequentially, when either parser fails - whole computation fails by the power of `?` operator:

```rust
struct ParseZip<L, R, A, B> {
    left: L,
    left_type: PhantomData<A>,
    right: R,
    right_type: PhantomData<B>,
}

impl<L, R, A, B> Parser<(A, B)> for ParseZip<L, R, A, B>
where
    L: Parser<A>,
    R: Parser<B>,
{
    fn run(self, args: &mut BTreeMap<&str, String>) -> Result<(A, B), String> {
        let a = self.left.run(args)?;
        let b = self.right.run(args)?;
        Ok((a, b))
    }
}
```

`pure` and `fail` simply stash the expected value or the error message and return them inside
the `run` function without touching `args` at all.

With `alt` picking between two alternatives and each alternatives potentially consuming the
same command line options, both branches must get exactly the same set of inputs and the final
set of changes to `args` should come from the succeeding branch:

```rust
struct ParseAlt<L, R, T> {
    left: L,
    right: R,
    result_type: PhantomData<T>,
}

impl<L, R, T> Parser<T> for ParseAlt<L, R, T> {
    fn run(self, args: &mut BTreeMap<&str, String>) -> Result<T, String> {
        let args_copy = args.clone();
        match self.left.run(&mut args_copy) {
            Ok(ok) => {
                std::mem::swap(args, &mut args_copy);
                Ok(ok)
            }
            _ => self.right.run(args)
        }
    }
}
```

With all those methods in place, all that's missing is a wrapper to take care of getting
arguments from `std::env::args()`, placing them into a `BTreeMap` and invoking `run`. Since
these steps the same for every `Parser`, it can be provided as a default implementation on the
`Parser` trait.

```rust
    ...
    fn exec(self) -> Result<T, String> {
        let argv = std::env::args().collect::<Vec<_>>();
        let mut args = BTreeMap::new();
        for i in 0..argv.len() / 2 {
            args.insert(&argv[i * 2], &argv[i * 2 + 1]);
        }
        self.run(&mut args)
    }
    ...
```

# Conclusions

## Using applicative parser command line parser

This tutorial establishes the base components for an applicative command line parser.
The [`bpaf`](https://crates.io/crates/bpaf) library extends this concept all the way to
production ready state.

Unlike traditional command line interface parsers, where one argument maps roughly to a single
field and validations are limited to cases accounted for by the parser library authors, using
applicative functors lets library users perform almost arbitrary transformations and
validations. For example, it's possible to have a single option to write to a multiple fields
or require that fields come in groups.

The fact that individual parsers compose makes it easy to share them across multiple binaries
in the same project. For example if your apps contain a notion of data input from multiple
types of sources (local file, remote data base, live network feed) it might be convenient to
have a single datatype representing it, possibly with `enum`, and a single shared parser that
lets users specify it. Such parser can contain all the help messages, validations, possible
dynamic shell completion functions and so on and can be easily reused across different binaries.

Typical steps consists of

- figuring out a list of options your app might take and relationships between them
- packing those options into a composition of `struct`s and `enum`s (to represent mutually required and mutually exclusive combinations respectively)
- decorating parsers with help messages, validations and shell completion functions

The derive macro supplied by `bpaf`'s `derive` feature helps to avoid writing most of the parsing
and composition code by hand, but in some cases using a mix of derived and manually written code
leads to overall cleaner results.

## Using Category Theory abstractions such as Applicative Functors

Rust already supports a very limited subset of similar function compositions with unstable
`Try` trait and `?` operator. Abstractions introduced in this tutorial can help to extend such
composition with the ability to implicitly pass information around, to try different paths through
compositions and collect information about successes and failures and make this information
available though side channels.

As shown earlier, Applicative Functors can help with splitting problems containing both business
logic (what command line options to consume and what constraints they must obey) and glue logic
(what arguments got consumed so far, how to pass consumed arguments around, how to make sure
consistent validations, etc) into performant and purely functional style code as far as the
external API is concerned.

While designing an Applicative style API requires some specialized knowledge - mostly what kind
of laws implementation needs to obey and how to check them - using the resulting API does not. With
help of the Rust's type system it's easy to make sure that for as long as the user's code
typechecks - it works and all compositions are correct.
