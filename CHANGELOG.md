# 变更记录

## 2026-11-13 · 加密货币/Web3 规则集

- 新增 `rules/Crypto_Web3.list`，188 条独立域名后缀，覆盖 Phantom、GMGN、Fomo、Solana、交易所、DeFi、钱包、区块浏览器、RPC、行情平台等 10 类。
- 未照搬第三方旧规则库；排除已停运站点、明显易误伤的共用认证和 CDN 域名。
- 官方主域名、历史域名与规则非安全白名单的注意事项已写入规则文件及 README。

## 2026-11-12 · 第二轮

- 确认仓库已调整为 Public，Loon 可直接读取 Raw URL。
- `AI_Extra.list`：新增 29 条 Karing AI 域名补充规则。
- `US_Extra.list`：新增 9 条美国专用网站/工具域名。
- `PROXY_Extra.list`：新增 11 条国外通用技术资源规则（不强制美国）。
- GitHub、Apple、DIRECT、REJECT 四份补充规则保留为空，说明相应上游覆盖或无原始手动规则。
- 增加迁移审核文档，暂缓对共享认证、支付和通用资源域名强制美国线路。
- 更新 README，说明 Loon 中对应的策略组、订阅地址及维护流程。

## 2026-11-12 · 第一轮

- 从 Karing 美国规则提取 146 条财经/国际媒体域名，生成 `US_Media_Finance.list`。
- 初始化个人多文件 Loon 规则仓库结构。
