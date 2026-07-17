# EFCC 安装与启用指引（Claude & Codex 双平台）

**最快方式：把 GitHub 链接甩给你的 Claude/Codex：**

> 请把这个工程在我的电脑中实现一遍，然后运行安装和自检：
> **https://github.com/xiaoqiuqiu889/everytingworkbuddy/tree/EFCC**

Agent 会自己 clone 仓库、运行安装脚本、并完成双平台健康检查。

---

## 🚀 命令行一键安装

如果你已经手动 clone 了仓库，在仓库根目录运行：

```bash
node EFCC/scripts/install.mjs                  # 默认两端都装
node EFCC/scripts/install.mjs --target claude  # 只装 Claude
node EFCC/scripts/install.mjs --target codex   # 只装 Codex
```

跨平台（Windows / macOS / Linux），**幂等**：可重复运行，已存在则刷新。

### 能力检索（按 GitHub 生态热度排序）

```bash
node EFCC/scripts/match.mjs "我是数据分析师做报表"   # 按相关+生态热度推荐
node EFCC/scripts/match.mjs --no-popularity "..." # 仅文本相关（调试）
node EFCC/scripts/popularity.mjs                   # 联网刷新热度数据（24h TTL）
```

公式：`final = 相关性 × 0.6 + 生态热度 × 0.4`。
- **EFCC 原生**技能给固定最高分（"我做的、实测可用"优先）
- **生态热度** = `log(仓库star+1) × 5 + log(1+技能issue提及数) × 3 × 仓库权重`
- 不读本机使用频率，严格按 GitHub 公开生态排名
- 默认从 `catalog/.popularity-cache.json` 读，缺失时回退到种子值

### 装完自动生效（无需操作）

**Claude 端：**
| 项目 | 位置 |
| --- | --- |
| 12 个 `efc-*` 技能 | `~/.claude/skills/efc-*/`（相关时自动加载，或 `/efc`） |
| 四步外壳纪律块 | `~/.claude/CLAUDE.md`（每会话自动注入） |
| 9 个子代理 | `~/.claude/agents/*.md` |
| 能力索引 + 检索器 | 打包进 `~/.claude/skills/efc-profile/` |

**Codex 端：**
| 项目 | 位置 |
| --- | --- |
| 12 个 `/efc-*` 斜杠命令 | `~/.codex/prompts/efc-*.md` |
| 四步外壳纪律块 | `~/.codex/AGENTS.md`（每会话自动注入） |
| 9 个子代理提示词 | `~/.codex/prompts/agent-*.md`（`/agent-*`） |
| 能力索引 + 检索器 | `~/.codex/efcc-assets/` |

---

## 🖱️ 需要你手动操作

### 1. 激活 MCP 连接器（context7 / sequential-thinking，可选）

安装器已把两个**无密钥** MCP 写入配置（Claude: `~/.claude.json`；Codex: `~/.codex/config.toml`），但出于安全默认不自动激活：

- **Claude**：在应用「连接器/MCP」面板对 `context7`、`sequential-thinking` 点「信任」。
- **Codex**：`config.toml` 里已声明，重启 Codex 即加载（首次 `npx` 拉包稍慢正常）。

> ⚠️ 每个项目启用 **< 10 个**连接器，用不到的别开（省上下文）。

### 2. 需密钥的 MCP（按需）

`mcp/mcp-servers.json` 的 `_templates_need_api_key` 段是需密钥的模板（supabase / brave-search 等）。用时复制进对应平台配置并替换占位符，**切勿提交真实密钥**。

---

## 🚀 日常怎么用

| 想做的事 | Claude | Codex |
| --- | --- | --- |
| 让它先规划再写 | 说需求即自动路由，或 `/efc-plan-feature` | `/efc-plan-feature` |
| TDD 实现 | 「用 efc-tdd-workflow 实现 X」 | `/efc-tdd-workflow` |
| 交付前验收 | 相关时自动，或 `/efc-verify` | `/efc-verify` |
| 报身份检索能力 | 「我是做 XX 的」→ 自动走 efc-profile | `/efc-profile` |
| 查最新库文档 | MCP 信任后自动可用（context7） | 同左 |

四步外壳纪律已写进两端记忆文件，每会话自动生效——遇实质任务，助手会（或应）先加载 `efc`。

---

## 📁 在新项目启用 EFCC

EFCC 是用户级全局配置，新项目无需重装。想让**子代理/本项目所有会话**都守外壳，把范例复制到项目根：

- Claude 项目：复制 [`examples/CLAUDE.md`](./examples/CLAUDE.md) 到项目根 `CLAUDE.md`。
- Codex 项目：复制 [`examples/AGENTS.md`](./examples/AGENTS.md) 到项目根 `AGENTS.md`。

两者都是项目级文件，每会话注入、**子代理也读**（子代理不加载用户级记忆，项目级文件是触达它们的唯一可靠通道）。

---

## 🔄 移植到另一台机器 / 更新

EFCC 目录自包含。新机器上 `git pull` 后重跑 `node EFCC/scripts/install.mjs` 即可；`user/` 覆盖层原样保留、重装不丢。
