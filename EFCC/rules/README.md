# Rules — 研发准则

这 6 份准则对标 Everything Claude Code 的 `rules/`。它们是**始终遵循的工程纪律**，语言与框架中立。

## 在 Claude 里怎么生效

Claude 没有自动加载 `rules/` 目录的机制。让这些准则真正生效的方式：

1. **并入用户级 `MEMORY.md`（推荐，全局生效）**：把每份准则的「核心红线」浓缩后写入 `用户级配置目录/MEMORY.md`，每个会话自动加载。EFCC 已为你做好这一步（见 install.md）。
2. **并入项目级记忆**：针对特定项目的额外约束，写入该项目根的 `CLAUDE.md`（Claude）或 `AGENTS.md`（Codex）。
3. **作为参考手册**：完整版留在此目录，需要时查阅或粘贴给子代理。

## 6 份准则

| 文件 | 主题 | 核心红线 |
| --- | --- | --- |
| `security.md` | 安全 | 绝不硬编码密钥；外部输入零信任 |
| `coding-style.md` | 编码风格 | 不可变优先；小文件小函数；命名达意 |
| `testing.md` | 测试 | TDD；关键路径 ≥80% 覆盖 |
| `git-workflow.md` | Git 流程 | 语义化提交；小而聚焦的 PR |
| `agents.md` | 委派 | 何时派子代理、派哪个 |
| `performance.md` | 性能与上下文 | 模型选择；MCP/上下文预算管理 |
