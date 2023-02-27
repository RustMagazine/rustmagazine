# Programming is hard, looking for better abstractions

If you ever wrote a program bigger than a few lines of code you probably know that the bigger
the program gets - the harder it's to make sure it does exactly what you meant due to how
different parts can interact. Over time programmers and computer scientists discovered multiple
ways to manage this complexity. Programming went from physically wiring the instructions to
writing them as mnemonics with assembly language, to abstractions with variables, labels,
functions, and so on.


[Functional Programming](https://en.wikipedia.org/wiki/Functional_programming)
is one of the paradigms for managing complexity with its main idea of writing code as a set of
functions and using those functions to pass values around instead imperative style of steps
to perform to mutate some data.

Rust supports both functional and imperative approaches well and parts of its standard library
are implemented with functional use in mind. Following examples show the difference between two
approaches:

Imperative approach describes exact steps program needs to take, for example, to calculate a
sum of all the vector items:
- initialize `sum` with 0
- start at the first element of the array
- multiply `i`th element of the array by two and add it to `sum`
- proceed to the next element
- repeat until the last element of the array

```rust
let xs = vec![1,2,3,4];
let mut sum = 0;
let mut i = 0;
loop {
    sum += xs[i] * 2;
    i += 1;
    if i == xs.len() {
        break;
    }
}
```

While functional approach describes what the result is:
- start from a sequence containing all the items in the array
- make a new sequence from it by doubling all the items
- result is a sum of all the elements of this new sequence

```rust
let xs = vec![1,2,3,4];
let sum = xs.iter().map(|x| x * 2).sum();
```

Both examples compile to the same set of instructions but it is easier to make a mistake in the
imperative one.

Not all the tasks are perfect fit for functional approach, at least not in an obvious way. This
article is going to explore ways of using purely functional approach for a problem that seems
to be better suited for imperative style.

# Parsing command line options

The main goal for this tutorial is to implement a basic library to parse command line options.
If you used `cargo` you are probably familiar with expressions like this:

```console
$ cargo build --bin hello      # build a binary "hello"
$ cargo check --package server # check if package "server" contains any issues
```

Parsing command line options in general is a wide problem and to make it more manageable this
tutorial is going to look only at option arguments with a long name: `--bin hello` and
`--package server` parts. This approach however can parse pretty much anything,
[`bpaf`](https://crates.io/crates/bpaf) is a finished library that uses it.

## Humble beginning

Tutorial starts with some magical handwavey way of taking things from `std::env::args()` and placing
them into variables and introduces a simple way of taking them out of the variables.

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
    // --name Bob
    let name = Magic("Bob");
    let _result = name.run(); // "Bob"
}
```

At this point parser can consume multiple string arguments using `Magic` and `Magic::run`.

## Adding more types

Next step would be to allow to have arguments of different types. Consider filenames. While
most of the functions would take a regular string reference as a filename - not every `String` is
a valid filename and not every filename is a valid `String`. It's a good practice to keep
`String` for strings and `PathBuf` for filenames. Type can also serve as a documentation for
users.

To be able to consume `PathBuf` from user's input parser needs a way to represent it in the first
place. One approach would be to make `Magic` a generic datatype:

```rust
struct Magic<T>(T);
impl<T> Magic<T> {
    fn run(self) -> T {
        self.0
    }
}
```

This allows to represent values and get them out but since handwavy magic creates variables of
type `Magic<&'static str>` parser still needs a way to change the type to `Magic<PathBuf>` or
any other type.

For that Category Theory gives an abstraction called
[`Functor`](https://en.wikipedia.org/wiki/Functor_(functional_programming)?useskin=vector).
Functor allows to change a value inside of a generic context to some other value with the same
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
    // --name Cargo.toml
    let name = Magic("Cargo.toml"); // Magic<&str>
    let _result = name.map(PathBuf::from).run(); // "Cargo.toml", PathBuf
}
```

Every valid `Functor` implementation must satisfy a two laws - preserving identity morphism and
preserving composition of morphisms. For as long as it only changes the values in a context
without affecting the context itself - implementation should be valid.

At this point parser can represent arguments of any type and provides a way to map between types

## Handling failures

Supporting mapping that can't fail is easy with just the `Functor` abstraction but it can't
handle failures well - consider parsing numeric information:

```
$ app --answer 42
$ app --answer Forty-two
```

A parser using `map`, `FromStr::from_str` and `unwrap` can parse the first line but panics
with a bad error message for the second one. To handle parsing failures `Magic` needs to be
able to represent them. Usual approach for dealing with failing computations in Rust is
with help from the `Result` type works well here.

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
```

Function `parse` applies a failing computation on a value inside `Magic` if one exists or keeps
the error message untouched otherwise. Change in the representation requires to change `map` and
`parse` can help with that too.

```
impl<T> Magic<T> {
    fn map<R, F: Fn(T) -> R>(self, f: F) -> Magic<R> {
        self.parse(|x| Ok(f(x)))
    }
}

#[test]
fn sample() {
    use std::str::FromStr;
    // --answer 42
    let answer = Magic(Ok("42"));
    let _result = answer
        .parse(|n| u32::from_str(n).map_err(|e| e.to_string()))
        .run(); // Ok(42)
    todo!("{:?}", _result);

    // --answer Forty-two => Err("invalid digit found in string")
}
```

At this point parser can represent arguments of any type and failures too. Function `parse` is an
ad hoc thing and isn't coming from Category Theory.

## Composing failing computations

`run` makes it easy to check if computation is successful and to proceed only when it is, but it
also adds a new corner case: consider an app that takes a name and the answer, checks
if the answer is correct and reports to the user:

```rust
let name = match name.run() {
    Ok(ok) => ok,
    _ => panic!("You need to specify name"),
}

// println!("Hello {name}!") // (1)

let answer = match answer.run() {
    Ok(ok) => ok,
    _ => panic!("You need to specify the answer"),
}

// println!("Hello {name}!") // (2)

if answer == 42 {
    println!("Your answer is correct");
} else {
    println!("Your answer is wrong");
}
```

Greeting code can go in one of two position: (1) and (2), in the first position it executes
before all the arguments are validated. In this example failure to validate all the
arguments results in a confusing messages to user, but it's easy imagine a situation where an
app might perform some harder to undo actions. Because of this a good argument parser needs to
have a way to make sure all the arguments are validated before proceeding.

An abstraction from the Category Theory called [`Applicative
Functor`](https://en.wikipedia.org/wiki/Applicative_functor?useskin=vector) can help with this
scenario. Applicative functors allows to run functorial computations in a sequence (unlike
plain functors), but don't allow to use results from prior computations in the definition of
subsequent ones.

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

This helps to combine two independent computations for *name* and *answer* into a single
computation for both arguments:

```rust
let args = name.zip(answer);
let args = match args.run() {
    Ok(ok) => ok,
    Err(err) => panic!("There's a problem with your arguments: {err}"),
}

println!("Hello {}!", args.0)
if args.1 == 42 {
    println!("Your answer is correct");
} else {
    println!("Your answer is wrong");
}
```

While `zip` can combine only two parsers you can chain it multiple times to create things like
`Magic<(A, (B, (C, D)))>` and flatten it later with `map` to `Magic<(A, B, C, D)>` or pack into a
struct like `Magic<Struct>`. A simple macro can take care of those transformations.

At this point parser can deal with any number of arguments of any type while making sure they all
present and valid.

## Composing failing computations in a different way

In some cases there can be more than one way to represent some information and for as long as
one of the representations is valid the alternatives may fail. To give an example an app might
expect user to specify either their nick name or a full name:

```console
app --nick Bob
app --fullname "Bob the Magnificent"
```

and work with whatever version user prefers. For this style of composition Category theory offers an
abstraction called
[`Alternative Functor`](https://en.wikibooks.org/wiki/Haskell/Alternative_and_MonadPlus).

It extends the parser with a single function that takes two values in contexts and picks one
that succeeds:

```rust
impl<T> Magic<T> {
    /// if first computation fails - pick the second one
    fn alt(self, other: Self) -> Self {
        match self.0 {
            Ok(t) => Magic(Ok(t)), => T
            Err(_) => other,
        }
    }
}
```
And a program that takes either full or short name might look like this:
```rust
let short = Magic(Err("No short name given").to_string());
let long = Magic(Ok("Bob the Magnificent"));
let name = short.alt(long);

println!("Hello {}", name.run().unwrap());
```

Since `zip` isn't constrained by argument types for as long as they the same - it can pick
between whole different computation trees or different operations with multiple simple parsers
each.

At this point parser can deal with any number of arguments of any types allowing to pick valid
combinations.

## Failing intentionally and succeeding unconditionally

While an app might require for user to specify some arguments, for some other arguments there
might be a valid default value. Alternatively for some cases parser might benefit from better
error messages than default "argument --foo is missing". Previously defined `alt` with helps
with both cases when composed with either always failing or always succeeding parser:

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
let name = short.alt(long).alt(fail("You need to pass --long or --short"));
```

Fallback to some default value:

```rust
let name = short.alt(pure("Anonymous"));
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

Those seven operations serve as a base for the parser. They allow to compose primitive argument
parsers in many ways to create a very wide range of computations and there's no mutations in the
API itself so it fits perfectly with a functional programming style.

There's a few examples of useful operations implemented in terms of this base API

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
            Ok(val(
        } else {
            Err(msg.into())
        }
    })
}
```

# Back to practical implementation

Now that the parser has all the basic building blocks the next step is to reimplement them
without `Magic<T>` since current version isn't practical.

An obvious way to represent specific flag would be by keeping its name around:

```rust
struct Arg(&'static str);
```

One way to represent all the arguments given by user is to store them in a `BTreeMap<String,
String>`  or `BTreeMap<String, Vec<String>>` to be able to handle multiple arguments with the
same name, but for simplicity this parser uses the former version.

User invocation

```console
$ app --name Bob --answer 42
```

can create a map looking like this:

```json
{
    "name": "Bob",
    "answer": "42",
}
```


Since `Arg` as defined above can only represent a `String` and doesn't have a value inside
until the execution phase parser needs to use other data types to represent remaining
operations. A unified way to perform the same set of operations on different data types is by
using a trait:

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

`PhantomData` here is something required by the Rust type system to allow to implement `Parser`
trait for `ParseMap`. Since `ParseMap` doesn't need to know what exact parser it works on as
long as types align - `map` can go directly into the trait as a default implementation.

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

`parse`'s implementation almost identical to `map` but instead of wrapping the result in `Ok`
it uses what `mapper` returns.

```rust
    ...
    fn run(self, args: &mut BTreeMap<&str, &str>) -> Result<T, String> {
        let p = self.inner.run(args)?;
        (self.mapper)(p)
    }
    ...
```

`zip` is close too, but instead of a single inner parser it holds two of them and runs them
sequentially, when either parser fails - whole computation fails by the power of `?` operator:

```rust
    ...
    fn run(self, args: &mut BTreeMap<&str, &str>) -> Result<(A, B), String> {
        let a = self.left.run(args)?;
        let b = self.right.run(args)?;
        Ok((a, b))
    }
    ...
```

`pure` and `fail` simply stash the expected value or the error message and return them inside
the `run` function without touching `args` at all.

With `alt` picking between two alternatives and each alternatives potentially consuming the
same command line options both branches must get exactly the same set of inputs and the final
set of changes to `args` should come from the succeeding branch:

```rust
    ...
    fn run(self, args: &mut BTreeMap<&str, &str>) -> Result<T, String> {
        let args_copy = args.clone();
        match self.left.run(&mut args_copy) {
            Ok(ok) => {
                std::mem::swap(args, &mut args_copy);
                Ok(ok)
            }
            _ => self.right.run(args)
        }
    }
    ...
```

With all those methods in place all that's missing is a wrapper to take care of getting
arguments from `std::env::args()`, placing them into a `BTreeMap` and invoking `run`. One of the
ways would involve adding a method to the `Parser` trait to perform those steps.


```rust
    ...
    fn exec(self) -> Result<T, String> {
        let argv = std::env::args().collect::<Vec<_>>();
        let mut args = BTreeMap::new();
        for i in 0..argv.len() / 2 {
            args.insert(&argv[i*2], &argv[i*2+1]);
        }
        self.run(&mut args)
    }
    ...
```

# Conclusions

## Using applicative parser command line parser

This tutorial establishes the base components for an applicative command line parser,
[`bpaf`](https://crates.io/crates/bpaf) library extends it all the way to production ready
state.

Unlike traditional command line interface parsers where one argument maps roughly to a single
field and validations are limited to cases accounted for by the parser library authors using
applicative functors lets library users to perform almost arbitrary transformations and
validations. For example it's possible to have a single option to write to a multiple fields
or require that fields come in groups.

The fact that individual parsers compose makes it easy to share them across multiple binaries
in the same project. For example if your apps contain a notion of data input from multiple
types of sources (local file, remote data base, live network feed) it might be convenient to
have a single datatype representing it, possibly with `enum`, and a single shared parser that
lets users to specify it. Such parser can contain all the help messages, validations, possible
dynamic shell completion functions and so on and can be easily reused across all the binaries
in the project.

Typical steps consists of

- figuring out a list of options your app might take and relationships between them
- packing those options into a composition of `struct`s and `enum`s - mutually exclusive
  options go into different enum variants, mutually required options go into `struct` fields,
  etc.
- decorating parsers with help messages, validations and shell completion functions

Derive macro supplied by` bpaf`'s `derive` feature helps to avoid writing most of the parsing
and composition code by hands but in some cases using mix of derived and manually written code
leads to overall cleaner results.

## Using Category Theory abstractions such as Applicative Functors

Rust already supports a very limited subset of similar function compositions with unstable
`Try` trait and `?` operator. Abstractions introduced in this tutorial can help to extend such
composition with ability to implicitly pass information around, to try different paths though
compositions and collect information about successes and failures and make this information
available though side channels.

As shown earlier Applicative Functors can help with splitting problems containing both business
logic (what command line options to consume and what constraints they must obey) and glue logic
(what arguments got consumed so far, how to pass consumed arguments around, how to make sure
consistent validations, etc) into performant and purely functional style code as far as the
external API is concerned.

While designing an Applicative style API requires some specialized knowledge - mostly what kind
of laws implementation needs to obey and how to check them, using the resulting API does not. With
help of the Rust's type system it's easy to make sure that for as long as the user's code
typechecks - it works and all compositions are correct.
