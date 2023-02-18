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
# Define the name of the GitHub Action.
name: "Build distributions for major OS"

# Trigger the action when there is a push to the repository.
on: push

# Define the job to be executed.
jobs:
  build:
    # Use the specified OS in the matrix.
    runs-on: ${{ matrix.os }}

    # Set write permission to the default GitHub token.
    permissions:
      # Give the default GITHUB_TOKEN write permission to commit and push the
      # added or changed files to the repository.
      contents: write

    # Define the OS to be used in the build.
    strategy:
      matrix:
        os: ["ubuntu-latest", "macos-latest", "windows-latest"]

    # Define the sequence of steps to be executed in the job.
    steps:
      # Checkout the code repository.
      - name: "Checkout repository"
        uses: actions/checkout@v3

      # Install dependencies according to the current OS.
      - name: "Install dependencies"
        run: |
          if [ "$RUNNER_OS" = "Linux" ]; then
            echo "Building for Linux."
            sudo apt update
            sudo apt install -y libxcb-shape0-dev libxcb-xfixes0-dev
          elif [ "$RUNNER_OS" = "Windows" ]; then
            echo "Building for Windows."
            # choco install -y xcb-shape xcb-util-wm
          elif [ "$RUNNER_OS" = "macOS" ]; then
            echo "Building for macOS."
          else
            echo "OS $RUNNER_OS not supported."
          fi
        shell: "bash"

      # Build the application.
      - name: "Build application"
        run: |
          export CARGO_TARGET_DIR=dist/${{ matrix.os }}
          cargo build --verbose --release
        shell: "bash"

      # Commit the built application to the repository.
      - name: "Commit builds"
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "Generate distributable builds for Linux, macOS, and Windows."
          file_pattern: "dist/${{ matrix.os }}/release/gptc"

      # Create a pull request to merge the built application.
      - name: "Open pull request"
        uses: peter-evans/create-pull-request@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "Autogenerated builds for Linux, macOS, and Windows."
          title: "Build gptc for all distros."
          body: "This pull request was generated from a Github Action and needs manual approval."
```

You’ll likely be encountering the following error an embarrassingly amount of times:

![Error in YAML syntax example](/static/issue-2/error-in-yaml-syntax.png)

When pasting the Workflow into your project, your code editor might replace empty space for tabs, and cause the YAML parser to complain. Just go to the YAML file, delete all empty space behind the line throwing the error, and click the space key until reaching the correct indent.

Checkout the Github repository if you have any questions…
