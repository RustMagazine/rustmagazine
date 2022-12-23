> This is the first article on **pr-demystifying** topics. Each article labeled **pr-demystifying** will attempt to demystify the details behind the PR.

Last month, when I was browsing the rust-lang repo's PR list, PR [#104435](https://github.com/rust-lang/rust/pull/104435)  (`VecDeque::resize should re-use the buffer in the passed-in element`) caught my eye. Seems pretty interesting. I wonder why we need to optimize `VecDeque::resize()`? Where does the old version suck? How did the author optimize the new version? After diving into the PR code, I figured it out.


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

The API is straightforward. The first argument is the new length the VecDeque should resize to, and the second argument is the default seed value the new elements should clone from when the VecDeque should expand.

## The problem

If we don't dive into the implementation details of `VecDeque::resize()`, we never know if there is really a need for optimization. We never reuse the original value we passed in, just like the author [@scottmcm](https://github.com/scottmcm)  mentioned in the PR title. For example:

```rs
use std::collections::VecDeque;

let mut buf = VecDeque::new();
buf.resize(5, String::from("rust"));
```

The owned string `rust` was cloned five times even though we only need four, the last of those clones is avoidable. This is because we use `VecDeque::resize_with()` underneath.


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

Here we simply use `repeat_with().take()` to produce the finite iterator. However, the closure of `repeat_with()` will be called repeatedly until we reach the take limit.

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

Now that we already know the problem, let’s move on to the next part. How the author fixed it.

## iter::repeat_n

Here is the point, the most important change is using `repeat_n()` to replace the entire `repeat_with().take()`:

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

How does `repeat_n()` avoid the unnecessary clone? Let’s dive into the code:

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

Not too much code, we can easily grasp it. The `RepeatN` struct returned by `repeat_n()` is the point. To save a clone, `RepeatN` declares its `element` to be the `ManuallyDrop` type.

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

In the `next()` method of `RepeatN`'s `Iterator` implementations, we clone the element in each iteration when the `count` doesn't reach 0. In the last iteration, we reuse the buffer via the call `ManuallyDrop::take()` to avoid the extra clone.

Wait，but why does `A::clone(&mut self.element)` will get an instance of `A`? The type of `&mut self.element` is `&mut ManuallyDrop`, not `&mut A`. Well, there are some kinds of obscure. Actually, it is a [Deref coercion](https://doc.rust-lang.org/std/ops/trait.DerefMut.html#more-on-deref-coercion). Here is a simpler example to help us understand:

```rs
fn main() {
    let mut a = String::from("A");
    test(&mut a);
}

fn test(s: &str) {
    println!("{s}");
}
```
The `test()` function argument type is `&str`. Here, not only we can pass a `&String`, we can also pass a `&mut String`. This is because `String` implements [Deref](https://doc.rust-lang.org/src/alloc/string.rs.html#2455) and [DerefMut](https://doc.rust-lang.org/src/alloc/string.rs.html#2465). `ManuallyDrop` also implements the `DerefMut` trait.

```rs
impl<T: ?Sized> const DerefMut for ManuallyDrop<T> {
    #[inline(always)]
    fn deref_mut(&mut self) -> &mut T {
        &mut self.value
    }
}
```

Don't forget, however, another essential implementation:

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

Rust is a thriving and prosperous project. There are more than hundreds of Pull requests merged per week. As a Rust developer, every release note of a stable version is the change we are concerned about most, we rarely track every single PR progress. However, this does not mean we should not care about the PR and the story behind the author and PR. That’s why I proposed a topic called [#pr-demystifying](/topic/pr-demystifying) to label these articles. Perhaps the rest of the community will learn a lot from these articles. If you come across a good PR in the Rust community, it also deserves an article to share what you learn.

The PR [#104435](https://github.com/rust-lang/rust/pull/104435) isn’t a big optimization, it let me learn a lot though. Thanks to the author [@scottmcm](https://github.com/scottmcm) for working on this. I also hope this article is helpful to you.