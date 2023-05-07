We are thrilled to present our third interview, this time with **Rob** ([@robjtede]), the core maintainer of [Actix Web](https://github.com/actix/actix-web) and [deps.rs](https://deps.rs/). In this interview, we talked about how he became involved with Actix Web, what motivated him to take over the project after [@fafhrd91] quit, and his experience of maintaining popular Rust projects.

Thanks to **Rob** for sharing his story with us. We hope you enjoy this interview!

![](/static/issue-3/robjtede.jpeg)

> Rob uses One Punch Man's Saitama as his avatar online. Here he is meeting his hero.

# Introduction

**Introduce yourself and share a bit about your background with Rust. When did you start learning Rust, and what inspired you to do so?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
Hey folks. I'm Rob; [@robjtede](https://github.com/robjtede) on GitHub/Discord/Twitter/Reddit/etc. I'm a professional software engineer in the finance sector focussed on low latency distributed systems, mainly using microservice architectures. I did a masters degree in computer science at the University of Sheffield in the UK and moved to London to start my career after that.

I found out about Rust at some point during university and started [practicing it during 2017's Advent of Code](https://github.com/robjtede/adventofcode2017) event. It was more or less just a curiosity at that point, as my main development was focussed on JavaScript and other frontend skills plus some Node.JS which I used in my undergraduate dissertation project.

It wasn't until I started working (a frontend role) that I started using Rust more. I had suggested to the (small) team that part of the monolithic application we were creating could be split out. It was written in Java, and I had no intention of writing Java so Rust seemed like a good idea to inject into our stack. Most of the team had at least heard of Rust and understood its stated benefits so they gave me free license to develop this service alongside my normal frontend work.

In the 4 years since then, I've transitioned to a purely backend role; as the team grew I needed to focus more on one side of the stack in order to keep my skills sharp. This lead to a desire to go deeper into Rust and its ecosystem.
"""
```

# Actix Web

**How did you become involved with Actix Web, and what motivated you to take over the project after [@fafhrd91] quit?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
I got involved with this particular open-source project in the same way most people do; submitting [a pull request for a feature I needed to use](https://github.com/actix/actix-web/pull/1282) for work. In particular, this was around the time that the "SameSite" cookie attribute was going through a default value change in a bunch of browsers and it wasn't possible to set the attribute to "none" explicitly, since the `None` variant was being used to represent the absence of this attribute. I felt a bit cheeky submitting my first PR with a breaking change, but it was accepted with grace. Unfortunately, v2.0 had been cut pretty recently so we had to use a fork or beta versions at work until v3.0 was released.

Now, after submitting that patch... the _very next_ day... the Actix Web repo disappeared from GitHub. This was a result of **Nikolay** ([@fafhrd91](https://github.com/fafhrd91)) getting frustrated with several comments made on GitHub and Reddit, especially, regarding the quality of the code in Actix Web. And, well, from a strict reading it seems _they_ were right to some extent; the foundational principles of Rust _were_ being broken. However, I can imagine (now) how that would have felt from **Nikolay**'s point-of-view; it must have come across as brigading or even bullying since, factually speaking, most people reading `/r/rust` at the time were hobbyists, not professionals like **Nikolay**.

I hadn't really been privy to all the community drama prior to this, but I'd spent too long on this work project already and wanted to see it through without switching language, so I decided to do something about it. I [posted on Reddit](https://www.reddit.com/r/rust/comments/eq4xsu/gauging_interest_in_an_actixweb_and_siblings_fork) to gauge interest in forking the project under a new name since it seemed that the repo would not be restored. Some people commented and we started a Discord server to discuss how to go about forking and maintaining a web server framework of this scale (it's a lot of code) including the most important aspect of this whole thing: the name. In short, the best we came up with in that week was "Actica". That effort never really got off the ground though, **Nikolay** realized that his project had become a bigger success that maybe he realized and that people were actually depending on it in real work (like me) so he restored the repo and gave effective ownership of the **@actix** organisation to **Yuki Okushi** ([@JohnTitor](https://github.com/JohnTitor) on GitHub) who had already proven himself a reliable open-source maintainer both in Rust and other ecosystems. The future of the project was safe.

**Yuki**'s attention, however, was already in high demand. The project still faced some risk of falling into obscurity or the dreaded "passive maintenance" mode. I felt driven to help though. I'd already submitted one PR. Why not another? Why not something more important and foundational? The patches for the known unsound code that caused the drama had been written and accepted but I wanted to make sure that no more "Unsafe Shitstorm"s could happen. I spent a great deal of personal time from February through May of 2020 (so, y'know, a lot of spare time) trawling through the codebase, adding documentation, comments, and most importantly, auditing unsafe blocks. I removed lots of unsafe blocks, replacing it with safe alternatives, and left detailed comments on every single unsafe block that remained. Some of the changes required API breaks, but we'd already kinda committed to that with my original `SameSite` PR (🙃). With that and some other tweaks, in September 2020, we were ready to [release v3.0](https://github.com/actix/actix-web/wiki/v3-Announcement) with a major focus on improved safety.

During this time, I'd been driving the development work along with some other contributors, and **Yuki** had been approving my PRs diligently. At some point he must have realized I was serious about maintaining Actix Web and he granted me owner permissions to the repo and publish permissions to the crates.io registry.
"""
```

**What is the current status of Actix Web, and how does it compare to two years ago? Are there any major changes or updates in the works?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
Actix Web is actively maintained, mostly by myself, but we have a wide spread of developers submitting issues and PRs regularly. The biggest outside contribution made recently was [derive macro support for multipart form uploads](https://github.com/actix/actix-web/pull/2883), a huge PR (~2000 lines) of high quality and well tested code that reduces boilerplate significantly for multipart request handlers.

Two years ago the Actix Web version was v3.3, which added a number of new features focussed around quality of life changes for developers since v3.0. Since then, we've had another round of breaking changes, resulting in the major version bump to v4. I had a fresh new focus for v4: API stability. The cracks in v3's API had started showing pretty quickly after its release and, based on feedback and repeated questions I had been observing, it felt like there was an opportunity to re-design some parts of the API surface so that we wouldn't need to break it again for at least a year and improve the getting started experience at the same time.

Notably, one of these rough edges was the difference between `#[actix_web::main]` and `#[tokio::main]`. The reason why the former was **required** in v3 is unimportant, but this question came up enough times that we thought it was important to make Actix Web work under `#[tokio::main]` in v4. This may not have required a breaking change except that we'd already committed to put v4 on the recently released Tokio v1, a release which had inspired me to get on the API stability band-wagon with its mindfully cut down interface, ensuring that the base API was rock solid and additive changes could be made for a long time to come.

Some other API changes I paid attention to are documented in the [v4 migration guide](https://github.com/actix/actix-web/blob/master/actix-web/MIGRATION-4.0.md). This page gives some insight into my thought processes for this release. All in all, it worked! There was a pretty long ([meme worthy](https://www.reddit.com/r/rustjerk/comments/rgux3a/seriously_its_been_in_beta_for_more_than_11)) beta period for v4, but since its release in February 2022 we've had no further breaking changes!

As for future changes, there is certainly a v5 on the cards. The most exciting reasons for a major version bump are the changes we'll be able to make to key traits like `FromRequest` now that Generic Associated Types (GATs) have been stabilized and return-position impl-trait and/or `async fn` in traits seems to be (perpetually) around the corner. These features will make writing custom extractors and middleware much more pleasant for our users (and us).

Some of the less exciting breaking changes are being trialled in the [`actix-web-lab`](https://crates.io/crates/actix-web-lab) crate, a place where I have been busy experimenting, unburdened by the burden of post-v1 semantic versioning. (This crate has helped me massively on the API stability goal of v4.x, too. Lots of cool, non-breaking features are written for this crate and then graduate to Actix Web after seeing some real world usage and having their sharp edges ironed out.)
"""
```

**Is Actix Web still a web framework powered by the actor model? If not, why?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
No. This is a common misconception, but one I can totally understand given the heritage and persisting name of the framework. Story time...

**Actix Web has not used the actor model, in particular the `actix` crate, to power its core HTTP server since before version 1.0!** (The last pre-v1 version was released in January 2019.) It was around that time that the work on asynchronous Rust was gaining traction and the `futures` v0.1 crate was released as a prototype of what the `Future` abstraction would look like when it was part of std. Many crates incorporated this version of the `Future` trait.

Using this new trait, the "service architecture" was first [modelled in `actix-service`](https://docs.rs/actix-service/0.1.0/actix_service/trait.Service.html) which, as it turns out, is a much more natural mental model for representing the request-response pattern of HTTP since it composes the different networking layers very elegantly.

The only part of the stack that still requires actors is `WebSockets`, since this is actually still modelled quite well by actors due to being bi-directional and not strictly request-response. However, we're working to remove the need for this too with a new API that should look similar to what's provided by the third party [`actix-ws`](https://crates.io/crates/actix-ws) crate.
"""
```

**What inspired you to maintain such a large project voluntarily, and what challenges have you faced in doing so?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
Mainly it was a desire to dive deeper into the web stack and understand HTTP at a more fundamental level using a real implementation as guidance. Plus it was 2020 and I had a lot of free time on my hands.

The main challenge has been thinking pragmatically **and** holistically when designing features and making changes as well as considering the current and futures needs of _all_ the users of Actix Web; even the ones who aren't vocal in chatrooms or issue trackers, especially our enterprise users.

One particular change of viewpoint I've had throughout my maintainer-ship is about Minimum Supported Rust Version (MSRV) policies. I was a hard-line "MSRV increases are breaking changes" believer at the beginning. This turned out to cause me and some of our users a large number of headaches during both v3.x and even v4.x cycles. To be fair, this a tricky problem to solve when upstream crates have different policies. However, it _feels_ like an area where Cargo could be smarter in selecting versions that _should_ work with a particular MSRV now that the [`package.rust-version`](https://doc.rust-lang.org/cargo/reference/manifest.html#the-rust-version-field) field in Cargo manifests files has been available for over a year and is used in lots of well known crates.

With it being a large project, it also comes with a community of users; including contributors. Opening up the Discord server as an initial discussion zone for help instead of GitHub issues was a great move; there's lots of folks in there asking questions and many apart from myself answering them. It also serves as a hub for Actix Web devs and third-party crate authors to bounce ideas around. Though with any community of significant size, we have to deal with the usual annoyances: spam, disagreements, Code of Conduct violations. The core team has been able to keep on top of all these issues, so far.

It's also been really challenging for me be critical of feedback and PRs from regular contributors and team members when they don't align with the overall vision for the project. I really want folks contributing code to remain excited and motivated so having to say "no" to an idea is hard. I try my best to understand their point of view, but have to stay balanced and consider _all_ Actix Web users; sometimes that means having to significantly re-work a PR myself or close it outright.
"""
```

# deps.rs

**Let's talk about deps.rs. What is it, and how did you get involved with deps.rs? How can Rust developers use it to improve their projects?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
**[deps.rs](https://deps.rs) is a tool you can use to analyze your crates for outdated dependencies.** We think that, in general, dependency freshness is a reasonably good indicator of maintainer activity, ecosystem compatibility, and, therefore, a factor in a crate's suitability for use in your project. Searching a crate on [deps.rs](https://deps.rs) will give details about dependency freshness and shows a snippet to include a badge/shield to put in your project README that will show green if all dependencies are up to date, or hint that some are outdated. We also integrated with the RustSec security advisory database to show indicators that updates are needed to patch security vulnerabilities.

In Nov 2019, there was a [call for maintainers](https://github.com/deps-rs/deps.rs/issues/40#issuecomment-552179964) from the original author, **Sam** ([@srijs](https://github.com/srijs)) which a few of us responded to, including [@cecton](https://github.com/cecton) and [@paolobarbolini](https://github.com/paolobarbolini) who are well known in the Rust community. We started a chatroom on Matrix to start co-ordinating ideas and resources. Since deps.rs is a free public tools that is not free to operate, this was more challenging to get started due to natural trust barriers of "strangers" on the internet. We didn't want to give any one person control of the service so the responsibilities of keeping it running were divided up; one person would operate and pay for running the application itself and another would manage and and pay for the domain name when it was transferred.

To give **Sam**  assurance that we meant business, we forked the project and started assessing open issues and PRs, integrating them with our fork. A few weeks later, **Sam**  gave our team ownership of the original repo and transferred the domain over to me. Then in December 2020, we put [an announcement out on Reddit](https://www.reddit.com/r/rust/comments/kbqgt8/we_have_restored_depsrs_dependency_status_reports) that this popular service was now community operated! I had already been toying with GitHub sponsors, so I changed the description on my page to encourage donations to cover domain costs, and it worked; the domain costs are effectively crowdsourced now! **Paolo** doesn't have GitHub sponsors set up so he must be fronting the cloud server expenses himself. **Even so, I consider this a real open-source success story.**

On a related note, I've been offering support to many crates that seem to be falling out of maintenance; most recently [`tinymap`](https://github.com/robjtede/tinymap). It takes very little time and I can help increase the bus factor and improve code quality. **If anyone has a crate and needs help keeping it up to date, message me on Discord. I'd be happy to take a look.**
"""
```

# Advice for developers

**What advice do you have for developers who are just starting to learn Rust, especially those who are interested in web development?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
Some general advice I give to Rust newcomers is to always run `cargo clippy` instead of `cargo check` so you learn more of the idiomatic code patterns right from day 1. Also go subscribe to the [This Week in Rust newsletter](https://this-week-in-rust.org) for exposure to lots of great blog posts, especially those in the "Rust Walkthroughs" section.

If you're familiar with the micro-framework style of creating web services in other languages (think Flask or ExpressJS), do consider reading through the [getting started guide](https://actix.rs/docs) and trying out Actix Web. I think Rust really is worth learning and doing so through building a web service is a good way to do so; it will expose you to loads of the concepts you read about in [The Book](https://doc.rust-lang.org/book) (you read the book already, right?).
"""
```

# End question

**What do you think of Rust Magazine, and do you have any advice for us as we continue to grow and improve? How can we better serve the Rust community?**

```quote
author="Rob"
avatar="/static/avatar/robjtede.jpeg"
content="""
I think the Magazine is a great initiative and fills a gap for more editorial content than you get from links via This Week in Rust, for example. I really enjoyed issue 1's `/issue-1/weihanglo` and that's not the kind of written content you could find anywhere else but a magazine.

I've personally had good success with GitHub sponsors to fund my otherwise free work. It may be a road to look at for the Magazine to encourage high quality content either by directing sponsorship money to article authors or reviewers/editors in some way.

Finally, a massive thanks for this opportunity to speak to the Rust community.
"""
```

> **Editor: We are trying to open an [OpenCollective account](https://opencollective.com/rustmagazine) for Rust Magazine, so that we can pay our contributors for incentivizing them to write more high-quality articles. We are also looking for sponsors to help us pay for the domain and email newsletter costs. If you are interested in helping us, please contact us on [Discord](https://discord.gg/DdwgBuReJe) or email us at [opencollective@rustmagazine.org](mailto://opencollective@rustmagazine.org).**

[@robjtede]: https://github.com/robjtede
[@fafhrd91]: https://github.com/fafhrd91
