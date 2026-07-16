# Automations — 定时任务（替代 hooks）

> **M3 核实结论（2026-07-15）**：WorkBuddy **不提供** Claude Code 式的事件钩子（PreToolUse / PostToolUse / Stop / UserPromptSubmit），`settings.json` 也无 hooks 配置项。其自动化原语只有 **Automation 定时任务**（cron 式，按时间触发 prompt）。因此原仓库 `hooks/` 的价值通过 Automation + 原生记忆/技能机制等价替代，不强行移植事件钩子。

Everything Claude Code 用 **hooks**（会话生命周期事件：SessionStart / SessionEnd / PreCompact / Stop 等）做自动化。

WorkBuddy 的自动化主力是 **Automation 定时任务**（cron 式），机制不同：它按时间触发一个 prompt，而不是挂在工具/会话事件上。因此 EFW 把 hooks 里**可迁移的价值**改造成定时任务。

## hooks → automation 映射

| ECC hook | 原本作用 | EFW 等价方案 |
| --- | --- | --- |
| `session-end` / `evaluate-session` | 会话结束提炼可复用模式 | **每日「研发学习提炼」定时任务**（见下） |
| `pre-compact` / `suggest-compact` | 压缩前保存状态 | WorkBuddy 已内置会话/记忆管理，无需自建 |
| `session-start` 加载上下文 | 启动注入上下文 | 由用户级 `MEMORY.md` + skills 自动完成 |
| PreToolUse 告警（如 console.log） | 工具调用前拦截 | 需产品支持工具级 hook；当前用 rules + code-review 覆盖 |

> 结论：真正值得做成定时任务的是「**周期性学习提炼**」。其余大多已被 WorkBuddy 原生记忆/技能机制覆盖。

## 推荐定时任务：研发学习提炼

**作用**：每天定时回顾当日研发工作，把新踩的坑、验证过的解法、可复用的模式，提炼进项目记忆 / 或提示可沉淀为新 skill。这正是 ECC `continuous-learning` 的精神。

**默认不激活** —— 定时任务会周期性消耗额度并产生记忆写入，是否创建由你决定。见下方「如何启用」。

## 如何启用

告诉我「创建 EFW 学习提炼定时任务」，并说清：
1. **频率**：每天几点？（如每天 22:00）默认建议每工作日 22:00。
2. **工作区**：针对哪个项目目录做提炼？（如 `D:\codebuddycn\EFW` 或你的主力项目）
3. **产出**：只写记忆，还是也提示「可沉淀为 skill」？

我会用这些参数创建一个 recurring automation。参考 prompt 见 [`learn-digest.prompt.md`](./learn-digest.prompt.md)。
