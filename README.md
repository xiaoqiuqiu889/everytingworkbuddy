# EFW — Everything For WorkBuddy

> 效仿 [Everything Claude Code](https://github.com/worldflowai/everything-claude-code)，把一套经过实战打磨的**生产级研发助手配置全家桶**，用 WorkBuddy 原生机制一次性装好。
>
> Production-ready agents, skills, rules, and MCP configurations —— 为 WorkBuddy 重新实现。

---

## 🚀 最简安装：把链接发给 WorkBuddy 就行

**你什么都不用装。** 直接把这个仓库链接发给你的 WorkBuddy：

> https://github.com/xiaoqiuqiu889/everytingworkbuddy

说一句「把这个工程在我的电脑中实现一遍」，它会自动 **克隆仓库 → 运行安装器 → 自检到全绿**，把整套研发配置装进你的 WorkBuddy。

唯一需要你点一下的：在**连接器面板**里「信任」 `context7` / `sequential-thinking` 两个 MCP（不填密钥）。

（想手动 / 逐步装？见 [install.md](./install.md)。）

---

## 这是什么

Everything Claude Code 是给 Claude Code 用的工具包（agents / skills / hooks / commands / rules / mcp）。
但 **WorkBuddy 和 Claude Code 是两套不同的产品，配置体系不能直接照搬**。

EFW 做的事：把 Everything Claude Code 每一类配置的**价值**，映射到 WorkBuddy 的原生机制上重新实现，并一次性安装启用。

## 概念映射（为什么这样做）

| Everything Claude Code | 数量 | WorkBuddy 落地形态 | 位置 |
| --- | --- | --- | --- |
| `agents/` 子代理 | 9 | 可复用子代理提示词库（配合 Agent/Task 调度） | `EFW/agents/*.md` |
| `skills/` 技能 | 9 | **原生 Skills**（本产品一等公民） | `~/.workbuddy/skills/` |
| `commands/` 斜杠命令 | 10 | 轻量 Skill 即命令 | `~/.workbuddy/skills/` |
| `rules/` 准则 | 6 | 准则文件 + 用户级 `MEMORY.md` | `EFW/rules/*.md` |
| `hooks/` 事件钩子 | - | **Automation 定时任务**（等价自动化） | WorkBuddy Automation |
| `mcp-configs/` MCP | 15 | **官方连接器**（一键授权）+ `mcp.json`（第三方） | 连接器面板 / `~/.workbuddy/mcp.json` |

### 三条核心差异（务必理解）

1. **WorkBuddy 没有 agents/commands/rules 目录概念** —— 工作流与命令统一由 **Skills** 承载。EFW 的 `agents/` 是「提示词素材库」，供调度子代理时复制使用。
2. **MCP 不手填密钥** —— WorkBuddy 内置 60+ 官方连接器，通过界面「信任/授权」启用。`mcp.json` 只用于连接器里没有的第三方 MCP。
3. **hooks 优先用 Automation 替代** —— WorkBuddy 的自动化以定时任务（Automation）为主，会话级事件钩子需按产品能力核实。

## 用了之后，WorkBuddy 好在哪（可量化）

EFW 把研发纪律固化进 WorkBuddy 的记忆与技能，让**每次对话自动走对流程**，少走弯路：

| 场景 | 投入变化 | 谁在起作用 |
| --- | --- | --- |
| 构建 / 编译报错定位 | ~25min → ~8min（**-68%**） | `efw-build-fix` 强制先定位根因，杜绝"能编过但没修好"的假修复 |
| 新功能返工率 | ~40% → ~15%（**-62%**） | `efw-plan-feature` 先规划 + `efw-tdd-workflow` 先写测试，需求跑偏在第一步被拦 |
| 代码审查漏检 | 腰斩以上 | `efw-code-review` + `efw-security-review` 用固定清单查安全 / 边界 / 密钥硬编码 |
| 第三方库 API 核对 | 来回 4 次 → 1 次 | `context7` MCP 直接拉最新官方文档（需信任启用） |
| 新人 / 新项目上手 | ~3 天 → ~1.5 天（**-50%**） | 规范显式化并自动注入，少口口相传 |

两条不体现在耗时、但最关键的收益：

- **一致性**：6 份准则 + 触发纪律写进用户级 `MEMORY.md`，**每个新会话自动加载**——你不用每次重复交代"别硬编码密钥""先写测试"。
- **防事故**：`efw-security-review` 专抓密钥硬编码 / `.env` 进库 / 路径穿越，漏 1 个可能就是线上事故。
- 数值为典型量级估算；配置本身可用 `scripts/verify-efw.mjs` + `doctor.mjs` 验证**零漂移、可复现**。

## 目录结构

```
EFW/
├── README.md            # 本文件：定位、映射、清单
├── install.md           # 一步步落地指引
├── agents/              # 9 个子代理提示词（可复用调度素材）
├── skills/              # 核心研发工作流技能（源文件，安装到用户级）
├── rules/               # 6 份研发准则（安全/编码/测试/Git/委派/性能）
├── mcp/                 # MCP 连接器推荐清单 + 授权指引
├── scripts/             # install.mjs 一键安装器 / verify-efw.mjs 自检 / build_experts.py 专家包生成
└── automations/         # 定时任务定义（替代 hooks）
```

## 安装清单（Checklist）

- [ ] **Agents** — 9 个子代理提示词就位于 `agents/`
- [ ] **Skills** — 核心研发技能安装到 `~/.workbuddy/skills/`（通过安全审查）
- [ ] **Rules** — 6 份准则就位，核心条目并入用户级 `MEMORY.md`
- [ ] **MCP** — 官方连接器授权指引 + `mcp.json` 第三方配置
- [ ] **Automations** — 按需创建定时任务

详细步骤见 [install.md](./install.md)。

## 设计原则

- **通用语言中立**：agents/rules/skills 不绑定特定框架，适配任意技术栈。
- **可移植**：EFW 目录本身是自包含的配置包，可拷贝到任意机器复现。
- **安全优先**：不硬编码任何密钥；MCP 走官方授权；技能安装前过安全审查。
- **上下文预算**：不要一次性启用所有 MCP —— 每个项目启用 < 10 个连接器，保持活动工具精简。

---

*Inspired by Everything Claude Code (MIT). Rebuilt for WorkBuddy.*
