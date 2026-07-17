# EFCC — Everything For Claude & Codex

> 🍶 **一套能力包，同时喂给 Claude 与 Codex 两款 AI 助手。**
> 让 Claude（桌面 / Claude Code）和 Codex（ChatGPT / Codex CLI）都从「顺手的工具」升级成「身经百战的战术搭档」——懂你是谁、会自己挑装备、上阵不掉链子。

EFCC（Everything For Claude & Codex）是一套开箱即用的**跨平台**能力配置包，对标 [Everything Claude Code](https://github.com/worldflowai/everything-claude-code)，并借鉴 [everytingworkbuddy (EFW)](https://github.com/xiaoqiuqiu889/everytingworkbuddy) 的「编排外壳 + 能力检索」设计。它把技能、子代理、连接器、准则编排成一套带「编排外壳」的即用全家桶，**用一条命令同时装进 Claude 和 Codex**，无需手动写配置。

---

## 🚀 安装（推荐方式）

**把下面仓库链接甩给你的 Claude 或 Codex：**

> 请把这个工程在我的电脑中实现一遍，然后运行安装和自检：
> **https://github.com/xiaoqiuqiu889/everytingworkbuddy/tree/EFCC**

Agent 会自己 clone 仓库、运行安装脚本、并完成双平台健康检查。

如果你偏好命令行：

```bash
# 先 clone EFCC 分支
git clone --branch EFCC https://github.com/xiaoqiuqiu889/everytingworkbuddy.git

# 进入目录运行安装器（默认同时装 Claude + Codex）
cd everytingworkbuddy
node EFCC/scripts/install.mjs

# 自检
node EFCC/scripts/doctor.mjs
```

- 跨平台（Windows / macOS / Linux），**幂等**：可重复运行，sentinel 块整体替换，不重复堆叠、不覆盖你已有的 MCP。
- 装完立刻可用：Claude 侧 12 个 `efc-*` 技能被自动发现；Codex 侧 12 个 `/efc-*` 斜杠命令就位。

写入身份档案（让助手懂你）：开个新会话报上角色，例如「我是游戏策划，写设计文档、做数值系统」，EFCC 会用 `efc-profile` 检索最匹配的能力组合并落档。

---

## 为什么需要「双平台」

Claude 和 Codex 各有自己的扩展机制，路径与格式都不同。EFCC 用一份**产品无关的源**（`skills/` `rules/` `agents/` `mcp/` `catalog/`），由安装器按平台各自落位：

| 能力 | Claude 落位 | Codex 落位 |
| --- | --- | --- |
| 技能 Skill | `~/.claude/skills/<name>/SKILL.md`（相关时自动加载，或 `/name`） | `~/.codex/prompts/<name>.md`（斜杠命令 `/name`） |
| 常驻纪律 | `~/.claude/CLAUDE.md`（每会话自动注入） | `~/.codex/AGENTS.md`（每会话自动注入） |
| 子代理 | `~/.claude/agents/*.md` | `~/.codex/prompts/agent-*.md`（提示词素材） |
| MCP 连接器 | `~/.claude.json` 的 `mcpServers` | `~/.codex/config.toml` 的 `[mcp_servers.*]` |

> **关键平台差异**：Claude 技能会在相关时**自动加载**；Codex 的 prompts 是**手动斜杠命令**。所以四步外壳的"常驻性"两端都靠**记忆文件**（CLAUDE.md / AGENTS.md，每会话自动注入）保证——遇实质任务先按 0 号动作显式发起 `efc`。

---

## 核心：四步编排外壳

EFCC 的灵魂是一套「编排外壳」，对**任意实质性任务**统一走四步：

```
① 计划  →  ② 干活  →  ③ 验收(efc-verify)  →  ④ 沉淀(efc-learn)
           ↑ 交给对口领域技能或原生工具
```

1. **计划** —— 拆解目标、交付物形态、分步与验收标准。
2. **干活** —— 交给对口领域技能或原生工具执行。
3. **验收（强制闸门）** —— 对照验收标准逐条勾选，产出可核验清单。文档/数据/设计任务不豁免。
4. **沉淀** —— 可复用套路写入长期记忆或存为新技能。

> **验收闸门**：未跑 `efc-verify` 之前，任务不算「完成」。这是最容易被吞掉、也最该守住的一步。
>
> **什么算「实质任务」**（满足任一）：① 产出文件；② 需 ≥3 步；③ 预计 ≥15 次工具调用。简单问答/闲聊不算，别套外壳。

---

## 12 个流程技能

| 技能 | 用途 |
| --- | --- |
| `efc` | 统一入口，自动路由到下面的子技能 |
| `efc-plan-feature` | 先规划：拆成文件级实现计划 |
| `efc-tdd-workflow` | 测试驱动开发 RED→GREEN→REFACTOR |
| `efc-code-review` | 代码审查，按严重级别给修复 |
| `efc-build-fix` | 从根因修构建/编译错误 |
| `efc-refactor-clean` | 重构与死代码清理，行为不变 |
| `efc-security-review` | 安全审查，按风险分级 |
| `efc-verify` | 交付前逐条验收闸门 |
| `efc-checkpoint` | 存进度快照，下次续上 |
| `efc-learn` | 从会话提炼可复用模式 |
| `efc-github-push` | 沙箱/无头环境非交互推送 GitHub |
| `efc-profile` | 按身份检索并推荐能力组合 |

配套还有 9 个子代理提示词（`agents/`）、6 条工程准则（`rules/`）。能力索引（`catalog/`）由 `scripts/build-catalog.mjs` 从本机真实存在的插件/技能目录扫描生成——每条都带 `verified_path`，可逐条核实，避免照搬。

---

## 生态热度排序

EFCC 的能力检索器 `scripts/match.mjs` 不按纯文本相似度排序，而是叠加 **GitHub 生态热度**：

```
final = 相关性 × 0.6 + 生态热度 × 0.4
生态热度 = log(仓库 star + 1) × 5 + log(1 + 技能 issue/PR 提及数) × 3
```

- `efc-native` 固定最高分："我做的、实测可用"优先
- 热度数据缓存在 `catalog/.popularity-cache.json`
- 离线时回退到纯相关性，不报错
- 加 `--no-popularity` 可关闭热度用于调试

---

## 模式上下文

EFCC 提供 4 种工作模式提示词，可用 `node EFCC/scripts/mode.mjs <dev|review|research|ship>` 切换：

- **dev**：开发模式，TDD/Plan 优先
- **review**：审查模式，找问题给修复
- **research**：研究模式，查资料重来源
- **ship**：交付模式，验收闸门强化

---

## 安全约束

- 禁止硬编码密钥 / token / 密码，一律走环境变量；`.env` 不进库。
- 外部输入零信任（防注入 / XSS / 路径穿越）。
- 含占位符的 MCP 配置会被安装器自动跳过，需你手动填真实密钥后再启用。

---

## 可拓展

在 `user/` 覆盖层加技能 / 准则 / MCP，重跑安装即生效，且自动并入能力检索。详见 [`EXTENSIBILITY.md`](./EXTENSIBILITY.md)。

---

## 与 EFW 的关系

- **EFW** = WorkBuddy / CodeBuddy 原生版本（单平台，安装极简）
- **EFCC** = Claude + Codex 双平台版本（跨平台，测试/模板/hooks 更完整）

两者纪律一致、代码结构相似，可共享 catalog 构建、MCP 模板、热度排序等中性模块。详细对比见 [`EFCC-vs-EFW.md`](./EFCC-vs-EFW.md)。

*Inspired by Everything Claude Code (MIT) & everytingworkbuddy. Rebuilt for Claude & Codex dual-platform.*
