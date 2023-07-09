Today, we are glad to announce our latest interview with **Jacob Pratt**, the core maintainer of the [time](https://crates.io/crates/time) crate and a contributor to the Rust compiler and standard library. We are grateful for Jacob's time and expertise, and we look forward to sharing his insights with you and hope you enjoy our interview with **Jacob Pratt**.

# Introduction

**Introduce yourself and share a bit about your background with Rust. When did you start learning Rust, and what inspired you to do so?**

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
Hello! For those that don't know me, I am **Jacob Pratt** (GitHub [@jhpratt](https://github.com/jhpratt)). I've been maintaining the `time` crate and contributing to `rustc` and `std` for a few years now. To the best of my recollection, I've been using Rust since October 2016, though I had played around with it somewhat before then. At that time, I was working on a backend for a website in JavaScript, but could not convince myself that a non-admin user would not be able to access the admin endpoints. This is because JavaScript is weakly typed, so any effort to verify this would have taken significant work. I had heard of this relatively new language "Rust", and decided to check it out. As Rust is strongly typed, my concerns were immediately alleviated, as I could simply require an instance of an admin user as a parameter. As a nice bonus, the backend got significantly faster in the rewrite!

In the nearly seven years since I started using Rust, I have written an immense amount of code in it. A large part of this is maintenance of `time` and contributing to the Rust compiler and standard library.
"""
```

# `time` crate

**How did you get involved with the `time` crate, and what has your experience been like as a core maintainer?**

```urlpreview
https://github.com/time-rs/time
```

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
Odd as it may seem for such a popular crate, I just asked. `time` was officially deprecated when I took it over, so the people with publishing permission and GitHub access were willing to hand it over once I had written sufficient code (so as to avoid malicious intent).

My experience as a maintainer has been largely positive. Of course it's impossible to please everyone, but I believe that on the whole I have written a solid crate that is widely used without much issue.
"""
```

**What are the differences between `chrono` and `time` crate? Can you offer any advice to help users choose which crate to use for their specific needs?**

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
Overall, [`time`](https://crates.io/crates/time) and [`chrono`](https://crates.io/crates/chrono) provide a generally similar API. For the best comparison, I honestly suggest that people just try them to see which one they like more. However, I'll try to give a relatively simple overview.

`time` has three core types: [`Date`](https://docs.rs/time/latest/time/struct.Date.html), [`Time`](https://docs.rs/time/latest/time/struct.Time.html), and [`UtcOffset`](https://docs.rs/time/latest/time/struct.UtcOffset.html). These can be combined to form a [`PrimitiveDateTime`](https://docs.rs/time/latest/time/struct.PrimitiveDateTime.html) (consisting of a `Date` and `Time`) or an [`OffsetDateTime`](https://docs.rs/time/latest/time/struct.OffsetDateTime.html) (consisting of all three). `chrono` is similar in having [`NaiveDate`](https://docs.rs/chrono/latest/chrono/naive/struct.NaiveDate.html), [`NaiveTime`](https://docs.rs/chrono/latest/chrono/naive/struct.NaiveTime.html), [`FixedOffset`](https://docs.rs/chrono/latest/chrono/offset/struct.FixedOffset.html), [`NaiveDateTime`](https://docs.rs/chrono/latest/chrono/naive/struct.NaiveDateTime.html), and [`DateTime`](https://docs.rs/chrono/latest/chrono/struct.DateTime.html), respectively. A quick check shows that the sizes of all types are the same, with the exception of `UtcOffset`, which is three bytes to four for `FixedOffset`. With that said, `time` supports niche value optimization! So if you have `Option<T>`, your types won't be any larger if at all possible. `chrono` does not do this.

Perhaps the largest difference between `time` and `chrono` is the choice of formatting. `time` prefers more powerful, readable descriptions (e.g. `[weekday], [month repr:long] [day padding:none]`), while `chrono` prefers a more limited description that is compatible with C (e.g. `%A, %B %-d, %Y`). I made this change out of frustration with the existing description, as it's not clear what is actually being written. Even those familiar with the format must admit that it's difficult to remember that `%A` corresponds to "Sunday" and `%B` "July", for example. An unexpected advantage of the change is that I was able to implement many modifiers, such as case sensitivity. Format descriptions in `time` can also be constructed via a macro, which statically verifies the format and eliminates all runtime overhead of parsing it, leading to it being faster the last time I benchmarked it.
"""
```

**Has the time crate fixed the `localtime` soundness issue? If not, why? Have you considered using `tz-rs` to address the issue?**

> **Editor:**
>
> - `localtime` soundness issue was reported by [@quininer](https://github.com/quininer) in 2020, both `time` and `chrono` have been affected. See [time#294](https://github.com/time-rs/time/issues/293) and [chrono#499](https://github.com/chronotope/chrono/issues/499) respectively.
> - [`tz-rs`](https://crates.io/crates/tz-rs) is an emerging crate reimplementation of `libc` functions `localtime`, `gmtime` and `mktime`.

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
"Fixed" is a relative term, unfortunately. It is fixed in the sense that there is no unsoundness (unless explicitly opted into via an `unsafe` method call), but the issue still remains in that Unix-based operating systems without thread-safe environments are unable to soundly get the local UTC offset. For that reason any method calls that require doing that return the error value.

With regard to `tz-rs`, I considered it when it was first released. Using that crate would be extremely costly, as it would require parsing the entire time zone database on every invocation to avoid returning incorrect values. For this reason I decided not to use it.

One solution that I hope will eventually be picked back up is `#[deprecated_safe]`, which should be applied to `std::env::set_var`. _Ultimately_ I would love for every operating system to have thread-safe environments, but that's an issue dating back to the very introduction of environment variables in 1979.
"""
```

# Contribution to Rust

**In addition to maintaining the `time` crate, what other contributions have you made to the Rust community? For example, I know you are the author of RFC and the implementation of [`derive_default_enum`](https://rust-lang.github.io/rfcs/3107-derive-default-enum.html).**

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
`time` is definitely the largest. Aside from that, I maintain [deranged](https://github.com/jhpratt/deranged) — a proof of concept for ranged integers — and [num_threads](https://github.com/jhpratt/num_threads) — to get the number of threads the process is currently using. I previously maintained [standback](https://github.com/jhpratt/standback), which backports new features from the standard library to older compilers, but stopped maintaining it because no one used it.

As you mentioned, I also (somewhat) wrote the RFC for `#[derive(Default)]` on `enum`s in addition to implementing and stabilizing it. More recently, I wrote the now-accepted RFC for restrictions, which will permit sealed traits at a compiler-level, rather than (ab)using visibility and accessibility. There is a pull request open to implement this, so it'll hit nightly relatively soon. By the time this is live, it may already be on nightly!

Beyond the two RFCs, I've stabilized a large number of standard library items and language features, largely allowing new behavior in `const` contexts. Aside from `const` things, I implemented proper stability checks for `impl const Trait`, improved stability checks within `std`, and reduced the frequency of merge conflicts for PRs to the Rust repository. Something I've been looking into more recently is reducing the special-casing of the standard library, which will have significant benefits to the Rust ecosystem as a whole. **I'll actually be talking about this at [RustConf](https://rustconf.com/schedule/the-standard-library-is-special-let-s-change-that-) in September!**
"""
```

**What are the most rewarding part and biggest challenges that you have faced as a maintainer of `time` crate and contributor of rust?**

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
Probably the most rewarding part is knowing that millions of people use code that I write on a daily basis. When I get a feature request, I know it's because someone thinks the crate is useful and wants to see it improved, even if in a small way. The biggest challenge is unfortunately finding time to work on things. Funding is also far from ideal, but that's the case for everyone. As far as technical challenges, I tend to push the boundaries of what's possible with the compiler, leading me to occasionally run into barriers.
"""
```

# Vision

**What is your vision for the future of the `time` crate and Rust as a whole?**

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
I have _a lot_ planned, to say the least.

In `time`, I started work on integrating the time zone database in April. That would mean full support for actual time zones, including daylight saving time adjustments, rather than only fixed UTC offsets. This is a large undertaking that will consume a significant amount of time to complete. Another thing I have been working on is having a generic `DateTime` type that supports a variety of offsets: statically known, dynamic (equivalent to `OffsetDateTime`), a time zone, or no offset at all (equivalent to `PrimitiveDateTime`). To that effect, both `PrimitiveDateTime` and `OffsetDateTime` are actually simple wrappers around this currently-internal type. I hope to eventually make it public, but there are some language features that I want to land on stable before that happens.

With Rust as a language, there are tons of things that I want to work on. I have an RFC that needs to be rewritten that would permit certain fields of `struct`s/`enum`s to have default values, such that they can be omitted when constructing them, with the values also being used by `#[derive(Default)]`. Other RFCs that I have planned, in some form or another, are `unsafe` fields and significant expansion of `#[derive]` capabilities, plus a couple more that I'm deliberately keeping the details of private. Rust is already a great language, but there is always room to improve. I intend to do my part in moving that forward.
"""
```

# End question

**When you're not working on Rust projects, what do you like to do in your free time? Do you have any hobbies or interests that you're particularly passionate about?**

```quote
author="Jacob"
avatar="/static/avatar/jhpratt.png"
content="""
While I do not train any more, I trained for nearly ten years in [American Kenpo](https://en.wikipedia.org/wiki/American_Kenpo), specializing in self-defense and achieving the rank of third degree black belt. In that time, I taught others for a number of years. Another thing I do on occasion is solving Rubik's cubes, though like the martial arts I don't do this as much as I used to. Something I do quite often nowadays is watch various sports.
"""
```

![](/static/issue-4/jacob-in-training.jpg)

> Jacob is in training for American Kenpo
