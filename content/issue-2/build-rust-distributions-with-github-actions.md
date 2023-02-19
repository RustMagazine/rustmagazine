Rust is a powerful systems programming language that has gained a lot of popularity in recent years due to its speed, safety, and reliability. One of the key advantages of Rust is its ability to compile to native code for a wide range of platforms, including Windows, Linux, and macOS. However, compiling Rust code for multiple operating systems can be a daunting task, especially if you're new to the language or the platforms you're targeting. That's where GitHub Actions comes in. In this post, we'll show you how to use GitHub Actions to build your Rust binary to multiple operating systems with ease, allowing you to distribute your application to a wider audience. We'll walk you through the process step-by-step, starting with setting up your Rust environment, configuring your GitHub Actions workflow, and testing your binary on different operating systems. Whether you're a seasoned Rust developer or just starting out, this guide will help you take your Rust projects to the next level.

## Setup project

We’ll set this up with the simplest example so we don’t get distracted with non-relevant stuff…

1. **Install Rust**: [Visit the Rust website](https://www.rust-lang.org/learn/get-started) and follow the installation instructions for your operating system. This will install Rust and Cargo, the Rust package manager.
2. **Create a new Rust binary project**: Open a terminal window and navigate to the directory where you want to create your project. Then, run the following command to create a new Rust binary project with Cargo:

```bash
cargo new hello_world --bin
```

This will create a new directory called **`hello_world`** with a basic Rust project structure and a **`main.rs`** file where you can start writing your code.

1. Write your Rust code: Open the **`main.rs`** file in your text editor of choice and start writing your Rust code. If you're new to Rust, you can find plenty of resources online to help you learn the language. Rust's official website has a great getting started guide, and there are many Rust tutorials and books available online.
2. Build your binary: Once you've written your Rust code, you can use Cargo to build your binary. Open a terminal window, navigate to your project directory, and run the following command:

```bash
cargo build --release
```

This will compile your Rust code into a binary file and place it in the **`target/release`** directory of your project.

1. Run your binary: To run your binary, navigate to the **`target/release`** directory in your terminal and run the binary file with the following command:

```bash
./hello_world
```

This will run your Rust binary and execute the code you've written.

Congratulations! You've just created and run your first Rust binary application. From here, you can continue to build on your project and explore the many features and benefits of the Rust programming language.

## Create .github/workflows/build.yml

[Add the following workflow to the file _.github/workflows/build.yml_](https://docs.github.com/en/actions/using-workflows/about-workflows) so GitHub Actions can parse it…

```yaml
# This YAML file builds and distributes a cross-platform application called YOUR_PROJECT using GitHub Actions.
name: "Build distributions for major OS"

# Specifies the trigger for the workflow.
on:
  push:
    branches:
      - main

# Defines the build and upload jobs for the YOUR_PROJECT application.
jobs:
  build_binaries:
    # Runs the job on the specified operating system using a matrix.
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        # Specifies the latest version of Windows to use for the build.
        os: ["ubuntu-latest", "macos-latest", "windows-latest"]
    steps:
      # Checks out the repository into main branch.
      - name: "Checkout repository"
        uses: actions/checkout@v3

      # Installs dependencies for the specified OS.
      - name: "Install dependencies"
        run: |
          if [ "$RUNNER_OS" = "Linux" ]; then
            echo "Building for Linux."
            sudo apt update
            # Do install these libraries.
            # They seem to be needed by the Rust compiler in Linux OS.
            sudo apt install -y libxcb-shape0-dev libxcb-xfixes0-dev
            # ...+ other relevant libs.
          elif [ "$RUNNER_OS" = "Windows" ]; then
            echo "Building for Windows."
            # choco install -y lib1, lib2 ...
          elif [ "$RUNNER_OS" = "macOS" ]; then
            echo "Building for macOS."
            # brew install ...?
          else
            echo "OS $RUNNER_OS not supported."
          fi
        shell: "bash"

      # Builds the application application.
      - name: "Build application"
        run: |
          cargo build --release --target-dir "dist/${{ matrix.os }}"
        shell: "bash"

      # Uploads the built binary to the artifact storage.
      - name: "Upload binary ${{ matrix.os }}"
        uses: actions/upload-artifact@master
        with:
          name: "YOUR_PROJECT-${{ matrix.os }}"
          # Also match Windows' `file.exe` pattern.
          path: |
            "dist/${{ matrix.os }}/release/gptc"
            "dist/${{ matrix.os }}/release/gptc.exe"

  # Defines the job to open a pull request after successful build and upload.
  open_pull_request:
    runs-on: ubuntu-latest
    needs: "build_binaries"

    # Grants write access to the repository content and pull requests.
    permissions:
      contents: write
      pull-requests: write

    steps:
      # Checks out the repository.
      - name: "Checkout repository"
        uses: actions/checkout@v3

      # Downloads the uploaded binary artifact from the previous build job.
      - name: "Download binaries"
        uses: actions/download-artifact@master

      # Commits the changes and opens a pull request.
      - name: "Commit changes and open pull request"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Sets the name and email of the user for committing the changes.
          # Found the `user.email` and `user.name` attributes to reference "Github Bot" in
          # Github's UI.
          # https://github.com/orgs/community/discussions/26560#discussioncomment-3531273
          # https://api.github.com/users/github-actions%5Bbot%5D
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git config user.name "github-actions[bot]"
          # Rebases the pull request branch on the latest changes from the main branch.
          git fetch --all
          git rebase origin/main
          # Switches to a new branch for the pull request.
          PR_BRANCH="build-$GITHUB_REF_NAME-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
          git switch -c $PR_BRANCH
          # Adds the built binaries to the commit.
          git add YOUR_PROJECT*
          # Commits the changes with a message.
          git commit -m "Add binaries."
          # Pushes the commit to the pull request branch.
          git push -u origin $PR_BRANCH
          gh pr create -B main -t "[$GITHUB_REF_NAME]: Build YOUR_PROJECT for all distros." -b "This pull request was generated from a Github Action and needs manual approval."
```

You’ll likely be encountering the following error an embarrassingly amount of times:

![Error in YAML syntax example](/static/issue-2/error-in-yaml-syntax.png)

When pasting the Workflow into your project, your code editor might replace empty space for tabs, and cause the YAML parser to complain. Just go to the YAML file, delete all empty space behind the line throwing the error, and click the space key until reaching the correct indent.

Push the changes into your project and see the workflow triggered open a PR containing the binaries inside a `dist/` folder that you can point to with a curl once the changes are merged into `main`.

Checkout the Github repository if you have any questions…
