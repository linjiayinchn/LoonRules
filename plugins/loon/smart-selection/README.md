# Smart Selection / 智能线路优选

**V0.1.4 — experimental, detection only / 真机测试版，仅检测。**

## 0.1.4

连续失败节点定时巡检按 1/2/4/6 小时退避，恢复后重置；手动诊断仍允许复核。单次运行先检测未测/正常节点并给恢复候选保留位置。手动诊断在核心测速完成且有余量时追加 Cloudflare trace 出口观察（进入已知故障节点复检前，先观察已完成的正常节点），仅记录本轮匿名编号（E1/E2 等）和服务数据中心，不持久化真实 IP 或其哈希；不同编号说明观察到不同出口，不证明每个请求均正确走指定节点，仍须核对 Loon 请求记录。未回调时仍停止本批，避免未知并发。

## 0.1.3

真机测试后调整：轻量请求超时 5 秒，下载 15 秒；回调 watchdog 额外 4 秒，未确认请求结束时仍安全停止。优先补测未尝试节点；已选节点名称不匹配时明确标注，绝不模糊匹配。耗时波动仅比较同一目标的重复请求；首轮缺少波动数据时按其余权重归一化，仍标为初步。旧记录无需迁移。

## 0.1.2

统一手动入口「一键诊断」：读取全部指定策略组，运行本轮全部检测项目，并在同一脚本日志内输出组内候选结构、逐节点原始请求结果、排名、预算、覆盖范围、停止原因及诊断状态。只需导出这一次日志。单轮上限仍为 6 节点/16 MB，未覆盖节点后续轮询，不宣称单次测完所有节点。旧版质量报告入口仅保留代码兼容。

## 0.1.1

修复真机候选节点对象数组解析：支持 `{name,type}` 和旧版名称字符串数组；仅检测叶子节点，未知类型跳过；日志新增数据结构计数，不输出原始节点描述。保留既有本地预算与历史记录。

## 安装 / Install

Loon 3.5.1 (983)+: add [Smart_Selection.plugin](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/plugins/loon/Smart_Selection.plugin) as a remote plugin. 不需要修改现有 url-test 策略组、规则、MitM 或订阅。

- 每日预算默认 200 MB，全部组共享；可选 50/100/200/300 MB。
- 策略组留空自动发现；也可填写 `所有可用线路;美国线路;香港线路;日本线路`。
- 首次保持定时检测关闭，从 Generic 手动入口运行「Smart Selection · 一键诊断」。每轮最多 6 个去重节点、16 MB 预扣预算、约 155 秒测速时间（另有发现及收尾开销）。
- 同一次运行即显示独立组排名；完整逐节点 JSON 与错误类型在同一脚本日志的 SMART_SELECTION_DIAGNOSTIC_BEGIN/END 区段，不需要另行运行质量报告。多运行几轮，未测节点会轮询进入队列。
- 若入口允许传入策略组或节点上下文，检测限于该范围；入口参数形式需真机验证。
- 确认实测正常后，可选开启每 30 分钟巡检。iOS 后台调度不保证准时。
- 原生 url-test 仍可能自行切换；本插件没有任何策略修改调用。

## 测量与限制 / Measurement and limitations

Two independent HTTPS HEAD targets (Google and Apple), plus Cloudflare 2 MB download with optional 5 MB refinement for short samples. Requests are serial, directed to named leaf nodes, with certificate checks and redirects/cookies disabled. A valid download must be binary, HTTP 200 and exactly the requested length. The rate includes all request overhead; it is not peak link bandwidth. The second throughput provider is not implemented. V0.1.4 adds a limited manual egress observation, not definitive per-request route verification; compare with external speed tests and Loon request records before trusting routing decisions.

评分：40%有效吞吐量、20% HTTP 响应时间、30%历史请求成功率、10%同一目标重复请求耗时波动（缺失时其余权重归一化）；速度效用随速度递增而趋于饱和。成功率指探测请求成功率，不是网络丢包率。历史使用近期加权；只有最新有效下载才允许评分；样本不足明确标注。共享数据按网络标识和节点名称复用，各组独立排序。节点名称是临时标识；同名节点在订阅更新后可能发生变化。Wi-Fi SSID 仅本地保存非加密哈希；其他网络身份未核实，历史最多使用 2 小时，不视为独立蜂窝识别。叶子节点之外的嵌套策略、内置策略和常见公告伪节点跳过，不会自行跨组。

Budget reserves requested bytes plus 16 KB per request before sending; timeouts and interrupted attempts remain charged. It is an estimate, not actual carrier accounting; oversized responses and transport overhead can exceed estimates. No extra downloads once the daily budget or per-run cap is insufficient. Device local day resets the shared ledger. The storage lease is best-effort, not an atomic lock. Do not overlap manual and scheduled tests until verified. All measurements and reports stay in local script storage/logs. Probe endpoints see the usual network request metadata. No credentials, SSID text or public IP are intentionally logged.

## 真机验收 / Device acceptance

1. 四组名称及候选数与 Loon 实际界面对照。报告中显示未测试、被跳过及错误状态。
2. 选择快慢明显的两条节点，重复检测并通过相同节点运行独立测速；记录 Loon 请求日志的实际节点以确认显式路由。
3. 核对各组排序、有效吞吐量、预扣预算、实际流量记录；重复节点不应在同一批反复下载（自适应复测除外）。
4. 测试超时、断网、节点移除、Wi-Fi/蜂窝切换；保存 JSON 日志及 Loon 版本。不需要提供机场订阅 URL、密码或节点密钥。
5. V0.1 通过真机验收之后才进入 V0.2 自动接管；V1.0 在持续使用、回归测试及文档完善后发布。

## Tests

`node plugins/loon/smart-selection/tests/smart-selection.test.js`

Mocked Loon adapters cover group discovery/isolation, shared probing, ranking, budget, invalid data, failure and read-only behavior. They do not emulate iOS networking or Loon plugin parsing.

References: [Loon Script API](https://nsloon.app/docs/Script/script_api/), [Plugin arguments](https://nsloon.app/docs/Plugin/), [Script syntax](https://nsloon.app/docs/Script/script_v2/), [Cloudflare speedtest](https://github.com/cloudflare/speedtest).
