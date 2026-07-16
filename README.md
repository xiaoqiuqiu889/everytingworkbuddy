# EFW — Everything For WorkBuddy

> 效仿 [Everything Claude Code](https://github.com/worldflowai/everything-claude-code)，把一套经过实战打磨的**生产级研发助手配置全家桶**，用 WorkBuddy 原生机制一次性装好。
>
> Production-ready agents, skills, rules, and MCP configurations —— 为 WorkBuddy 重新实现。

---

## 👋 怎么用（两步上手）

### ① 首次使用：直接让 AI 自动安装这个 GitHub 仓库

**你不用手动搬文件。** 把下面这个仓库链接直接发给你的 WorkBuddy，说一句：

> 🔗 https://github.com/xiaoqiuqiu889/everytingworkbuddy
>
> 「把这个工程在我的电脑中实现一遍」

它会自动 **克隆仓库 → 运行安装器 → 自检到全绿**，一次性装好：

- ✅ **11 个技能**（9 研发流程 / `efw` 自动路由 / `efw-profile` 个人能力检索）
- ✅ **6 份研发准则**（自动注入用户级记忆，每会话生效）
- ✅ **2 个 MCP** 配置（context7 + sequential-thinking）
- ✅ **9 个子代理提示词**（作为参考素材就位）
- ✅ **能力索引 + 检索器**：你说「我是…/我需要…」，自动检索并写入个人档案，开箱即用

### ② 自定义使用：让 EFW 按你的工作升级 WorkBuddy

装好之后，开个新会话，直接跟 AI 说（换成你的真实身份即可）：

> 「我是一名 **游戏策划**，我平时会 **写设计文档、做数值系统和竞品拆解**，让 EFW 帮我升级下我的 workbuddy。」

EFW 会：根据你的自述 **自动检索最匹配的能力** → 排好优先级 → 写入你的个人档案（`~/.workbuddy/MEMORY.md`）。
之后 **每个会话** WorkBuddy 都自动知道你是谁、该优先调哪些能力——这就是「升级」。

### 装完还需手动 2 步

#### 1. 信任 2 个 MCP 连接器（让 AI 拥有「查文档」和「深度推理」能力）

EFW 安装器已把这 2 个 MCP 写入了配置，但 **WorkBuddy 要求你手动点一次「信任」才会真正启用**——这是 WorkBuddy 的安全机制（防止第三方连接器在用户不知情时自动运行）。

**操作路径：**

> 左侧边栏 → 点击 **「连接器」** → 弹出 **「自定义连接器」** 对话框
> 

>
> 找到列表中的 `context7` 和 `sequential-thinking`，分别点击右侧的 **「信任」** 按钮（无需填写密钥）

| 连接器 | 做什么 | 不信任会怎样 |
|---|---|---|
| **context7** | 让 AI 能实时查询主流编程框架/库的最新官方文档（React、TypeScript、Node.js 等），回答不会用过时知识瞎编 | AI 写代码时只能靠训练数据里的旧知识，遇到新 API 版本可能给出错误用法 |
| **sequential-thinking** | 给 AI 一个「草稿纸」，在处理复杂多步问题（架构设计、方案推演、数学计算）时先内部推理再输出结论，减少一步到位时的逻辑跳跃和幻觉 | 复杂任务输出质量下降，容易遗漏边界条件或推理链条断裂 |

#### 2. （可选）生成专家包
想要「专家中心」里可一键拉起的 9 个专家？再说一句 **「把 agents 下的 9 个子代理转成专家」** 即可（脚本已含，见 `scripts/build_experts.py`）。

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

## 能力检索（Profile）：开箱即用的「懂你」机制

EFW 不止是一堆配置——它内置一套**能力索引 + 检索器**，让你不用背技能名、不用读文档，说一句「我是谁、我做什么」就能拿到最该用的能力组合。

**怎么用**

1. 新会话里说一句，例如：「我是前端开发，做组件库，常做代码评审和 TDD」。
2. 触发 `efw-profile`（说「用 efw 帮我看看该配哪些能力」也行），它从 `catalog/capabilities.json` 里语义匹配出 top 能力，按 **技能 / 子代理 / 准则 / MCP / 专家** 分组，并说明每项「为什么适合你 + 怎么启用」。
3. 它会把你的画像 + 推荐能力写入 `~/.workbuddy/MEMORY.md` 的 `<!-- EFW-PROFILE-START/END -->` 块——**每会话自动注入**，之后 agent 都知道你是谁、该优先用哪些能力。

**索引里有什么**

`catalog/capabilities.json` 是一份**持续丰富、跨多角色的策展能力库**，已内置标注 **87 条能力**（53 技能 + 9 子代理 + 6 准则 + 2 MCP + 17 专家），覆盖研发/游戏/数据/金融/研究/写作/设计/产品/营销/办公等维度。每条带 `triggers`（触发词）、`tags`（角色/工作维度）、`activate`（启用方式）。

但这份清单**不是上限**——`match.mjs` 会再**动态发现你机器上已安装的全部技能**（`~/.workbuddy/skills/*`，含 WorkBuddy 内置技能）并解析其 `SKILL.md` 自动纳入检索。实测索引规模**约 90+ 条（随机器已装技能浮动）**，且**随你安装新技能自增长**，不会卡在固定数字上。想确定性排序时也可直接跑：

```bash
node scripts/match.mjs "我是前端，做组件库，常写测试"
# 或 echo "我是安全工程师" | node scripts/match.mjs --json
```

`match.mjs` 会**动态扫描 `user/` 下你自建的技能/子代理**，以及你机器上已安装的全部技能（`~/.workbuddy/skills/*`），一并纳入排序——所以你拓展的能力、以及 WorkBuddy 生态里的其他技能，都会自动被检索到（见[可拓展性](#可拓展性extensibility)）。

## 用了之后，WorkBuddy 好在哪（按场景）

EFW 把研发纪律固化进 WorkBuddy 的记忆与技能，让**每次对话自动走对流程**，少走弯路：

| 场景 | 谁在起作用 |
| --- | --- |
| 构建 / 编译报错定位 | `efw-build-fix` 强制先定位根因，杜绝"能编过但没修好"的假修复 |
| 新功能返工率 | `efw-plan-feature` 先规划 + `efw-tdd-workflow` 先写测试，需求跑偏在第一步被拦 |
| 代码审查漏检 | `efw-code-review` + `efw-security-review` 用固定清单查安全 / 边界 / 密钥硬编码 |
| 第三方库 API 核对 | `context7` MCP 直接拉最新官方文档（需信任启用） |
| 新人 / 新项目上手 | 规范显式化并自动注入，少口口相传 |

两条不体现在耗时、但最关键的收益：

- **一致性**：6 份准则 + 触发纪律写进用户级 `MEMORY.md`，**每个新会话自动加载**——你不用每次重复交代"别硬编码密钥""先写测试"。
- **防事故**：`efw-security-review` 专抓密钥硬编码 / `.env` 进库 / 路径穿越，漏 1 个可能就是线上事故。
- 数值为典型量级估算；配置本身可用 `scripts/verify-efw.mjs` + `doctor.mjs` 验证**零漂移、可复现**。

## 目录结构

```
EFW/
├── README.md            # 本文件：定位、映射、清单
├── EXTENSIBILITY.md     # 可拓展性指南（user/ 覆盖层用法）
├── install.md           # 一步步落地指引
├── agents/              # 9 个子代理提示词（可复用调度素材）
├── skills/              # 核心研发工作流技能（源文件，含 efw-profile 检索入口，安装到用户级）
├── rules/               # 6 份研发准则（安全/编码/测试/Git/委派/性能）
├── mcp/                 # MCP 连接器推荐清单 + 授权指引
├── catalog/             # ★ 能力索引（capabilities.json，检索机制的数据源）
├── user/                # ★ 你的个人拓展层（技能/子代理/准则/MCP，覆盖底座、重装不丢、自动被检索）
├── scripts/             # install.mjs 一键安装器 / verify-efw.mjs 自检 / doctor.mjs 诊断 / match.mjs 检索器 / build_experts.py 专家包生成
└── automations/         # 定时任务定义（替代 hooks）
```

## 安装清单（Checklist）

- [ ] **Agents** — 9 个子代理提示词就位于 `agents/`
- [ ] **Skills** — 核心研发技能安装到 `~/.workbuddy/skills/`（通过安全审查）
- [ ] **Rules** — 6 份准则就位，核心条目并入用户级 `MEMORY.md`
- [ ] **MCP** — 官方连接器授权指引 + `mcp.json` 第三方配置
- [ ] **Automations** — 按需创建定时任务

详细步骤见 [install.md](./install.md)。

## 可拓展性（Extensibility）

EFW 不是装死配置：你的个人定制全部走 **`user/` 覆盖层**，与底座分离、重装不丢、同名覆盖底座。

- 加自己的技能 / 子代理 / 准则 / MCP → 丢进 `user/` 对应目录，重跑 `node scripts/install.mjs` 即生效
- 改某个底座技能 → 同名放 `user/skills/<同名>/` 覆盖，别直接改底座（`git pull` 更新会冲掉）
- 更新底座：`git pull` + 重跑安装，`user/` 原样保留
- **你加的能力自动可被检索**：`node scripts/match.mjs` 与 `efw-profile` 会动态扫描 `user/skills`、`user/agents`，无需手动登记进索引

完整玩法见 [EXTENSIBILITY.md](./EXTENSIBILITY.md)。

## 设计原则

- **通用语言中立**：agents/rules/skills 不绑定特定框架，适配任意技术栈。
- **可移植**：EFW 目录本身是自包含的配置包，可拷贝到任意机器复现。
- **安全优先**：不硬编码任何密钥；MCP 走官方授权；技能安装前过安全审查。
- **上下文预算**：不要一次性启用所有 MCP —— 每个项目启用 < 10 个连接器，保持活动工具精简。

---

*Inspired by Everything Claude Code (MIT). Rebuilt for WorkBuddy.*
