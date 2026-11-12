# 论规则 · LoonRules

个人维护的 Loon 分流规则仓库。分类保存自定义域名规则，Loon 订阅同一路径后可持续更新。

## 规则文件与用途

| 文件 | 建议在 Loon 中绑定的策略 | 说明 |
| --- | --- | --- |
| `rules/US_Media_Finance.list` | 美国节点 | Karing 备份的财经与国际媒体域名，146 条 |
| `rules/AI_Extra.list` | AI 服务 | 补充第三方 AI 规则未覆盖的网站 |
| `rules/GitHub_Extra.list` | 美国节点 | GitHub 规则补充 |
| `rules/Apple_Extra.list` | 苹果服务 | 苹果服务补充 |
| `rules/US_Extra.list` | 美国节点 | 其他美国线路例外 |
| `rules/DIRECT_Extra.list` | DIRECT | 手动直连例外 |
| `rules/PROXY_Extra.list` | Available | 其他代理例外 |
| `rules/REJECT_Extra.list` | REJECT | 拦截例外 |

除 `US_Media_Finance.list` 外，其余文件初始只有注释，不含生效规则；有内容以后再单独订阅。

## 订阅

当前仓库为 **Private**。Loon 普通远程规则订阅通常无法直接下载私有仓库 Raw 文件。要使用下方 Raw 链接，请在 GitHub 仓库 Settings → General → Danger Zone → Change repository visibility 将仓库改为 Public（仅在确认公开其中域名列表可以接受后操作）。不要将 GitHub Token 拼进订阅 URL。

公开后：

`https://raw.githubusercontent.com/linjiayinchn/LoonRules/main/rules/US_Media_Finance.list`

在 Loon 规则订阅中添加 URL，选择对应策略并更新。规则文件不内置策略或节点信息。

## 上游规则（建议直接订阅作者）

- AI: https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/rule/AI.list
- GitHub: https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/GitHub/GitHub.list
- Apple: https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Apple/Apple.list
- Apple_Domain: https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Apple/Apple_Domain.list
- Proxy: https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Proxy/Proxy.list
- Proxy_Domain: https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Proxy/Proxy_Domain.list

## 后续维护

向 ChatGPT 提出具体网站的增加、删除、替换或分类需求。修改前先读取 GitHub 文件及 SHA，检查格式、重复、交叉覆盖，再提交新版本并说明变更。Raw URL 不因文件内容更新而变化。

本仓库只存域名分流规则。请勿提交节点订阅 URL、密码、密钥、Cookie、Token、完整 Karing 备份或含敏感数据的抓包。
