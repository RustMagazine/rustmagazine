每次我们聊到 unsafe 的时候，我们其实总离不了 Invariant 一词。Invariant 直接翻译过来称为“不变式”，在 Rust 的语境下，一般指那些需要保持的性质。比如说

- 给定一个`x: bool`，这就有一个 invariant：`x`只会是`true`或者`false`；
- 给定一个`p: Pin<Box<T>>`，这里其中一个 invariant：当`T: !Unpin`时`p`所指向的内存不会移动；
- `unsafe fn read<T>(src: *const T) -> T`，这里其中一个 invariant：`src`指向一个已经完全初始化的值。

Rust 中有各种各样的 invariant，大部分由类型检查来保证，而有些需要人为验证来保证。

# Invariant 的分类

我们可以大致将 Rust 中的 invariant 分为两类，一类是语言层面的 invariant，一类是库层面的 invariant。

**语言层面的 invariant 又叫 validity**。语言层面的 invariant 对于编译器来说，编译器用这些 invariant 生成正确的代码，也会用这些 invariant 来进行优化。利用 invariant 进行优化的一个很典型的例子就是 niche optimization，比如将`Option<&T>`的大小优化为一个指针大小，其利用的一个 invariant 是`&T`非空，这时就可以利用空的情况去表示`None`，进而压缩了类型的大小。值得注意的是这里还可以做其他优化，在`T`不包含`UnsafeCell`的情况下，`&T`有一个 invariant 是其指向的值是不可变的，所以我们还可以告诉 LLVM，`&T`这个指针是 readonly 的，然后 LLVM 就可以根据这个信息去进行优化。

而一旦违反语言层面的 invariant，后果将是**致命**的，这便是所谓的 UB(Undefined Behavior)。编译器不再保证程序的任何行为（产物甚至还不保证是可执行文件）。比如上文中提到的 invariant，当我们硬是把除了`true`和`false`的值，比如`2`强转为了`bool`，会导致未定义行为；当我们`read`一个未初始化的值时，也是一个未定义行为。[这里](https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html#behavior-considered-undefined) 是一些已经明确了的 UB，违反语言的 invariant，就会导致这些 UB（但不仅限于这个列表）。这种 invariant 是**必须**要遵守的

不过编译器也可能因为失误，违反了这些 invariant，导致依赖该 invariant 的业务逻辑失效，这属于是编译器的 bug。

**库/接口层面的 invariant 又称为 safety**。这一般由库的作者所给定。比如指定一个 invariant，`struct Even(u64)`的值必须是偶数，那么使用`Even`这个类型的地方就可以直接引入这个性质去做业务逻辑。

对于`Even`的作者，它可以提供这样的接口（假设这个库仅仅提供这几个接口）：

```rust
impl Even {
    /// 当n为偶数时返回Some
    /// 当n不是偶数时返回None
    pub fn new(n: u64) -> Option<Self> {
        if n % 2 == 0 {
            Some(Self(n))
        } else {
            None
        }
    }

    /// n必须是偶数
    pub fn unchecked_new(n: u64) -> Self {
        Self(n)
    }

    /// 返回值为偶数
    pub fn as_u64(&self) -> &u64 {
        &self.0
    }
}
```

对于接口`Even::new`，invariant 由`Even`的作者保证；对于`Even::unchecked_new`，invariant 由调用者保证。与语言层面的 invariant 相比，这个 invariant 就“温和”许多——破坏了这个 invariant，并不会*在这个库中*造成 UB（但同样也会造成程序出现预期以外的行为）。

`Pin`的 invariant 也是一个十分典型的库层面的 invariant。一般来说这个“不可移动”的 invariant 由`Pin<P>`的作者来保证，比如`Pin<Box<T>>`提供的所有接口都无法移动其指向的值，而使用者无需担心自己的什么错误使用操作破坏了这一 invariant（前提是在 safe rust 下，由类型系统来保证）。而当我们破坏了`Pin`的 invariant 后，也可能不会立刻 UB，而是在后续的使用中产生 UB（比如自引用结构移动后，仍访问其引用所指向的内存）。

Rust 中绝大部分的 invariant 都是库层面的 invariant，比如“str 一定是 utf-8 的编码”，“Send 和 Sync”，以及后续引入的一些 IO-safety 等等，都可以划入这类 invariant 中。

# 有类型证明的 Invariant

人总会是要犯错的，我们不能靠人来确保这些 invariant 不会被破坏，那我们是否有自动化检查 invariant 是否被破坏的方案呢？有，Rust 提供了表达力比较强大的类型系统，靠其类型规则就可以各种各样的 invariant。

比如根据类型系统的借用规则，引用的借用范围一定在原值的作用域内，可以保证`&T`一定是有效的：

```rust
let p: &String;
{
    let s = String::from("123");
    p = &s;
}
// 编译错误，因为`p`借用的范围超出了`s`作用域范围
println!("{p:?}");
```

每次编译的时候，都会进行类型检查，当代码不满足类型规则时，编译器就将其视为不合法的程序，不允许其编译。通过类型规则来保证程序各种各样的程序中 invariant。我们将有类型系统证明的那一部分 rust 称之为 safe rust。

Rust 有个很重要的原则，**在 safe rust 下，一个库所有公开的接口中的 invariant 不会被破坏。**这就是所谓的 soundness。比如说刚刚`Even`其实并不 sound，因为提供了`Even::unchecked_new`这个接口，可以在 type check 的情况下破坏掉 Even 的 invariant。而如果不提供这个接口，这个库就 sound 了，因为在类型系统的加持下，你无法构造出一个非偶数的`Even`，从而保持了 invariant。

当然，有些库则是“几乎”严格地遵守了这个原则，比如说标准库。我们在只使用 std 的情况下，我们可以更近一步说，**在 safe rust 下，不会出现 UB**。有类型系统的语言很多，但并不是所有的语言都有这么强的保障，比如说 cpp，稍不注意，写个死循环就 UB 了。

![cpp loop ub](/static/issue-4/cpp-loop-ub.jpg)

另外 Invariant 不仅仅要由程序员来保证，而是所有的参与方都要努力保证的一个事实，谁违反了就是谁的 bug。这个锅谁来背很重要。Rust 的模块系统（指的是 crate），也在这方面也起到了至关重要的作用，**使得我们无法从外部破坏在库内部所保证的 invariant**。

这条规则就是所谓的 coherence rules，这条规则**不允许为第三方的类型实现第三方的 trait**。举个例子，一个库实现了一个指针`Ptr<T>`，大概只提供这些方法：

```rust
impl Deref for Ptr<T> {
    type Target = T;
    // ...
}

impl<T> Ptr<T> {
    // 因为没有实现`DerefMut`，所以`Pin<Ptr<T>>`没有任何方法可以移动`T`
    pub fn pin(t: T) -> Pin<Ptr<T>> { ... }

    pub fn new(t: T) -> Ptr<T> { ... }

    // 被`Pin`前可以访问`&mut T`
    pub fn borrow_mut(&mut self) -> &mut T { ... }
}
```

如果没有 coherence rules 的话，我们可以为`Ptr`实现`DerefMut`，从而破坏`Pin`的 invariant（这个 invariant 原本在库里已经是被保证了的）：

```rust
impl DerefMut for Ptr<Unmovale> {
    fn deref_mut(&mut self) -> &mut Unmovable {
        let mut tmp = Box::new(Unmovale);
        // 将Unmovable移动了出来
        swap(self.borrow_mut(), &mut tmp);
        Box::leak(tmp)
    }
}

let unmovable = Unmovable::new();
let mut ptr: Pin<Ptr<Unmovable>> = Ptr::pin(unmovable);
// Pin::as_mut() 调用了 Ptr::deref_mut() 使得unmovable移动了
// 破坏了`Pin`的invariant，unsoundnesss!
// 我们可以根据这个漏洞来构造出UB。
ptr.as_mut();
```

事实上，`Pin`曾经也在标准库中发生过同样的问题。。。（`&T`, `&mut T`, `Box<T>`, `Pin<P>`可以打破 coherence rules，所以能直接构造出来这样的漏洞，~~但后续修复了~~ [并没有](https://github.com/rust-lang/rust/issues/85099)）

而现在因为 coherence rule 你无法这么做——只要你的 invariant 在本地已经被保证了的，就不能被第三方破坏。所以，在 Rust 中可以严格地划分责任，究竟是谁破坏了 invariant：如果使用者正常使用的情况出了 bug，那么是库作者的 bug，因为正常使用是无法破坏库内部的 invariant 的。

（但我很好奇，haskell，swift 这些可以随意为第三方库实现第三方的 typeclass(protocol)的语言是如何保证自己的库不被下游或者其它第三方库所影响的）

# Invariant 与 unsafe 的关系

不过 Rust 的类型系统并不是万能的，有些 invariant 是无法靠类型系统来证明的，其中就包括一些 validity（语言级 invariant），这些 invariant 就需要程序员自己去保证了。其它 invariant 破坏了，可能影响比较小，但 validity 不行，太重要了，一碰就炸，所以 rust 给了一个`unsafe`的关键字来表示 validity 相关的问题。

- `unsafe fn`：表示一个接口有一些 invariant，如果调用者不保证就有可能破坏掉一些 validity，从而发生 UB。这些 invariant 则可以当做**公理**直接在接口的实现中使用。
- `unsafe {}`：则表示确保已经遵守了内部的一些 invariant。rust 会**完全**信任程序员给的承诺。
- `unsafe trait`/`unsafe impl`类似。

于是 rust 被 unsafe 一分为二，safe rust 是有 rust 类型系统证明的一部分（出问题责任在编译器），unsafe rust 则是需要程序员自己证明安全的一部分（出问题责任在程序员）。

什么应该接口(`fn`和`trait`)标记为`unsafe`，在 rust 中很克制，并不是所有类型系统无法证明的 invariant 都应该标记。**只有那些和 validity 相关的 invariant，以及 FFI 才应该标记为 unsafe**，而且是能不标就不标。比如说`UnwindSafe`就没有标为 unsafe，因为同在标准库内，没有东西会因为不 unwind 会产生 UB，而使用标准库且不使用任何 unsafe 的情况下，也不会产生 UB，所以就没有标。（但我更愿意将这种无法在 safe 下确切证明的性质，称为 hint，而非 invariant，因为没有人会为其负责；就像一开始定义的`Even`一样）

FFI 是一个比较特别的情况，它与 validity 不一样，它的正确性不由 rust 的编译器保证，因为 Rust 完全不知道 FFI 另一边的信息。但 FFI 的另一侧可以做任何事情，所以理论上执行 FFI 是永远都不安全的。所以这时候就要求程序员知道 FFI 干了啥， `unsafe { call_ffi() }`的含义则变成，“我已知悉调用 FFI 所带来的后果，并愿意接受其带来的所有影响”。

除了什么才应该标`unsafe`以外，我们也要求对`unsafe`的内容进行严格的审查。

首先是对接口上的`unsafe`对应的 invariant 的检查。比如说 invariant 是否充分（满足 invariant 就安全了吗）？比如 invariant 间是否矛盾（`x: u64`却要求`x < 0`，这就没法实现）？

然后是严格检查`unsafe {}`/`unsafe impl`里的条件是否满足。有些东西是不能依赖的，那些没有被证明且没有被标记为 unsafe 的 invariant，比如

- 前文的`Even`，声称的为偶数
- 对于一个未知的`T: UnwindSafe`所“声称”的 unwindsafe
- 对于一个未知的`T: Ord`，所“声称”的全序

因为这些都能在 safe 的情况下违反掉这些接口声称的 invariant，但在 safe 的情况下我们不能”追责“。（again，我觉得这种就应该叫 hint）一般来说可以依赖的是：

- **具体类型**的一些性质。比如说`u64: Ord`满足全序，这一点你是可以确保的。这时候具体类型就相当于一个白盒，你可以知道这个类型的所有性质。
- 通过 unsafe 声明的 invariant。

人是不可靠的。那么我们应该如何检查我们是否违反了 validity 呢？有工具，但不多。目前我们可以通过 MIRI（一个 rust 的解释器，目前可以理解为这是 rust 的标准行为）去运行你的 rust 程序（仅限于纯 rust 代码）。MIRI 只维护 rust 所有正确行为的状态，当你的程序触发 UB 的时候，MIRI 就会报错。但这是有限制的，MIRI 只能告诉你 UB 了，但无法理解你是违反了那一个 invariant 而 UB 了；然后 MIRI 也不可能跑完所有情况；就算跑完所有情况发现没有 UB，也不能证明你提供的接口是 sound 的。（就像测试一样）

还有一些功能有限的形式化证明工具，比如[flux](https://flux-rs.github.io/flux/index.html)，这里就不再展开。

unsafe 算是 Rust 中一大特色了。如果没有 unsafe，但又要完全安全，就会有这些情况：

1. 所有 validity 都可以用类型证明——要求类型系统足够强大（dt 起步，可以证明下标合法），可以表达复杂条件。代价就是类型系统空前复杂，对于使用者心智负担很重，对于实现者也很难证明类型系统的可靠性，另外基本都会碰到 undecidable 的理论天花板。
2. 所有 validity 都有运行时的动态检查，或者说以运行时的代价消除 UB——这就会在各种地方引入不可避免的开销，性能难以做到极致。甚至限制用户做一些底层的操作（每次都要喷一遍，hs 没法自己通过语言自身提供的语法定义数组，只能靠运行时的开洞或 FFI）

# 再补充一点点

1. rust 的类型系统还没被证明是可靠的，也就是说一些规则可能有矛盾（[不一致](https://github.com/rust-lang/rust/issues/25860)），所以现阶段对 invariant 的证明也不一定可靠。

2. rust 的标准库也还没被证明是 soundness 的，也就是说有些接口的 invariant 有可能会被破坏。

3. rust 的绝大数第三方库没有验证是否 soundness，尤其是内部用到 unsafe 的库。

4. rust 的编译器也有可能破坏 invariant，进行错误的优化，让我们在 safe rust 下构造出[段错误](https://play.rust-lang.org/?version=stable&mode=release&edition=2021&gist=2179a4f4567edd276818c7869aac7e60)。

5. 运行 rust 程序的平台也有可能破坏 invariant，比如说`proc/self/mem`可以破坏内存独占的 invariant，修改内存。但从实践意义来说，rust 接受这种 cornercase。

以后可能 1 和 2 会得到解决，但是 345 看起来是没法避免的，也就是说 rust 的安全也是有限制的，有些关键的地方还是得靠人来决定，但人永远是不可靠的。让我想起了 linus 关于安全所说的一句话：

> So?
>
> You had a bug. Shit happens.

不过，尽管如此，rust 的安全性仍然是有统计学意义论支撑，而且出了问题责任也分明。这同样十分有意义。

---

参考：

- <https://github.com/rust-lang/unsafe-code-guidelines/issues/428>
- <https://www.ralfj.de/blog/2018/08/22/two-kinds-of-invariants.html>
- <https://doc.rust-lang.org/stable/std/os/unix/io/index.html#procselfmem-and-similar-os-features>
