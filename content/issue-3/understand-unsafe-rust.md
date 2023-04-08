# Introduction

As is well known, the Rust language consists of two major parts: Safe Rust and Unsafe Rust. Unsafe Rust is a superset of Safe Rust. This means that all code written in Safe Rust can also work normally in Unsafe Rust, but Unsafe Rust provides additional features and operations that cannot be used directly in Safe Rust.

However, one of the most frequently asked questions in the community is: **Why is Rust considered a safe language when a large amount of Unsafe Rust is used in the standard library?**

Moreover, some people in the community even develop PTSD towards Unsafe Rust, deeming anything involving Unsafe as unsafe. Admittedly, we should minimize the use of Unsafe, but when faced with situations where Unsafe is indispensable, we should know how to use Unsafe safely, know how to review Unsafe code, and thus not be so afraid and resistant when seeing Unsafe.

So, the goal of this article is to guide readers through a systematic understanding of Unsafe Rust, truly grasping the ingenious uses of Unsafe Rust.

# Why Unsafe Rust is Needed

**In general, Safe Rust is abstracted from Unsafe Rust. The world itself is Unsafe, so Unsafe comes first, followed by Safe. This is the basic worldview of the Rust language.**

This worldview is actually very consistent with the objective world and is very easy for people to understand. The universe is Unsafe, so we need Safe spaceships and spacesuits to explore it; the Earth is Unsafe, so we humans use science and civilization to continuously create Safe homes.

From a language design perspective, the reasons for needing Unsafe Rust are as follows:

- **Providing low-level support for high-level abstractions**: Rust provides some high-level abstractions, such as reference counting, smart pointers, synchronization primitives, etc. These abstractions require Unsafe operations at the lower level, such as raw pointer operations and memory management. Through Unsafe Rust, library developers can implement these low-level operations and encapsulate them in safe interfaces.
- **High-performance optimization**: To ensure memory safety, the Rust compiler automatically inserts some runtime checks, such as array boundary checks. In some performance-critical scenarios, these checks can become performance bottlenecks. Unsafe Rust allows developers to bypass these checks while ensuring safety, to achieve higher performance.
- **System-level programming**: As a systems programming language, Rust needs to handle low-level operations, such as operating systems or embedded systems, or driver development. Unsafe Rust provides this flexibility, making Rust suitable for these tasks.
- **Interoperability with other languages**: In real-world projects, Rust code may need to interact with code written in other languages (such as C/C++). Since these languages may use different memory management and type systems, Rust needs to provide a way to safely communicate with this external code. Unsafe Rust provides such a mechanism, allowing the handling of raw pointers and type conversions in Rust, thus enabling interoperability with other languages.
- **Language extensibility**: Unsafe Rust provides possibilities for future language features and libraries. By allowing low-level operations, Unsafe Rust enables the Rust community to continually explore new ideas and integrate them into the language.

In summary, from the perspective of Rust language design, Unsafe Rust is an intentional design compromise. It meets the needs of low-level operations, performance optimization, and interoperability while ensuring overall safety through strict restrictions and encapsulation.

# What Unsafe Rust Can Do

As mentioned earlier, Unsafe Rust is a superset of Safe Rust. Therefore, Unsafe Rust also includes all compiler safety checks in Safe Rust. However, Unsafe Rust also includes operations not found in Safe Rust, i.e., operations that can only be executed in Unsafe Rust:

1.  **Raw pointer operations**: You can create, dereference, and manipulate raw pointers (`*const T` and `*mut T`). This allows you to directly access memory addresses, perform memory allocation, deallocation, and modification, etc.
2.  **Calling Unsafe functions**: Unsafe Rust can call functions marked as `unsafe`. These functions may lead to undefined behavior, so they need to be called within an `unsafe` code block. These functions are typically used to implement low-level operations, such as memory management, hardware access, etc.
3.  **Implementing Unsafe traits**: You can implement traits marked as `unsafe`. These traits may contain potentially risky operations, and they need to be explicitly marked as `unsafe` when implemented.
4.  **Accessing and modifying mutable static variables**: In Unsafe Rust, you can access and modify mutable static variables with a global lifetime. These variables remain active throughout the entire program execution and may lead to potential data race issues.
5.  **Working with `Union` types**: Since multiple fields share the same memory location, using `union` carries certain risks. When accessing a `union` field, the compiler cannot guarantee type safety because it cannot determine which field the currently stored value belongs to. To ensure safe access to `union` fields, you need to perform operations within an `unsafe` code block.
6.  **Disabling runtime boundary checks**: Unsafe Rust allows you to bypass array boundary checks. By using `get_unchecked` and `get_unchecked_mut` methods, you can access array and slice elements without performing boundary checks, thereby improving performance.
7.  **Inline assembly**: In Unsafe Rust, you can use inline assembly (the `asm!` macro) to write processor instructions directly. This allows you to implement platform-specific optimizations and operations.
8.  **Foreign Function Interface (FFI)**: Unsafe Rust allows you to interact with code written in other programming languages (such as C/C++). This usually involves native pointer operations, type conversions, and calling unsafe functions.

It is important to note that caution is needed when using Unsafe Rust. Whenever possible, prefer using Safe Rust to write code. Although it provides powerful capabilities, it can also lead to undefined behavior and memory safety issues. Therefore, Rust's official standard library source code implementation and the official [Unsafe Code Guideline](https://rust-lang.github.io/unsafe-code-guidelines/) both contain the safety philosophy of Unsafe Rust to maintain its security.

# Safety Philosophy of Unsafe Rust

The safety philosophy of Unsafe Rust is **allowing developers to perform low-level operations and performance optimizations under restricted conditions while ensuring that the overall code remains safe**.

## Safety Abstraction: Maintaining Safety Invariants and Validity Invariants

What does it mean for the overall code to remain safe? Unsafe Rust has a term called **Safety Invariant** specifically for defining this.

Safe Rust has compiler safety checks to ensure memory safety and concurrency safety, but for those specialized operation scenarios of Unsafe Rust, the Rust compiler cannot help, so developers themselves need to ensure the memory safety and concurrency safety of the code. Unsafe Rust is the developer's safety commitment to the Rust compiler: "Leave safety to me to guard!"

In order to abide by this safety commitment when writing Unsafe Rust code, developers must always maintain safety invariants. **Safety invariants refer to the conditions that must be maintained throughout the entire program execution process to ensure memory safety.** These conditions usually include pointer validity, data structure integrity, data access synchronization, etc. Safety invariants primarily focus on the correct execution of the program and the avoidance of undefined behavior. When using Unsafe Rust, developers are responsible for ensuring that these safety invariants are met to avoid memory safety issues.

In the process of maintaining safety invariants, another concept to understand is the **Validity Invariant**. **Validity invariants refer to the conditions that certain data types and structures must meet during their lifetime.** Validity invariants mainly focus on the correctness of data types and structures. For example, for reference types, validity invariants include non-null pointers and valid memory being pointed to. When writing and using Unsafe Rust code, developers need to ensure that these validity invariants are maintained.

There is a certain degree of association between safety invariants and validity invariants because they both focus on the correctness and safety of the code. Maintaining validity invariants often helps ensure that safety invariants are met. For example, ensuring the validity of reference type pointers (validity invariant) can prevent null pointer dereferencing (safety invariant). Although they are related, the areas of focus for safety invariants and validity invariants are different. Safety invariants mainly focus on the memory safety of the entire program and the avoidance of undefined behavior, while validity invariants mainly focus on the correctness of specific data types and structures.

The relationship between them can be summarized in the following aspects:

1.  **Purpose**: Safety invariants mainly focus on memory safety and data integrity to prevent undefined behavior. Validity invariants focus on the conditions that type instances must meet during their lifetime for correct use.
2.  **Scope**: Safety invariants typically involve the memory safety of the entire program or module, while validity invariants are specific to type constraints. To some extent, safety invariants can be regarded as global restrictions, while validity invariants are local restrictions.
3.  **Hierarchy**: Safety invariants and validity invariants can interact at different levels. Generally, maintaining validity invariants is the foundation for implementing safety invariants. In other words, the validity invariants of a type are often required for implementing higher-level safety invariants.
4.  **Dependency**: Safety invariants depend on validity invariants. When the validity invariants of a type are satisfied, it helps ensure the conditions required for implementing safety invariants. For example, in Rust, safe reference access depends on the underlying type's validity invariants being satisfied.

Therefore, when the Unsafe Rust code violates safety invariants or validity invariants, we say the code is **unsound**. Unsound code may lead to undefined behavior, memory leaks, data races, and other issues. Rust attempts to avoid unsound situations by ensuring memory safety for most code through the compiler and type system, especially avoiding undefined behavior.

> Read More: [Two Kinds of Invariants: Safety and Validity](https://www.ralfj.de/blog/2018/08/22/two-kinds-of-invariants.html)

**Undefined behavior** refers to situations where the program's execution result is unpredictable. This may be due to out-of-bounds memory access, null pointer dereferencing, data races, and other errors. When encountering undefined behavior, the program may crash, produce incorrect results, or exhibit other unexpected behavior.

> However, some people argue that [using the term "undefined behavior" in newer languages like Zig and Rust may not be precise](https://matklad.github.io/2023/04/02/ub-might-be-the-wrong-term-for-newer-languages.html).

In Rust, pay special attention to situations that may lead to undefined behavior:

1.  **Data races**: Data races occur when multiple threads access the same memory location simultaneously, and at least one thread is performing a write operation. Rust's ownership system and borrow checker prevent most data races at compile time, but in Unsafe Rust, developers need to be extra careful to avoid data races.
2.  **Invalid pointer dereferencing**: Dereferencing an invalid pointer (e.g., a null pointer, a pointer to freed memory) leads to undefined behavior.
3.  **Integer overflow**: In some cases, integer overflow (e.g., integer addition, subtraction, multiplication, etc.) may cause unexpected program situations. Rust enables integer overflow checks by default in debug mode, **but in Release mode, integer overflow behavior is defined**, see [RFC 0560](https://rust-lang.github.io/rfcs/0560-integer-overflow.html).
4.  **Accessing uninitialized memory**: Accessing uninitialized memory leads to undefined behavior. This includes reading or writing uninitialized memory or passing uninitialized memory to external functions.
5.  **Incorrect type casting**: Forcing a pointer of one type to be converted to a pointer of another type and then dereferencing it may lead to undefined behavior. This usually occurs in Unsafe Rust code and requires special attention to ensure type conversion is safe.

In summary, when using Unsafe Rust, developers need to pay special attention to maintaining safety invariants and validity invariants to avoid Unsound and undefined behavior. We call Unsafe Rust code that strictly follows these principles **Unsafe safety abstractions**. They can be considered Safe, allowing for low-level operations and performance optimization while maintaining overall safety.

## Examples from the standard library

### Vec\<T\>

The `push` method in the `Vec<T>` type in the standard library is a typical example of an Unsafe safety abstraction. The following code is a simplified implementation of this method:

```rust
pub struct Vec<T> {
    ptr: *mut T,
    len: usize,
    cap: usize,
}

impl<T> Vec<T> {
    pub fn push(&mut self, value: T) {
        if self.len == self.cap {
            // Reallocate memory (detailed implementation omitted here)
            self.reallocate();
        }

        // Ensure safety invariants and validity invariants are satisfied here
        unsafe {
            let end = self.ptr.add(self.len); // end is a valid pointer because len < cap
            std::ptr::write(end, value);      // Write value to memory pointed to by end, assuming end is valid
            self.len += 1;                    // Update the length
        }
    }
}
```

In this simplified version of the `Vec<T>::push()` implementation. Now let's analyze how safety invariants and validity invariants are satisfied:

1.  **Safety invariants**:
    - Memory allocation and deallocation: The `push` method calls the `reallocate` method (detailed implementation omitted here) when the length equals the capacity, ensuring sufficient memory is allocated. This ensures that there will be no out-of-bounds memory access.
    - Data access synchronization: In this example, the `push` method is a mutable reference (`&mut self`), ensuring that there are no other mutable or immutable references when called. This ensures that there is no data race.
2.  **Validity invariants**:
    - Pointer validity: The `end` pointer is calculated using `self.ptr.add(self.len)`. Since `self.len < self.cap` (after `reallocate`), we can ensure that the memory address pointed to by `end` is valid.
    - Data type correctness: `std::ptr::write(end, value)` writes `value` to the memory pointed to by `end`. Since we have already ensured the validity of `end`, this operation is safe and ensures data type correctness.

By maintaining safety invariants and validity invariants, the `Vec<T>` type in the Rust standard library can provide high-performance operations while ensuring memory safety. In this simplified version of the `push` method, Unsafe Rust is used to perform low-level memory operations, but throughout the process, developers ensure that safety invariants and validity invariants are satisfied.

In conclusion, the Rust standard library uses Unsafe Rust for low-level operations and optimizations while ensuring safety invariants and validity invariants are satisfied, achieving safe and high-performance abstractions. This approach is also applied in many other standard library types and methods, such as `String`, `HashMap`, etc. This allows developers to take advantage of low-level operations and performance optimizations while writing safe, high-level code.

### String

In the standard library's `String` type, there is a pair of similar methods: `from_utf8` and `from_utf8_unchecked`. The difference is that the former is a Safe function, while the latter is an Unsafe function.

```rust
pub fn from_utf8(vec: Vec<u8>) -> Result<String, FromUtf8Error> {
    // This is not the source code of the standard library but a demonstration
    let vec = match run_utf8_validation(v) {
        Ok(_) => {
            // SAFETY: validation succeeded.
            Ok(unsafe { from_utf8_unchecked(v) })
        }
        Err(err) => Err(err),
    };
    Ok(String { vec })
}
```

In the `from_utf8` code, the input byte sequence is checked for UTF8 encoding to ensure the data validity of the vec argument. Therefore, the entire function will not exhibit Unsound behavior when handling arbitrary byte sequences, especially without undefined behavior. At this point, we can consider it to maintain safety invariants. Then the function is safe.

`from_utf8_unchecked` source code example:

```rust
/// # Safety
///
/// This function is unsafe because it does not check that the bytes passed
/// to it are valid UTF-8. If this constraint is violated, it may cause
/// memory unsafety issues with future users of the `String`, as the rest of
/// the standard library assumes that `String`s are valid UTF-8.
pub unsafe fn from_utf8_unchecked(bytes: Vec<u8>) -> String {
    String { vec: bytes }
}
```

In this function, the input byte sequence is not checked for UTF8 encoding but is directly constructed as a String, which is risky. Since the data validity of the `bytes` argument cannot be guaranteed, the entire function is `unsafe`, so it needs to be marked as `unsafe fn`. A `Safety` documentation comment should also be added to inform developers using this function under what circumstances it is safe to use, that is, to let the caller maintain the safety invariants.

Some readers might wonder, **why do we need a `from_utf8_unchecked` function when there is already a `from_utf8` function?**

This is a convention in Unsafe Rust practice, providing an `unsafe` function with an `_unchecked` name suffix as a performance outlet. For example, in some environments, the `bytes` argument of the `from_utf8_unchecked` function is validated for UTF8 encoding externally (e.g., in C interfaces), so there is no need to validate it twice here. For performance reasons, the `_unchecked` method can be used.

## Example from FFI

One common scenario for Unsafe Rust is to interact with various other languages through C-ABI, i.e., FFI (Foreign Function Interface) scenarios. In this situation, we need to consider many safety factors to achieve Unsafe safety abstraction. Let's demonstrate how to achieve safety abstraction in FFI with an example.

Suppose we have a C language library (`my_c_lib.c`):

```c
#include <stdint.h>

int32_t add(int32_t a, int32_t b) {
    return a + b;
}

```

We need to write a Rust program to call this `add` function. First, we need to create an FFI binding in Rust:

```rust
// my_c_lib.rs
extern "C" {
    fn add(a: i32, b: i32) -> i32;
}
```

Now, we can create a safe Rust function that wraps this Unsafe FFI binding:

```rust
// my_c_lib.rs
pub fn safe_add(a: i32, b: i32) -> i32 {
    // The developer is responsible for maintaining safety invariants and validity invariants
    // If a or b are not valid i32, return 0 (depending on the specific business choice)
    if a >= i32::MAX || b >= i32::MAX || (i32::MAX - a - b) < 0 {return 0}
    unsafe {
        add(a, b);
    }
}
```

In this example, we wrapped the Unsafe FFI binding `add` function in a safe `safe_add` function. This way, when other Rust code calls `safe_add`, they don't have to worry about potential safety issues (e.g., an integer overflow). Unsafe Rust code is limited to the internals of the `safe_add` function, and the developer is responsible for ensuring that safety invariants and validity invariants are satisfied.

Now we can use the `safe_add` function safely in Rust:

```rust
fn main() {
    let result = my_c_lib::safe_add(5, 7);
    println!("5 + 7 = {}", result);
}
```

In this FFI scenario, Unsafe Rust is used to call the `add` function implemented in C. By encapsulating Unsafe code in a safe API, we ensure the safety of Rust code when calling this API. In practice, developers need to pay attention to potential safety invariants and validity invariants issues and ensure they are satisfied when encapsulating Unsafe Rust.

# Unsafe Rust Programming Guidelines

Following these guidelines in Unsafe Rust practices can effectively achieve Unsafe safety abstraction:

1.  **Minimize unsafe code**: The use of Unsafe Rust should be limited and used only when necessary. Most features should be implemented using Safe Rust to ensure memory safety and avoid undefined behavior. When possible, Unsafe Rust code should be encapsulated in a safe API to provide users with a safe interface.
2.  **Explicitly unsafe**: Unsafe Rust must be explicitly marked as `unsafe` so that developers can clearly identify potential safety risks. When encountering the `unsafe` keyword, developers should pay special attention and carefully review the code to ensure proper handling of potential memory safety issues and undefined behavior. Developers need to carefully consider whether a function or trait should be marked `unsafe`, and should not intentionally remove or not use the unsafe mark where it should be marked as `unsafe`.
3.  **Review and testing**: Unsafe Rust code requires stricter review and testing to ensure its correctness. This includes testing low-level operations, memory allocation and release, and concurrent behavior. Ensuring the correctness of Unsafe Rust code is crucial, as errors can lead to serious memory safety issues and undefined behavior.
4.  **Documentation and comments**: Unsafe Rust code should be well documented and commented on so that other developers can understand its purpose, operation, and potential risks. This helps maintainers and other contributors follow correct safety practices when modifying the code.
5.  **Reduce complexity**: Unsafe Rust code should be as simple and straightforward as possible to facilitate understanding and maintenance. Complex Unsafe Rust code may lead to hard-to-find errors, increasing potential safety risks.

By following these principles, Unsafe Rust's safety philosophy aims to balance the need for low-level operations and performance optimization while ensuring that the overall code remains safe. Although the use of Unsafe Rust may lead to potential safety issues, the Rust language attempts to minimize these risks through explicit marking, limiting the scope of use, strict review, and thorough documentation.

# Conclusion

This article attempts to help readers understand the safety philosophy of Unsafe Rust. In the next article `/issue-3/is-zig-safer-than-unsafe-rust`, I'll attempt to compare Zig and Unsafe Rust on who is safer.

Thank you for reading.
