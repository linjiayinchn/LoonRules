# Smart Selection / 智能线路优选

**1.0.0-rc.1 — 1.0 功能候选版 / 1.0 release candidate. 真机自动切换尚待集中验收。**

Smart Selection 为 Loon 的指定策略组独立执行质量检测和智能选路。测速数据跨组去重复用，不改变分流规则、机场订阅或其他未管理策略组。

Smart Selection measures and selects nodes independently within explicitly managed Loon policy groups, sharing probe data without changing routing rules or subscriptions.

## 安装 / Installation

Loon 3.5.1 (983)+: [Smart_Selection.plugin](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/plugins/loon/Smart_Selection.plugin).

1. 更新或添加远程插件。检测范围「策略组名称」留空发现所有组，或填写指定组。
2. **启用自动选路：**将希望接管的组从 `url-test` 改为 `select`，保留名称、节点筛选、规则绑定；在「自动选路管理组」填入这些组的精确名称，以英文分号隔开。管理组为空不会修改任何组。默认自动选路开关开启；关掉即可停止切换。
3. 默认每30分钟巡检，网络变化也触发；iOS 后台不保证准时。执行「一键诊断」可立即收集一份包含检测、评分、预算、出口观察及选路决定的日志。
4. 不使用 MitM，无额外服务端。只管理叶子节点组。组类型无法可靠从公开配置摘要读取，须由用户确认已设为 select。

For automatic selection, convert the desired groups to `select`, preserve their names and membership, and enter their exact names in Managed Groups. The auto-select toggle is enabled by default, but an empty allowlist makes the plugin observe-only. Scheduled checks are enabled by default; use the one-click diagnostic for a unified log.

## 参数 / Settings

| 参数 / Setting | 默认 / Default |
| --- | --- |
| 每日共享预算 / Shared daily budget | 200 MB (50/100/200/300 selectable) |
| 单轮限制 / Batch cap | 6 nodes / 16 MB / 155 s probing |
| 定时与网络变化 / Scheduled and network-change checks | Enabled, every 30 min |
| 自动选路 / Auto selection | Enabled for explicitly managed groups |
| 切换通知 / Switch notification | Off |
| 普通切换冷却 / Switch cooldown | 30 min |
| 外部选择保护 / External selection hold | 2 h |

## 测量与决策 / Measurement and decisions

- Google/Apple HTTPS HEAD (5 s timeout), Cloudflare binary download (2 MB, adaptive 5 MB, 15 s timeout). Valid download requires HTTP 200 and exact byte length; TLS verified, no redirects. Serial probing, pre-charge requested bytes plus 16 KB allowance. Effective end-to-end throughput, not peak bandwidth.
- 评分：下载40%、HTTP响应20%、历史请求成功率30%、同目标重复请求波动10%；缺少波动时其余权重归一化。历史速度近期加权，未知及过期样本不用于切换。失败自动复检退避1/2/4/6小时；优先覆盖未测节点。
- 普通切换须当前与候选本轮均有可比较下载、候选至少2次有效样本、成功率≥80%、下载记录不超过1小时；评分至少提升10分，或同时提升至少5分及15%且速度提升至少25%，连续两轮确认。已确认故障（连续两轮完整检测且无有效下载）允许跳过普通冷却；未回调不能当作已确认故障。当前与候选必须精确属于同一组。
- 独立决策，操作前重新读取成员和当前选择，写入后回读验证；外部选择保护2小时，切换失败保护2小时。网络身份未识别时不自动修改策略；网络变化触发重检，Wi-Fi 历史按本地 SSID 哈希区分。回调未结束或网络变化的本轮不切换。未检测到用户操作发生的精确时间，只能通过两次巡检选择变化推断。
- 定时任务在12点前最多使用当天预算50%，18点前75%，之后100%；手动诊断可使用剩余全天预算。预算是预扣估算而非运营商精确计数；失败仍计入，响应超出预期及协议开销可能增加消耗。存储租约为尽力互斥，非原子锁。
- 手动出口观察只输出本轮匿名编号和服务数据中心，不输出原始IP；不同编号只能证明观察到不同出口，非每次请求的完整路由验证。第二个独立下载服务暂未实现。

## 验收与回退 / Acceptance and rollback

本候选版整合原0.2与1.0核心选路功能，仍需一次集中真机验收；模拟测试不能替代 iOS 实际调度、切换、网络身份及请求路径验证。请导出一次「一键诊断」日志（含 SMART_SELECTION_DIAGNOSTIC_BEGIN/END）。检查各组选择、决策理由、回读结果、预算与出口编号。无需提供节点密钥或订阅地址。

关闭自动选路或清空管理组可停止写入；关闭定时检测可停止后台巡检；恢复原有组类型可恢复 Loon 原生自动优选。插件卸载不修改规则集。

Disable auto selection or clear Managed Groups to stop policy writes. Disable scheduled checks to stop background probes. Restore the previous policy type to resume native Loon selection.

## Tests

`node --check plugins/loon/smart-selection/Smart_Selection.js`

`node plugins/loon/smart-selection/tests/smart-selection.test.js`

Mocked adapters cover discovery, ranking, deduplication, budgets, failure backoff, anonymous egress observation, group isolation, confirmed quality switches, manual holds and failure recovery. Independent GitHub Actions workflow.

References: [Loon Script API](https://nsloon.app/docs/Script/script_api/), [Plugin arguments](https://nsloon.app/docs/Plugin/), [Script syntax](https://nsloon.app/docs/Script/script_v2/), [Cloudflare speedtest](https://github.com/cloudflare/speedtest).
