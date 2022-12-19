# How to contribute?

## Install zine

```
cargo install zine
```

## Clone the magazine

```
$ git clone https://github.com/rustmagazine/rustmagazine.github.io

$ cd rustmagazine

$ zine serve
listening on http://127.0.0.1:3000
```

## Add your article

```
$ tree content/issue-1 
content/issue-1
├── announcing-zh.md
├── announcing.md
└── zine.toml

0 directories, 3 files
```

Add your markdown file to `content/issue-1` directory.

## Update zine.toml

```toml
[[article]]
path = "/your-article-path"
file = "your-article.md"
title = "Your article title"
author = "your-name"
topic = ["optional-topic"]
pub_date = "2022-12-10"
publish = true
featured = true
```

## Add author

If you are the first time contributing to the magazine, you also should add your profile into the `[authors]` section of the root `zine.toml` file.

```diff
[authors]
rust-magazine = { name = "The Editor Team", editor = true, bio = "The magazine editor team" }
+ yourname = {}
```

Finally, `git commit`, `git push` and submit your PR!