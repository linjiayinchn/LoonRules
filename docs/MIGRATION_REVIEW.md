# Karing → Loon 迁移审核

基准：2026-11-12 用户上传的 Karing 备份，自定义「🇺🇸 美国规则」中的 320 条 `domain_suffix`。本文件用于审计，不是 Loon 订阅。

## 已处理部分

| 来源 | 处理方式 |
| --- | --- |
| 财经、投资研究和国际媒体 146 条 | 完整保留在 `US_Media_Finance.list` |
| AI 56 条 | 2026-11-12 初期采用 29 条自建补充 + 第三方 AI 主规则的设计；**2026-11-13 已统一为 128 条自主维护的 `AI_Extra.list`**（旧订阅 URL 保留），仍排除 6 条可能影响其他功能的共用 Google/Bing API |
| GitHub 31 条 | 用 blackmatrix7 GitHub 订阅的 `github` 关键词、域名后缀及 `ghcr.io` 规则覆盖；不重复复制 |
| 其他技术与认证域名 87 条 | 9 条在 `US_Extra.list`，11 条在 `PROXY_Extra.list`；苹果登录 4 条由 Apple 订阅覆盖；`registry.npmjs.org` 由 GitHub 订阅中 `npmjs.org` 覆盖；`challenges.cloudflare.com`、`cdnjs.cloudflare.com` 被个人 `cloudflare.com` 后缀规则覆盖；其余 60 条暂不强制美国 |

历史分类及去重基于 2026-11-12 的 Karing 备份；AI 类已在 2026-11-13 升级为独立维护的完整文件。GitHub、Apple 等上游规则仍可能变更，需要根据实际命中情况复核。

## 暂缓强制美国线路的 AI 共用域名（6 条）

这些域名在原 Karing 中被指定美国线路，但可能用于普通 Google/Bing 搜索、地图、自动填充或广告等非 AI 功能，不应直接绑定整套「AI 服务」策略：

- `bing.com`
- `ogads-pa.clients6.google.com`
- `optimizationguide-pa.googleapis.com`
- `content-autofill.googleapis.com`
- `streetviewpixels-pa.googleapis.com`
- `serviceusage.googleapis.com`

## 其他技术/认证域名的暂缓事项

源备份中的 Google 账号登录、Microsoft 登录、Apple ID、Stripe 支付、验证码、WorkOS/Clerk、Sentry、DataDog、分析和广告平台等，可能被大量独立应用共同使用。未经验证，暂不全部强制走美国。

- **账号与认证**：`accounts.google.com`、`oauth2.googleapis.com`、`login.microsoftonline.com`、`appleid.apple.com`、`idmsa.apple.com`、WorkOS/Clerk 相关域名等
- **支付与订阅**：`api.stripe.com`、`checkout.stripe.com`、`js.stripe.com`、`revenuecat.com`
- **验证与反滥用**：`recaptcha.net`、`hcaptcha.com`、`arkoselabs.com`、`funcaptcha.com`
- **Google 常用资源**：`www.google.com`、`www.googleapis.com`、`fonts.googleapis.com`、`maps.googleapis.com`、`play.google.com` 及 gstatic/googleusercontent 常用子域
- **日志、遥测、营销与搜索基础设施**：Sentry、DataDog、SendGrid、Analytics、DoubleClick、Intercom、Algolia 等域名

这些属于**未独立强制美国**，不等于阻断访问；它们仍会受通用代理、国内直连、Apple 等现有规则及 Final 影响。遇到确切连接故障，可以根据 Loon 连接日志给具体主机增加窄范围例外，不建议对整个共用域名强制路由。

## 不要自动添加的内容

- Android 应用包名和 Windows 进程匹配规则：Loon iOS 中无直接对应的等价导入项
- Karing 的 `geosite`/ACL 内置规则：应订阅对应 Loon 格式的上游规则，不复制为不存在的假域名
- 广告/应用净化：没有从 Karing 提取到单独的手动广告域名；`REJECT_Extra` 初始为空
- 国内直连：原配置主要是内置中国域名/IP 规则；`DIRECT_Extra` 初始为空

## 复核方法

1. 看 Loon 连接记录中的实际域名、匹配规则和策略。
2. 如果访问不正常，先判断 DNS、规则冲突、节点地区还是目标站点本身故障。
3. 提出需要调整的**具体域名**，再在对应 `.list` 中增删；公共认证/支付域名优先用单独精确主机规则。
4. 每次修改应记录提交及变更原因。
