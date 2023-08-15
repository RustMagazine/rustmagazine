# 稍微聊聊Rust中的Invariant —— 那些必须保持的性质



每次我们聊到unsafe的时候，我们其实总离不了Invariant一词。Invariant直接翻译过来称为“不变式”，在Rust的语境下，一般指那些需要保持的性质。比如说

* 给定一个`x: bool`，这就有一个invariant：`x`只会是`true`或者`false`；
* 给定一个`p: Pin<Box<T>>`，这里其中一个invariant：当`T: !Unpin`时`p`所指向的内存不会移动；
* `unsafe fn read<T>(src: *const T) -> T`，这里其中一个invariant：`src`指向一个已经完全初始化的值。

Rust中有各种各样的invariant，大部分由类型检查来保证，而有些需要人为验证来保证。



# Invariant的分类

我们可以大致将Rust中的invariant分为两类，一类是语言层面的invariant，一类是库层面的invariant。



**语言层面的invariant又叫validity**。语言层面的invariant对于编译器来说，编译器用这些invariant生成正确的代码，也会用这些invariant来进行优化。利用invariant进行优化的一个很典型的例子就是niche optimization，比如将`Option<&T>`的大小优化为一个指针大小，其利用的一个invariant是`&T`非空，这时就可以利用空的情况去表示`None`，进而压缩了类型的大小。值得注意的是这里还可以做其他优化，在`T`不包含`UnsafeCell`的情况下，`&T`有一个invariant是其指向的值是不可变的，所以我们还可以告诉LLVM，`&T`这个指针是readonly的，然后LLVM就可以根据这个信息去进行优化。

而一旦违反语言层面的invariant，后果将是**致命**的，这便是所谓的UB(Undefined Behavior)。编译器不再保证程序的任何行为（产物甚至还不保证是可执行文件）。比如上文中提到的invariant，当我们硬是把除了`true`和`false`的值，比如`2`强转为了`bool`，会导致未定义行为；当我们`read`一个未初始化的值时，也是一个未定义行为。[这里](https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html#behavior-considered-undefined) 是一些已经明确了的UB，违反语言的invariant，就会导致这些UB（但不仅限于这个列表）。这种invariant是**必须**要遵守的

不过编译器也可能因为失误，违反了这些invariant，导致依赖该invariant的业务逻辑失效，这属于是编译器的bug。



**库/接口层面的invariant又称为safety**。这一般由库的作者所给定。比如指定一个invariant，`struct Even(u64)`的值必须是偶数，那么使用`Even`这个类型的地方就可以直接引入这个性质去做业务逻辑。

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

对于接口`Even::new`，invariant由`Even`的作者保证；对于`Even::unchecked_new`，invariant由调用者保证。与语言层面的invariant相比，这个invariant就“温和”许多——破坏了这个invariant，并不会*在这个库中*造成UB（但同样也会造成程序出现预期以外的行为）。

`Pin`的invariant也是一个十分典型的库层面的invariant。一般来说这个“不可移动”的invariant由`Pin<P>`的作者来保证，比如`Pin<Box<T>>`提供的所有接口都无法移动其指向的值，而使用者无需担心自己的什么错误使用操作破坏了这一invariant（前提是在safe rust下，由类型系统来保证）。而当我们破坏了`Pin`的invariant后，也可能不会立刻UB，而是在后续的使用中产生UB（比如自引用结构移动后，仍访问其引用所指向的内存）。

Rust中绝大部分的invariant都是库层面的invariant，比如“str一定是utf-8的编码”，“Send和Sync”，以及后续引入的一些IO-safety等等，都可以划入这类invariant中。



# 有类型证明的Invariant

人总会是要犯错的，我们不能靠人来确保这些invariant不会被破坏，那我们是否有自动化检查invariant是否被破坏的方案呢？有，Rust提供了表达力比较强大的类型系统，靠其类型规则就可以各种各样的invariant。

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

每次编译的时候，都会进行类型检查，当代码不满足类型规则时，编译器就将其视为不合法的程序，不允许其编译。通过类型规则来保证程序各种各样的程序中invariant。我们将有类型系统证明的那一部分rust称之为safe rust。



Rust有个很重要的原则，**在safe rust下，一个库所有公开的接口中的invariant不会被破坏。**这就是所谓的soundness。比如说刚刚`Even`其实并不sound，因为提供了`Even::unchecked_new`这个接口，可以在type check的情况下破坏掉Even的invariant。而如果不提供这个接口，这个库就sound了，因为在类型系统的加持下，你无法构造出一个非偶数的`Even`，从而保持了invariant。

当然，有些库则是“几乎”严格地遵守了这个原则，比如说标准库。我们在只使用std的情况下，我们可以更近一步说，**在safe rust下，不会出现UB**。有类型系统的语言很多，但并不是所有的语言都有这么强的保障，比如说cpp，稍不注意，写个死循环就UB了。

![cpp loop ub](/static/issue-4/cpp-loop-ub.jpg)







另外Invariant不仅仅要由程序员来保证，而是所有的参与方都要努力保证的一个事实，谁违反了就是谁的bug。这个锅谁来背很重要。Rust的模块系统（指的是crate），也在这方面也起到了至关重要的作用，**使得我们无法从外部破坏在库内部所保证的invariant**。

这条规则就是所谓的coherence rules，这条规则**不允许为第三方的类型实现第三方的trait**。举个例子，一个库实现了一个指针`Ptr<T>`，大概只提供这些方法：

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

如果没有coherence rules的话，我们可以为`Ptr`实现`DerefMut`，从而破坏`Pin`的invariant（这个invariant原本在库里已经是被保证了的）：

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

事实上，`Pin`曾经也在标准库中发生过同样的问题。。。（`&T`, `&mut T`, `Box<T>`, `Pin<P>`可以打破coherence rules，所以能直接构造出来这样的漏洞，~~但后续修复了~~ [并没有](https://github.com/rust-lang/rust/issues/85099)）

而现在因为coherence rule你无法这么做——只要你的invariant在本地已经被保证了的，就不能被第三方破坏。所以，在Rust中可以严格地划分责任，究竟是谁破坏了invariant：如果使用者正常使用的情况出了bug，那么是库作者的bug，因为正常使用是无法破坏库内部的invariant的。

（但我很好奇，haskell，swift这些可以随意为第三方库实现第三方的typeclass(protocol)的语言是如何保证自己的库不被下游或者其它第三方库所影响的）



# Invariant与unsafe的关系

不过Rust的类型系统并不是万能的，有些invariant是无法靠类型系统来证明的，其中就包括一些validity（语言级invariant），这些invariant就需要程序员自己去保证了。其它invariant破坏了，可能影响比较小，但validity不行，太重要了，一碰就炸，所以rust给了一个`unsafe`的关键字来表示validity相关的问题。

* `unsafe fn`：表示一个接口有一些invariant，如果调用者不保证就有可能破坏掉一些validity，从而发生UB。这些invariant则可以当做**公理**直接在接口的实现中使用。
* `unsafe {}`：则表示确保已经遵守了内部的一些invariant。rust会**完全**信任程序员给的承诺。
* `unsafe trait`/`unsafe impl`类似。

于是rust被unsafe一分为二，safe rust是有rust类型系统证明的一部分（出问题责任在编译器），unsafe rust则是需要程序员自己证明安全的一部分（出问题责任在程序员）。



什么应该接口(`fn`和`trait`)标记为`unsafe`，在rust中很克制，并不是所有类型系统无法证明的invariant都应该标记。**只有那些和validity相关的invariant，以及FFI才应该标记为unsafe**，而且是能不标就不标。比如说`UnwindSafe`就没有标为unsafe，因为同在标准库内，没有东西会因为不unwind会产生UB，而使用标准库且不使用任何unsafe的情况下，也不会产生UB，所以就没有标。（但我更愿意将这种无法在safe下确切证明的性质，称为hint，而非invariant，因为没有人会为其负责；就像一开始定义的`Even`一样）

FFI是一个比较特别的情况，它与validity不一样，它的正确性不由rust的编译器保证，因为Rust完全不知道FFI另一边的信息。但FFI的另一侧可以做任何事情，所以理论上执行FFI是永远都不安全的。所以这时候就要求程序员知道FFI干了啥， `unsafe { call_ffi() }`的含义则变成，“我已知悉调用FFI所带来的后果，并愿意接受其带来的所有影响”。



除了什么才应该标`unsafe`以外，我们也要求对`unsafe`的内容进行严格的审查。

首先是对接口上的`unsafe`对应的invariant的检查。比如说invariant是否充分（满足invariant就安全了吗）？比如invariant间是否矛盾（`x: u64`却要求`x < 0`，这就没法实现）？

然后是严格检查`unsafe {}`/`unsafe impl`里的条件是否满足。有些东西是不能依赖的，那些没有被证明且没有被标记为unsafe的invariant，比如

* 前文的`Even`，声称的为偶数
* 对于一个未知的`T: UnwindSafe`所“声称”的unwindsafe
* 对于一个未知的`T: Ord`，所“声称”的全序

因为这些都能在safe的情况下违反掉这些接口声称的invariant，但在safe的情况下我们不能”追责“。（again，我觉得这种就应该叫hint）一般来说可以依赖的是：

* **具体类型**的一些性质。比如说`u64: Ord`满足全序，这一点你是可以确保的。这时候具体类型就相当于一个白盒，你可以知道这个类型的所有性质。
* 通过unsafe声明的invariant。



人是不可靠的。那么我们应该如何检查我们是否违反了validity呢？有工具，但不多。目前我们可以通过MIRI（一个rust的解释器，目前可以理解为这是rust的标准行为）去运行你的rust程序（仅限于纯rust代码）。MIRI只维护rust所有正确行为的状态，当你的程序触发UB的时候，MIRI就会报错。但这是有限制的，MIRI只能告诉你UB了，但无法理解你是违反了那一个invariant而UB了；然后MIRI也不可能跑完所有情况；就算跑完所有情况发现没有UB，也不能证明你提供的接口是sound的。（就像测试一样）

还有一些功能有限的形式化证明工具，比如[flux](https://flux-rs.github.io/flux/index.html)，这里就不再展开。



unsafe算是Rust中一大特色了。如果没有unsafe，但又要完全安全，就会有这些情况：

1. 所有validity都可以用类型证明——要求类型系统足够强大（dt起步，可以证明下标合法），可以表达复杂条件。代价就是类型系统空前复杂，对于使用者心智负担很重，对于实现者也很难证明类型系统的可靠性，另外基本都会碰到undecidable的理论天花板。
2. 所有validity都有运行时的动态检查，或者说以运行时的代价消除UB——这就会在各种地方引入不可避免的开销，性能难以做到极致。甚至限制用户做一些底层的操作（每次都要喷一遍，hs没法自己通过语言自身提供的语法定义数组，只能靠运行时的开洞或FFI）



# 再补充一点点

1. rust的类型系统还没被证明是可靠的，也就是说一些规则可能有矛盾（[不一致](https://github.com/rust-lang/rust/issues/25860)），所以现阶段对invariant的证明也不一定可靠。

2. rust的标准库也还没被证明是soundness的，也就是说有些接口的invariant有可能会被破坏。

3. rust的绝大数第三方库没有验证是否soundness，尤其是内部用到unsafe的库。

4. rust的编译器也有可能破坏invariant，进行错误的优化，让我们在safe rust下构造出[segment fault](https://play.rust-lang.org/?version=stable&mode=release&edition=2021&gist=2179a4f4567edd276818c7869aac7e60)。

5. 运行rust程序的平台也有可能破坏invariant，比如说`proc/self/mem`可以破坏内存独占的invariant，修改内存。但从实践意义来说，rust接受这种cornercase。

以后可能1和2会得到解决，但是345看起来是没法避免的，也就是说rust的安全也是有限制的，有些关键的地方还是得靠人来决定，但人永远是不可靠的。让我想起了linus关于安全所说的一句话：

> So?
>
>  You had a bug. Shit happens.

不过，尽管如此，rust的安全性仍然是有统计学意义论支撑，而且出了问题责任也分明。这同样十分有意义。



***

参考：

* https://github.com/rust-lang/unsafe-code-guidelines/issues/428
* https://www.ralfj.de/blog/2018/08/22/two-kinds-of-invariants.html
* https://doc.rust-lang.org/stable/std/os/unix/io/index.html#procselfmem-and-similar-os-features