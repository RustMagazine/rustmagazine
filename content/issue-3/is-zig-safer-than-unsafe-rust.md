Recently, a hotly debated post trending on Reddit: [When Zig is safer and faster than Rust](https://www.reddit.com/r/rust/comments/11l6ehj/when_zig_is_safer_and_faster_than_unsafe_rust/). Although the title says `Rust`, it's actually comparing with `Unsafe Rust`. Based on that post, I’d like to discuss which language is safer when writing Unsafe code: Is Zig safer than Unsafe Rust?

# Zig Language Introduction

```urlpreview
https://ziglang.org/
```

Zig is a modern, high-performance systems programming language aimed at simplifying some of the complexities of C while providing greater safety and ease of use. Zig was initiated by Andrew Kelley in 2016 and has received support from an active open-source community. Zig is suitable for various scenarios, such as operating system development, embedded systems, game development, high-performance computing, etc. Although the Zig language is relatively new, it has attracted the attention of many developers and has been applied in actual projects. With the development of the community and ecosystem, Zig is expected to become an important choice in the field of systems programming.

| Feature                  | Zig                                                                           | Rust                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Design Goals             | Simplicity, high-performance, ease of use, C compatibility                    | Safety, concurrency, high-performance, memory safety                       |
| Syntax                   | Closer to C language, simpler                                                 | Closer to ML series languages, expressive type system                      |
| Memory Safety            | Compile-time checks, no borrow checker and ownership system                   | Borrow checker and ownership system, compile-time guaranteed memory safety |
| Performance              | High performance, close to C language                                         | High performance, comparable to C++                                        |
| Line-by-Line Compilation | Supports line-by-line compilation, allows compile-time execution of code      | Supports const generics, limited compile-time execution capabilities       |
| Error Handling           | Error return values and error union types, no exceptions                      | Result and Option types, no exceptions                                     |
| FFI                      | Excellent C language compatibility, easy to interoperate with existing C code | Good FFI support, requires additional bindings creation                    |
| Package Management       | Built-in package manager                                                      | Cargo package manager                                                      |
| Runtime                  | No runtime overhead                                                           | Minimal runtime, can run without std                                       |
| Community and Ecosystem  | Relatively new, community in development                                      | Mature community and rich ecosystem                                        |

Please note that while this table summarizes the main differences, each language has its unique features in practice, so you may need to delve deeper into the characteristics of each language before making a choice.

Zig language is designed with a focus on memory safety, but unlike Rust, it does not have a ownership system and borrow checker. Nevertheless, Zig enhances memory safety through some compile-time checks and language features. Here are some ways Zig language implements memory safety:

1. **Compile-time checks**: The Zig compiler performs many checks during compilation to catch potential memory errors, such as array out-of-bounds access, null pointer dereference, etc. When the Zig compiler detects these errors, it stops the compilation and reports the error.
2. **Error handling**: Zig improves code robustness through explicit error handling. Zig does not have exceptions; instead, it uses error return values and error union types to handle errors. This forces developers to explicitly handle potential errors, helping to reduce memory safety issues caused by unhandled errors.
3. **Optional types**: Zig provides optional types (Optionals) to represent values that may be null. By using optional types, null value cases can be explicitly handled, reducing the risk of null pointer dereferences.
4. **Defined behavior**: Zig designs defined behavior for many memory-related operations to avoid security risks posed by undefined behavior. For example, when dereferencing a null pointer, Zig ensures that a clearly defined error occurs, rather than producing undefined behavior.
5. **Memory management**: Zig offers flexible memory management options, including manual memory management, built-in allocators, and the use of user-defined allocators. Through explicit memory management, developers can better control memory usage, reducing the risks of memory leaks and memory errors.

In summary, the Zig language, like C, entrusts memory management to humans, placing full trust in human development. Zig then provides some memory safety checks to ensure memory safety. However, it still lacks the strict compile-time guarantees of Rust's ownership system and borrow checker. Therefore, when writing Zig code, developers need to pay more attention to potential memory safety issues and ensure that errors and exceptional situations are handled correctly.

# Is Zig really safer than Unsafe Rust?

Compared to Safe Rust, the Zig language gives developers more freedom but is less safe than Safe Rust. However, is Zig safer than Unsafe Rust?

Let's go back to the Reddit article [When Zig is safer and faster than Rust](https://www.reddit.com/r/rust/comments/11l6ehj/when_zig_is_safer_and_faster_than_unsafe_rust/).

**1. The author says that using Unsafe Rust is difficult and relies entirely on Miri's checks.** This statement seems correct, but not entirely correct.

> Miri is a MIR interpreter with many functions. One of them is UB checking in Unsafe Rust.

First, Unsafe Rust is indeed challenging. After understanding the content about Unsafe Rust safety abstractions mentioned in the [previous article](/issue-3/understand-unsafe-rust), this difficulty should be reduced by half for Rust developers. At least, the usage of Unsafe Rust is not as confusing, and there is a correct direction.

UB issues also exist in the Zig language, and Zig will also face the problems of Unsafe code. When writing Unsafe code in Zig, memory safety guarantees mainly depend on the developer's experience and coding practices. Although the Zig compiler provides some compile-time checks, in Unsafe code, these checks may not be enough to capture all potential memory errors. To ensure memory safety when writing Unsafe code, developers can follow these practices:

1.  **Reduce the use of Unsafe code**: Try to minimize the use of Unsafe code without compromising performance and functionality. Limit Unsafe code to the smallest possible scope, making it easier to review and maintain.
2.  **Use the type system**: Make the most of Zig's type system to represent different types of data and constraints. The type system can help developers capture potential errors at compile-time, reducing the risk of memory errors.
3.  **Explicit error handling**: Ensure that potential errors are explicitly handled in Unsafe code, using error return values and error union types to represent possible error situations. This helps improve code robustness and reduce memory safety issues caused by unhandled errors.
4.  **Proper encapsulation and abstraction**: For parts that require the use of Unsafe code, consider encapsulating them into safe abstractions, isolating Unsafe code. This ensures that other parts of the code do not touch potential memory errors when called.
5.  **Code review**: Conduct a detailed code review for parts involving Unsafe code, ensuring that developers understand potential memory risks and take appropriate measures to prevent errors.
6.  **Testing**: Write test cases for Unsafe code, ensuring that it works correctly under different scenarios. Testing can help discover potential memory errors and verify the effectiveness of fixes.

When writing Unsafe code in Zig, it is also necessary to perform safety abstractions like Unsafe Rust and pay attention to maintaining safety invariants and validity invariants.

**2. The author provides two examples to illustrate the difficulty of using Unsafe Rust**

Firstly, using `*mut T` and `*const T` already loses the compiler's safety guarantees, and even in C, using pointers requires developers to ensure safety themselves. **In Zig, the usage of pointers is similar to that of C, so there is no particular safety advantage for Zig in this regard.**

The author also [states](https://zackoverflow.dev/writing/unsafe-rust-vs-zig/#the-most-challenging-part-aliasing-rules) that in Unsafe Rust, using pointers leads to scattered code, such as `(*ptr).field`, since pointers cannot call methods. However, there is a better and safer solution in Unsafe Rust:

```rust
impl Foo {
	/// # Safety
	/// When calling this method, you have to ensure that _either_ the pointer is null _or_ all of the following is true:
	/// -  The pointer must be properly aligned.
	/// -   The pointer must point to an initialized instance of `T`.
	unsafe fn as_ref<'a>(ptr: *const Foo) -> &'a Foo {
		unsafe {
		    if let Some(foo) = ptr.as_ref() {
		        println!("We got back the value: {foo}!");
		        foo
		    }
		}
	}
	/// # Safety
	/// When calling this method, you have to ensure that _either_ the pointer is null _or_ all of the following is true:
	/// -  The pointer must be properly aligned.
	/// -   The pointer must point to an initialized instance of `T`.
	unsafe fn as_mut<'a>(ptr: *mut Foo) -> &'a mut Foo {
		unsafe {
		    if let Some(foo) = ptr.as_mut() {
		        println!("We got back the value: {foo}!");
		        foo
		    }
		}
	}
}

```

The standard library provides `as_ref` and `as_mut` methods for raw pointers to convert them into immutable and mutable references. By implementing these two methods for `Foo`, safety conditions can be fully considered, and it becomes more convenient to call methods on instances of `Foo` without the need for `(*ptr).field`-like code.

Regarding the author's point about arrays, I have provided an improved version of their example:

```rust
#[derive(Debug)]
struct Value(i32);

unsafe fn do_stuff_with_array(values: *mut Value, len: usize) {
    let values: &mut [Value] = std::slice::from_raw_parts_mut(values, len);
    // I can use the ergonomics of iterators!
    for val in values.iter_mut() {
        // ...
        // Perform actions on each `val` of type &mut Value
        val.0 += 1;
    }
}

fn main() {
    // Example usage of `do_stuff_with_array`
    let mut values = vec![Value(1), Value(2), Value(3)];
    unsafe { do_stuff_with_array(values.as_mut_ptr(), values.len()) };
    println!("{values:?}");
}
```

I don't see any problem with this code. Perhaps I missed the author's point. At least I don't agree with their suggestion of avoiding the use of references as a solution to this issue.

The author refers to these issues as "dark arts" in Rust, but I have reason to believe that they may not fully understand Rust's safety philosophy regarding Unsafe Rust.

**3. The Author Favors Zig's Built-in Safety Strategy**

The built-in safety strategies in Zig that the author favors include:

- An explicit allocation policy and a special allocator that detects memory errors.
- Pointers are non-null by default, but their nullability can be expressed with `?*Value`.
- The dot operator is used for pointer dereferencing and distinguishing between single and array value pointers.

From this perspective, Zig's safety measures for pointers are similar to Rust's references. Zig may be more flexible to use, like C, without having to consider as many safety factors. It appears that Zig may be safer than Unsafe Rust.

Although Unsafe Rust's pointers are no different from those in C, their incorrect usage can lead to safety issues just like with C. However, Unsafe Rust's safety philosophy allows developers to fully consider the safety issues related to raw pointers. The standard library also provides some methods to assist developers in using pointers more safely. Developers can completely transform pointers into references or use `NonNull<T>` to make pointers non-null. Additionally, there are safety checking tools like Miri or [kani](https://model-checking.github.io/kani/) that perform safety checks on pointer-related issues.

Unsafe Rust has higher requirements for developers, and its safety may be better because the `unsafe` keyword in Unsafe Rust can propagate. For developers and reviewers, abstracting safety from Unsafe Rust requires more effort. However, these efforts are worthwhile.

Zig's safety strategies are not 100% safe and still require developers to consider safety factors. For example, explicit memory management allows developers to explicitly allocate and release memory, thus more clearly controlling the memory's lifecycle, but also means that developers have to assume more responsibility to ensure that memory errors do not occur.

**Therefore, there is no such thing as who is safer than whom.** However, Zig's performance is better than Unsafe Rust, at least according to the author's [benchmark tests](https://zackoverflow.dev/writing/unsafe-rust-vs-zig/#benchmark-results).

# Conclusion

This article attempts to compare Zig and Unsafe Rust on who is safer, which has recently been discussed on Reddit. Two pieces is not enough to cover all the various details of Unsafe Rust's safety abstractions. I'll write subsequent articles for the [#unsafe-rust](/topic/unsafe-rust) topic, please stay tuned!

Finally, it is worth noting that this article's creation was also aided by GPT4.

Thank you for reading.
