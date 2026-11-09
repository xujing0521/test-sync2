# 单独做事件动态示例

做出这项决定时，仓库里已有 `nexus-commit-webhook`，负责 Webhook 地址的创建与作废，以及把请求写成工单或工作项评论。事件动态要在同一次安装里展示五类平台事件，并走完定时汇总再发布、再消费的闭环。两个教学目的放进同一个应用会缠在一起，所以新建 `nexus-event-feed`。当前分支已移除原 Webhook 示例。

## Considered Options

- 扩展 `nexus-commit-webhook`。拒绝。那个示例要讲清的是地址管理和评论，不是五类平台事件。
