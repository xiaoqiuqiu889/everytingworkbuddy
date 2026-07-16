---
name: efw-checkpoint
description: "Save current verification state as a recoverable snapshot so a later session can resume. Use when pausing mid-work. Mirrors everything-claude-code /checkpoint."
description_zh: "保存当前验证状态为可恢复快照"
description_en: "Checkpoint current verification state"
version: 1.0.0
agent_created: true
---

# Checkpoint — 保存验证状态 (EFW)

工作中途要停下来时，把当前状态存成快照，下次能直接续上，不丢上下文。

## 步骤

1. **采集**：现在哪些绿、哪些红、最后跑的命令 + 输出要点、未决风险、下一步打算。
2. **落盘**：写到本项目的 `.workbuddy/memory/checkpoint-YYYYMMDD.md`（新文件或追加）。
   格式建议：
   ```
   ## Checkpoint <时间>
   - 绿: ...
   - 红: ...
   - 最后命令: <cmd> → <结果摘要>
   - 风险: ...
   - 下一步: ...
   ```
3. **回报**：给出 checkpoint 文件路径，一句话说清「现在停在哪、下次从哪续」。

## 何时用

- 会话要结束，但任务没做完。
- 进入复杂调试前，先存一个可回退点。
- 切换分支 / 上下文前。

## 原则

- **只存可续的信息**：命令、状态、风险、下一步；不存临时路径噪声。
- **不覆盖历史**：追加或带时间戳新建，保留前序 checkpoint。
