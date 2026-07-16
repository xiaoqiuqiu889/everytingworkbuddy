---
name: efw-learn
description: "Extract reusable patterns from the session into memory. Use at end of a productive session. Mirrors everything-claude-code /learn."
description_zh: "从会话提炼可复用模式写入记忆"
description_en: "Learn: extract session patterns into memory"
version: 1.0.0
agent_created: true
---

# Learn — 从会话提炼模式 (EFW)

 productive 会话结束后，把值得长期留存的模式提炼进记忆，避免重复踩坑、重复发明。

## 步骤

1. **回顾**：读今天的工作痕迹（项目 `.workbuddy/memory/` 当日日志、最近改动的关键文件、遇到并解决的问题）。
2. **提炼**：只保留真正有长期复用价值的：
   - 踩过的坑 + 正确解法
   - 验证过的技术方案 / 命令 / 配置
   - 项目约定或偏好
3. **落盘**：追加到项目 `.workbuddy/memory/YYYY-MM-DD.md`；长期事实并入 `.workbuddy/memory/MEMORY.md`。
4. **提示 skill**：若某个解决过程清晰可复用（多步工作流），提示「这可以沉淀为一个 skill」，给出建议名与用途——**不自动创建，等确认**。
5. **无则明说**：今天没有值得沉淀的内容，简短回「今日无需提炼」，不要硬凑。

## 原则

- 记录**可复用**的，不记录临时信息（临时路径、一次性报错、搜索结果）。
- 记忆是给人/给未来会话看的，清晰 > 详尽。
- 不确定是否该沉淀时，宁可不写，或标注「待确认」。
