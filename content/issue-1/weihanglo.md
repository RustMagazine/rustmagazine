

# Introduction

**Introduce yourself and share a bit about your background with Rust. When did you start learning Rust and what inspired you to do so?**

```quote
author = "Weihang Lo"
content = """
Hello, people. I am [Weihang Lo](https://github.com/weihanglo). You might come across me online if you ever tried to search something about Cargo in the rust-lang/Cargo repository. And yes, my profile image is a green rabbit. Oh it is not actually a green rabbit. It is a white rabbit with a green background. Besides my public-known identity — a Cargo team member — I am also an active member of our local Rust community in Taiwan. 

Back to the day I really loves of the concept behind open source communities. It is not really the classic "free as freedom" open source idea. It's more like "sharing is caring". I love one people sharing their ideas their knowledge and everything. Without thinking too much like "I give this out and wait for returns", the generosity did make me feel wholesome. I have received a lot of helps from the community when I started my career as a software engineer, so I want to give it back to the community and let sharing continue. 

I was a web frontend developer in 2017, seeking opportunities to sharpen my skills outside web development. I'd like to learn more on system programming and compiled languages. There were a couple of choice: Golang from Google and Rust from Mozilla. I took a glimpse at Golang, though the development of Golang itself was not really open-source minded at that time. Instead, I bet on Rust, not because its safety guarantee, but the openness of the community. And I trust Mozilla as well, regarding how they operation open source communities.

I attended the Mozilla conference in Taipei and spoke to many people, including someone who had written a lot of content on Rust and is now an author of two Rust books. During the conference, I learned about the Servo engine in Rust. I also met others interested in learning Rust. The community was supportive and friendly, so we organized a reading club to read through the entire Rust book. That's how I got started with Rust.

What inspires me to stick with Rust is the community and the shared belief that Rust will succeed. I keep learning and advocating Rust because it is a pragmatic and safe programming language, acting as a bridge between paradigms. The ownership and lifetime model in Rust eliminates common programming errors, making me feel safe when writing code. Rust is like an mother from East Asia who wants to control your life, but also nurtures and teaches you. This is why I keep learning and advocating Rust. I cannot program anything without Rust. I am already spoiled by Rust.
"""
```

# The story behind joining the Cargo team

**Can you share the story of how you joined the Cargo team? What was the process like and what attracted you to the opportunity?**

```quote
author = "Weihang Lo"
content = """
To be honest, there was no a clear path to become an official member of the Cargo team. It's more like a long process of earning the trust of existing members. I've been contributing to the project since 2019 during the lockdown and my first pull requests is simple. It was a fix related to lockfile comparsion. I removed some unnecessary allocation of the comparison function and switched from string comparison to iterator comparison, which was encouraged by a kind maintainer Jacob (Eh2406). He recognized my efforts and I felt more welcomed with the project.

The community is really friendly, so I continued to contribute and expand my knowledge of Cargo. Initially, I only improved error messages because it was easy and is a two-way door change, which means we can always rollback when making mistake on that. However, I wasn't satisfied with just contributing error messages, so I broadened my knowledge in other areas.

For example, I added the ability for the Cargo target filter to support glob syntax. This means that if you have a filter `--test`, you can write `--test '*'`" to inclue all the test targets. I have also worked on improving the resolver and error messages. Although I still don't completely understand the resolver, I'm trying my best to earn the trust of the Cargo team. Besides code contributions, I also help managing issues, responding to pull requests. Here is a trick for review pull requests when you are an external reviewer: pick pull requests that are not too simple or already well-done. That's a way to show your knowledge of the codebase and really share the burden of other maintainers. I believe maintainers will still look into it. With your words, they can pick up the pull request much quicker and give you credits.

I was thrilled when I was invited to join the Cargo team of a four-member team. I had never been officially recognized before and it was one of the highlights of my life. I joined their weekly meeting, which was at midnight my time due to the time difference between Taiwan, where I live, and the US, where the other team members are located. There were a lot of topics on the agenda and I felt a bit overwhelmed by the fast-paced technical discussion in English. Despite feeling stressed, I was grateful for the opportunity to listen and learn from the team.

I feel happier and fulfilled than ever since I became a part of the team, even more happier than joining a big company like Google or Amazon. I am proud to be part of the community.
"""
```

# About Cargo team

**How does the Cargo team work on a day-to-day basis? Do you have weekly meetings or a specific workflow that you follow?**

```quote
author = "Weihang Lo"
content = """
For Cargo, there is a weekly meeting called the Cargo triage meeting. During this meeting, various topics are discussed and added to the agenda. Each topic is discussed and solved within the hour-long meeting. If there are any remaining items that haven’t been discussed, they are carried over to the next week.

During these meetings, we often discuss pull requests and raise awareness for issues that need review or are particularly complex. Team members are encouraged to share their opinions on these issues and provide solutions. If there is any related information that the author is not aware of, the team will discuss how to handle it.

Decisions are usually done during the meetings. The team would post a thread on an issue to explain in detail how and why the final decision came out like this. It doesn't mean things are close-doored. Usually there will be an final comment period for major issues. For monior issues, peopel can still add more comments and bring more use cases to the discussion.
"""
```

# Most proud of accomplishements past year in the Cargo team

**As a member of the Cargo team for nearly a year, can you share some of the tasks that you have worked on and the accomplishments that you are most proud of?**

```quote
author = "Weihang Lo"
content = """
As a Cargo member, I haven't accomplished a lot of common outstanding features by myself that the users are aware of. However, I have contributed to the project by triaging issues, mentioning a couple of members.. I have also been actively working to revive some old and stagnant pull requests. Since last April Alex stepped down, the Cargo team were in low review capacity. I has taken care of making everyone's pull request get a response.  This is an accomplishment I am proud of.

One prominent example is that I have made is bringing the scrap-examples back to life. Although I didn't implement this feature, it was created by Will Crichton, the brother of Alex. This feature scrapes examples in a Cargo package and generate a beautiful HTML in rustdoc to display what are used. It's quite convenient for users to learn how to use those API in more complete examples. This is a valuable feature, but it became stagnant after Alex stepped down. I helped revive it and now the feature is turned on by default on docs.rs (under some circumstances).

It's extremely hard to revive stagnated and unstable features. Authors were disappeared or unwilling to process, but I enjoy making them live and stable. Another feature I'm trying to help with is artifact dependencies. You can now depend on a binary or dynamic library instead of a Rust library, making integration easier. I was fixing bugs in this area and making it more useful, but I did't have the expertise to be an expert in it. I spend my knowledge on understanding what's going on in the feature resolution. As a maintainer, I don't always have to fix bugs myself. I can write down my findings and analysis, and someone else may come in and fix it. This is the amazing part of open source work. And for artifact dependencies I really did that and someone got a idea more clever than mine finally fixed it. You don't need to fix everything yourself. Your analysis and contribution can help the community work together and solve problems. That's the beauty of open source.
"""
```

### How do you balance your daily job with working on Cargo in your free time? Do you have any tips for others who are interested in contributing to open source projects while also managing a full-time job or other responsibilities?

```quote
author = "Weihang Lo"
content = """
It is challenging to continuously contribute to open source projects when your interest wanes over time. This can also be further compounded by negative feedback from other contributors. To overcome this, it is important to set aside dedicated time for your owncontributions and to have a clear plan and goal for what kind of contributions you want to make. Don't just sink yourself in a sea of issues. Starting with small tasks, such as improving error messages, can help build up your knowledge and skills. It is also important to remember to prioritize your own well-being, and take a break if you are feeling stressed or overwhelmed.

Rememeber. Not everyone needs to be enthusiastic about open source. It's okay you don't consider programming as your hobby. It's okay you do programming only for earning a liviing. We are first human than programmer.
"""
```

# The biggest challenges of the Cargo team

**What do you think are the biggest challenges facing the Cargo team right now? How do you plan to tackle these challenges in the future?**

```quote
author = "Weihang Lo"
content = """
One of the major challanges Cargo team faces is long-term sustainability. It doesn't mean that Cargo is going to die. Just the Rust langauge itself is growing too fast that Cargo's development is a bit lagged behind. Since Alex stepped down, we are more prone to the bus factor. Only Cargo team lead has comprehensive knowledge of the code base. If one changes a module, it may affect another module and the team lead knows how they interact. Other members don't have that kind of knowledge, so the attention of the team lead become the most scarce resource. 

We has aimed to spread knowledge among team members. This will help to keep the team healthy and reduce dependency on a single person. So far it goes pretty well, as more and more people participating in the review process, including some external reviewers! Cargo mau probably follow the Conway's law and align our organizational structure with our code structure. I don't mean we need to have more team leads or more different positions within the team. I mean by making the code more modular, so that each module has a designated person responsible for it. The organizational structure of the Cargo team will also need to be modularized. This will reduce the overhead for new contributors and make it easier for them to get on board in a specific area.

To attract more contributors and increase chances for them to become long-term maintainers, we can improve not only the code, but also the documentation and tutorials. We can aim to be like the Rust compiler team, which has a large and active community, by share knowledge about Cargo through videos, tutorials, and workshops. This way, everyone can learn how Cargo works and interact with it, and they may even come up with new ideas and external sub-commands. In turn, the Cargo community will become more prosperous. Although these kind of social events sounds intimidating to a Eastern-Asian like me. 

To me, the other of unresolved issue in Cargo is that its internal API is not well documented or stable enough for third-party developers to easily create their own sub-commands. Not to mention you need to add a full Cargo library as your dependency to create your own exstension. That stacks up your compile time. Some functionalities in people has already re-invented the whell outside Cargo. However, they cannot guarantee the stability as the Cargo team might change to underlying details from versions to versions. 

On the other hand, Cargo has many subcommands, with the first-class subcommands being treated differently from the third-party subcommands. The first-class subcommands, such as Cargo build and Cargo tree, can use the internal API freely, but the third-party subcommands cannot. That leads to a situation that first-class subcommands haven't "eaten their own dog food." To address this, we need to find a way to modularize the code and improve it over time, which make the API interface more friendly and extensible.

These are two of the chanllges I am aware of the Cargo team currently facing. It's like a chicken-egg problem. When open-source project grows, contributors may step down or burn out, and new contributors get in. However, the code base becomes increasingly monolithic and difficult for new contributors to understand. To address this, we need to lower the barrier for new contributors to get on board and become reviewers or maintainers. Even if not everyone wants to become a maintainer, they can still follow the trail to learn and bring values. That's the key to succeed for a open source project.
"""
```

# Future plan of the Cargo team

**Does the Cargo team have any specific plans or goals for the coming year or two? Can you give us a sneak peek into what we can expect from Cargo in the near future?**

```quote
author = "Weihang Lo"
content = """
The Cargo team is trying to write their own roadmap, but it's challenging due to differing opinions and use cases among users. Currently, there's a lack of clear roadmap, but the top priority for the next year is turn the sparse index registry on by default, which will help speed up CI pipelines when it becomes stable in 1.68. However, this requires more communication and collaboration with the infrastructure team and the crates.io team, so personally I don't expect it will become the default right after it hits stable.

As an open-source project, every maintainer in the Cargo team is a volunteer and free to contribute as they wish. We don't set any expectation on a single person. The minimal requirements are attending the meeting regularly and doing FCP reviews.

There are many ongoing projects, such as integration of the new dependency resolver pubgrubs, modularizing Cargo, and collaborate with with private registry providers to figure out the needs of registry autentications. Some other are exploring ideas on nested workspaces or making Cargo release process more smooth. Also some area like parallsing libtest is under consideration. However, `cargo test` depends on litest and may need an edition breaking change for a different mechanism of sharing test environments.

To sum up, the team doesn't have a clear roadmap yet, but they are working on various issues to improve Cargo's overall experience for both developers and users.
"""
```

### In addition to your work on Cargo, do you contribute to any other open source projects, either as an individual or as part of an organization? Can you share a little bit about some of these other projects and what you enjoy?

```quote
author = "Weihang Lo"
content = """
I don’t regularly contribute to other open source projects apart from occasionally helping with fish shell for Rust-related completion, and translating the Traditional Chinese version of the Rust Programming language book. Most of my time is occupied by Cargo. However, I still want to explore other opportunities to help the community and make the world a little bit better.

I also have an interest in contributing to rust-lang/rust repository, specifically in learning more about the codegen phase and the interaction between Cargo and Rust, such as the integration of debuggers and libtest tools. This will not only improve Cargo but also help me think ahead and make a long-term goal for myself. And yep, I may not have time to do so but that's totally fine.
"""
```