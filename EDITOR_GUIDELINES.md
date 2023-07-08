# Editor Guidelines for Rust Magazine

As an editor for Rust Magazine, you play a critical role in shaping the content and direction of this publication. The goal of this document is to provide you with a clear understanding of the principles, responsibilities, and expectations of your role, as well as the procedures for joining or exiting the editorial team.

## Principle

The Rust Magazine editorial team is committed to the following principles:

- Providing accurate, informative, and engaging content that serves the Rust community
- Encouraging diversity and inclusiveness in our content and authors
- Ensuring that all content is of high quality and adheres to editorial standards
- Promoting the growth and advancement of the Rust programming language

## Responsibilities

As an editor for Rust Magazine, your responsibilities will include:

- Call for articles from the community for each issue
- Writing articles for the issue if you have an idea
- Reviewing and editing articles submitted by authors
- Assisting authors with improving the quality and clarity of their content
- Ensuring as far as reasonably possible that all articles are accurate, informative, and engaging
- Collaborating with other editors and the Rust Magazine team to plan and execute editorial initiatives
- Promoting Rust Magazine and its content on social media and other channels (prefer)
- Staying up-to-date with the Rust community (prefer)

## Joining

If you are interested in joining the Rust Magazine editorial team, please fill this [Google form](https://xxx) with the following information:

- Your name and brief background in Rust programming
- Your experience and qualifications as an editor
- Your availability and time commitment (optional)

## Exit

In the event that you need to step down from your role as an editor for Rust Magazine, we understand that life circumstances can change. We kindly request that you inform us of your intentions by sending a PR to move your profile into the alumni section. After being inactive for more than **three months** as the editor, we will change you to the **Reviewer** role.

We are grateful for your contributions to Rust Magazine and would like to take this opportunity to thank you for your time and dedication to the publication. We wish you all the best in your future endeavors and hope that you will continue to be a part of the Rust community.

## How to maintain Rust Magazine

### Zine

Rust Magazine is powered by [zine], a user-friendly static site generator designed specifically for magazines. Familiarity with zine is a valuable asset in maintaining the magazine as it offers built-in code blocks, such as the `urlpreview` to display an OGP preview of a URL, and `quote` to highlight someone's sentence. This is a good use case for an interview article. The repository and accompanying [documentation](https://zineland.github.io/) are great resources for getting started with zine.

### Tracking issue

For each magazine issue, it is recommended to create a dedicated GitHub tracking issue, such as [#4]. This gives us a birds-eye view of the progress made in the current issue, and it can be closed after the latest issue has been published.

### Topic

Each article can have zero, one, or several topics. Each topic should be declared in the root `zine.toml` in advance. As editors, we should provide a description of the topic and help the authors categorize their articles.

### Article

- **path**

We prefer to maintain control over article paths and do not generally allow authors to set their own `path` in the article metadata. This helps to keep the article paths organized under the issue slug.

```toml
[[article]]
path = "/cool-article"
file = "cool-article.md"
...
```

For example, the article above will render to `https://rustmagazine.org/cool-article` instead of `https://rustmagazine.org/issue-1/cool-article`. We should request the author to remove the `path` property.

In some significant circumstances, such as the announcing article: `https://rustmagazine.org/announcing/`, customizing the path may be permitted.

```toml
[[article]]
path = "/announcing"
file = "announcing.md"
title = "Announcing Rust Magazine"
author = "rust-magazine"
topic = ["announcement"]
...
```

- **canonical**

When articles are reposted from their original source, it is important to include a `canonical` property to help prevent duplicate content issues for search engines.

```toml
[[article]]
file = "hidden-control-flow.md"
title = "The Hidden Control Flow — Some Insights on an Async Cancellation Problem in Rust"
canonical = "https://greptime.com/blogs/2023-01-12-hidden-control-flow.html"
...
```

> For more information, please refer to the [Canonical link element
> ](https://en.wikipedia.org/wiki/Canonical_link_element) on Wikipedia.

### Issue publishing

Before publishing an issue, all articles should have `publish = false` set in their metadata. A dedicated PR can be submitted to publish all articles at once, as seen in [#31]. After the issue has been published, a git tag (such as the [`issue-1` tag]) should be created for the last commit of the issue.

> Pro Tip: It's not uncommon to receive typo-fixing PRs a few days after an issue has been published, so waiting a day or two before creating a tag may be a good strategy to catch any last minute updates.

[zine]: https://github.com/zineland/zine
[#4]: https://github.com/RustMagazine/rustmagazine/issue/4/
[#31]: https://github.com/RustMagazine/rustmagazine/pull/31/
[`issue-1` tag]: https://github.com/RustMagazine/rustmagazine/releases/tag/issue-1
