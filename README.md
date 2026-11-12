# 论规则｜LoonRules

这是个人维护的 Loon 远程分流规则仓库。2026-11-12 依据 Karing 1.2.25 的自定义规则迁移，并保留可持续更新的固定订阅 URL。

**重要：** 本仓库现在为 Public，只存规则，不存节点订阅、代理密码、密钥、Cookie、Token、完整备份或抓包内容。

## 立即可用的订阅

在 Loon → 配置 → 规则 → 订阅规则中添加相应 Raw URL，并选择右侧策略。**规则文件中不写策略名称**，在 Loon 里绑定即可。

| 文件 | 当前有效规则 | 建议策略 | 说明 |
| --- | ---: | --- | --- |
| [US_Media_Finance.list](rules/US_Media_Finance.list) | 146 | 美国节点 | 财经金融与国际媒体，按原 Karing 手工域名保留 |
| [AI_Extra.list](rules/AI_Extra.list) | 29 | AI 服务 | 未被现用 AI 合集明确覆盖的个人补充 |
| [US_Extra.list](rules/US_Extra.list) | 9 | 美国节点 | 文档网站和 IP 检测等指定美国服务 |
| [PROXY_Extra.list](rules/PROXY_Extra.list) | 11 | Available／国外服务 | 常用国外技术资源；不强制走美国 |
| [GitHub_Extra.list](rules/GitHub_Extra.list) | 0 | 美国节点 | GitHub 基础域名由上游订阅覆盖，暂不添加 |
| [Apple_Extra.list](rules/Apple_Extra.list) | 0 | 苹果服务 | 苹果服务由上游订阅覆盖，暂不添加 |
| [DIRECT_Extra.list](rules/DIRECT_Extra.list) | 0 | DIRECT | 国内直连由现有 CN 规则负责 |
| [REJECT_Extra.list](rules/REJECT_Extra.list) | 0 | REJECT | 广告拦截由专用规则负责，不凭空添加 |

Raw URL 格式：`https://raw.githubusercontent.com/linjiayinchn/LoonRules/main/rules/<文件名>`

例如，美国财经与国际媒体：
`https://raw.githubusercontent.com/linjiayinchn/LoonRules/main/rules/US_Media_Finance.list`

建议只订阅**有有效规则的 4 个文件**。其余文件保留作将来新增例外。不要因为文件存在就全量启用空规则订阅。

## 推荐沿用的第三方订阅（不复制到本仓库）

| 订阅 | 绑定策略 | URL |
| --- | --- | --- |
| AI 合集 | AI 服务 | https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/rule/AI.list |
| GitHub | 美国节点 | https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/GitHub/GitHub.list |
| Apple | 苹果服务（默认 DIRECT） | https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Apple/Apple.list |
| Apple_Domain | 苹果服务（默认 DIRECT） | https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Apple/Apple_Domain.list |
| Global / Proxy | Available | https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Proxy/Proxy.list |
| Global_Domain / Proxy_Domain | Available | https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Proxy/Proxy_Domain.list |

国内服务继续使用原有的 `GEOIP_CN → DIRECT` 订阅及独立的 `GEOIP,CN,DIRECT,no-resolve` 本地规则；Final 保留 Available。**匹配是否生效以 Loon 连接记录为准**，规则优先级可能受文件内容和订阅加载次序影响。

## 从 Karing 迁移的原则

美国手工域名总共 320 条，其中财经媒体 146 条、AI 56 条、GitHub 31 条、其他技术/认证域名 87 条。

AI、GitHub、Apple 中已经被上游覆盖的部分，不再重复复制。身份认证、支付、验证码、公共域名与分析服务不会直接全部强制美国节点；详见 [迁移审核说明](docs/MIGRATION_REVIEW.md)。

该审核清单不是生效规则。对这些域名的迁移需以连接记录和具体用途逐项确认。

## 日后修改流程

你可以直接向 ChatGPT 提出具体网站/域名的增删改或重新分类要求。我应先读取 GitHub 对应文件和现有 SHA，检查重复及潜在冲突，再提交并记录 [变更记录](CHANGELOG.md)。**更新文件内容不会改变订阅 URL**；在 Loon 更新远程订阅即可生效。

建议别对所有分类使用同一个美国策略：AI 服务可以选择稳定美国节点，财经媒体使用美国节点，Google、CDN 等国外通用内容使用 Available；苹果服务默认 DIRECT，遇到确实需要代理的具体服务再另设例外。
