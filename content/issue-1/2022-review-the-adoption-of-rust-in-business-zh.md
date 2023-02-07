# 前言

2022 年是 Rust 语言距离稳定版正式发布以来已经走过的第七年。从 Rust 发布以来，就一直受到广大开发者的欢迎。在 Stackoverflow 来自 180 个国家 7 万 3 千多名开发者的投票调查中，Rust 连续七年荣获最受欢迎的编程语言，87% 的开发人员希望使用 Rust 。

2022 年也距离 [Rust 基金会](https://foundation.rust-lang.org)成立的第二年。在 2021 年 2 月 9 日 Rust 基金会成立之初，只有 Mozilla、Amazon、华为、谷歌、微软五家创始白金成员，截止到今天（2022.12 月）已经有 39 家不同领域的头部公司成为了[Rust 基金会成员](https://foundation.rust-lang.org/members/)，共同推动 Rust 在各自领域的落地。

2022 年在 Rust 基金会成员公司之外，也有不少公司开始使用 Rust。其中包含初创企业，使用 Rust 从头构建产品；也有成立多年的老牌公司，使用 Rust 来改进生产。Rust 开发者数量也逐渐增多。据开发者调查分析公司 SlashData 发布了一份题为“[第 22 届开发者国家状况](https://www.slashdata.co/free-resources/state-of-the-developer-nation-22nd-edition)”的报告指出，从 2020 年 Q1 季度到 2022 年 Q1 季度，Rust 语言的开发者用户量从 60 万猛增到了 220 万。[TIOBE](https://www.tiobe.com/tiobe-index/) 编程语言排行榜 2022 年 11 月榜单中，Rust 语言进入了前 20 。

可以说，2022 年是 Rust 语言开始广泛应用的元年。本文就让我们来盘点一下 Rust 在全球商业化领域的应用状态。

# Rust 基金会成员应用盘点

> Rust 基金会成员投资 Rust ，尤其是白金成员们，是在投资 Rust 的可持续性，他们认为应该使用这种语言来构建可持续且安全节能的解决方案。

## 白金成员如何应用 Rust

在 AWS，Rust 已迅速成为大规模构建基础设施的关键。[Firecracker](https://firecracker-microvm.github.io/)是一种开源虚拟化技术，为[AWS Lambda](https://aws.amazon.com/lambda/)和其他无服务器产品提供支持，它于 2018 年公开发布。AWS 使用 Rust 来交付[Amazon Simple Storage Service](https://aws.amazon.com/s3/) (Amazon S3)、[Amazon Elastic Compute Cloud](https://aws.amazon.com/ec2) (Amazon EC2)、[Amazon CloudFront](https://aws.amazon.com/cloudfront/)等服务。2020 年，推出了[Bottlerocket](https://aws.amazon.com/bottlerocket/)，这是一个用 Rust 编写的基于 Linux 的容器操作系统。 Amazon EC2 团队使用 Rust 作为新[AWS Nitro 系统](https://aws.amazon.com/ec2/nitro/)组件的首选语言，包括敏感应用程序，例如[Nitro Enclaves](https://aws.amazon.com/blogs/aws/aws-nitro-enclaves-isolated-ec2-environments-to-process-confidential-data/)（用于处理机密数据的隔离 EC2 环境）。

此外，过去一年，[Amazon Prime Video 使用了 WASM 和 egui](https://www.amazon.science/blog/how-prime-video-updates-its-app-for-more-than-8-000-device-types) 为超过 8k 多种设备类型更新其应用向数百万客户提供内容（例如游戏机、电视、机顶盒和流媒体等）。他们认为对 Rust 和 WebAssembly 的投资得到了回报，经过一年的开发，共编写了 37,000 行 Rust 代码，显著地提高了性能、稳定性和 CPU 消耗并降低了内存利用率。

Google 将 Rust 应用于[Chromium](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/rust-toolchain.md)、 [Android](https://source.android.com/docs/setup/build/rust/building-rust-modules/overview) 和 [Fuchsia OS ](https://fuchsia.dev/fuchsia-src/development/languages/rust)中，其中 Chromium 对 Rust 支持是实验性的。开发者可以使用 Rust 为 Android 和 Fuchsia OS 开发组件，并且 Rust 在 Android 和 Fuchsia OS 内部代码使用超过了一定的比例，尤其是 Fuchsia OS 中 Rust 代码占比已经超过 50%。因为其内部 Cpp 代码比较多，所以 Google 联合 Meta (原 Facebook) 一起开发了 [cxx](https://cxx.rs/) 用于和 Cpp 安全交互。在今年 10 月份，Google 又推出基于开源 RISC-V 芯片的嵌入式系统的新型安全操作系统 KataOS。[Sparrow ](https://github.com/AmbiML/sparrow-manifest)是 KataOS 的参考实现，它运行在[seL4 之上](https://github.com/seL4)，几乎完全用 Rust 编写。该操作系统不适用于台式机或智能手机，而是用于物联网，可能用于智能家居。目标是为嵌入式硬件或边缘设备构建可验证的[安全操作系统](https://www.analyticsinsight.net/significance-of-cloud-security-how-businesses-can-enjoy-its-benefits-2/)，例如用于捕获图像的网络连接相机，这些图像在设备上或云中处理以进行机器学习。在最新发布的 [Android 13 版本](https://security.googleblog.com/2022/12/memory-safe-languages-in-android-13.html)中，Google 也宣布在 Android 13 中，大约 21% 的新原生代码（C/C++/Rust）是 Rust。AOSP 中大约有 150 万行 Rust 代码，涵盖新功能和组件。并且，**迄今为止，在 Android 的 Rust 代码中发现的内存安全漏洞为零。** 为了实现提高 Android 范围内的安全性、稳定性和质量的目标，Android 团队表示需要能够在代码库中需要本地代码的任何地方使用 Rust。

华为的目标是引领通信系统软件向安全可信演进，其中 Rust 语言正在发挥很大的作用。华为希望通过部分 C/C++ 代码的迁移，在保证高性能的同时，拥有更高的安全性。在此过程中， 为开发者提供一套自动化工具支持：基于开源的 C2Rust 转译工具， 首先从 C 代码生成 Rust 代码, 然后通过源到源变换工具自动重构。华为也为 Rust 社区贡献了许多重要的功能特性。例如，为 Rust 编译器提交了一系列代码，使得 Rust 编译目标可以支持`ARM AArch64 32`位大端变体[ILP32](https://developer.arm.com/documentation/dai0490/latest/)芯片组, 用于华为的通信产品中。 这些改进使得华为和友商可以在这些常用网络硬件架构上执行 Rust 原生程序。这些代码已经通过华为的 Rust 专家`Amanieu d'Antras`  提交给了  [LLVM 编译器](https://reviews.llvm.org/rG21bfd068b32ece1c6fbc912208e7cd1782a8c3fc), [libc 库](https://github.com/rust-lang/libc/pull/2039), 以及  [Rust 编译器](https://github.com/rust-lang/rust/pull/81455)等开源社区。华为国内工程师 [李原 也为 Rust 做了很多贡献](https://github.com/rust-lang/rust/pulls?q=is%3Apr+author%3ASparrowLii)，其中包括修复了多个当前并行编译导致的程序错误，(比如串行并行模式在迭代器 panic 场景的行为一致性、并行编译死锁处理的 ICE 问题）、分析并优化了多个编译过程中频繁锁同步导致并行编译效率降低的问题(比如生成 attributes 编号、生成生命周期依赖分析表等等)、优化了编译器中多处诊断信息的生成，(比如查询中 layout 深度限制、错误 using 语句的提示信息、let 语句中默认类型的提示信息等)，并且在 2022 年李原主导发起[重启 Rust 编译器并行编译工作组](https://hackmd.io/@TKyxIWXBRqyDPLDPcP0qfg/parallel_rustc_mcp)，准备为加速 Rust 编译器并行编译做出贡献。

Meta（原 Facebook ）从 2016 年开始使用 Rust，也就是该语言的 1.0 版发布一年后。Rust 是它用于 Diem（以前的 Libra）稳定币区块链、Mononoke 源代码控制服务器和 Meta 的“用于区块链的新的安全编程语言” [Move 的主要语言。](https://developers.diem.com/main/docs/move-overview) 选择 Rust 而不是 C++ 对 Meta 来说是一个重大决定，因为它的大部分后端代码都是用 C++ 编写的，这使其成为显而易见的选择。  据 Meta 称，在 Mononoke 被认为取得成功后，Rust 的采用势头强劲，吸引了具有 Python 和 JavaScript 背景的工程师。  现在，Rust 与 Hack、C++ 和 Python 一起成为主要受支持的服务器端语言。 Meta 现在建议将 Rust 用于编写命令行界面 (CLI) 工具和“性能敏感的后端服务”。 Meta 内部也针对 Rust 建立了专门的新手训练营，用于培养 Rust 工程师。Meta 对 Rust 生态的重要贡献之一是 [`cxx`](https://cxx.rs/) ，用于 Rust 和 Cpp 之间的安全交互。在 2022 年 7 月，Meta 首次宣布 Rust 成为 [Meta 支持服务器端使用的编程语言](https://engineering.fb.com/2022/07/27/developer-tools/programming-languages-endorsed-for-server-side-use-at-meta/)。

Microsoft 拥有世界上最大的 C/C++ 代码库之一。从 Windows 和 Office 到 Azure 云，其所有核心产品都在其上运行。从 2019 年开始，微软开始寻找内存安全的语言，与此同时，引入了 Rust 进行尝试。随后在 GitHub 上开源了 [Rust for Windows 库](https://github.com/microsoft/windows-rs/releases) ，供 Rust 开发者们无缝地使用 Windows API。此外，Azure 孵化的团队 DeisLabs 开始尝试用 Rust   构建 Krustlet 来允许开发人员在 Kubernetes 中运行多个 WebAssembly 模块的服务。2022 年[微软 Azure](https://www.analyticsinsight.net/microsofts-azure-cloud-is-going-to-space-with-this-expansion/)首席技术官 Mark Russinovich 表示，C 和[C++](https://www.analyticsinsight.net/why-every-programmer-should-learn-c-c-during-their-careers/)不应该用于新项目。“是时候停止使用 C/C++ 启动任何新项目，并将 Rust 用于那些需要非 GC 语言的场景。为了安全性和可靠性，业界应该宣布这些语言已被弃用”。他在 Twitter 上表示，表达的是个人观点，而不是微软的新政策。

> 2022 年 DeisLabs 初创团队离职后出来创业创建了 [Fermyon 公司](https://www.fermyon.com/) ，专注于 WebAssembly 云产品。

JFrog 于 2022 年 9 月宣布加入了 Rust 基金会成为白金会员。JFrog 提供了一个[DevOps 平台](https://jfrog.com/) ，并且支持多种主流编程语言。JFrog 加入 Rust 基金会的目的就是为了与 Rust 社区和 Rust 基金会合作，帮助保护软件供应链。JFrog 将识别并消除 Rust 平台和生态系统面临的安全威胁，并修正 Rust 平台问题以防止进一步的风险。随着物联网（IoT）、云计算和大数据的出现，网络安全威胁也越来越大。在过去两年中，Rust 编程语言的使用量增加了两倍，达到 220 万开发人员。JFrog 与非营利组织的合作反映了其从最近采用的覆盖组织软件供应链的安全解决方案中获益的战略。

## 金牌成员如何应用 Rust

[Shopify](https://shopify.engineering/shopify-rust-systems-programming) 是加拿大跨国电商公司，在 2022 年 12 月份宣布加入 Rust 基金会，成为基金会第一个金牌会员。 Shopify 在服务端一直使用 Ruby 语言，从 2021 年开始，Shopify 团队开始使用 Rust 实现[YJIT，这是一种新的 CRuby 即时 (JIT) 编译器](https://shopify.engineering/yjit-just-in-time-compiler-cruby) ，到今年合并到了 Ruby 3.1 版本中。在最近的一次[性能测试](https://speed.yjit.org/)中，YJIT 的性能比 Ruby 解释器 CRuby 快了 38%。

除此之外， Shopify 也决定采用 Rust 作为公司的系统编程语言，比如编写高性能网络服务器。在 Shopify 看来，**Rust 的一致性、性能、社区生态、生产力、安全和互操作性**是他们采用 Rust 用于系统编程的原因。

## 银牌会员及普通赞助商如何应用 Rust

Rust 基金会的银牌成员逐渐增多，目前已经达到了 28 家公司。这些公司分布在各个领域。此外，还包括三家非会员普通赞助商。在文后的「Rust 其他领域应用」小节将统计他们的应用信息。

# Rust 初创产品

2022 年也可以算作是 Rust 创业元年。因为今年陆续有好几家采用 Rust 的创业公司拿到了巨额融资。

## Fermyon

首当其冲的是[ Fermyon 技术公司](https://www.fermyon.com/)。在今年十月份，[Fermyon 宣布](https://www.forbes.com/sites/justinwarren/2022/10/24/webassembly-pioneer-fermyon-raises-20-million-series-a-releases-fermyon-cloud/?sh=6dbc1d6031bb)拿到了 2000 万美元的 A 轮融资。并且发布了 Fermyon Cloud 平台。

Fermyon Cloud 旨在使[基于 WebAssembly 的应用程序和微服务的](https://pivotnine.com/2022/07/08/fermyon-revolution-microservices-wasm/ "https://pivotnine.com/2022/07/08/fermyon-revolution-microservices-wasm/")部署变得快速和容易。使用 Fermyon 的 [Spin](https://github.com/fermyon/spin) 构建工具（基于 Rust 实现），为 WebAssembly 编译和打包应用程序，然后可以立即将其部署到 Fermyon Cloud。Fermymon 的工具链处理将应用程序代码投入生产所需的所有基础设施配置和部署步骤，使应用程序开发人员无需了解有关底层基础设施的任何信息。

WebAssembly 起源于浏览器，针对高安全性和低资源消耗进行了优化。通过将 WebAssembly 引入服务器环境，应用程序可以享受相同的优化，同时使用通用代码库部署到各种环境：云、边缘、物联网或任何组合。Fermyon 以这些概念为基础，将 WebAssembly 引入数据中心和云端。Fermyon 希望实现类似于 Java 的“一次编写，随处运行”的承诺，同时又具有 Heroku 的易用性。它使开发人员无需过多考虑基础架构，从而有助于消除应用程序开发中的摩擦。

“使用 Fermyon Spin，开发人员可以快速创建 WebAssembly 微服务应用程序，现在使用 Fermyon Cloud，开发人员可以在不到两分钟的时间内从零开始实现并部署应用程序。这是 WebAssembly 在云中实现的承诺：快速开发、快速部署、快速执行。”，Fermyon 的联合创始人兼首席执行官 Matt Butcher 在一份声明中如是说。

## 新终端 Warp

虽然现在的常用的终端模拟器也有很多好用的，比如 Rust 实现的高性能跨平台现代化终端模拟器  [alacritty](https://github.com/alacritty/alacritty) 。但它们的内核其实还是一个传统的终端模拟器。现代开发者，要使用终端做很多事，从构建代码、执行和部署，与版本控制系统交互到与云端交互等。作为开发者日常离不开的工具，在当下日益增长的开发需求的时代，现在的终端模拟器却没有帮助开发者提升更多工作效率。

而 Warp 的出现，让我看到了终端模拟器进化的下一代形态。[Warp](https://www.warp.dev/) 在 2022 年 4 月 5 号推出其公开测试版并[宣布获得 2300 万美元的资金](https://techcrunch.com/2022/04/05/warp-raises-23m-to-build-a-better-terminal/)，它正试图通过构建一个旨在提高开发人员生产力的新命令行终端来改变这一现状。

Warp 选择使用 Rust 语言来实现。使用 Rust 技术栈（包括 WebAssembly）也方便构建跨平台支持。在底层，使用 Metal （Mac 的 GPU API）直接用 GPU 进行 UI 渲染。之所以使用 GPU 进行渲染，是因为团队想摆脱 CPU 上面的许多软件和架构瓶颈，来适应更高分辨率的显示器。选择 Metal 而不是 OpenGL 作为 GPU API，因为 Warp 把 MacOS 作为第一个平台。Xcode 中的 Metal 调试工具非常出色，使 Warp 团队能够检查纹理资源并轻松测量帧速率和 GPU 内存大小等重要指标。Mac 平台现在也是大多数开发者选择的重要生产力工具。

但是，目前 Rust 对 GPU 支持并不是很完善，没有开箱即用的合适的 UI 库。团队考虑过  [Azul](https://azul.rs/)和[Druid](https://github.com/linebender/druid)，但这两者都处于实验阶段，所以团队决定和 Atom 编辑器联合创始人  [Nathan Sobo](https://github.com/nathansobo)  合作，使用他创建的一个受 Flutter 启发的 Rust UI 框架，不久后应该会开源。在未来，会支持更多的渲染后端，比如 OpenGL 和 WebGL（会通过 wasm 支持）。同时也和 Nathan 合作，在 Warp 中构建了一个文本编辑器。Warp 也 fork 了  [Alacritty](https://github.com/alacritty/alacritty)  的模型代码，用于处理数据模型，为 Warp 界面中的块实现提供了帮助。

看得出来，Warp 作为一个商业产品，它并没有将其产品的全部代码进行开源。但他们在实现产品过程中，通过解决 Rust GUI 和 GPU 渲染相关的问题，沉淀出一些工具和库，会以开源的方式贡献给社区。虽说要走 PLG 路线，开源社区非常重要，但也并不是说盲目地之间把产品全部开源出来。还是要根据自己的商业模式和产品形态做出最好的权衡。

## 初创数据库领域公司

今年在数据库领域的初创公司可以算得上是扎堆出现了。

在 2022 年 4 月，Rust 社区知名开发者 Jon Gjengset 宣布成为  [ReadySet 公司](https://link.zhihu.com/?target=https%3A//readyset.io/)的联合创始人，准备将其博士论文中的 Noria 数据库研究成果进行落地为 ReadySet ，为数据库提供 SQL 缓存引擎，可帮助开发人员构建高性能的实时应用程序，而无需更改代码或切换数据库。[该公司目前 A 轮融资 2900 w 美元](https://link.zhihu.com/?target=https%3A//techcrunch.com/2022/04/05/readyset-raises-29m-to-expedite-access-to-enterprise-scale-app-data/)。

在 2022 年 4 月，已经融资千万美元的数据库初创企业 Singularity Data [Singularity Data](https://36kr.com/project/1713086132758785)（奇点无限公司）宣布开源 Rust 实现的云原生的支持 SQL 的流式数据库 RisingWave 。RisingWave 于 2021 年初开始用 Cpp 创建，在七个月之后用 Rust 重写。对于早期创业公司来说，这是一个疯狂的决定。特别是在竞争激烈的环境中，对科技初创公司来说，时间几乎就是一切。

## 流媒体服务

实时事件流媒体公司 InfinyOn 筹集了 500 万美元的种子资金，由 Gradient Ventures 和 Fly Ventures 领投，Bessemer Venture Partners、TSVC 等参投。InfinyOn 使用由 Rust 开发的动态数据可编程平台 [Fluvio](https://github.com/infinyon/fluvio) 。Fluvio 拥有超过 1,000 个 Github star，在开发人员和开源社区中越来越受欢迎。

“在 Java 时代构建的遗留数据平台会生成大型二进制文件，需要大量内存，并且从边缘到核心的操作具有挑战性。这些也缺乏实时决策的在线处理能力，”InfinyOn 的联合创始人兼首席技术官 Sehyo Chang 说。“我们通过消除对 ETL 工具的需求来简化数据架构，提供更具成本效益的平台，内存减少高达 80 倍，并通过内存安全解决方案提供最大的安全性。”

“我们整合来自不同来源的医疗保健数据：物联网、患者和医生的输入。借助 InfinyOn，我们可以使用现代工具快速高效地完成这项工作。它是用 Rust 编写的，与 Kafka 相比，这使得团队更容易集成。” Nammu 首席执行官 Chris Brucker 说。

InfinyOn 可以轻松地从多个来源提取、整形和转换数据，并实时计算结果。虽然仍处于 Beta 阶段，但早期采用者已在 InfinyOn 的概念验证中看到了与替代解决方案相比的显着优势。除了易用性和开发速度之外，与其他供应商相比，供应商还看到了总拥有成本的显着降低。

# Rust 其他领域应用

## 软件定义汽车：Rust 的关键作用

> 关键字：软件定义汽车

汽车标准组织 Autosar——其成员包括福特、通用、宝马、博世、大众、丰田、沃尔沃等——在 4 月份宣布在其功能安全工作组 (WG-SAF) 中成立一个新的子组，以探索 Rust 如何能够用于其参考平台之一。SAE International 还  [成立了一个工作组](https://connexionplus.sae.org/communities/community-home/digestviewer/viewthread?GroupId=31&MessageKey=9e947f64-aefc-45cd-aee6-a787818af963&CommunityKey=c9c80476-9027-4edc-953c-65bda22ba7a7)  来研究汽车行业中与安全相关系统的 Rust 。在 5 月份 Autosar 和 Rust 团队进行了一次[交流](https://standardsworks.sae.org/standards-committees/safer-rust-task-force) ，探讨 Safe Rust 在汽车领域是否可以构造一个合规的安全子集，讨论内容就是 Ferrocene Rust 安全子集。

> 随后 Autosar 官网撤销了成立新的 Rust 工作组的新闻，也许是要等待 Ferrocene Rust 的成果。另外，在今年 9 月份，Volvo 汽车公司的技术专家和系统架构师  [Julius Gustavsson 接受了采访](https://medium.com/volvo-cars-engineering/why-volvo-thinks-you-should-have-rust-in-your-car-4320bd639e09)，他坦言，想在 Volvo 中推动 Rust 开发。

### Ferrocene Rust 安全子集

[Ferrous Systems ](https://ferrous-systems.com/blog/ferrous-systems-adacore-joining-forces/)和 [AdaCore ](https://blog.adacore.com/adacore-and-ferrous-systems-joining-forces-to-support-rust) 在今年 2 月份宣布，他们将联手开发 Ferrocene——一种符合安全要求的 Rust 工具链，旨在支持各种受监管市场的需求，例如汽车、航空电子设备、太空和铁路。这意味着根据各种安全标准对 Ferrocene Rust 编译器进行汽车安全性等级 ASIL 的 D 级（D 代表最高程度的汽车危险）认证，这项工作最终将包括必要的动态和静态分析工具的开发和资格认证。Ferrous Systems 和 AdaCore 也在寻找经过安全认证的库，包括语言支持 (libcore) 或其他用户库。我们的目标是针对与这些市场相关的各种架构和操作系统。这一愿景需要时间才能实现，而 Ferrous Systems 和 AdaCore 准备从关注某些特定方面开始。最终，我们的目标是像支持任何其他与高完整性应用程序开发相关的编程语言一样全面地支持 Rust。[Ferrocene 语言规范](https://spec.ferrocene.dev/)目前正在制定中，预计年底发布。

### 其他公司

在 Rust 基金会银牌会员中还有 [ARM](https://www.arm.com/) 也在致力于推动 Rust 在软件定义汽车中落地。

## 即时通信: Threema

> 关键字：即时通信

[Threema](https://threema.ch/en) 是一款跨平台、隐私安全且开源的即时通信工具。

## 密码管理工具： 1Password

> 关键字：跨平台

1Password [很早就使用 Rust 来构建其 Windows 客户端](https://serokell.io/blog/rust-in-production-1password)。在 2019 年将其支持浏览器扩展的逻辑引擎从 Go 移植到了 Rust ，然后就开始了 Rust 跨平台的应用实践。直到 2022 年 11 月，1Password 也开源了其[跨多种语言生成一致的类型模式](https://blog.1password.com/typeshare-for-rust/) 的 [Typeshare](https://github.com/1Password/typeshare) 库。Typeshare 可以帮助开发者实现跨语言无缝同步共享数据类型，这是跨平台安全开发的利器。

## GUI ：目标指向 Qt 市场

> 关键字： Qt、GUI

全球知名 Qt 咨询和 UI/UX 设计服务公司 tQCS 的合作伙伴有两家都加入了 Rust 基金会银牌会员。分别是：

- [KDAB](https://www.kdab.com/) ：在嵌入式系统、3D 图形以及跨桌面、嵌入式和移动平台的工作方面拥有多年经验， KDAB 是 Qt 项目的主要贡献者。他们正在研究[cxx-qt](https://github.com/KDAB/cxx-qt)以使 Qt 和 Rust 更容易地一起使用。
- [Slint](https://slint-ui.com/): 极大地简化了取代 Qt 需求的嵌入式平台的 GUI 开发。支持 Rust/Cpp/Javascript ，有设计友好的 UI 标记语言。其创始人同样来自 Qt 项目主要贡献者，QtQml 引擎的主要开发者。

## 云存储： Dropbox

> 关键字：云存储

Dropbox 是最早使用 Rust 并取得成功的公司之一。Dropbox 将 Rust 用于其部分文件同步引擎。以及一个新的视觉交流工具 [Dropbox Capture](https://www.dropbox.com/capture) ，旨在使团队能够轻松地使用屏幕记录、视频信息、屏幕截图或 GIF 来异步分享他们的工作。

## 边缘计算：Cloudflare

> 关键字：边缘计算、serverless

[Cloudflare](https://github.com/cloudflare) 在其核心边缘逻辑中使用 Rust 来替代内存不安全的 C。Cloudflare worker 支持 Rust 和 WebAssembly 。在今年 9 月份，Cloudflare 还宣布正在用 Rust 实现一款可以替代 Nginx 的代理服务器 [Pingora](https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/) 。

## 迪士尼公司（Walt Disney Company）

> 关键字：WebAssembly 、渲染引擎

迪士尼公司正在用 Rust 构建其  NCP GUI 框架，从[迪士尼的这一职位招聘信息](https://www.builtinnyc.com/job/engineer/lead-software-engineer/181881)中可以得出这一结论。从该公司 2021 年发布的信息[“介绍 Disney+ 应用程序开发工具包 (ADK)”](https://medium.com/disney-streaming/introducing-the-disney-application-development-kit-adk-ad85ca139073)来看， 使用 Rust 主要是构建代号为“m5”的 Native Client Platform v2 (NCPv2) 框架。他们选择了 Rust，以 [WebAssembly](https://webassembly.org/) (WASM) 为目标，以便在限制更新基于 C 的运行时的能力的任何固件更新周期之外简化 Web 部署和应用程序可更新性。该项目已经持续进行了快三年了，现在已经达到了从手持终端到电视，网页等全平台使用同一个渲染引擎来渲染它们的动画。

## 特斯拉

> 关键字：高性能机器人模拟器、固件验证

虽然[马斯克](https://twitter.com/elonmusk/status/1496293976692899843?lang=en)在今年 2 月份于推特上面宣称他是 Rust 语言的粉丝，同时也承认特斯拉主要使用 Cpp 和 Python 。但从今年 11 月份发布的两个 Rust 职位来看，特斯拉也开始采用了 Rust 。其中一个是[特斯拉机器人模拟引擎团队](https://www.theladders.com/job/rust-or-c-developer-software-engineer-tesla-bot-simulations-tesla-palo-alto-ca_60305636)的招聘，正在寻找 Rust 开发人员来扩展用 Rust 编写的高性能机器人模拟引擎。另外一个是 [Rust 固件验证工程师](https://www.tesla.com/careers/search/job/python-rust-c-firmware-validation-engineer-drive-systems-all-levels--98473) ，但该职位对于 Rust 的要求只是“有任何 Rust 经验者优先，但不是必需的”。

## Tweedegolf ： 与太空公司宇宙飞船

> 关键字：PTP、卫星、宇宙飞船、太空

这次 Rust 真的要上天了。[Gama](https://www.gamaspace.com/) 将发射太阳帆宇宙飞船 🛰️，并且是公开将 Rust 送入太空的公司之一。提供软件服务的应该是这家公司：[Tweedegolf](https://tweedegolf.nl/en) ，该公司也是 Rust 基金会银牌会员。他们的[开源仓库](https://github.com/tweedegolf)里有一个 Rust 实现的 PTP (精确时间协议) 库，这个 PTP 一般用在卫星的时间源，比 NTP 更精确。但这个是 PoC 实现，不知道这次发射的飞船上有没有用。从另外的项目 嵌入式开发板 pcf85063a （一般用于计时闹钟）rust 驱动来看，这次上天的 Rust 程序很可能和精确计时相关。

[Gama 太阳帆的卫星于 2023 年 1 月 3 日由 SpaceX 猎鹰 9 号成功送入轨道](https://www.sail-world.com/news/257330/Gama-launches-its-Gama-Alpha-solar-sail-mission)。

## 荷兰 Lightyear 太阳能汽车公司采用 Rust 

> 荷兰 Lightyear 公司将在今年晚些时候开始向客户交付全球首款可量产的太阳能汽车

在 [Tweedegolf 公司的博客网站](https://tweedegolf.nl/nl/blog/76/pioneering-rust-high-tech)上透露，由 Lightyear 公司的软件架构师 Jorrit 在 Tweedegolf 公司组织的[高科技行业 Rust 线下聚会](https://hightechsoftwarecluster.nl/evenementen/rustmeetup/)分享了 Lightyear 公司如何在 Lightyear 核心平台的开发中使用 Rust 。 可能是隐私原因，并没有放出该分享的视频和 ppt 资料。

## 文件数据存储： Qumulo

> 关键字：混合云文件数据管理

Qumulo（混合云文件数据管理领域领导者） 和 西部数据 这两家公司是合作企业，通过部署基于西部数据 UltrastarTM 大容量 HDD 和高性能 SSD 的 Qumulo 可扩展文件数据平台，IHME（健康指标与评估研究所）每天可处理高达 2PB 数据，推进公共流行病研究、统计和预测。 Qumulo 赞助了 RustConf 2022 大会。

## 老牌数据库公司： PostgreSQL

> 关键字：数据库、postgresql

PostgreSQL 赞助了 RustConf 2022 大会，没有发现 PostgreSQL 公司内部有使用 Rust 的痕迹。但是在 GitHub 有一个致力于用 Rust 编写 PostgreSQL 扩展的项目 [pgx](https://github.com/tcdi/pgx)，其中核心开发者 [Ana 博客也有很多相关文章](https://hoverbear.org/tags/postgresql/)。

## 企业数据分析：Redjack

> 关键字：数据分析

Redjack 号称来自美国国家情报机构的技术，每年监控和保护超过 8% 的互联网公共 IP 空间和超过 100 万亿次商业通信，提高可操作的数据使组织能够提高分析的速度和准确性，从而实现大规模运营的安全性和弹性。Redjack 也赞助了 RustConf 2022 大会，以此推断 该公司也有采用 Rust 的可能性。

## 数据科学与人工智能

> 数据科学、AI

Rust 基金会银牌会员中也包括数据科学和人工智能领域的公司：

- [Watchful](https://www.watchful.io/)，以传统标签解决方案无法实现的速度和规模为 AI 标记数据。

## 汽车物联网

> 关键字： IoT

[Wyliodrin](https://wyliodrin.com/) 使用**Rust** , **Tock OS**和**Android**保护设备并构建安全高效的系统。将 Rust 嵌入式实时操作系统 [Tock OS](https://github.com/tock/tock) 推入商业应用中。该公司也加入了 Rust 基金会银牌会员。

##   消息推送服务商：OneSignal

> 关键字：消息推送

消息推送服务商 OneSignal 在 2017 年就开始使用 Rust 了，提供了 Rust Client 来支持推送通知、电子邮件、短信和应用内自助式客户参与解决方案。

## 自动化货运列车：Parallel Systems

> 关键字：货运自动化列车

自动化货运列车 Parallel Systems，相信货运的未来是铁路，所以研发了零排放的自动化电动货运跑在铁路上，Rust 语言是该公司技术栈的通用语言。该公司也赞助了 RustConf 2022 大会。

## Rust 开发工具、平台与工具链支持

> 关键字：开发工具

基于 Rust 实现了一些好用的开发工具，比如：

- [tabnine](https://www.tabnine.com/)，一款基于机器学习的代码自动完成开发工具。
- [Open Source Security](https://opensrcsec.com/) ，该公司加入了 Rust 基金会银牌会员，致力于为 Rust 生态推广做出贡献，目前主要是赞助 GCC Rust 的实现。截止到 2022 年 12 月，[GCC Rust 前端将在 GCC 13 中合并](https://www.phoronix.com/news/GCC-Rust-v4-Cleared-For-Landing)！
- [Embecosm](https://www.embecosm.com/) ，提供开源软件工具链和嵌入式操作系统服务。Embecosm 也是 GCC Rust 前端的赞助商。
- [grafbase](https://grafbase.com/)，构建和部署 GraphQL 后端的服务平台。
- [Rust for Linux](https://github.com/Rust-for-Linux)，Linux 6.1 内核版本[合并了初始的 Rust 基础设施](https://www.phoronix.com/news/Rust-Is-Merged-Linux-6.1)，为未来的内核驱动程序和其他内核代码启用 Rust 编程语言打好了基础。在 11 月 11 号，Rust for Linux 又提交了很多补丁代码到上游内核中。一旦所有这些 Rust 基础设施就位，我们将看到在更突出的现实世界驱动程序开始过渡到 Rust 代码之前需要多长时间，以获得新的硬件支持或在 Rust 中重写现有的 C 驱动程序代码。Rust 在 Linux 内核中的首批主要用户之一预计将是 Apple M1/M2 图形的 DRM 驱动程序。

## 安全监控

> 关键字： 资产安全、事件监控

该领域目前在 Rust 基金会银牌会员中包括以下公司：

- [Spectralops](https://spectralops.io/)，监控、分类和保护代码、资产和基础设施，以防止暴露的 API 密钥、令牌、凭证和高风险安全错误配置。
- [Sentry](https://sentry.io/welcome/)，应用程序监控平台。

## 软件咨询

> 关键字： 软件咨询

目前也涌现出一些 Rust 咨询公司，下面是加入 Rust 基金会银牌会员的公司：

- [knoldus](https://www.knoldus.com/)
- [Ferrous Systems ](https://ferrous-systems.com/blog/ferrous-systems-adacore-joining-forces/)
- [mainmatter](https://mainmatter.com/)
- [Tag1](https://www.tag1consulting.com/)

## 游戏 与 渲染引擎

> 关键字： 游戏

Rust 在游戏领域目前还在发展中。游戏公司动视暴雪作为普通赞助商加入了 Rust 基金会，并且在 2021 年发布了一份由动视暴雪旗下工作室 Treyarch 撰写的 [「用于游戏工具的 Rust 编程语言 」](https://www.activision.com/cdn/research/The_Rust_Programming_Language_for_Game_Tooling.pdf) 调研报告。 Treyarch 自 2018 年以来， 一直在逐步将 Rust 集成到我们的工具和管道中。

另外还有一家值得关注的游戏公司是 [Embark](https://www.embark-studios.com/)，该公司赞助了 Rust 游戏引擎 [Bevy](https://github.com/bevyengine/bevy) 和 [Fyrox](https://github.com/FyroxEngine/Fyrox)，并且开源了 [rust-gpu](https://github.com/EmbarkStudios/rust-gpu) 致力于使 Rust 成为 GPU 着色器的一流语言和生态系统。

## 电商

> 关键字：电商

Rust 也被用于电商领域。

- 美国最大的家具电商公司 Wayfair 旗下的开源项目 [Tremor](https://github.com/tremor-rs/tremor-runtime)，已经进入 CNCF。去年 九月份还召开了一次小型的线上的 [Tremor Conf](https://community.cncf.io/events/details/cncf-tremor-community-presents-tremor-con-2021/) 。从 2018 年开始， tremor 就是跑在了 wayfair 生产环境中，每天处理 10 兆字节的数据，或每分钟 100 亿条消息，每秒 1000 万个指标。tremor 降低了成本，减少了复杂性，巩固和简化了操作环境，以激发 SRE 的乐趣，减少 NOC 的工作量，并降低运营成本。[Rust 为 Wayfair 省掉数千个核心和 TB 级的内存的成本 ](https://www.tremor.rs/slides/2020-03-31-RustAndTellBerlin-functions.pdf)
- [cargurus](https://www.cargurus.com/) ，英国的一家二手车电商网站，也成为了 Rust 基金会普通赞助商成员。

## Web3 与 区块链

> 关键字：Web3 、同态加密、隐私计算、区块链、数字货币、零知识证明

Rust 在 Web3 和 区块链领域已经成为了主流语言。在这些领域耳熟能详的公司和项目很多：

- [Diem](https://github.com/diem/diem) ，前身叫 Libra ，曾经是 Facebook 的稳定币项目，但是现在已经被 Silvergate Capital Corporation 收购。
- 超新公链[aptoslabs](https://aptoslabs.com/) 和 [sui](https://sui.io/)，都是 Diem 团队成员离职创业的两个项目，它们的共同点是都使用 Rust 实现的 Move 语言作为智能合约语言。
- [parastate](https://www.parastate.io/)，波卡生态多链智能合约平台，是 Rust 基金会银牌会员。
- [Zama](https://www.zama.ai/)，为数据科学和 AI 构建开源同态加密解决方案，是 Rust 基金会银牌会员。
- [Keyrock](https://keyrock.eu/) ，部署了专有且高度可扩展的数字资产做市技术，是 Rust 基金会银牌会员。
- [matter-labs](https://matter-labs.io/) ，扩展以太坊  [零知识证明](https://github.com/matter-labs/awesome-zero-knowledge-proofs/) 。
- 日本区块链技术孵化公司 [TECHFUND](https://techfund.jp/en) ，也加入了 Rust 基金会银牌会员。
- 其他。

# 小结

Rust 是一门通用的语言，并且多样化也是 Rust 语言的设计原则之一。本文试图通过罗列 Rust 在各个领域的成功应用案例，来帮助人们了解 Rust 适合落地的业务场景。然而，本文远远未能覆盖 Rust 应用的全部角落，还有我们看不到的地方，正在默默地采用 Rust 。本文也几乎没有罗列国内使用 Rust 的公司，但国内也有公司准备逐步采用 Rust ，只是进展比较慢。

> P.S 你也可以在 GitHub 上查看别人维护的全球范围内[使用 Rust 的公司列表](https://github.com/omarabid/rust-companies)。

Rust 就像一阵“春雨”，随风潜入夜，润物细无声。感谢阅读。
