> This is the first article on **pr-demystifying** topics. Each article labeled **pr-demystifying** will attempt to demystify the details behind the PR.

While browsing the rust-lang repository's list of pull requests last month, I came across PR [#104435], titled `VecDeque::resize should re-use the buffer in the passed-in element`. This PR caught my attention because it seemed interesting and I wanted to understand more about it. I began to wonder why it was necessary to optimize `VecDeque::resize()` and how the old version might be lacking. I also wanted to know how the author had optimized the new version. After delving into the code in the PR, I was able to gain a deeper understanding of these issues.

## VecDeque::resize()

Firstly, let's get familiar with the [VecDeque::resize()](https://doc.rust-lang.org/std/collections/struct.VecDeque.html#method.resize).

> Modifies the deque in-place so that len() is equal to new_len, either by removing excess elements from the back or by appending clones of value to the back.

```rs
use std::collections::VecDeque;

let mut buf = VecDeque::new();
buf.push_back(5);
buf.push_back(10);
buf.push_back(15);
assert_eq!(buf, [5, 10, 15]);

buf.resize(2, 0);
assert_eq!(buf, [5, 10]);

buf.resize(5, 20);
assert_eq!(buf, [5, 10, 20, 20, 20]);
```

The `VecDeque::resize()` API is simple to use. It takes two arguments: the new length to which the `VecDeque` should be resized, and a default value to use for any new elements that are added to the `VecDeque` when it expands.

## The problem

However, if we don't look at the implementation details of this function, we might not realize that there is room for optimization. As the PR's author [@scottmcm] pointed out, the old version did not reuse the value that was passed in as the default, resulting in unnecessary cloning of values.

```rs
use std::collections::VecDeque;

let mut buf = VecDeque::new();
buf.resize(5, String::from("rust"));
```

 For example, the string "rust" was cloned five times, even though only four were needed, because the `VecDeque::resize()` function used `VecDeque::resize_with()` underneath, which passed a closure to the `repeat_with().take()`.

```rs
pub fn resize(&mut self, new_len: usize, value: T) {
    self.resize_with(new_len, || value.clone());
}

pub fn resize_with(&mut self, new_len: usize, generator: impl FnMut() -> T) {
    let len = self.len();

    if new_len > len {
        self.extend(repeat_with(generator).take(new_len - len))
    } else {
        self.truncate(new_len);
    }
}
```

This closure was called repeatedly until it reached the `take` limit, causing unnecessary cloning. 

```rs
pub fn repeat_with<A, F: FnMut() -> A>(repeater: F) -> RepeatWith<F> {
    RepeatWith { repeater }
}

/// An iterator that repeats elements of type `A` endlessly by
/// applying the provided closure `F: FnMut() -> A`.
#[derive(Copy, Clone, Debug)]
pub struct RepeatWith<F> {
    repeater: F,
}

impl<A, F: FnMut() -> A> Iterator for RepeatWith<F> {
    type Item = A;

    #[inline]
    fn next(&mut self) -> Option<A> {
        Some((self.repeater)())
    }

    #[inline]
    fn size_hint(&self) -> (usize, Option<usize>) {
        (usize::MAX, None)
    }
}
```

Now that we have identified the problem, let's move on to how the author fixed it.

## iter::repeat_n

The most significant change made in PR [#104435] was the replacement of `repeat_with().take()` with `repeat_n()`.

```diff
pub fn resize(&mut self, new_len: usize, value: T) {
    if new_len > self.len() {
        let extra = new_len - self.len();
-       self.extend(repeat_with(generator).take(new_len - len))
+       self.extend(repeat_n(value, extra))
    } else {
        self.truncate(new_len);
    }
}
```

We can learn more about `repeat_n` from [ACP: Uplift iter::repeat_n from itertools](https://github.com/rust-lang/libs-team/issues/120). The author proposes to uplift [itertools::repeat_n()](https://docs.rs/itertools/latest/itertools/fn.repeat_n.html) into the standard library, just like how [iter::repeat_with()]() has obviated [itertools::repeat_call()](https://docs.rs/itertools/latest/itertools/fn.repeat_call.html).

How does `repeat_n()` avoid the unnecessary cloning? Let’s dive into the code:

```rs
pub fn repeat_n<T: Clone>(element: T, count: usize) -> RepeatN<T> {
    let mut element = ManuallyDrop::new(element);

    if count == 0 {
        // SAFETY: we definitely haven't dropped it yet, since we only just got
        // passed it in, and because the count is zero the instance we're about
        // to create won't drop it, so to avoid leaking we need to now.
        unsafe { ManuallyDrop::drop(&mut element) };
    }

    RepeatN { element, count }
}

pub struct RepeatN<A> {
    count: usize,
    // Invariant: has been dropped iff count == 0.
    element: ManuallyDrop<A>,
}

impl<A: Clone> Iterator for RepeatN<A> {
    type Item = A;

    #[inline]
    fn next(&mut self) -> Option<A> {
        if self.count == 0 {
            return None;
        }

        self.count -= 1;
        Some(if self.count == 0 {
            // SAFETY: the check above ensured that the count used to be non-zero,
            // so element hasn't been dropped yet, and we just lowered the count to
            // zero so it won't be dropped later, and thus it's okay to take it here.
            unsafe { ManuallyDrop::take(&mut self.element) }
        } else {
            A::clone(&mut self.element)
        })
    }
}
```

Not too much code, we can easily grasp it. The `RepeatN` struct returned by `repeat_n()` is the point. To save a cloning, `RepeatN` declares its `element` as the `ManuallyDrop` type.

## ManuallyDrop\<T\>

[ManuallyDrop\<T\>](https://doc.rust-lang.org/std/mem/struct.ManuallyDrop.html) is a zero-cost wrapper to inhibit compiler from automatically calling **T**’s destructor unless you call `ManuallyDrop::drop()` method. 

The two most important APIs that can help us avoid unnecessary cloning are:

- `ManuallyDrop::take()`

```rs
pub unsafe fn take(slot: &mut ManuallyDrop<T>) -> T {
    // SAFETY: we are reading from a reference, which is guaranteed
    // to be valid for reads.
    unsafe { ptr::read(&slot.value) }
}
```

- The `DerefMut` implementation

In the `Iterator` implementation of `RepeatN`, the `next()` method clones the element in each iteration until the `count` reaches 0. In the final iteration, the `ManuallyDrop::take()` function is used to reuse the buffer and avoid an extra clone. 

Wait, but why does `A::clone(&mut self.element)` will get an instance of `A`? The type of `&mut self.element` is `&mut ManuallyDrop`, not `&mut A`. Well, the use of `ManuallyDrop` may seem obscure at first, but it becomes clearer when we consider the `Deref` and `DerefMut` traits that it implements. These traits allow for a type like `&mut ManuallyDrop<A>` to be treated as if it were a type like `&mut A`. This is known as [Deref coercion](https://doc.rust-lang.org/std/ops/trait.DerefMut.html#more-on-deref-coercion). As an example, consider the following code:

```rs
fn main() {
    let mut a = String::from("A");
    test(&mut a);
}

fn test(s: &str) {
    println!("{s}");
}
```

Here, we are able to pass a `&mut String` value to the `test()` function, even though the function's argument type is `&str`. This is because `String` implements both [Deref](https://doc.rust-lang.org/src/alloc/string.rs.html#2455) and [DerefMut](https://doc.rust-lang.org/src/alloc/string.rs.html#2465), allowing it to be treated as if it were a `&str` value. 

Similarly, `ManuallyDrop<A>` also implements `DerefMut`, allowing it to be treated as if it were an `&mut A` value.

```rs
impl<T: ?Sized> const DerefMut for ManuallyDrop<T> {
    #[inline(always)]
    fn deref_mut(&mut self) -> &mut T {
        &mut self.value
    }
}
```

It's important to note that the `Deref` trait also has a implementation for `&mut T`:

```rs
impl<T: ?Sized> const Deref for &mut T {
    type Target = T;

    fn deref(&self) -> &T {
        *self
    }
}
```

So `A::clone(&mut self.element)` works because `&mut ManuallyDrop<A>` can convert to `&mut A` due to **Deref coercion**, then `&mut A` can convert to `&A` also due to **Deref coercion**.

## Conclusion

As a Rust developer, I am often most concerned with the changes listed in the stable release notes. However, this does not mean that I should not be interested in the individual pull requests (PRs) that are being merged into the project. There are hundreds of PRs merged each week, and each one has a story and an author behind it. That's why I propose the creation of a topic called [#pr-demystifying], where we can share articles about interesting or educational PRs in the Rust community. The PR [#104435], for example, may not be a major optimization, but it allowed me to learn a lot. I would like to thank the author [@scottmcm] for their work on this PR. I hope that this article and others like it will be helpful to others in the community.

[#pr-demystifying]: /topic/pr-demystifying
[#104435]: https://github.com/rust-lang/rust/pull/104435
[@scottmcm]: https://github.com/scottmcm