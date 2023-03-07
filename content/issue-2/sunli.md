I am pleased to introduce our second interviewee, [Sunli], the creator of two widely-used crates: [async-graphql] and [poem]. It is an honor to have the chance to speak with him and gain insights into his experiences and expertise.

# Introduction

**Introduce yourself and share a bit about your background with Rust. When did you start learning Rust, and what inspired you to do so?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="""
Hello everyone, I am **Sunli** (Github: [@sunli829](https://github.com/sunli829)), an older programmer who loves coding. Previously, C++ was my main programming language, and even though I have been using it for many years, I still feel like I haven't fully mastered it.

Three years ago, I started learning Rust. Rust's ownership and lifetime mechanisms force developers to follow conventions and naturally consider exceptional cases when writing code. This is one of the truly distinctive features that sets Rust apart from other programming languages. Therefore, I began applying it to my work. I also enjoy the Rust community, there are many helpful people.
"""
```

# Async-graphql

```urlpreview
https://github.com/async-graphql/async-graphql
```

**Can you explain what async-graphql is and how it differs from other GraphQL libraries?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="""
[GraphQL](https://graphql.org/) is a query language for APIs that allows clients to request specific data and enables servers to respond with the corresponding data based on the request content. The flexibility and powerful querying capabilities of GraphQL have made it increasingly popular in developing modern applications.

**async-graphql** is a server-side library used to implement the GraphQL specification, leveraging Rust features such as procedural macros to enhance development experience and provide full asynchronous support.

Another library similar to **async-graphql** is [juniper](https://github.com/graphql-rust/juniper), which I have used before and is also excellent.
"""
```

**What inspired you to create async-graphql, and what has the response been like from the Rust community?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="""
As a Rust learner, I wanted to contribute something to the community. As I wasn't familiar with GraphQL at the time, I did some research and decided to develop the **async-graphql** project, also to learn GraphQL.

During development, I referenced the more complete GraphQL library at the time, **Juniper**, but it didn't support Rust's asynchronous features. So my goal became to implement all the features provided by **Juniper** and add asynchronous support to provide a better user experience.

About a month later, I released the first version of **async-graphql** and have been maintaining and improving it ever since. As it is the only library that supports asynchronous, many people have migrated from **Juniper** to **async-graphql**, which I believe is a very important point.

Although the first version of the code was not perfect, it still worked properly. Therefore, I received a lot of feedback, which helped me better understand Rust and GraphQL and provided many suggestions for improving **async-graphql**. Some even provided PRs to rewrite parts of the code, which greatly improved my skills and made me more aware of how to contribute to the open-source community.
"""
```

# Poem

```urlpreview
https://github.com/poem-web/poem
```

**Can you tell us about Poem and its design philosophy?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="""
I wanted a web framework that may not have the best performance, but would be relatively simple to use, which is why I made it.

**Poem** was named by `@HandongZhang`, a friend in the Rust community. It is definitely a good name. He transferred this crate to me for free, hoping that using this library can really be like writing poem.
"""
```

**What inspired you to develop another web framework, and how does Poem differ from other Rust web frameworks?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="""
Rust has many high-quality web frameworks, some of which are better than **Poem**. However, for me personally, **Poem** is very important because it's mine and I can freely modify it, which makes me more free during the development process.

Over time, I wanted to add more features and capabilities to **Poem**, so I started learning the OpenAPI specification and created a sub-project called [poem-openapi](https://github.com/poem-web/poem/tree/master/poem-openapi). Using Rust's procedural macros to automatically generate API documentation that conforms to the OpenAPI specification, similar to the popular [FastAPI](https://github.com/tiangolo/fastapi) library in Python. This greatly improved the efficiency of the development process.
"""
```

**Can you share any exciting upcoming features or plans for Poem?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="There is no plan currently as the functionalities provided by **Poem** are already sufficient for my needs."
```

# Open-source

**What are the most challenging aspects of maintaining two popular open-source projects like async-graphql and Poem?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="""
I didn't expect these two libraries to have so many users. In the early days, I would receive around 10 issue reports from users around the world every day, which required me to work for more than 12 hours a day. Although it was very hard, as time went by, I saw that the number of users of these libraries was increasing, and I felt that it was all worth it. In fact, this was my first attempt at an open-source project, so I learned a lot during this process, such as how to collaborate with other developers using Github and how to better manage and solve problems.
"""
```

**How do you balance maintaining these projects with other commitments?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="Balancing maintaining projects with other commitments can be difficult and definitely requires more time."
```

# End question

**Are there any other hobbies or interests that you have, and how do you balance them with your work on Rust projects?**

```quote
avatar="/static/avatar/sunli.jpeg"
author="Sunli"
content="""
I only have two hobbies, one is programming and the other is playing games. When I feel tired, I will spend some time playing games to relax my mind and body. This is also the secret to my long-term work efficiency. In this way, I can get rest and entertainment, so that I can better focus on my programming projects.

**I am fortunate to have the support of my family, especially my wife, who always encourages me to do things that make me happy. This support gives me more confidence to continue doing what I love, and I feel very lucky and grateful for it.**
"""
```

[sunli]: https://github.com/sunli829
[async-graphql]: https://github.com/async-graphql/async-graphql
[poem]: https://github.com/poem-web/poem
