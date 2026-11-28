# Smart Selection

Smart Selection 是一款 Loon 智能线路优选插件，综合下载速度、响应时间和稳定性，为不同策略组选择表现更好的节点，减少频繁切换。

Smart Selection is a Loon plugin that selects nodes based on download speed, response time and reliability, with independent selection for each policy group.

## 功能 / Features

- 智能选路：综合线路质量与历史表现，按策略组独立优选。 / Quality-based selection within each policy group.
- 自动检测：定时测速，网络变化时重新评估。 / Scheduled checks and reassessment on network changes.
- 稳定连接：识别故障线路，避免因微小评分差异频繁切换。 / Fault recovery and switching protection.
- 流量管理：所有策略组共享每日测速预算。 / Shared daily traffic budget.
- 休眠时段：在指定时间内暂停测速和选路。 / Custom quiet hours.
- 切换通知：可选接收线路切换提醒。 / Optional switch notifications.

## 安装 / Installation

适用于 Loon 3.5.1 (983) 及以上版本。 / Requires Loon 3.5.1 (983) or later.

[添加 Smart Selection](https://raw.githubusercontent.com/GFStillpoint/RoutingRules/main/plugins/loon/Smart_Selection.plugin)

1. 在 Loon 的插件页面添加上述订阅地址。 / Add the URL in Loon's plugin settings.
2. 将需要自动优选的策略组设为 `select`，保留原有节点及分流设置。 / Set the policy groups to `select`, retaining their nodes and routing rules.
3. 在「管理策略组」中留空以管理全部符合条件的线路组，或填写指定组名，以英文分号分隔。 / Leave Managed Groups blank to include all eligible node-only groups, or enter group names separated by semicolons.

包含直连、拒绝或嵌套策略的组保留原有选择；如只希望管理部分纯节点组，请填写组名。 / Mixed and nested policy groups retain their original selection. Specify group names to manage only a subset of node-only groups.

## 设置 / Settings

| 设置 / Setting | 默认值 / Default | 说明 / Description |
| --- | --- | --- |
| 管理策略组 / Managed Groups | 全部 / All | 留空即全选 / Blank includes all eligible groups |
| 自动选路 / Auto Selection | 开启 / On | 根据质量选择线路 / Select nodes by quality |
| 自动检测 / Automatic Checks | 开启 / On | 每30分钟及网络变化时检测 / Every 30 minutes and on network changes |
| 每日测速预算 / Daily Budget | 200 MB | 50、100、200、300 MB 可选 / Shared across groups |
| 休眠时段 / Quiet Hours | 开启 / On | 暂停测速与选路 / Pause probes and selection |
| 休眠开始 / Start | 00:00 | 24小时制 / 24-hour time |
| 休眠结束 / End | 08:00 | 24小时制 / 24-hour time |
| 切换通知 / Notifications | 关闭 / Off | 成功切换时通知 / Notify on successful switches |

休眠时间以设备本地时间为准，支持跨午夜（如 23:00–07:00）。休眠期间所有检测暂停，现有线路继续使用；结束后随下一次自动检测恢复。需要临时测速时，可关闭休眠开关后执行「立即检测」。

Quiet hours follow the device's local time and can span midnight, e.g. 23:00–07:00. The current connection remains in use while checks and selection are paused. Automatic checks resume at the next scheduled opportunity. Turn quiet hours off to run an immediate check during that period.

## 使用 / Usage

开启自动检测和自动选路后，插件会根据线路质量自动调整。可运行「立即检测」查看当前线路、推荐线路和测速预算；关闭自动选路后仍可测速。切换通知可按需开启。

With automatic checks and selection enabled, the plugin evaluates and adjusts routes. Run **Check Now** to view current and recommended nodes and daily budget. Disable automatic selection to monitor quality without changing nodes.

测速预算为预计消耗量，包含请求预留开销。自动检测时间取决于 Loon 的后台调度。 / The budget estimates probe traffic, including request overhead. Automatic checks depend on Loon's scheduling.

[版本记录 / Version history](https://github.com/GFStillpoint/RoutingRules/commits/main/plugins/loon/smart-selection/) · [反馈 / Issues](https://github.com/GFStillpoint/RoutingRules/issues)
