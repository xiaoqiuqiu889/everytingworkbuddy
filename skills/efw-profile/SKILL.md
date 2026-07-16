---
name: efw-profile
description: 用户自述角色与工作后，自动检索并推荐最匹配的 EFW 能力组合，并写入个人档案使其开箱即用。触发：用户说"我是…"/"我需要…"/"我该用哪些能力"/"帮我检索能力"。
version: 1.0.0
---

# EFW 个人能力检索（Profile）

把 EFW 从「一堆配置」变成「懂你的助手」：用户描述自己，agent 自动从能力索引里检索出最该用的能力，并固化成个人档案，之后开箱即用。

## 何时用
- 用户说「我是做 XX 的 / 我需要 YY / 我该用哪些 EFW 能力 / 帮我检索能力」
- 新会话开头想快速配置个人研发环境
- 想确认自己该优先启用哪些技能/专家/MCP

## 检索索引（必读）
本技能同目录下的 `catalog/capabilities.json` 是**内置能力索引**：每条含 `type`（skill/agent/rule/mcp/expert）、`title`、`summary`、`triggers`（触发词）、`tags`（角色/工作维度）、`activate`（启用方式）。

**索引不是封顶的**——真正的检索由 `scripts/match.mjs` 完成，它除了读这份内置索引，还会：
- **动态发现你机器上已安装的全部技能**（`~/.workbuddy/skills/*/SKILL.md` 与 `~/.codebuddy/skills/*/SKILL.md` 都会被扫描，解析 frontmatter 的 name/description 自动纳入），含 WorkBuddy / CodeBuddy 内置技能（如 game-analysis / pptx-generator / minimax-xlsx / 市场研究等）；
- 动态扫描 `EFW/user/` 下你自建的技能/子代理；
- 三者合并去重（内置优先），用「触发词 +3 / 标签 +2 / 中文 bigram + 英文词 语义重叠 +1」打分排序。

因此**索引规模随用户已装技能自增长**（策展库 150 条，基于 WorkBuddy 生态公开使用热度 + 多角色覆盖编排，非以单一用户本地已装为准 + 已装技能动态纳入，随已装技能增长），不会卡在固定数字——这对非研发用户（如游戏策划）尤其关键，他们最需要的往往是生态技能而非研发技能。

- 优先运行 `node <EFW>/scripts/match.mjs "<用户自述>"` 做确定性检索（它已包含上述全部来源）；无脚本时再退回到只读本索引。

## 流程
1. **采集自述**（不啰嗦）：角色、工作内容、技术栈、偏好、痛点。信息足够就不追问；明显缺失（如完全没提技术方向）才问 1 个关键问题。
2. **检索匹配**：用索引排出最相关能力，按 `type` 分组。
3. **产出清单**：每项给「为什么适合你」+「怎么启用」（`activate` 字段：call_skill 喊名/自动触发、schedule 调度子代理、auto 已自动生效、trust 需连接器信任、open_expert 侧栏点开）。
4. **落档（开箱即用关键一步）**：把用户画像 + 推荐能力写入用户级记忆文件（WorkBuddy 为 `~/.workbuddy/MEMORY.md`，CodeBuddy 为 `~/.codebuddy/MEMORY.md`），用独立标记块包裹：
   ```
   <!-- EFW-PROFILE-START -->
   ## 我的 EFW 画像
   - 角色/工作：<用户自述要点>
   - 优先启用：<推荐的能力 id 列表，按 type 分组>
   - 备注：<偏好/痛点>
   <!-- EFW-PROFILE-END -->
   ```
   该块带独立标记，**重跑 install.mjs 不会被清**，且 MEMORY.md 每会话自动注入——之后每次对话 agent 都先知道你是谁、该用哪些能力。
5. **提示用户**：MCP 需到连接器面板「信任」；专家需从左侧「专家」面板点开；其余技能可喊名或自动触发。

## 注意
- 不写密钥/隐私进档案。
- 用户想把它带进自己 fork 的仓库，可把同一份内容复制到 `user/rules/00-profile.md`（重跑 install 会进 MEMORY 用户块）。
- 画像可迭代：用户说「我最近转做安全了」→ 重新跑本技能更新档案。
