
#  2022 Review | The adoption of Rust in Business  
Author: Alex Zhang

## Table of Contents

- Preface
- How Rust is adopted by Rust Foundation members
- How startups adopt Rust
- How the industry adopted the Rust 
- Summary

## Preface

The year 2022 marks the seventh year since the official release of the stable version of the Rust language. Since its release, Rust has been popular with developers. In a Stackoverflow poll of more than 73,000 developers in 180 countries, Rust was voted the most popular programming language for the seventh year in a row, and 87% of developers want to use Rust.

2022 is also the second year since the [Rust Foundation](https://foundation.rust-lang.org) was founded. At the inception of the Rust Foundation on February 9, 2021, there were only five founding platinum members - Mozilla, Amazon, Huawei, Google, and Microsoft - and as of today (December 2022) there are 39 headline companies in various fields that are members of the [Rust Foundation](https://foundation.rust-lang. org/members/) to drive the implementation of Rust in their respective domains.

The number of Rust developers is also growing, ranging from startups using Rust to build products from scratch to long-established companies using Rust to improve production. According to a report published by SlashData, a developer research and analysis company, entitled "[The 22nd State of the Developer Nation](https://www.slashdata.co/free-resources/state-of-the-developer-nation-22nd- edition), which reports that from Q1 2020 to Q1 2022, the number of developers using the Rust language jumped from 600,000 to 2.2 million users. The [TIOBE](https://www.tiobe.com/tiobe-index/) programming language list for November 2022 has Rust in the top 20.

It is safe to say that 2022 is the year when the Rust language became widely used. In this article, let's take a look at the state of  the adoption of Rust in Business .

##  How Rust is adopted by Rust Foundation members

> Rust Foundation members investing in Rust, especially Platinum members, are investing in the sustainability of Rust, a language they believe should be used to build sustainable and safe energy-efficient solutions.


### How Platinum Members Adopted Rust 

At AWS, Rust has quickly become the key to building infrastructure at scale. [Firecracker](https://firecracker-microvm.github.io/), an open source virtualization technology that powers [AWS Lambda](https://aws.amazon.com/lambda/) and other serverless products, was released publicly in 2018. AWS uses Rust to deliver [Amazon Simple Storage Service](https://aws.amazon.com/s3/) (Amazon S3), [Amazon Elastic Compute Cloud](https://aws.amazon .com/ec2) (Amazon EC2), [Amazon CloudFront](https://aws.amazon.com/cloudfront/), and other services. 2020 saw the launch of [Bottlerocket](https://aws.amazon.com/ bottlerocket/), a Linux-based container operating system written in Rust. The Amazon EC2 team uses Rust as the preferred language for new [AWS Nitro System](https://aws.amazon.com/ec2/nitro/) components, including sensitive applications such as [Nitro Enclaves](https://aws.amazon.com/blogs /aws/aws-nitro-enclaves-isolated-ec2-environments-to-process-confidential-data/) (for isolated EC2 environments that process confidential data).

In addition, over the past year, [Amazon Prime Video has used WASM and egui](https://www.amazon.science/blog/how-prime-video-updates-its-app-for-more-than-8-000-device- types) to update their application to deliver content to millions of customers (e.g., game consoles, TVs, set-top boxes, streaming media, etc.) for over 8k+ device types. They believe their investment in Rust and WebAssembly paid off with 37,000 lines of Rust code written over a year of development, significantly improving performance, stability and CPU consumption and reducing memory utilization.

Google applied Rust to [Chromium](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/rust-toolchain.md), [ Android](https://source.android.com/docs/setup/build/rust/building-rust-modules/overview) and [Fuchsia OS](https://fuchsia.dev/fuchsia- src/development/languages/rust), where Chromium support for Rust is experimental. Developers can use Rust to develop components for Android and Fuchsia OS, and Rust is used in more than a certain percentage of Android and Fuchsia OS internal code, especially in Fuchsia OS, where Rust code already accounts for more than 50% of the code. Because of the large amount of internal Cpp code, Google and Meta (formerly Facebook) have developed [cxx](https://cxx.rs/) for secure interaction with Cpp. In October this year, Google launched KataOS, a new secure operating system for embedded systems based on open source RISC-V chips. [Sparrow ](https://github.com/AmbiML/sparrow-manifest) is the reference implementation of KataOS, which runs on [seL4]( https://github.com/AmbiML/sparrow-manifest) and is almost completely secure. https://github.com/seL4), written almost entirely in Rust. The OS is not intended for use on desktops or smartphones, but for the Internet of Things, possibly for smart homes. The goal is to build verifiable [secure operating systems](https://www.analyticsinsight.net/significance-of-cloud-security-how-businesses-can-enjoy-its-benefits -2/), such as network-connected cameras for capturing images that are processed on the device or in the cloud for machine learning. In the latest release of [Android version 13](https://security.googleblog.com/2022/12/memory-safe-languages-in-android-13.html), Google also announced that in Android 13, about 21% of new native code (C/C++/Rust) is Rust. There are about 1.5 million lines of Rust code in AOSP, covering new features and components. And, **to date, there have been zero memory security vulnerabilities found in Android's Rust code.** To achieve the goal of improving security, stability and quality across Android, the Android team said it needed to be able to use Rust anywhere in the code base where native code was needed.

Huawei's goal is to lead the evolution of communication system software to secure and trustworthy, in which the Rust language is playing a big role. Huawei hopes to migrate some of the C/C++ code to ensure high performance and higher security at the same time. In this process, Huawei provides developers with a set of automated tools to support the process: based on the open source C2Rust translation tool, Rust code is first generated from C code, and then automatically refactored through source-to-source transformation tools. Huawei has also contributed many important features to the Rust community. For example, a series of code submissions for the Rust compiler enabled the Rust compilation target to support the `ARM AArch64 32`-bit big-end variant [ILP32](https://developer.arm.com/documentation/dai0490/latest/) chipset, used in Huawei's communication products. in Huawei's communication products. These improvements allow Huawei and its friends to execute Rust native programs on these common network hardware architectures. The code has been submitted to the [LLVM compiler](https://reviews.llvm.org/rG21bfd068b32ece1c6fbc912208e7cd1782a8c3fc), [libc library](https) via Huawei's Rust expert `Amanieu d'Antras`. ://github.com/rust-lang/libc/pull/2039), and [Rust compiler](https://github.com/rust-lang/rust/pull/81455) to the open source community. Huawei engineer [YuanLi has also made many contributions to Rust](https://github.com/rust-lang/rust/pulls?q=is%3Apr+author%3ASparrowLii), including fixing several program bugs caused by current parallel compilation, (e.g. serial parallel mode in iterative The problem of ICE in parallel compilation deadlock handling), analysis and optimization of several compilation process frequent lock synchronization leading to parallel compilation efficiency degradation (such as generating attributes number, generating lifecycle dependency analysis table, etc.), optimization of the compiler in several diagnostic information generation, (such as layout depth limit in query, In 2022, YuanLi led the [Restarting the Rust Compiler Parallel Compilation Working Group](https://hackmd.io/@TKyxIWXBRqyDPLDPcP0qfg/parallel_rustc_mcp) to prepare Contribute to accelerating parallel compilation of the Rust compiler.

Meta (formerly Facebook) started using Rust in 2016, a year after the release of version 1.0 of the language, which is its "new secure programming language for blockchain" for the Diem (formerly Libra) stablecoin blockchain, the Mononoke source control server, and Meta. " [Move's primary language.](https://developers.diem.com/main/docs/move-overview) Choosing Rust over C++ was a big decision for Meta, as most of its back-end code is written in C++, making it the obvious choice. According to Meta, the adoption of Rust gained momentum after the perceived success of Mononoke, attracting engineers with backgrounds in Python and JavaScript. Rust is now a major supported server-side language, along with Hack, C++, and Python. Meta now recommends Rust for writing command-line interface (CLI) tools and "performance-sensitive back-end services". Meta has also created a special internal boot camp for Rust to train Rust engineers. One of Meta's major contributions to the Rust ecosystem is [`cxx`](https://cxx.rs/) for secure interaction between Rust and Cpp. In July 2022, Meta first announced Rust as [Meta's support for server-side use programming languages](https://engineering.fb.com/2022/07/27/developer-tools/programming-languages-endorsed-) for-server-side-use-at-meta/).


Microsoft has one of the largest C/C++ code bases in the world. All of its core products, from Windows and Office to the Azure cloud, run on it. Starting in 2019, Microsoft started looking for memory-safe languages, and in the meantime, introduced Rust to try it out. The [Rust for Windows library](https://github.com/microsoft/windows-rs/releases) was then open sourced on GitHub for Rust developers to work seamlessly with the Windows API.

2022 [Microsoft Azure](https://www.analyticsinsight.net/microsofts-azure-cloud-is-going-to-space-with-this-expansion/) Chief Technology Officer Mark Russinovich said that C and [C++](https://www.analyticsinsight.net/why-every-programmer-should-learn-c-c-during-their-careers/) should not be used for new projects. "It's time to stop starting any new projects with C/C++ and use Rust for those scenarios that require a non-GC language. For safety and reliability, the industry should declare these languages deprecated." He said on Twitter, expressing a personal opinion rather than a new Microsoft policy.

JFrog joined the Rust Foundation as a Platinum Member in September 2022. JFrog provides a [DevOps platform](https://jfrog.com/) and supports multiple major programming languages. JFrog will identify and eliminate security threats to the Rust platform and ecosystem, and fix Rust platform issues to prevent further risk. With the advent of the Internet of Things (IoT), cloud computing and big data, cybersecurity threats are growing. In the last two years, use of the Rust programming language has tripled to 2.2 million developers. 

###  How Gold Members Adopt Rust 

[Shopify](https://shopify.engineering/shopify-rust-systems-programming), a Canadian multinational e-commerce company, announced in December 2022 that it was joining the Rust Foundation as its first Gold member. Shopify has been using the Ruby language on the server side, and starting in 2021, the Shopify team began using Rust to implement [YJIT, a new CRuby Instant (JIT) compiler](https://shopify.engineering/yjit-just-in-time- compiler-cruby), which was merged into Ruby version 3.1 this year. In a recent [performance test](https://speed.yjit.org/), YJIT outperformed the Ruby interpreter CRuby by 38%.

In addition to this, Shopify has also decided to adopt Rust as the company's system programming language, for example to write high-performance web servers. In Shopify's opinion, **Rust's consistency, performance, community ecology, productivity, security, and interoperability** are the reasons why they adopted Rust for system programming.

### How Silver Members and General Sponsors Adopt Rust

The Rust Foundation's Silver membership has grown to 28 companies. These companies are in a variety of fields. In addition, there are three non-member general sponsors. Their applications are counted in the "How the industry adopted the Rust" section later in the article.



## How startups adopt Rust

2022 can also be considered the year of the Rust startup. This year, several Rust-based startups have received large funding rounds.

### Fermyon

The first to bear the brunt is [ Fermyon Technologies ](https://www.fermyon.com/). In October of this year, [Fermyon announced that](https://www.forbes.com/sites/justinwarren/2022/10/24/webassembly-pioneer-fermyon-raises-20-million-series-a- releases-fermyon-cloud/?sh=6dbc1d6031bb) received $20 million in Series A funding. And it has released the Fermyon Cloud platform.

Fermyon Cloud is designed to enable [WebAssembly-based applications and microservices for](https://pivotnine.com/2022/07/08/fermyon-revolution-microservices-wasm/ "https://pivotnine .com/2022/07/08/fermyon-revolution-microservices-wasm/") to be deployed quickly and easily. Using Fermyon's [Spin](https://github.com/fermyon/spin) build tool (based on a Rust implementation), applications are compiled and packaged for WebAssembly, which can then be immediately deployed to the Fermyon Cloud. Fermymon's toolchain handles all the infrastructure configuration and deployment steps required to put application code into production, eliminating the need for application developers to know anything about the underlying infrastructure.

WebAssembly originated in the browser and is optimized for high security and low resource consumption. By bringing WebAssembly into the server environment, applications can enjoy the same optimizations while being deployed to a variety of environments using a common code base: cloud, edge, IoT, or any combination.Fermyon builds on these concepts to bring WebAssembly into the data center and the cloud. Fermyon hopes to deliver something like Java's on the promise of "write once, run anywhere" with the ease of use of Heroku. It helps remove friction from application development by eliminating the need for developers to think too much about infrastructure.

"With Fermyon Spin, developers can quickly create WebAssembly microservice applications, and now with Fermyon Cloud, developers can implement and deploy applications from scratch in less than two minutes. This is the promise of WebAssembly delivered in the cloud: rapid development, rapid deployment, and rapid execution." , said Matt Butcher, co-founder and CEO of Fermyon, in a statement.


###  Warp

Although there are many good terminal emulators in common use today, such as the high-performance cross-platform modern terminal emulator [alacritty](https://github.com/alacritty/alacritty) implemented in Rust. But their kernel is still a traditional terminal emulator. Modern developers, use the terminal for many things, from building code, executing and deploying it, interacting with version control systems to interacting with the cloud. As a tool that developers can't live without on a daily basis, today's terminal emulators don't help developers be more productive in the current era of growing development needs.

With Warp, I can see the next generation of terminal emulator evolution. [Warp](https://www.warp.dev/) launched its public beta and [announced $23 million in funding](https://techcrunch.com/2022/04/05/warp-raises-23m-to-build-a-) on April 5, 2022 better-terminal/), it is trying to change that by building a new command-line terminal designed to improve developer productivity.

Warp has chosen to implement this using the Rust language. Using the Rust technology stack (including WebAssembly) also facilitates building cross-platform support. Under the hood, UI rendering is done directly with the GPU using Metal (the Mac's GPU API). The reason for using the GPU for rendering is that the team wanted to get rid of many software and architectural bottlenecks on top of the CPU to accommodate higher resolution displays. Metal was chosen over OpenGL as the GPU API because Warp chose MacOS as its first platform. the Metal debugging tools in Xcode are excellent, allowing the Warp team to examine texture resources and easily measure important metrics like frame rate and GPU memory size. the Mac platform is also now the key productivity tool of choice for most developers.

However, Rust's GPU support is currently not perfect and there is no proper UI library available out of the box. The team has considered [Azul](https://azul.rs/) and [Druid](https://github.com/) linebender/druid), but both were in the experimental stage, so the team decided to work with Atom editor co-founder [Nathan Sobo](https://github.com/nathansobo) and use a Flutter-inspired Rust UI framework he created, which should be open sourced soon. In the future, more rendering backends will be supported, such as OpenGL and WebGL (which will be supported via wasm). Also working with Nathan to build a text editor in Warp. warp also forked the model code for [Alacritty](https://github.com/alacritty/alacritty), which is used to process data models for Warp. Warp also forked the Alacritty model code to handle the data model and provide help with the block implementation in the Warp interface.

It is clear that Warp, as a commercial product, does not open source the entire code of its product. However, in the process of implementing their product, they have precipitated some tools and libraries by solving problems related to Rust GUI and GPU rendering, which will be contributed to the community in an open source way. Although the open source community is very important to go the PLG route, it does not mean blindly open source all the products between them.


### Database field startups

This year can be considered a pile-up of startups in the database space.

 In April 2022, Jon Gjengset, a well-known developer in the Rust community, was announced as a co-founder of [ReadySet, Inc.](https://readyset.io/), ready to take his PhD thesis on Noria databases () to ground his PhD thesis on Noria databases as ReadySet, a SQL caching engine for databases that helps developers build high-performance, real-time applications without having to change code or switch databases. [The company is currently raising $2900 w in Series A funding](https://techcrunch.com/2022/04/05/readyset-raises-29m-to-expedite-access-to- enterprise-scale-app-data/).

In April 2022, Singularity Data [Singularity Data](https://36kr.com/project/1713086132758785) (Singularity Unlimited), a database startup that has raised $10 million, announced the open source Rust implementation of its cloud-native SQL-enabled RisingWave, a streaming database, was created in Cpp in early 2021 and rewritten in Rust seven months later. This was a crazy decision for an early-stage startup. Especially in a competitive environment, where time is almost everything for tech startups.


### Streaming Service

InfinyOn, a real-time event streaming company, has raised $5 million in seed funding led by Gradient Ventures and Fly Ventures, with participation from Bessemer Venture Partners, TSVC and others. InfinyOn uses [Fluvio](), a dynamic data programmability platform developed by Rust. Fluvio has over 1,000 Github stars and is growing in popularity among developers and the open source community.

"Legacy data platforms built in the Java era generate large binaries, require a lot of memory, and are challenging to operate from the edge to the core. These also lacked the online processing power to make real-time decisions," said Sehyo Chang, co-founder and CTO of InfinyOn. "We simplify the data architecture by eliminating the need for ETL tools, providing a more cost-effective platform with up to 80 times less memory and maximum security with an in-memory security solution."

"We integrate healthcare data from different sources: IoT, patient and physician input. With InfinyOn, we can do this quickly and efficiently using modern tools. It's written in Rust, which makes it easier for teams to integrate compared to Kafka." says Chris Brucker, CEO of Nammu.

InfinyOn makes it easy to extract, shape and transform data from multiple sources and calculate the results in real time. Although still in Beta, early adopters are already seeing significant advantages over alternative solutions in InfinyOn's proof-of-concept. In addition to ease of use and speed of development, suppliers are seeing a significant reduction in total cost of ownership compared to other vendors.


## How the industry adopted the Rust 

### Software Defined Vehicles: The Critical Role of Rust

The automotive standards organization Autosar - whose members include Ford, GM, BMW, Bosch, Volkswagen, Toyota, Volvo and others - announced in April the formation of a new subgroup within its Working Group on Functional Safety (WG-SAF) to explore how Rust can be used in one of its reference platforms. how Rust can be used in one of its reference platforms. SAE International has also [formed a working group](https://connexionplus.sae.org/communities/community-home/digestviewer/viewthread? GroupId=31&MessageKey=9e947f64-aefc-45cd-aee6-a787818af963&CommunityKey=c9c80476-9027-4edc-953c-65bda22ba7a7) to study Rust for safety-related systems in the automotive industry. In May Autosar and the Rust team had an [exchange](https://standardsworks.sae.org/standards-committees/safer-rust-task-force) to explore whether Safe Rust in the automotive space could construct a compliant The discussion was about the Ferrocene Rust safe subset.

> Subsequently, Autosar withdrew the news of a new Rust working group, perhaps pending the results of Ferrocene Rust. Also, in September, Volvo Cars' technologist and system architect [Julius Gustavsson was interviewed](https://medium.com/volvo-cars-engineering/why-volvo-thinks-you-should-have- rust-in-your-car-4320bd639e09), who confessed that he wanted to push Rust development in Volvo.

####  Ferrocene Rust Security Subset

[Ferrocene Systems](https://ferrous-systems.com/blog/ferrous-systems-adacore-joining-forces/) and [AdaCore](https://blog.adacore.com/ adacore-and-ferrous-systems-joining-forces-to-support-rust) announced in February that they are joining forces to develop Ferrocene, a security-compliant Rust toolchain designed to support the needs of various regulated markets, such as automotive, avionics, space and rail. This means certifying the Ferrocene Rust compiler to ASIL level D (D for highest level of automotive hazard) for automotive safety according to various safety standards, an effort that will eventually include the development and qualification of the necessary dynamic and static analysis tools. language support (libcore) or other user libraries. Our goal is to target a variety of architectures and operating systems relevant to these markets. This vision will take time to achieve, and Ferrous Systems and AdaCore are prepared to start by focusing on certain specific aspects. Ultimately, our goal is to support Rust as comprehensively as any other programming language relevant to high integrity application development.[The Ferrocene Language Specification](https://spec.ferrocene.dev/) is currently under development and is expected to be released by the end of the year.

#### Others

Among the Rust Foundation Silver members is [ARM](https://www.arm.com/), which is also working to bring Rust to life in software-defined cars.

### Instant Messaging: Threema

[Threema](https://threema.ch/en) is a cross-platform, privacy-secure and open source instant messaging tool.


### Password management tool: 1Password

1Password [used Rust early on to build its Windows client](https://serokell.io/blog/rust-in-production-1password). After porting its logic engine with browser extension support from Go to Rust in 2019, the practice of Rust cross-platform adoption began. Until November 2022, 1Password also open sourced its [Typeshare](https://github.com/1Password) library for [generating consistent type patterns across multiple languages](https://blog.1password.com/typeshare-for-rust/). Typeshare helps developers seamlessly synchronize shared data types across languages, which is a powerful tool for secure cross-platform development.


### GUI : Target to replace Qt 

Two of the partners of tQCS, the world's leading Qt consulting and UI/UX design services company, have joined the Rust Foundation as Silver members. They are.
- [KDBA](https://www.kdab.com/) : With years of experience in embedded systems, 3D graphics, and working across desktop, embedded, and mobile platforms, KDAB is a major contributor to the Qt project.
- [Slint](https://slint-ui.com/): Greatly simplifies GUI development for embedded platforms that replace Qt requirements. Supports Rust/Cpp/Javascript and has a design-friendly UI markup language. Its founder is also a major contributor from the Qt project and the main developer of the QtQml engine.

### Cloud storage: Dropbox

Dropbox was one of the first companies to use Rust with success. Dropbox uses Rust for part of its file sync engine. and a new visual communication tool [Dropbox Capture](https://www.dropbox.com/capture) designed to make it easy for teams to share their work asynchronously using screen recordings, video messages, screenshots or GIFs.

### Edge Computing: Cloudflare


[Cloudflare](https://github.com/cloudflare) uses Rust in its core edge logic to replace memory-insecure C. Cloudflare workers support Rust and WebAssembly. In September, Cloudflare also announced that it was using Rust to implement  [Pingora](https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/), a proxy server that could replace Nginx.

###  Walt Disney Company (Disney)

The Disney Company is building its NCP GUI framework in Rust, as can be concluded from [this Disney job posting](https://www.builtinnyc.com/job/engineer/lead-software-engineer/181881). From the company's 2021 release ["Introducing the Disney+ Application Development Kit (ADK)"](https://medium.com/disney-streaming/introducing-the-disney-) application-development-kit-adk-ad85ca139073), the use of Rust was primarily to build the Native Client Platform v2 (NCPv2) framework, codenamed "m5". They chose Rust to target [WebAssembly](https://webassembly.org/) (WASM) in order to simplify Web deployment and application updatability outside of any firmware update cycle that limits the ability to update the C-based runtime. The project has been ongoing for almost three years and has now reached the point where the same rendering engine is used to render their animations across all platforms, from handheld terminals to TVs, web pages, etc.

 
### Tesla

While [Musk](https://twitter.com/elonmusk/status/1496293976692899843?lang=en) tweeted in February that he was a fan of the Rust language, he also admitted that Tesla primarily uses Cpp and Python. But two Rust posts released this November show that Tesla has also started to adopt Rust. One is for [the Tesla Robotics Simulation Engine team](https://www.theladders.com/job/rust-or-c-developer-software-engineer-tesla-bot-simulations-tesla-palo-alto-ca_ 60305636), which is looking for Rust developers to extend the high-performance robot simulation engine written in Rust. The other is [Rust Firmware Verification Engineer](https://www.tesla.com/careers/search/job/python-rust-c-firmware-validation-engineer-drive-systems-all-levels--98473), but the only requirement for Rust in this position is "any Rust experience is preferred but not required".


### Tweedegolf : with SpaceX Spacecraft

This time Rust is really going to take to the sky. [Gama](https://www.gamaspace.com/) will launch the solar sail spaceship 🛰️ and is one of the companies publicly sending Rust into space. Providing software services should be this company: [Tweedegolf](https://tweedegolf.nl/en), which is also a Silver member of the Rust Foundation. Their [open source repository](https://github.com/tweedegolf) has a library of Rust implementations of PTP (Precision Time Protocol), which is generally used in satellite time sources and is more accurate than NTP. But this is a PoC implementation, I don't know if it is used on the spacecraft launched this time. From another project, the embedded development board pcf85063a (generally used for timing alarm clocks) rust driver, it seems that the Rust program on board this time is probably related to precise timing.

[Gama Solar Sail's satellite was successfully put into orbit by SpaceX Falcon 9 on January 3, 2023](https://www.sail-world.com/news/257330/Gama-launches-its-Gama-Alpha-solar-sail-mission).


### Lightyear Solar Car Company Adopts Rust 

As revealed on [Tweedegolf's blog site](https://tweedegolf.nl/nl/blog/76/pioneering-rust-high-tech), Jorrit, a software architect at Lightyear, shared at the [High Tech Industry Rust offline gathering](https://hightechsoftwarecluster.nl/evenementen/rustmeetup/) organized by Tweedegolf to share how Lightyear is using Rust in the development of Lightyear's core platform. For privacy reasons, no video or PowerPoint of the presentation was released.

### File Data Storage: Qumulo

 Qumulo (the leader in hybrid cloud file data management) and Western Digital, a partnership that enables the IHME (Institute for Health Metrics and Evaluation) to process up to 2 petabytes of data per day by deploying the Qumulo scalable file data platform based on Western Digital's UltrastarTM high-capacity HDDs and high-performance SSDs. advancing public epidemiological research, statistics and forecasting. Qumulo is sponsoring the RustConf 2022 conference.

### Veteran database company: PostgreSQL

 PostgreSQL sponsored the RustConf 2022 conference, and there is no sign of Rust being used within the PostgreSQL company. However, there is a GitHub project [pgx](https://github.com/tcdi/pgx) dedicated to writing PostgreSQL extensions in Rust, where the core developer [Ana's blog also has many articles about it](https://hoverbear.org/tags/ postgresql/).

### Enterprise Data Analytics: Redjack
 
Redjack claims technology from the U.S. National Intelligence Agency that monitors and protects more than 8% of the Internet's public IP space and more than 100 trillion business communications each year, increasing actionable data that enables organizations to improve the speed and accuracy of analysis for the security and resilience of large-scale operations. Redjack is also sponsoring the RustConf 2022 conference, so it is likely that the company will also adopt Rust.


### Data Science & AI

Rust Foundation Silver members also include companies in data science and AI:.
- [Watchful](https://www.watchful.io/), tagging data for AI at a speed and scale not possible with traditional tagging solutions.

### Automotive IoT

[Wyliodrin](https://wyliodrin.com/) Protects devices and builds secure and efficient systems using **Rust** , **Tock OS** and **Android**. Launches the Rust embedded real-time operating system [Tock OS](https://github.com/tock/tock) into commercial applications. The company has also joined the Rust Foundation as a Silver member.

### Messaging Push Service Provider: OneSignal

Messaging push provider OneSignal has been using Rust since 2017, providing a Rust Client to support push notifications, email, SMS and in-app self-service customer engagement solutions.


### Automated Freight Trains: Parallel Systems

Parallel Systems, an automated freight train, believes the future of freight is rail, so it has developed zero-emission automated electric freight running on rail, with the Rust language as the common language for the company's technology stack. The company is also sponsoring the RustConf 2022 conference. 


### Rust Development Tools, Platforms and Toolchain Support

Some good development tools are implemented based on Rust, such as.
- [tabnine](https://www.tabnine.com/), a machine learning based code autocompletion development tool.
- [Open Source Security](https://opensrcsec.com/), which has joined the Rust Foundation as a Silver member and is committed to contributing to the promotion of the Rust ecosystem, currently sponsoring mainly GCC Rust implementations. As of December 2022, [GCC Rust front ends will be merged in GCC 13](https://www.phoronix.com/news/GCC-Rust-v4-Cleared-For-Landing)!
- [Embecosm](https://www.embecosm.com/), which provides open source software toolchain and embedded operating system services. Embecosm is also a sponsor of the GCC Rust front end.
- [grafbase](https://grafbase.com/), a service platform for building and deploying GraphQL backends.
- [Rust for Linux](https://github.com/Rust-for-Linux), Linux 6.1 kernel release [merged with initial Rust infrastructure](https://www.phoronix.com/news/Rust-Is-Merged-Linux -6.1), lays the groundwork for future kernel drivers and other kernel code to enable the Rust programming language. On November 11, Rust for Linux committed a lot more patch code to the upstream kernel. Once all of this Rust infrastructure is in place, we will see how long it takes before more prominent real-world drivers start transitioning to Rust code to get new hardware support or to rewrite existing C driver code in Rust. One of the first major users of Rust in the Linux kernel is expected to be the DRM drivers for Apple M1/M2 graphics.

### Security Monitoring

This area currently includes the following companies among the Rust Foundation Silver members.
- [Spectralops](https://spectralops.io/), monitors, classifies, and protects code, assets, and infrastructure from exposed API keys, tokens, credentials, and high-risk security misconfigurations.
- [Sentry](https://sentry.io/welcome/), application monitoring platform.


### Software Consulting

A number of Rust consulting firms have also emerged, and the following have joined the Rust Foundation Silver membership.
- [knoldus ](https://www.knoldus.com/).
- [Ferrous Systems ](https://ferrous-systems.com/blog/ferrous-systems-adacore-joining-forces/) 
- [mainmatter](https://mainmatter.com/) 
- [Tag1](https://www.tag1consulting.com/) 

### Games with Rendering Engines

Rust is still in development in the gaming space. The game company Activision Blizzard joined the Rust Foundation as a general sponsor and in 2021 released a research report ["Programming Language for Game Tools"](https://www.activision.com/cdn/research/The_Rust_) written by Treyarch, an Activision Blizzard studio. Programming_Language_for_Game_Tooling.pdf) by Treyarch, an Activision Blizzard studio, in 2021. Treyarch has been gradually integrating Rust into our tools and pipeline since 2018.

Another game company to watch is [Embark](https://www.embark-studios.com/), which sponsors the Rust game engine [Bevy](https://github.com/bevyengine/bevy) and [Fyrox](https:/ /github.com/FyroxEngine/Fyrox), and has open sourced [rust-gpu](https://github.com/EmbarkStudios/rust-gpu) which is dedicated to making Rust the premier language and ecosystem for GPU shaders.


### E-commerce

Rust is also used in the e-commerce space.
- The open source project [Tremor](https://github.com/tremor-rs/tremor-runtime), owned by Wayfair, the largest furniture e-commerce company in the US, has been entered into CNCF. A small online [Tremor Conf](https://) was also held last September community.cncf.io/events/details/cncf-tremor-community-presents-tremor-con-2021/). Starting in 2018, tremor is what runs in the wayfair production environment, processing 10 terabytes of data per day, or 10 billion messages per minute, and 10 million metrics per second. tremor lowers costs, reduces complexity, consolidates and simplifies the operating environment to excite SREs, reduce NOC workload, and lower operational costs. [Rust saves Wayfair the cost of thousands of cores and terabytes of memory ]( https://www.tremor.rs/slides/2020-03-31-RustAndTellBerlin-functions.pdf) 
- [cargurus](https://www.cargurus.com/), a UK-based used car e-commerce site, has also become a Rust Foundation General Sponsor member.


### Web3 and Blockchain

Rust has become a mainstream language in the Web3 and blockchain space. There are many companies and projects that are familiar in these areas.

- [Diem](https://github.com/diem/diem), formerly known as Libra, was once Facebook's stablecoin project, but has now been acquired by Silvergate Capital Corporation.
- The super new public chains [aptoslabs](https://aptoslabs.com/) and [sui](https://sui.io/), both of which are projects started by Diem team members who left the company, have in common that they both use the Move language, implemented in Rust, as their smart contract language.
- [parastate](https://www.parastate.io/), a Polka Ecosystem multi-chain smart contract platform, is a Silver member of the Rust Foundation.
- [Zama](https://www.zama.ai/), building open source homomorphic cryptography solutions for data science and AI, is a Silver member of the Rust Foundation.
- [Keyrock](https://keyrock.eu/), which deploys proprietary and highly scalable market-making technology for digital assets, is a Silver member of the Rust Foundation.
- [matter-labs](https://matter-labs.io/), extending Ether [Zero Knowledge Proof](https://github.com/matter-labs/awesome-zero-knowledge-proofs/).
- [TECHFUND](https://techfund.jp/en), a Japanese blockchain technology incubator, has also joined the Rust Foundation as a Silver Member.
- Other.

## Summary

Rust is a general-purpose language, and diversity is one of the design principles of the Rust language. This article attempts to help people understand the business scenarios in which Rust is suitable for implementation by listing examples of successful applications in various domains. However, this article falls far short of covering all corners of Rust applications, and there are silent adopters of Rust in places we cannot see. This article also barely lists the companies in China that are using Rust, but there are companies in China that are ready to adopt Rust incrementally, just slowly.

> P.S. You can also check out the worldwide [list of companies using Rust] maintained by others on GitHub (https://github.com/omarabid/rust-companies).

Rust is like a "spring rain" that drips into the night. Thanks for reading.