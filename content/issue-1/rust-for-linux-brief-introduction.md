Rust is popular among programmers for a quite long time. It won the favorite programming language on Stackoverflow in the last several years. Rust language community is active and more and more tools are built with Rust, such as block chains and databases. Even some OSes are built with Rust, though most of them are prototypes for education or demos. Of course besides these toy OSes, Rust is used to build real world OS, Linux.

```urlpreview
https://github.com/Rust-for-Linux/linux
```

[Rust for Linux], short for **r4l** later, is announced in 2020, which try to reduce the number of bugs in Linux with the help of Rust. After two years of development, **r4l** is accepted by the Linux community, got [merged in Linux 6.1](https://lkml.org/lkml/2022/12/11/206).


# Rust for Linux Definition

Before diving into **r4l**, we must answer the question "What's is Rust for Linux". It's not about rewriting Linux with Rust or translating all the drivers in Linux from C to Rust. **r4l** is just a tool, helping kernel developers use Rust in Linux. Though **r4l** contains some drivers, they are demos for teaching Rust driver development.

Here we list the main components of the **r4l** project:

- Bindings of kernel functions and data structures, which are automatic generated.
- Memory management module.
- High level abstraction of data structures and interfaces.
- Macro definition.
- Sample code.
- Modified Makefile

# Get Hands Dirty

It's time to get our hands dirty. Let's write a Rust kernel module and analyze it.

## Compile

You can download the Linux kernel code from [torvalds/linux](https://github.com/torvalds/linux), usually it's a `git clone`. Rust compiler is a little different from what we use daily. The project depends on some nightly features of the compiler so that a specific version is required. Let's follow the instruction in the file [Documentation/rust/quick-start.rst](https://github.com/torvalds/linux/blob/master/Documentation/rust/quick-start.rst), in which the way to turn on the Rust functions is also covered. Then we can compile the kernel as usual.

## Linux kernel module in C

Let's take a look of a C kernel module, which is shown below:

```c
static struct file_operations fops = {
    .read = device_read,
    .write = device_write,
    .open = device_open,
    .release = device_release
};

/*
 * This function is called when the module is loaded
 */
int init_module(void)
{
    Major = register_chrdev(0, DEVICE_NAME, &fops);

    if (Major <0) {
        printk (KERN_ALERT "Registering char device failed with%d\n", Major);
        return Major;
    }

    printk(KERN_INFO "I was assigned major number %d. To taalk to\n", Major);
    printk(KERN_INFO "the driver, create a dev file with\n");
    printk(KERN_INFO " mknod/dev/%s c%d 0'. N", DEVICE NAME, Major);
    printk(KERN_INFO "Try various minor numbers. Try to cat and echo to\n");
    printk(KERN INFO "the device file. \n");
    printk(KERN_INFO "Remove the device file and module when done. \n");

    return SUCCESS;
}

/*
 * This function is called when the module is unloadled
 */
void cleanup_module(void)
{
    /*
     * Unregister the device
     */
    int ret = unregister_chrdev(Major, DEVICE_NAME);
    if (ret < 0)
        printk(KERN_ALERT "Error in unregister_chrdev: %d\n", ret);
}
```

The whole module consists of three parts, call back functions definition, module initialization and module destruction.

## Linux kernel module in Rust

Now let's take a look of a Rust kernel module:

```rust
module! {
    type: RustChrdev,
    name: b"rust_chrdev",
    author: b"Rust for Linux Contributors",
    description: b"Rust character device sample",
    license: b"GPL",
}

struct RustFile;

#[vtable]
impl file::Operations for RustFile {
    fn open(_shared: &(), _file: &file::File) -> Result {
        Ok(())
    }
}

struct RustChrdev {
    _dev: Pin<Box<chrdev::Registration<2>>>,
}

impl kernel::Module for RustChrdev {
    fn init(name: &'static CStr, module: &'static ThisModule) -> Result<Self> {
        pr_info!("Rust character device sample (init)\n");

        let mut chrdev_reg = chrdev::Registration::new_pinned(name, 0, module)?;

        // Register the same kind of device twice, we'ree just demonstrating
        // that you can use multiple minors. There anre two minors in this case
        // because its type is `chrdev::Registration<2>`
        chrdev_reg.as_mut().register::<RustFile>()?;
        chrdev_reg.as_mut().register::<RustFile>()?;

        Ok(RustChrdev { _dev: chrdev_reg })
    }
}

impl Drop for RustChrdev {
    fn drop(&mut self) {
        pr_info!("Rust character device sample (exit)\n");
    }
}
```

It's easy to tell that these two versions are very similar, so migrating a driver from C to Rust should not be too hard. Let's dive into the code behind the kernel, we'll find out how they help simplify the module build.

# Rust for Linux Deep Dive

First let's talk about the macro used in the first few lines `module`. That macro seems simple and only declare some property of the module. If we jump to the definition of the macro, we'll find some interesting work there, such as C language interface and some utilities to initialize and destroy the module from C code, which is shown below.

```rust
#[cfg(not(MODULE))]
#[doc(hidden)]
#[no_mangle]
pub extern "C" fn __{name}_init() -> core::ffi::c_int {{
    __init()
}}

#[cfg(not(MODULE))]
#[doc(hidden)]
#[no_mangle]
pub extern "C" fn __{name}_exit() {
    __exit()
}}

fn __init() -> core::ffi::c_int {{
    match <{type_} as kernel::Module>::init(kernel::c_str!("{name}"), &THIS_MODULE) {{
        Ok(m) => {{
            unsafe {{
                __MOD = Some(m);
            }}
            return 0;
        }}
        Err(e) => {{
            return e.to_kernel_errno();
        }}
    }}
}}

fn __exit() {{
    unsafe {{
        // Invokes `drop()` on `__MOD`, which should be used for cleanup.
        __MOD = None;
    }}
}}
```

Then there's another macro named `vtable`. How does it work? It add a bool constant for each function like `HAS_XXX`. If function `A` is defined, `HAS_A` is true, otherwise it's false. The caller can tell if the function is defined by checking these constants. Besides that `vtable` also generate some FFI part, which is called by the C code.

In this example, it's not hard to find out that **r4l** is kind of "glue", building a bridge between Rust and C. It make the module developers focus on the functionality instead of the language related dirty work.

# Summary

Rust for Linux is a utility project to help write Linux kernel module in Rust. By using it, the developers write the pure Rust code dealing with the module's function instead of handling the gap between C and Rust. Though the project is in the early stage, many important components are still missing, we believe they'll be ready in the near future with the help of the whole community.

[rust for linux]: https://github.com/Rust-for-Linux/linux
