# RoutingRules

RoutingRules 是一个持续维护的网络分流规则集，按服务类型整理域名与 IP 规则，并提供适配不同客户端的订阅文件及网络规则扩展。

RoutingRules is a curated and continuously maintained collection of network routing rules. It organizes domain and IP rules by service category and publishes client-specific subscription files and network rule extensions.

## 架构 / Architecture

统一整理规则，按客户端格式发布。上游来源与自定义规则独立维护，特定网络场景的规则扩展以客户端插件形式提供。 / Rules are processed centrally and published in client-specific formats. Upstream sources and custom rules are maintained separately; specialized network rules are provided as client-specific plugins.

![RoutingRules architecture / 项目架构](assets/architecture.svg)

## 规则分类 / Rule Categories

| 分类 / Category | 内容 / Coverage |
| --- | --- |
| US | AI 服务、Google 生态、全球财经与新闻媒体 / AI services, Google ecosystem, financial news and international media |
| Crypto | 加密资产、交易所、钱包、行情分析、量化交易及链上服务 / Crypto assets, exchanges, wallets, market analytics, algorithmic trading and on-chain services |
| Overseas | GitHub、国际网站及网络工具 / GitHub, international websites and online utilities |
| Direct | 中国大陆常用服务、银行、支付及 Apple 服务 / Mainland Chinese services, banking, payments and Apple services |

## 订阅地址 / Subscriptions

选择客户端对应的格式，复制链接添加至远程规则或 Rule Set，为各分类配置所需的连接策略。

Choose the format for your client, copy its URL into a remote rule or rule set, and assign a connection policy to each category.

| 分类 / Category | Loon (LIST) | sing-box (SRS) | sing-box (JSON) |
| --- | --- | --- | --- |
| US | [US.list](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/loon/US.list) | [US.srs](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/US.srs) | [US.json](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/US.json) |
| Crypto | [Crypto.list](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/loon/Crypto.list) | [Crypto.srs](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/Crypto.srs) | [Crypto.json](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/Crypto.json) |
| Overseas | [Overseas.list](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/loon/Overseas.list) | [Overseas.srs](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/Overseas.srs) | [Overseas.json](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/Overseas.json) |
| Direct | [Direct.list](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/loon/Direct.list) | [Direct.srs](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/Direct.srs) | [Direct.json](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/subscriptions/sing-box/Direct.json) |

### 快速开始 / Quick Start

**Loon:** 在规则设置中添加远程规则，填入 LIST 地址并选择策略。 / Add a remote rule using its LIST URL and select a policy.

**Karing:** 在分流规则中添加自定义规则组，填入 SRS 或 JSON 地址并选择策略。 / Create a custom diversion group, add the SRS or JSON rule-set URL, and select a policy.

建议优先匹配 US、Crypto 等专项规则，再匹配 Overseas、Direct 等基础规则。同层级的匹配顺序和默认策略由客户端配置。 / Match specialized rules (US and Crypto) before general rules (Overseas and Direct). Choose the order within each tier and the default policy in your client.

## 规则质量 / Rule Quality

构建时移除基础规则中与专项规则完全相同的条目。同层级规则的重复项以及域名后缀、关键词、IP 网段等匹配范围重叠项保留，由客户端处理优先级。

Exact duplicates of specialized rules are removed from general rule sets during the build. Duplicates within each tier and detected domain, keyword and IP range overlaps remain available for client-side priority selection.

[冲突报告 / Conflict report](reports/conflicts.md) · [结构化数据 / JSON](reports/conflicts.json)

## 规则扩展与插件 / Rule Extensions & Plugins

针对特定网络场景，项目同时提供可独立启用的客户端规则插件。 / The project also provides independently enabled rule plugins for specialized network scenarios.

| 客户端 / Client | 插件 / Plugin | 功能 / Features |
| --- | --- | --- |
| Loon | [Device Loopback](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/plugins/loon/Device_Loopback.plugin) | 通过 Loon 处理本地开发服务的回环连接，使兼容的 iOS 开发工具能够在使用 Loon 时访问本地服务，避免为此反复切换 LocalDevVPN。 / Handles local development loopback traffic through Loon, allowing compatible iOS development tools to access local services without repeatedly switching to LocalDevVPN. |
| Loon | [Smart Selection](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/plugins/loon/Smart_Selection.plugin) · [使用说明 / Guide](plugins/loon/smart-selection/README.md) | 1.0.0-rc.3：多策略组独立智能选路、真实下载测速、历史评分和共享每日预算（默认200 MB）；管理范围留空即全选纯节点组（须预先设置为 select），支持暂停接管和一键诊断。候选版，真机自动切换待验收。 / Independent quality-based node selection, real downloads, historical scoring and a shared daily budget (200 MB default); blank scope includes eligible leaf-only groups (configure as select first), pause control and unified diagnostics. Device acceptance pending. |

在 Loon 的插件页面添加对应链接即可使用。 / Add the plugin URL in Loon's plugin settings.


## 自动更新 / Automatic Updates

项目每天同步上游规则，与自定义规则统一整理、去重及校验，并生成各客户端的订阅文件。 / Upstream and custom rules are merged, deduplicated and validated daily before being exported into client-specific subscription files.

更新计划 / Schedule: **00:17 UTC (08:17 UTC+8)**

插件测试由独立工作流运行，不阻塞规则订阅的日常生成。 / Plugin tests run in an independent workflow and do not block daily rule generation.

## 项目结构 / Project Structure

| 目录 / Directory | 用途 / Purpose |
| --- | --- |
| [sources/upstream/](sources/upstream/) | 上游来源配置 / Upstream source registry |
| [sources/custom/](sources/custom/) | 自定义规则 / Curated custom rules |
| [subscriptions/](subscriptions/) | 按客户端格式发布的规则 / Client-specific subscriptions |
| [scripts/](scripts/) | 统一规则整理及各格式生成 / Shared rule processing and format-specific exporters |
| [plugins/](plugins/) | 客户端规则扩展 / Client-specific rule plugins |
| [reports/](reports/) | 规则质量检测报告 / Rule quality reports |
| [assets/](assets/) | 项目文档图示 / Documentation diagrams |
| [.github/workflows/](.github/workflows/) | 自动更新与发布 / Automated updates and publishing |

基础规则来源包括 [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)，并结合本项目维护的服务域名。 / Base rules draw on [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script), supplemented by curated service domains.

开发维护约定 / Documentation maintenance: 每次开发变更须审查仓库内全部 README，并在同一提交中更新受影响的功能、版本、配置、安装说明与目录结构；未受影响的文档不作无意义改动。 / Review every README on each development change; update affected features, versions, configuration, installation and layout in the same commit, leaving unrelated text unchanged.

欢迎通过 Issues 或 Pull Requests 提供建议与补充规则。 / Suggestions and contributions are welcome through Issues and Pull Requests.
