# Development notes

## Repository conventions

Review all README files for every development change and update affected user-facing functionality, setup, settings and structure in the same commit. Keep public documentation bilingual, written for new users, with practical instructions and no internal process narration. User-facing interfaces should use natural product language, show only useful results and actionable exceptions, and keep raw logs, compatibility experiments, test requirements and implementation details separate. Preserve truthful claims and material usage requirements.

## Smart Selection technical reference

Current candidate: 1.0.0-rc.4. The core measurement engine has device evidence from previous builds; actual automatic switching and new quiet-hours behavior require device acceptance. The underlying Loon group type is not reliably exposed. Only configure node-only select groups for automatic selection; explicit scope is available for other configurations. Runtime measurements are shared by node and network identity. The stored daily ledger is an estimate, not carrier accounting.

## 测量与决策 / Measurement and decisions

- Google/Apple HTTPS HEAD (5 s timeout), Cloudflare binary download (2 MB, adaptive 5 MB, 15 s timeout). Valid download requires HTTP 200 and exact byte length; TLS verified, no redirects. Serial probing, pre-charge requested bytes plus 16 KB allowance. Effective end-to-end throughput, not peak bandwidth.
- 评分：下载40%、HTTP响应20%、历史请求成功率30%、同目标重复请求波动10%；缺少波动时其余权重归一化。历史速度近期加权，未知及过期样本不用于切换。失败自动复检退避1/2/4/6小时；优先覆盖未测节点。
- 普通切换须当前与候选本轮均有可比较下载、候选至少2次有效样本、成功率≥80%、下载记录不超过1小时；评分至少提升10分，或同时提升至少5分及15%且速度提升至少25%，连续两轮确认。已确认故障（连续两轮完整检测且无有效下载）允许跳过普通冷却；未回调不能当作已确认故障。当前与候选必须精确属于同一组。
- 独立决策，操作前重新读取成员和当前选择，写入后回读验证；外部选择保护2小时，切换失败保护2小时。网络身份未识别时不自动修改策略；网络变化触发重检，Wi-Fi 历史按本地 SSID 哈希区分。在复检已知故障节点及可选出口诊断之前，先完成已经取得可比较样本的独立管理组决策；每组每轮只决策一次。回调未结束或网络变化后不再启动新的切换或请求，已完成的决策保留。诊断报告列出实际传入的自动选路开关、全选或指定范围、符合条件的管理组名单；观察模式不代表切换失败。未检测到用户操作发生的精确时间，只能通过两次巡检选择变化推断。
- 定时任务在12点前最多使用当天预算50%，18点前75%，之后100%；手动诊断可使用剩余全天预算。预算是预扣估算而非运营商精确计数；失败仍计入，响应超出预期及协议开销可能增加消耗。存储租约为尽力互斥，非原子锁。
- 手动出口观察只输出本轮匿名编号和服务数据中心，不输出原始IP；不同编号只能证明观察到不同出口，非每次请求的完整路由验证。第二个独立下载服务暂未实现。



## Quiet hours

Default 00:00–08:00 local device time; start inclusive, end exclusive. Supports same-day and overnight intervals. Enabled by default; disabling skips time validation. Equal endpoints and invalid HH:mm are configuration errors. All probe triggers respect the schedule, including manual Check Now. Read-only legacy quality reports remain accessible. Before each request and before each switch (including after membership preflight), recheck the clock. A request already sent before quiet hours may finish; no new probes or selection writes begin during the interval. Do not record incomplete samples caused by the quiet-hours boundary as failures. No budget reservation on skipped runs. Resume depends on normal Loon scheduling; there is no separate wake timer.

## Diagnostics and testing

The user-facing result shows current/recommended nodes, budget and plain-language selection status. Complete structured diagnostics remain in script logs (SMART_SELECTION_DIAGNOSTIC_BEGIN/END). Use those logs for troubleshooting; do not require routine manual testing.

`node --check plugins/loon/smart-selection/Smart_Selection.js`

`node plugins/loon/smart-selection/tests/smart-selection.test.js`

Mock tests cover group discovery, isolation, ranking, shared budget, failure backoff, route observation, selection safeguards, and quiet-hours boundaries. GitHub Actions runs plugin tests separately from rule updates. Device testing is required for Loon plugin parsing, background scheduling and actual selection writes.

References: [Loon Script API](https://nsloon.app/docs/Script/script_api/), [Plugin arguments](https://nsloon.app/docs/Plugin/), [Script syntax](https://nsloon.app/docs/Script/script_v2/), [Cloudflare speedtest](https://github.com/cloudflare/speedtest).
