# Rule: Agents — 委派准则

## 什么时候派子代理

派子代理（Agent 工具）能隔离上下文、降低主线负担、并行推进。适合：

- **广域探索/搜索**：在大代码库里找实现、理清结构 —— 用 `Explore`（只读）。
- **独立可并行的子任务**：多个互不依赖的调研/实现可同时跑。
- **专项深度任务**：规划、架构、安全审查、E2E 等有明确边界的工作。
- **减少主上下文污染**：大量文件读取放到子代理里做，只回传结论。

## 派哪个（对应 EFW/agents/）

| 场景 | 子代理 | Agent 类型 |
| --- | --- | --- |
| 拆需求做计划 | planner | Plan（只读） |
| 技术选型/系统设计 | architect | Plan（只读） |
| 测试驱动实现 | tdd-guide | general-purpose |
| 代码质量审查 | code-reviewer | general-purpose |
| 安全漏洞审查 | security-reviewer | general-purpose |
| 修构建错误 | build-error-resolver | general-purpose |
| 端到端测试 | e2e-runner | general-purpose |
| 重构清理 | refactor-cleaner | general-purpose |
| 文档同步 | doc-updater | general-purpose |

## 规则

- **只读任务用只读代理**（Explore/Plan），不给它们改代码的权限。
- **要改代码用 general-purpose**。
- **prompt 要自包含**：子代理看不到主对话，必须交代清楚背景、目标、约束、期望产出。
- **不下放理解**：先自己想清楚要什么，再派任务；不写「你看着办」式模糊指令。
- **并行独立任务**：互不依赖的子任务在一条消息里同时发起。
- **验证产出**：子代理的总结是「它打算做的」，改动要亲自核对。
