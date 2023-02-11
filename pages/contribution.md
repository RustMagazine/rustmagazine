# How to contribute?

## Install zine

```
cargo install zine
```

## Clone the magazine

```
$ git clone https://github.com/rustmagazine/rustmagazine

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

Add your markdown file to the `content/issue-1` directory.

## Update zine.toml

```toml
[[article]]
path = "/your-article-path"
file = "your-article.md"
title = "Your article title"
author = "Your-name"
topic = ["optional-topic"]
pub_date = "e.g. 2022-12-10"
publish = true
featured = true
```

## Add author

If this is your first time contributing to the magazine, you should also add your profile to the `[authors]` section of the root `zine.toml` file.

```diff
[authors]
rust-magazine = { name = "The Editorial Team", editor = true, bio = "The magazine editorial team" }
+ yourname = {}
```

Finally, run `git commit`, `git push`, and submit your PR!