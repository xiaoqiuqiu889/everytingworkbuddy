# Agents — 子代理提示词库

这 9 个文件是**可复用的子代理提示词**，对标 Everything Claude Code 的 9 个 agent。

## 在 Claude 里怎么用

Claude 没有 `用户级配置目录/agents/` 这类自动加载目录，子代理通过 **Agent 工具**（可选 `Explore`/`Plan`/`general-purpose` 等类型）在对话中临时调度。因此这些文件的用法是：

1. **作为 prompt 素材**：需要某个专项子代理时，把对应 `.md` 的正文作为 Agent 工具的 `prompt` 传入（或粘贴到对话中）。
2. **作为团队角色**：用 TeamCreate 组队时，把这些提示词作为不同 teammate 的职责说明。
3. **作为思维检查清单**：即便不派子代理，也可当作「该阶段要注意什么」的准则手册。

## 9 个子代理

| 文件 | 角色 | 建议 Agent 类型 | 用途 |
| --- | --- | --- | --- |
| `planner.md` | 规划师 | Plan | 把需求拆成可执行的实现计划 |
| `architect.md` | 架构师 | Plan | 系统设计与技术选型决策 |
| `tdd-guide.md` | TDD 教练 | general-purpose | 引导测试驱动开发循环 |
| `code-reviewer.md` | 代码审查员 | general-purpose | 质量、可读性、正确性审查 |
| `security-reviewer.md` | 安全审查员 | general-purpose | 漏洞与敏感信息分析 |
| `build-error-resolver.md` | 构建修复师 | general-purpose | 定位并修复构建/编译错误 |
| `e2e-runner.md` | E2E 测试师 | general-purpose | 端到端测试编写与执行 |
| `refactor-cleaner.md` | 重构清理师 | general-purpose | 死代码清理与重构 |
| `doc-updater.md` | 文档同步师 | general-purpose | 保持文档与代码一致 |

> 读只读类任务（探索/规划）用 `Explore`/`Plan`；需要改代码的用 `general-purpose`。

## 2026-07-16 更新：这 9 个 agents 已升级为 Expert Center 正式专家

通过 `expert-manager` 已把这 9 个子代理转成 Claude 专家中心可一键拉起的正式专家（命名 `efc-planner` 等），
经 `init → fill → validate → register` 流程，已登记进 `marketplace.json`，专家中心可见。
专家包位于：`用户级配置目录/plugins/marketplaces/my-experts/plugins/efc-*/`。
头像为占位（`.gitkeep`，未消耗 AI 额度），如需可后续用 ImageGen 生成。

也就是说：这套子代理**既是** `agents/` 下的参考提示词，**也是**专家中心里真实可用的专家——两侧内容同源。
