> It is recommended that readers first study the "Prompt Guide" ([https://www.promptingguide.ai](https://www.promptingguide.ai)) before reading this article for a better understanding. It is also suggested to use GPT-4 for this system, but if GPT-4 is not available, GPT-3.5 can also be used to create this system, although GPT-4 is more accurate. Additionally, this system can be applied to other programming languages.

Recently, I have been experimenting with AI technologies such as ChatGPT and Midjourney, trying to experience what it feels like to be a Prompt engineer with a six-figure salary. It wasn't until this week that I discovered how helpful GPT-4 is for learning Rust code. Therefore, I tried to create this Rust learning system, which I named "RustChat" ([https://github.com/ZhangHanDong/rustchat](https://github.com/ZhangHanDong/rustchat)) and created a repository on GitHub for others to join in.

When learning Rust, it would be great to have a system that can provide questions to test our knowledge and give accurate answers and explanations. Or, when we don't know what project to work on to practice, it can recommend project ideas. Now, with AI, we can create such a magical and useful system.

## Introduction to RustChat: The Ultimate Rust Learning "Magic" System

First, let's talk about the idea. Since we want a command prompt mode, we should design the command format just like designing a program API.

> It is worth noting that although this idea seems simple, it was the result of a lot of experimentation. The previous failed design resulted in a new command breaking the old GPT setting, causing confusion.

### "Magic" Design

Here are some command prompt examples I want to implement:

```
work               // "work" is the main command, representing Rust questions at the work level
work -tech trait   // "-tech" represents a primary command, which means to output the work level concept explanation for the specified "trait" content and provide code examples
work -tech --cn trait // "--cn" represents a secondary command, which means to output the content specified by the main command and primary command in Chinese
work -type --en eBPF  // "-type" represents a primary command, which means to output work level questions for the specified content "eBPF"
work -idea --cn   // "-idea" represents a primary command, which means to output project practice ideas and thoughts corresponding to the main command level for reference. "--cn" represents a secondary command, which means to output the content in Chinese.
```

I plan to divide the questions into three levels:

1.  Work level. Work-level questions cover basic and common features and knowledge for writing Rust code.
2.  Professional level. Professional-level covers expert-level features and knowledge of Rust.
3.  Quiz type. The Quiz type is specifically designed to test Rust language features that are easily confusing.

The main command corresponds to these three levels respectively:

1.  The "work" command corresponds to work-level questions.
2.  The "expert" command corresponds to professional-level questions.
3.  The "quiz" command corresponds to quiz-level questions.
4.  The "answer" command is used to specify the number of questions to answer.

Next, let's introduce the primary commands. The primary commands can be combined with the main commands in any way:

1.  "-tech" represents a primary command, which means to output the corresponding concept explanation of the main command level for the specified content and provide examples.
2.  "-type" represents a primary command, which means to output questions corresponding to the main command level for the specified content.
3.  "-idea" represents a primary command, which means to output project practice ideas and thoughts corresponding to the main command level for reference.
4.  "-crate" represents a primary command, which is only applicable to the "work" command and means to recommend the corresponding third-party "crate" for the specified content.
5.  "-n" represents a primary command, which is only applicable to the "answer" command and means to specify the number of questions to answer.

Next, let's introduce the secondary commands, which can be used after the primary commands:

1.  "--cn" represents a secondary command, which means to output the content in Chinese.
2.  "--en" represents a secondary command, which means to output the content in English.
3.  "--jp" represents a secondary command, which means to output the content in Japanese.

Therefore, the following are the commands that this learning system should support:

```
work               // "work" is the main command, representing Rust questions at the work level
work -tech trait   // "-tech" represents a primary command, which means to output the work level concept explanation for the specified "trait" content and provide code examples
work -tech --cn trait // "--cn" represents a secondary command, which means to output the content specified by the main command and primary command in Chinese
work -type --en eBPF  // "-type" represents a primary command, which means to output work level questions for the specified content "eBPF"
work -crate eBPF   // "-crate" represents a primary command, which means to recommend a third-party "crate" for the specified content "eBPF"
work -idea --cn   // "-idea" represents a primary command, which means to output project practice ideas and thoughts corresponding to the main command level for reference. "--cn" represents a secondary command, which means to output the content in Chinese.
answer -n 2 ,// "-n" represents a primary command, which is only applicable to the "answer" command and means to answer the two questions before this command
expert               // "expert" is the main command, representing Rust questions at the professional level
expert -tech trait   // "-tech" represents a primary command, which means to output the professional level concept explanation for the specified "trait" content and provide code examples
expert -tech --cn trait // "--cn" represents a secondary command, which means to output the content specified by the main command and primary command in Chinese
expert -type --en eBPF  // "-type" represents a primary command, which means to output professional-level questions for the specified content "eBPF"
expert -idea --cn   // "-idea" represents a primary command, which means to output project practice ideas and thoughts corresponding to the main command level for reference. "--cn" represents a secondary command, which means to output the content in Chinese.
quiz               // "quiz" is the main command, representing Rust quiz questions
quiz -tech trait   // "-tech" represents a primary command, which means to output the quiz-level concept explanation for the specified "trait" content and provide code examples
quiz -tech --cn trait // "--cn" represents a secondary command, which means to output the content specified by the main command and primary command in Chinese
quiz -type --en eBPF  // "-type" represents a primary command, which means to output quiz-level questions for the specified content "eBPF"
quiz -idea --cn   // "-idea" represents a primary command, which means to output project practice ideas and thoughts corresponding to the main command level for reference. "--cn" represents a secondary command, which means to output the content in Chinese.
```

### Building a prompt

Next, we will build a prompt. To ensure that GPT-4 can fully understand the "magic" of the design, we should adopt a "whole-to-details" approach to gradually "feed" it.

**1. Setting the main command**

```
As a Rust expert, I need your help to generate Rust questions according to my requirements. By default, the questions include a multiple-choice question and a coding question. The questions are output in Chinese by default, unless a corresponding secondary command is specified to tell you the number of questions.

The questions are divided into three levels:

1. Work level. Work level questions cover the common features and knowledge of Rust code writing for beginners and daily use.
2. Expert level. Expert level covers Rust expert features and knowledge.
3. Quiz type. Quiz type specifically tests Rust language features that are easily confusing.

The main commands correspond to these three levels respectively:

1. "work" command, corresponding to work-level questions.
2. "expert" command, corresponding to expert-level questions.
3. "quiz" command, corresponding to quiz-level questions.
4. "anwser" command, used to specify the number of questions to be answered.
```

**2. Setting secondary commands**

```
Next, let's introduce primary commands, which can be used in combination with the main command:
1. "-tech", represents a primary command, which means that the corresponding main command-level conceptual explanation should be output for the specified content, with examples attached.
2. "-type", represents a primary command, which means that the corresponding main command-level questions should be output for the specified content.
3. "-idea", represents a primary command, which means that the corresponding main command-level project practice ideas and strategies should be output for reference.
4. "-crate", represents a primary command, which means that the corresponding third-party crate should be recommended for the specified content.
5. "-n", represents a primary command, which means that you need to specify the number of questions to be answered and provide explanations for the answers. If you use other main commands, it limits the number of questions generated.
```

**3. Setting tertiary commands**

```
Next, let's introduce secondary commands, which can be used after the primary command:
1. "--cn", represents a secondary command, which means that the content should be output in Chinese.
2. "--en", represents a secondary command, which means that the content should be output in English.
3. "--jp", represents a secondary command, which means that the content should be output in Japanese.
```

4.  Adding definition of modification commands

The reason for designing this command system so elaborately is to make it more convenient to add and modify commands. Otherwise, GPT-4 will be confused.

Here is an example of a modification command:

```
Modifying a primary command:

"-n", represents a primary command, which means that you need to specify the number of questions to be answered and provide explanations for the answers. If you use other main commands, it limits the number of questions generated.
```

Here is an example of adding instructions:

`Add primary instruction:  explain, which means providing a detailed explanation of the specified Rust code. debug, which means helping to find code bugs and providing corrected code based on the given compiler error prompt.`

> Note: `explain` has the meaning of explanation itself, so even if this primary instruction is not set, GPT can recognize this word. In most cases, GPT can also recognize `cn` and output Chinese by using `explain --cn`.

Usage:

```rust
debug  

fn add(a: i32, b: i32) -> i32 {   
	(a + b) as i64 
}  

error:  Return type mismatch

```


## Let GPT output the "Magic" system manual

Finally, let GPT help you organize all the instructions into a markdown table:

`Please help me organize the primary, secondary, and tertiary instructions, along with their functions, into a markdown table.`

It will output the following table:

| Primary Instruction | Function                                                     |
| ------------------- | ------------------------------------------------------------ |
| explain             | Provides a detailed explanation of the specified Rust code.  |
| debug               | Helps find code bugs and provides corrected code based on the given compiler error prompt. |
| work                | Outputs questions covering common features and knowledge of Rust for entry-level and daily programming. |
| expert              | Outputs questions covering expert-level features and knowledge of Rust. |
| quiz                | Outputs questions that specifically test confusing Rust language features. |
| anwser              | Specifies the number of questions to be answered and provides explanations for the answers. |

| Secondary Instruction | Function                                                     |
| --------------------- | ------------------------------------------------------------ |
| -tech                 | Outputs corresponding primary instruction level concept explanations with examples. |
| -type                 | Outputs corresponding primary instruction level questions.   |
| -idea                 | Outputs project practice ideas and thoughts corresponding to the primary instruction level. |
| -crate                | Limited to the `work` primary instruction, recommends corresponding third-party crates. |
| -n                    | Limited to the `anwser` primary instruction, specifies the number of questions to be answered and provides explanations. |

| Tertiary Instruction | Function                     |
| -------------------- | ---------------------------- |
| --cn                 | Outputs content in Chinese.  |
| --en                 | Outputs content in English.  |
| --jp                 | Outputs content in Japanese. |

## "Magic" System Usage

Now that our "magic" system is up and running, we can achieve the expected results by combining the main instructions, first-level instructions, and second-level instructions.

We can use it to achieve the following functions:

-   Generate Rust questions and answers of different levels to test our knowledge
-   Specify Rust language features to generate corresponding questions
-   Let it recommend practice projects
-   Let it answer the questions we generated ourselves
-   Specify the natural language of the output content

### **Generate work-level questions**

```rust
work
```
GPT-4:

Here are two work-level Rust questions, one multiple-choice question and one coding question.

Multiple-choice question:

In Rust, which keyword is used to declare an immutable variable? A. let B. mut C. const D. static

Coding question: 2. Please write a Rust function `find_max` that takes a vector of integers as an argument and returns the maximum value in the vector. If the vector is empty, return None. The function signature is as follows:

```rust
fn find_max(numbers: Vec<i32>) -> Option<i32> {
    // Write your code here
}
```

### **Generating a specified number of work-level questions**

Copy code

`work -n 3`

GPT-4:

> GPT understands that `-n` requires explanation of the questions, which can be modified by the instruction definition.

Here are three work-level Rust questions, each consisting of a multiple-choice question and a coding implementation question:

Question 1:

In Rust, which keyword is used to declare an immutable variable?

A. let B. mut C. const D. static

Answer: A. let

Explanation: In Rust, an immutable variable is declared using the `let` keyword. Immutable means that the value of the variable cannot be changed after it is declared. If you need to declare a mutable variable, you can use `let mut`. The `const` and `static` keywords are used to declare constants, where `const` is a compile-time constant and `static` is a globally allocated variable at runtime.

Question 2:

Write a Rust function called `calculate_average` that takes a vector of integers as input and returns the average of the numbers. If the vector is empty, return None. The function signature should be as follows:

rustCopy code

`fn calculate_average(numbers: Vec<i32>) -> Option<f32> {     // write your code here }`

Question 3:

In Rust, what is the difference between a `String` and a `&str`?

A. A `String` is a fixed-size string, while a `&str` is a variable-size string. B. A `String` is an immutable string, while a `&str` is a mutable string. C. A `String` is a heap-allocated string, while a `&str` is a stack-allocated string. D. A `String` is a owned string, while a `&str` is a borrowed string.

Answer: D. A `String` is a owned string, while a `&str` is a borrowed string.

Explanation: In Rust, a `String` is a type that represents a heap-allocated, growable, mutable sequence of Unicode characters. A `&str` is a reference to a string slice, which is a fixed-size view into a block of memory that contains a sequence of Unicode scalar values. A `String` owns the memory it uses, while a `&str` borrows the memory from some other source.

### **Generate Questions Based on Specified Content**

`work -type algorithm`

GPT-4:

Here are two Rust job-level questions related to algorithms, one multiple-choice question and one coding question.

Multiple-choice question:

1.  In Rust, which method is used to perform an in-place sort (i.e., without creating a new vector) on a vector for a sorting algorithm?

A. sort B. sorted C. sort_by D. sort_unstable

Coding question:

2.  Please write a Rust function `merge_sorted_arrays` that takes two sorted integer vectors as parameters and merges them into a new sorted vector. The example function signature is as follows:

```rust
fn merge_sorted_arrays(a: Vec<i32>, b: Vec<i32>) -> Vec<i32> {
    // Write your code here
}
```

To prevent GPT-4 from generating the same questions, you can change the topic by using the following command:

`work -type trait change`

**Change the Main Command to `expert`**

`expert -type trait`

GPT-4:

Here are two Rust job-level questions related to traits, one multiple-choice question and one coding question.

Multiple-choice question:

1.  In Rust, which statement about trait objects and static dispatch is correct?

A. Trait objects implement static dispatch and have better performance than dynamic dispatch. B. Static dispatch uses trait objects and has better performance than dynamic dispatch. C. Static dispatch uses monomorphization to determine the concrete type at compile time, resulting in better performance than dynamic dispatch. D. Dynamic dispatch uses monomorphization to determine the concrete type at compile time, resulting in better performance than static dispatch.

Coding question:

2.  Please implement a trait named `Drawable` that contains a method named `draw`. Then, implement the `Drawable` trait for the `Circle` and `Rectangle` structs. Finally, create a vector containing `Circle` and `Rectangle` and draw them by iterating through the vector and calling the `draw` method. The example code structure is as follows:
```rust
trait Drawable {
    // Write your code here
}

struct Circle {
    // Write your code here
}

struct Rectangle {
    // Write your code here
}

// Implement the Drawable trait for Circle and Rectangle here

fn main() {
    // Write your code here to create a Drawable vector and draw them by calling the draw method
}
```

**Specify a Question Type of "Coding Implementation" Only:**

```
work -n 1 -type ffi coding implementation
```

Here is a Rust job-level question related to FFI (Foreign Function Interface), which provides a coding implementation question with answer and explanation.

Coding question:

1.  Using Rust's FFI (Foreign Function Interface) capabilities, write a function named `rust_add` that adds two `int` type integers in C language and returns the result. Provide the corresponding C function declaration for this function. The example code structure is as follows:

```rust
// Write your Rust code here

/*
// Provide the C function declaration here
extern "C" {
    // ...
}
*/

fn main() {
    // Write your test code here
}
```

Answer:

```rust
// Rust code
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}

/*
// C function declaration
#include <stdint.h>

extern int32_t rust_add(int32_t a, int32_t b);
*/

fn main() {
    // It is not possible to test directly here, as it needs to be compiled and called in a C language environment.
}
```

Explanation: First, we define a function named `rust_add` in Rust code, which takes two `i32` type parameters and returns their sum. To allow C code to call this function, we use the `#[no_mangle]` attribute to prevent the compiler from renaming the function name. Then, we use the `pub extern "C"` keyword to specify the ABI (Application Binary Interface) of this function as C style.

Next, we provide a C function declaration. Note that the `int` type in C may have different sizes on different platforms and compilers, so we use the `int32_t` type in C to ensure that it matches the `i32` type in Rust. This requires including the `stdint.h` header file.

In the `main` function, we cannot directly test this FFI function because it needs to be compiled and called in a C language environment. You can create a simple C language program, compile Rust as a dynamic library or static library, link it to the C language program, and then call the `rust_add` function for testing.

> I am not sure why sometimes it provides both answers and explanations.


### Recommendation for Practice Projects

`work -idea`

GPT-4:

Here are some ideas and suggestions for Rust projects at a work level for you to practice:

1.  Command-line tool: Create a command-line tool for handling daily tasks, such as batch renaming files, downloading web resources, or parsing log files. You can use the `clap` or `structopt` libraries to handle command-line parameters.
    
2.  Web server: Write a simple multithreaded web server using Rust to handle HTTP requests and provide static or dynamic content. You can use the `hyper` and `tokio` libraries to implement asynchronous I/O and HTTP functionality.
    
3.  Web crawler: Write a web crawler to fetch content from a specified website and parse out the desired information. You can use the `reqwest` library to handle network requests and the `select.rs` library to parse HTML documents.
    
4.  Chat server and client: Create a chat server and client that allows multiple users to communicate in real-time through TCP connections. You can use the `tokio` library to implement asynchronous I/O and multithreading functionality.
    
5.  File encryption tool: Implement a simple file encryption and decryption tool for protecting user privacy data. You can use the `rust-crypto` or `ring` libraries to implement encryption algorithms.
    
6.  Text editor: Develop a simple text editor that supports basic text editing features such as opening, saving, searching, and replacing. You can use the `crossterm` or `termion` libraries to implement a cross-platform terminal interface.
    

You can specify the keyword "idea":

```
work -idea cli gpt
```

GPT-4:

Here are some ideas and suggestions for a GPT tool project using Rust for a command-line interface (CLI) for your reference:

Project Name: GPT-CLI

Project Overview: Create a CLI tool that allows users to interact with a GPT model by inputting text and obtaining text generated by the model. This tool can be used for various purposes such as writing assistance, programming problem-solving, automatic email replies, etc.

Key Features:

1.  Text input: Allow users to input text to use as input for the GPT model.
2.  GPT model integration: Integrate a GPT model (such as OpenAI's GPT-3 or a self-trained model) and call its API to generate text based on user input.
3.  Result display: Display the text generated by the GPT model to the user.
4.  Save function: Allow users to save the generated text result to a specified file.

Recommended libraries and tools:

1.  Command-line parameter handling: Use the `clap` or `structopt` libraries to handle command-line parameters.
2.  HTTP request library: Use the `reqwest` library to handle network requests to the GPT model API.
3.  Asynchronous programming: Use the `tokio` or `async-std` libraries to implement asynchronous programming for improved performance.
4.  Environment variable management: Use the `dotenv` library to manage sensitive information such as API keys.

Development Steps:

1.  Design the command-line parameter structure, such as input text and save file path.
2.  Parse command-line parameters using the `clap` or `structopt` library.
3.  Integrate the GPT model API, such as OpenAI's GPT-3, and set API keys and request parameters.
4.  Use the `reqwest` library to send HTTP requests and obtain text generated by the GPT model.
5.  Process the results returned by the GPT model and display them to the user. 
6. Implement the function to save the generated text to a file.
7.  Test and optimize the program.

### Answering Generated Questions

`expert -type struct`

GPT-4:

Here are two professional-level Rust problems related to structs, one multiple-choice and one code implementation.

Multiple-choice question:

1.  Regarding deriving `PartialEq` and `Eq` traits for structs in Rust, which statement is correct?

A. All structs must implement `PartialEq` and `Eq` traits. B. Structs only need to implement the `PartialEq` trait, and the `Eq` trait will be automatically derived. C. Structs can choose to derive `PartialEq` and `Eq` traits, but only if all of their fields implement these traits. D. When deriving `PartialEq` and `Eq` traits for a struct, you don't need to consider the trait implementation of its fields.

Code implementation question:

2.  Please create a struct named `Color` that contains three `u8` fields: `red`, `green`, and `blue`. Implement the `PartialEq` trait for the `Color` struct to compare if two `Color` instances are equal. Two `Color` instances are considered equal if the difference between their `red`, `green`, and `blue` field values is less than or equal to 10. The sample code structure is as follows:
```rust
use std::cmp::PartialEq;

struct Color {
    // write your code here
}

impl PartialEq for Color {
    // write your code here
}

fn main() {
    // create two Color instances here and compare if they are equal
}
```

```
answer -n 2
```

Based on your request, I will provide you with the answers and explanations for the first two questions.

Multiple-choice answer and explanation:

1.  Regarding deriving `PartialEq` and `Eq` traits for structs in Rust, which statement is correct?

Answer: C. Structs can choose to derive `PartialEq` and `Eq` traits, but only if all of their fields implement these traits.

Explanation: In Rust, structs can selectively derive `PartialEq` and `Eq` traits for equality comparison of struct instances. However, the prerequisite for deriving these traits for a struct is that all of its fields have already implemented these traits. If any field of a struct doesn't implement these traits, you won't be able to derive `PartialEq` and `Eq` traits for that struct.

Code implementation answer and explanation:

2.  Please create a struct named `Color` that contains three `u8` fields: `red`, `green`, and `blue`. Implement the `PartialEq` trait for the `Color` struct to compare if two `Color` instances are equal. Two `Color` instances are considered equal if the difference between their `red`, `green`, and `blue` field values is less than or equal to 10. The sample code structure is as follows:

Answer:

```rust
use std::cmp::PartialEq;

struct Color {
    red: u8,
    green: u8,
    blue: u8,
}

impl PartialEq for Color {
    fn eq(&self, other: &Self) -> bool {
        (self.red as i32 - other.red as i32).abs() <= 10 &&
        (self.green as i32 - other.green as i32).abs() <= 10 &&
        (self.blue as i32 - other.blue as i32).abs() <= 10
    }
}

fn main() {
    let color1 = Color { red: 255, green: 128, blue: 64 };
    let color2 = Color { red: 250, green: 130, blue: 70 };

    println!("Color1 equals Color2: {}", color1 == color2);
}
```

Explanation: 

First, we defined the `Color` struct and added three fields of type `u8`: `red`, `green`, and `blue`. Next, we implemented the `PartialEq` trait for the `Color` struct and defined the `eq` method. In the `eq` method, we compared the absolute difference between the `red`, `green`, and `blue` fields of two `Color` instances to see if they are less than or equal to 10. If this condition is satisfied, then the two `Color` instances are considered equal. Finally, in the `main` function, we created two `Color` instances and used the `==` operator to compare if they are equal.

### Recommended crate

`expert -crate eBPF`

GPT-4:

Alright, here are some advanced-level questions and recommended third-party crates related to the `eBPF` topic:

Questions:

1.  Please explain in detail the principle and application scenarios of eBPF technology in Rust.
2.  In Rust, how to use the `libbpf-rs` crate to write efficient eBPF programs?
3.  In Rust, how to use the `redbpf-probes` crate to implement custom eBPF event probes?

Recommended third-party crates:

-   `libbpf-rs`: A Rust crate used for writing and loading eBPF programs.
-   `redbpf-probes`: A Rust crate used for writing custom eBPF event probes.

Note: eBPF technology needs to run on a kernel that supports it. If your system does not support eBPF, you may not be able to complete this task.

### Requesting it to output in Japanese:

`work -tech lifetime --jp`

GPT-4:

以下は、ライフタイムに関連する技術概念の説明と例を日本語で提供します。

ライフタイムとは、Rust でメモリ管理や参照の安全性を担保するための概念です。ライフタイムは、コンパイル時に参照の有効性を検証し、参照されるオブジェクトが参照されている期間中に破棄されないことを保証します。

例:

```rust
fn longest<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() {
        s1
    } else {
        s2
    }
}

fn main() {
    let s1 = String::from("長い文字列");
    let s2 = String::from("短い");

    let result = longest(&s1, &s2);
    println!("最も長い文字列は: {}", result);
}
```

上記の例では、`longest`関数は2つの文字列のスライスを引数に取り、最も長いものを返します。ライフタイムパラメータ`'a`は、入力参照と戻り値の参照が同じライフタイムを持つことを示しています。

`longest`関数は、参照されるオブジェクトが参照されている期間中に破棄されないことを保証するために、ライフタイムを使用しています。これにより、ダングリングポインタや他のメモリ安全性に関連する問題を防止できます。

**Requesting it to output in English:**

`work -tech --en lifetime`

> The position of the secondary instruction does not affect its understanding.


Below is an explanation and example of the technical concept of lifetimes in Rust, provided in English.

Lifetimes are a concept in Rust for managing memory and ensuring reference safety. Lifetimes are used to verify the validity of references at compile-time, ensuring that the object being referenced is not destroyed while it is still being referenced.

Example:

```rust
fn longest<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() {
        s1
    } else {
        s2
    }
}

fn main() {
    let s1 = String::from("long string");
    let s2 = String::from("short");

    let result = longest(&s1, &s2);
    println!("The longest string is: {}", result);
}
```

In the example above, the `longest` function takes two string slices as arguments and returns the longer one. The lifetime parameter `'a` indicates that the input references and the returned reference have the same lifetime.

The `longest` function uses lifetimes to ensure that the object being referenced is not destroyed while it is still being referenced, preventing dangling pointers and other memory safety-related issues.


## Summary

Setting up this "magical" learning system is not difficult, but it should be of great help for daily Rust learning. Finally, we hope that everyone can share the useful commands you have developed or the Rust questions and answers generated by GPT-4 that are worth recording to the RustChat GitHub repository, forming a Q&A knowledge base to help more Rust learners.

Thank you for reading.