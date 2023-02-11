# Preface

The year 2022 marks seven years since the stable version of the Rust language was officially released. Since its release, Rust has been popular among developers. In a Stack Overflow poll of over 73,000 developers from 180 countries, Rust was voted the most popular programming language for the seventh consecutive year, with 87% of developers expressing a desire to use it.

2022 also marks the second year of the existence of the [Rust Foundation](https://foundation.rust-lang.org), which was founded on February 9, 2021. At its inception, there were only five founding platinum members: Mozilla, Amazon, Huawei, Google, and Microsoft. Today, in December 2022, the Rust Foundation has 39 headline companies from various industries as members, working towards the implementation of Rust in their respective domains.

The number of Rust developers continues to grow, including both startups building products from scratch and established companies looking to improve their operations. According to a report by developer research and analysis company SlashData, titled "[The 22nd State of the Developer Nation](https://www.slashdata.co/free-resources/state-of-the-developer-nation-22nd-edition)," the number of Rust users increased from 600,000 to 2.2 million from Q1 2020 to Q1 2022. Additionally, the [TIOBE](https://www.tiobe.com/tiobe-index/) programming language list for November 2022 ranked Rust in the top 20.

It can be safely concluded that 2022 was a year of widespread adoption for the Rust language. In this article, let's examine the state of Rust adoption in business.

# How Rust is adopted by Rust Foundation members

> The Rust Foundation members, particularly the Platinum members, are adopting Rust by investing in its sustainability. They believe that Rust should be used to create sustainable and energy-efficient solutions that are also safe. This investment supports the long-term viability of the language.

## Platinum Members Embrace Rust

At AWS, Rust has quickly become a crucial tool for building large-scale infrastructure at AWS. In 2018, the open-source virtualization technology [Firecracker](https://firecracker-microvm.github.io/) was publicly released, and it powers [AWS Lambda](https://aws.amazon.com/lambda/) and other serverless products. AWS uses Rust to provide services such as [Amazon Simple Storage Service](https://aws.amazon.com/s3/) (Amazon S3), [Amazon Elastic Compute Cloud](https://aws.amazon.com/ec2) (Amazon EC2), [Amazon CloudFront](https://aws.amazon.com/cloudfront/), among others. In 2020, [Bottlerocket](https://aws.amazon.com/bottlerocket/), a Linux-based container operating system written in Rust, was launched. The Amazon EC2 team has also adopted Rust as the preferred language for developing new [AWS Nitro System](https://aws.amazon.com/ec2/nitro/) components, including sensitive applications like [Nitro Enclaves](https://aws.amazon.com/blogs/aws/aws-nitro-enclaves-isolated-ec2-environments-to-process-confidential-data/) for secure and isolated EC2 environments that handle confidential data.

Furthermore, over the past year, [Amazon Prime Video has leveraged WASM and egui](https://www.amazon.science/blog/how-prime-video-updates-its-app-for-more-than-8-000-device-types) to enhance its application and deliver content to millions of customers across 8,000+ device types, such as game consoles, TVs, set-top boxes, and streaming media. The investment in Rust and WebAssembly has paid off with 37,000 lines of Rust code written during a year of development, resulting in improved performance, stability, reduced CPU consumption, and lower memory usage."

Google has applied Rust to [Chromium](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/rust-toolchain.md), [Android](https://source.android.com/docs/setup/build/rust/building-rust-modules/overview), and Fuchsia OS, with Chromium's support for Rust being experimental. Developers can use Rust to develop components for Android and [Fuchsia OS](https://fuchsia.dev/fuchsia-src/development/languages/rust), and Rust is used in a significant proportion of the internal code of Android and Fuchsia OS, particularly with Fuchsia OS where the Rust code has surpassed 50%. Due to its large amount of internal Cpp code, Google has worked with Meta (formerly Facebook) to adopt [cxx](https://cxx.rs/) for secure interaction with Cpp. In October of this year, Google introduced a new secure operating system called KataOS based on the open-source RISC-V chip. [Sparrow ](https://github.com/AmbiML/sparrow-manifest) is the reference implementation of KataOS and runs on [seL4](https://github.com/seL4), almost entirely written in Rust. The operating system is not designed for desktop computers or smartphones, but rather for the Internet of Things and may be used for smart home devices. The goal is to build a verifiable [secure operating systems](https://www.analyticsinsight.net/significance-of-cloud-security-how-businesses-can-enjoy-its-benefits-2/) for embedded hardware or edge devices, such as network-connected cameras that capture images that are processed on the device or in the cloud for machine learning. In the latest released version of Android 13, Google also announced that approximately 21% of the new native code (C/C++/Rust) in [Android version 13](https://security.googleblog.com/2022/12/memory-safe-languages-in-android-13.html) is Rust. The AOSP has about 1.5 million lines of Rust code, covering new features and components. Additionally, so far, zero memory safety vulnerabilities have been found in Android's Rust code. In order to achieve the goal of increasing security, stability, and quality within Android, the Android team says that Rust should be used anywhere in the codebase where native code is needed.

Huawei aims to drive the evolution of communication system software towards being secure and trustworthy, and the Rust language plays a significant role in this pursuit. The company plans to migrate some of its C/C++ code to enhance performance and security simultaneously. To support this process, Huawei provides developers with automated tools, such as the open-source C2Rust translation tool, which first generates Rust code from C code and then automatically refactors it using source-to-source transformation tools. Huawei has also made several important contributions to the Rust community, such as code submissions for the Rust compiler that allow for the support of the ARM AArch64 32-bit big-end variant [ILP32](https://developer.arm.com/documentation/dai0490/latest/) chipset used in Huawei's communication products, enabling Huawei and its partners to run Rust native programs on these common network hardware architectures. The contributions have been submitted to the [LLVM compiler](https://reviews.llvm.org/rG21bfd068b32ece1c6fbc912208e7cd1782a8c3fc), [libc library](https://github.com/rust-lang/libc/pull/2039), libc library, and [Rust compiler](https://github.com/rust-lang/rust/pull/81455) by Huawei's Rust expert Amanieu d'Antras. Huawei engineer [YuanLi has also made numerous contributions to Rust](https://github.com/rust-lang/rust/pulls?q=is%3Apr+author%3ASparrowLii), including fixing program bugs, optimizing the compiler's parallel compilation efficiency, and [leading the Rust Compiler Parallel Compilation Working Group](https://hackmd.io/@TKyxIWXBRqyDPLDPcP0qfg/parallel_rustc_mcp) in 2022 to contribute to accelerating parallel compilation of the Rust compiler.

In 2016, Meta (formerly Facebook) adopted Rust as its "new secure programming language for blockchain," utilizing it for the Diem (formerly Libra) stablecoin blockchain, the Mononoke source control server, and as the primary language for Meta. This was a significant decision, as most of Meta's backend code was written in C++. However, after the perceived success of Mononoke, the adoption of Rust gained momentum, attracting engineers with backgrounds in Python and JavaScript. Today, [Rust is a major supported server-side language](https://engineering.fb.com/2022/07/27/developer-tools/programming-languages-endorsed-for-server-side-use-at-meta/) alongside Hack, C++, and Python, and Meta recommends it for writing CLI tools and performance-sensitive backend services. To further support its use, Meta created an internal boot camp for Rust engineers and made a significant contribution to the Rust ecosystem with [cxx](https://cxx.rs/) for secure interaction between Rust and Cpp.

Microsoft has one of the largest collections of code in the world that is written in C/C++, which is used in all its core products such as Windows, Office, and Azure cloud. In 2019, Microsoft started exploring memory-safe programming languages and introduced Rust as a trial. The [Rust for Windows library](https://github.com/microsoft/windows-rs/releases) was then open-sourced on GitHub, allowing Rust developers to work smoothly with the Windows API.

In 2022, Mark Russinovich, the CTO of [Microsoft Azure](https://www.analyticsinsight.net/microsofts-azure-cloud-is-going-to-space-with-this-expansion/), stated that C and [C++](https://www.analyticsinsight.net/why-every-programmer-should-learn-c-c-during-their-careers/) should no longer be used for new projects. He suggested that Rust should be used for projects that require a non-GC language for improved safety and reliability. He made this statement on Twitter as his personal opinion and not as a new Microsoft policy.

In September 2022, [JFrog](https://jfrog.com/) became a Platinum Member of the Rust Foundation. As a DevOps platform provider, JFrog supports multiple major programming languages and aims to identify and eliminate security threats to the Rust platform and ecosystem, as well as fixing platform issues to prevent further risk. With the growing cybersecurity threats from the Internet of Things (IoT), cloud computing, and big data, the use of Rust programming language has tripled to 2.2 million developers in the last two years.

## Gold Members Embrace Rust

[Shopify](https://shopify.engineering/shopify-rust-systems-programming), a Canadian multinational e-commerce company, joined the Rust Foundation as a Gold member in December 2022. The company has been using the Ruby language for server-side programming, but since 2021, Shopify has been using Rust to develop [YJIT, a new CRuby Instant (JIT) compiler](https://shopify.engineering/yjit-just-in-time-compiler-cruby) that was merged into Ruby 3.1. In a [performance test](https://speed.yjit.org/), YJIT outperformed CRuby by 38%. Shopify has also decided to adopt Rust as the company's system programming language for high-performance web servers due to **its consistency, performance, community ecology, productivity, security, and interoperability**.

## Silver Members and General Sponsors Embrace Rust

The Rust Foundation's Silver membership has expanded to include 28 companies from a range of industries. Additionally, there are three non-member general sponsors, whose adoption of Rust will be discussed in the "How the Industry Adopted Rust" section of the article.

# How startups adopt Rust

2022 can also be considered a year of growth for Rust startups. This year, several startups based on Rust technology have received substantial funding.

## Fermyon

[Fermyon Technologies](https://www.fermyon.com/) was one of the first Rust startups to experience success in 2022. In October, the company [announced](https://www.forbes.com/sites/justinwarren/2022/10/24/webassembly-pioneer-fermyon-raises-20-million-series-a-releases-fermyon-cloud/?sh=6dbc1d6031bb) that it had received $20 million in Series A funding and launched the Fermyon Cloud platform. Fermyon Cloud is designed to simplify the deployment of [WebAssembly-based applications and microservices](https://pivotnine.com/2022/07/08/fermyon-revolution-microservices-wasm/). With Fermyon's [Spin](https://github.com/fermyon/spin) build tool, based on a Rust implementation, developers can compile and package applications for WebAssembly, and then deploy them to Fermyon Cloud. This eliminates the need for developers to have knowledge of the underlying infrastructure, as Fermyon's toolchain handles all configuration and deployment steps.

WebAssembly is optimized for security and low resource consumption, and by bringing it into the server environment, applications can enjoy the same benefits while being deployed to various environments using a common codebase. Fermyon aims to provide a solution similar to Java's "write once, run anywhere" with the ease of use of Heroku. This reduces friction in application development by eliminating the need for developers to worry about infrastructure.

Fermyon's CEO, Matt Butcher, stated that with Fermyon Spin and Fermyon Cloud, developers can create and deploy applications in less than two minutes, fulfilling the promise of rapid development, deployment, and execution in the cloud through WebAssembly.

## Warp

[Warp](https://www.warp.dev/) is a new generation terminal emulator that aims to improve developer productivity. It has [received $23 million in funding](<(https://techcrunch.com/2022/04/05/warp-raises-23m-to-build-a-better-terminal/)>) and launched its public beta on April 5, 2022. Warp uses the Rust language and technology stack, including WebAssembly, to provide cross-platform support. The UI rendering is done using the GPU through the Metal API on MacOS, chosen due to the platform's popularity among developers and the availability of excellent debugging tools. The Rust GPU support is currently not perfect, so the team worked with Nathan Sobo to use a Flutter-inspired Rust UI framework, which will be open-sourced soon. In the future, more rendering backends will be supported. Although Warp is a commercial product and does not open source the entire code, it has contributed some tools and libraries to the open-source community.

## Database field startups

This year has seen an influx of startups in the database field.

In April 2022, Jon Gjengset, a well-known developer in the Rust community, was announced as a co-founder of [ReadySet, Inc.](https://readyset.io/). He aimed to bring his PhD thesis on Noria databases to life as ReadySet, a SQL caching engine for databases that helps developers build high-performance and real-time applications without having to change code or switch databases. Currently, the company is [raising $29 million in Series A funding](https://techcrunch.com/2022/04/05/readyset-raises-29m-to-expedite-access-to-enterprise-scale-app-data/).

In April 2022, [Singularity Data](https://36kr.com/project/1713086132758785)(Singularity Unlimited), a database startup that raised $10 million, announced the open source Rust implementation of its cloud-native SQL-enabled streaming database called RisingWave. Originally created in C++ in early 2021, the database was rewritten in Rust seven months later. This was a bold move for an early-stage startup, particularly in a competitive industry where time is a critical factor for technology startups.

## Streaming Service

[InfinyOn](https://infinyon.com), a real-time event streaming company, has raised $5 million in seed funding from investors including Gradient Ventures, Fly Ventures, Bessemer Venture Partners, and TSVC. The company uses Fluvio, a dynamic data programmability platform developed in Rust, which is growing in popularity among developers and the open source community.

According to Sehyo Chang, co-founder and CTO of InfinyOn, traditional data platforms built in the Java era are cumbersome, require a lot of memory, and are difficult to operate, making real-time decisions challenging. InfinyOn eliminates the need for ETL tools, providing a cost-effective and secure platform with up to 80 times less memory usage.

Chris Brucker, CEO of Nammu, mentions that InfinyOn makes it easier for teams to integrate healthcare data from multiple sources, such as IoT, patient input, and physician input. This is because InfinyOn is written in Rust, which makes it easier to integrate compared to other solutions such as Kafka.

Early adopters of InfinyOn are already seeing significant advantages over other solutions, including ease of use, faster development, and a lower total cost of ownership. Despite being in Beta, InfinyOn is already proving its worth in its proof-of-concept stage.

# How the industry adopted Rust

## Software Defined Vehicles: The Critical Role of Rust

In April, the automotive standards organization Autosar, whose members include major companies such as Ford, GM, BMW, Bosch, Volkswagen, Toyota, and Deliver, announced the formation of a new subgroup within its [working group](https://connexionplus.sae.org/communities/community-home/digestviewer/viewthread?GroupId=31&MessageKey=9e947f64-aefc-45cd-aee6-a787818af963&CommunityKey=c9c80476-9027-4edc-953c-65bda22ba7a7) on Functional Safety (WG-SAF) to explore the use of Rust in one of its reference platforms. SAE International has also established a working group to examine Rust for safety-related systems in the automotive industry. In May, Autosar and the Rust team held an [exchange](https://standardsworks.sae.org/standards-committees/safer-rust-task-force) to determine if Safe Rust could meet the requirements for use in the automotive space, specifically discussing the Ferrocene Rust safe subset.

> However, Autosar later withdrew their announcement of the new Rust working group , possibly due to the pending results of the Ferrocene Rust project. In September, Julius Gustavsson, a technologist and system architect at Volvo Cars, stated in an [interview](https://medium.com/volvo-cars-engineering/why-volvo-thinks-you-should-have-rust-in-your-car-4320bd639e09) that he is pushing for the development of Rust at Volvo.

### Ferrocene Rust Security Subset

[Ferrocene Systems](https://ferrous-systems.com/blog/ferrous-systems-adacore-joining-forces/) and [AdaCore](https://blog.adacore.com/adacore-and-ferrous-systems-joining-forces-to-support-rust) announced in February that they are partnering to develop Ferrocene, a security-compliant Rust toolchain designed to meet the needs of various regulated markets, such as automotive, avionics, space, and rail. This will involve certifying the Ferrocene Rust compiler to ASIL level D, the highest level of automotive hazard, according to various safety standards. It will also involve developing and qualifying the necessary dynamic and static analysis tools, language support (libcore), and other user libraries. The goal is to support Rust as comprehensively as any other programming language relevant to high-integrity application development, targeting various architectures and operating systems relevant to these markets. [The Ferrocene Language Specification](https://spec.ferrocene.dev/) is currently under development and is expected to be released by the end of the year.

### Others

Among the Silver members of the Rust Foundation is [ARM](https://www.arm.com/), which is also working to bring the use of Rust to software-defined vehicles.

## Instant Messaging: Threema

[Threema](https://threema.ch/en) is a cross-platform, privacy-secure and open source instant messaging tool.

## Password management tool: 1Password

[1Password](https://1password.com), a password management tool, adopted Rust early on to build its Windows client. In 2019, [the company ported its logic engine with browser extension support from Go to Rust](https://serokell.io/blog/rust-in-production-1password), marking the start of its cross-platform adoption of Rust. By November 2022, 1Password had also open-sourced its [Typeshare](https://github.com/1Password) library, which [helps developers generate consistent data types across multiple languages](https://blog.1password.com/typeshare-for-rust/) and facilitates secure cross-platform development.

## GUI : Targeting the QT market

The two partners of tQCS, a world-leading company in Qt consulting and UI/UX design services, have become Silver members of the Rust Foundation.

They are [KDAB](https://www.kdab.com/), with expertise in embedded systems, 3D graphics, and cross-platform development, They're working on [cxx-qt](https://github.com/KDAB/cxx-qt) to make using Qt and Rust together much easier. 

[Slint](https://slint-ui.com/), which simplifies GUI development for embedded platforms and supports various programming languages including Rust and JavaScript. Both companies are significant contributors to the Qt project, with Slint's founder being the main developer of the QtQml engine.

## Cloud storage: Dropbox

[Dropbox](https://dropbox.com) was one of the early adopters of Rust, utilizing it in the development of its file sync engine. The company has continued to innovate with Rust, using it in the development of [Dropbox Capture](https://www.dropbox.com/capture), a new visual communication tool designed to make it easier for teams to share their work through asynchronous methods such as screen recordings, video messages, screenshots, or GIFs.

## Edge Computing: Cloudflare

[Cloudflare](https://github.com/cloudflare) uses Rust in its core edge logic to replace memory-unsafe C language. Its Cloudflare Workers platform supports both Rust and WebAssembly. In September, the company also announced that it was using Rust to develop [Pingora](https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/), a proxy server that has the potential to replace Nginx.

## Walt Disney Company (Disney)

The Disney Company is using Rust to build its NCP GUI framework. This was concluded from a Disney [job posting](https://www.builtinnyc.com/job/engineer/lead-software-engineer/181881) and the company's 2021 release,["Introducing the Disney+ Application Development Kit (ADK)"](https://medium.com/disney-streaming/introducing-the-disney-application-development-kit-adk-ad85ca139073). The use of Rust in the development of the Native Client Platform v2 (NCPv2) framework, codenamed "m5", was primarily to target [WebAssembly](https://webassembly.org/) (WASM) for easier web deployment and application updatability. The project, which has been ongoing for nearly three years, has reached a point where the same rendering engine is used to render animations across all platforms, from handheld terminals to TVs, web pages, etc.

## Tesla

While [Elon Musk](https://twitter.com/elonmusk/status/1496293976692899843?lang=en) tweeted in February that he is a fan of the Rust language, he admitted that Tesla primarily uses C++ and Python. However, two job postings for Rust developers at Tesla, released in November, suggest that the company is starting to adopt Rust. The first is for the [Tesla Robotics Simulation Engine team](https://www.theladders.com/job/rust-or-c-developer-software-engineer-tesla-bot-simulations-tesla-palo-alto-ca_60305636), which is seeking Rust developers to enhance the high-performance robot simulation engine, which is already written in Rust. The second is for a [Rust Firmware Verification Engineer](https://www.tesla.com/careers/search/job/python-rust-c-firmware-validation-engineer-drive-systems-all-levels--98473), where having experience with Rust is preferred but not mandatory.

## Tweedegolf: with SpaceX Spacecraft

Rust is taking flight. [Gama](https://www.gamaspace.com/) Solar Sail is set to launch a solar sail spaceship, making it one of the companies that is publicly sending Rust into space. [Tweedegolf](https://tweedegolf.nl/en), a software services company and a Silver member of the Rust Foundation, is providing the necessary services for the launch. They have an [open source repository](https://github.com/tweedegolf) that includes a library of Rust implementations of the Precision Time Protocol (PTP), which is more accurate than NTP and is used in satellite time sources. Although it is a proof-of-concept implementation, it is unknown if it will be used on the spacecraft. The embedded development board PCF85063A rust driver, used for timing alarm clocks, suggests that the Rust program on board the satellite will likely be related to precise timing. [On January 3, 2023, the Gama Solar Sail satellite was successfully placed into orbit by a SpaceX Falcon 9 rocket](https://www.sail-world.com/news/257330/Gama-launches-its-Gama-Alpha-solar-sail-mission).

## Lightyear Solar Car Company Adopts Rust 

As revealed on [Tweedegolf's blog](https://tweedegolf.nl/nl/blog/76/pioneering-rust-high-tech), a software architect at Lightyear named Jorrit shared at a [High Tech Industry Rust gathering](https://hightechsoftwarecluster.nl/evenementen/rustmeetup/) organized by Tweedegolf how the company is using Rust in the development of its core platform. Due to privacy concerns, no video or PowerPoint of the presentation was made available to the public.

## File Data Storage: Qumulo

[Qumulo](https://qumulo.com), a leader in hybrid cloud file data management, has partnered with Western Digital to enable the Institute for Health Metrics and Evaluation (IHME) to process up to 2 petabytes of data per day. This is achieved by deploying the Qumulo scalable file data platform, which is based on Western Digital's Ultrastar high-capacity hard disk drives (HDDs) and high-performance solid-state drives (SSDs). This partnership is aimed at advancing public epidemiological research, statistics, and forecasting. Qumulo is also sponsoring the RustConf 2022 conference.

## Veteran database company: PostgreSQL

PostgreSQL sponsored the RustConf 2022 conference, but there is no evidence of them using Rust within the company. However, there is a GitHub project called [pgx](https://github.com/tcdi/pgx), which is dedicated to writing PostgreSQL extensions using Rust. The core developer [Ana's blog](https://hoverbear.org/tags/postgresql/) also features numerous articles about it.

## Enterprise Data Analytics: Redjack

[Redjack](https://www.redjack.com) claims technology from the U.S. National Intelligence Agency that monitors and protects more than 8% of the Internet's public IP space and more than 100 trillion business communications each year, increasing actionable data that enables organizations to improve the speed and accuracy of analysis for the security and resilience of large-scale operations. Redjack is also sponsoring the RustConf 2022 conference, so it is likely that the company will also adopt Rust.

## Data Science & AI

Rust Foundation Silver members also include companies in the data science and AI sector, such as [Watchful](https://www.watchful.io/). Watchful tags data for AI at a speed and scale that traditional tagging solutions can't match.

## Automotive IoT

[Wyliodrin](https://wyliodrin.com/) protects devices and builds secure and efficient systems using Rust, [Tock OS](https://github.com/tock/tock), and Android. They launched the Rust-based embedded real-time operating system Tock OS into commercial applications, and the company has joined the Rust Foundation as a Silver member.

## Messaging Push Service Provider: OneSignal

[OneSignal](https://onesignal.com), a messaging push provider, has been using Rust since 2017 to support push notifications, email, SMS, and in-app self-service customer engagement solutions. The company provides a Rust Client for these services.

## Automated Freight Trains: Parallel Systems

[Parallel Systems](https://moveparallel.com), a company that develops zero-emission automated electric freight trains, believes that the future of freight transportation lies in rail. To support this vision, the company has built its technology stack using the Rust language. As a sponsor of the RustConf 2022 conference, Parallel Systems is further demonstrating its commitment to the use of Rust in its operations.

## Rust Development Tools, Platforms and Toolchain Support

Good development tools that are implemented in Rust include:

- [tabnine](https://www.tabnine.com/), a machine learning-based code autocompletion tool.
- [Open Source Security](https://opensrcsec.com/), a member of the Rust Foundation as a Silver member, committed to promoting the Rust ecosystem, and sponsoring the GCC Rust implementation. The GCC Rust front ends are expected to be [merged in GCC 13](https://www.phoronix.com/news/GCC-Rust-v4-Cleared-For-Landing) by December 2022.
- [Embecosm](https://www.embecosm.com/), a provider of open-source software toolchain and embedded operating system services, and a sponsor of the GCC Rust front end.
- [Grafbase](https://grafbase.com/), a platform for building and deploying GraphQL backends.
- [Rust for Linux](https://github.com/Rust-for-Linux), which was [merged with the Linux 6.1 kernel release](https://www.phoronix.com/news/Rust-Is-Merged-Linux-6.1), laying the foundation for future kernel drivers and code written in the Rust language. It is expected that the first major users of Rust in the Linux kernel will be the DRM drivers for Apple M1/M2 graphics.

## Security Monitoring

This area currently includes the following companies among the Rust Foundation Silver members.

- [Spectralops](https://spectralops.io/) is a company that monitors, classifies, and protects code, assets, and infrastructure from exposed API keys, tokens, credentials, and high-risk security misconfigurations. They are a Rust Foundation Silver member.
- [Sentry](https://sentry.io/welcome/) is an application monitoring platform and is also a Rust Foundation Silver member.

## Software Consulting

These consulting firms specialize in providing professional services and support for organizations using the Rust programming language, including software development, training, and consulting services. They have a deep understanding of Rust and its ecosystem and can help organizations leverage the language to build robust and efficient software solutions.

- [knoldus ](https://www.knoldus.com/)
- [Ferrous Systems ](https://ferrous-systems.com/blog/ferrous-systems-adacore-joining-forces/)
- [mainmatter](https://mainmatter.com/)
- [Tag1](https://www.tag1consulting.com/)

## Games with Rendering Engines

Rust is still being developed for the gaming industry. Activision Blizzard, a game company, joined the Rust Foundation as a general sponsor and released a research report, ["Programming Language for Game Tools"](https://www.activision.com/cdn/research/The_Rust_Programming_Language_for_Game_Tooling.pdf) in 2021 by Treyarch, a studio within the company. Since 2018, Treyarch has been gradually incorporating Rust into their tools and pipeline.

Another noteworthy game company is [Embark](https://www.embark-studios.com/), which sponsors the Rust game engines [Bevy](https://github.com/bevyengine/bevy) and [Fyrox](https://github.com/FyroxEngine/Fyrox) and has open-sourced rust-gpu, which aims to make Rust the leading language and ecosystem for GPU shaders.

## E-commerce

Rust is being increasingly used in the e-commerce industry. The open-source project [Tremor](https://github.com/tremor-rs/tremor-runtime), which is owned by the US furniture e-commerce company Wayfair, has been accepted into the Cloud Native Computing Foundation (CNCF). Tremor processes a massive 10 terabytes of data per day and 10 billion messages per minute, [making it a cost-effective solution for Wayfair](https://www.tremor.rs/slides/2020-03-31-RustAndTellBerlin-functions.pdf) .

Another company, [CarGurus](https://www.cargurus.com/), a UK-based used car e-commerce site, has also joined the Rust Foundation as a General Sponsor member.

## Web3 and Blockchain

Rust has become a widely used language in the Web3 and blockchain space, with many companies and projects adopting it. Some notable examples include [Diem](https://github.com/diem/diem), which was once Facebook's stablecoin project and is now owned by Silvergate Capital Corporation, and new public chains [aptoslabs](https://aptoslabs.com/) and [sui](https://sui.io/), which both use the Rust-implemented Move language as their smart contract language. Other Rust Foundation Silver members in this space include [parastate](https://www.parastate.io/), a multi-chain smart contract platform in the Polka Ecosystem, [Zama](https://www.zama.ai/), building homomorphic cryptography solutions for data science and AI, [Keyrock](https://keyrock.eu/), deploying market-making technology for digital assets, [matter-labs](https://matter-labs.io/), extending Ether Zero Knowledge Proof, and [TECHFUND](https://techfund.jp/en), a Japanese blockchain technology incubator.

# Summary

Rust is a versatile programming language that has a diverse range of applications across various domains. This article highlights some of the successful applications of Rust in different fields, but it is not exhaustive and there are many more organizations using Rust in ways that are not visible. Additionally, the adoption of Rust in China is slower, but there are companies in China that are gradually adopting it.

> It is worth noting that there is [a global list of Rust-using companies](https://github.com/omarabid/rust-companies) maintained by others on GitHub, which provides a more comprehensive view of Rust's reach.

Rust is like a gentle rain that permeates quietly and steadily.

Thank you for reading this article.
