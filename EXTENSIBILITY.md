# EFW 可拓展性指南（Extensibility）

EFW 不是「装好就定死」的配置包。它的设计目标是：**底座由项目维护，你的个人定制永远留在你这边，互不干扰。**

核心机制是一个 **`user/` 覆盖层（overlay）**——你所有按自己需求优化的内容都放这里，与 `skills/`、`agents/`、`rules/`、`mcp/` 底座彻底分离。

## 心智模型

```
EFW/
├── skills/   agents/   rules/   mcp/     ← 底座（项目维护，更新时可能变）
└── user/                              ← 你的层（永远属于你，更新不丢）
    ├── skills/<你的技能>/
    ├── agents/<你的子代理>.md
    ├── rules/<你的准则>.md
    └── mcp/mcp-servers.json
```

安装顺序（见 `scripts/install.mjs`）：**底座先装 → `user/` 后装**。
因此同名文件 `user/` 赢（覆盖底座），不同名则两者共存。

## 五种扩展方式

改完任意一项，重跑一次即可生效：

```bash
node scripts/install.mjs
```

### 1. 新增一个自己的技能
```
user/skills/my-tool/SKILL.md
```
`SKILL.md` 需要 frontmatter：
```yaml
---
name: my-tool
description: 一句话说明何时用（WorkBuddy 靠它自动匹配）
version: 1.0.0
---
（技能正文…）
```
装到 `~/.workbuddy/skills/my-tool`，WorkBuddy 会自动发现并在对话里调用 / 自动触发。

### 2. 改写某个 EFW 底座技能
想让 `efw-build-fix` 更符合你的习惯？**不要直接改 `skills/efw-build-fix/`**（pull 更新会冲掉），而是：
```
user/skills/efw-build-fix/SKILL.md   # 复制底座后改
```
因为 `user/` 后装，同名即覆盖。

### 3. 新增子代理提示词
```
user/agents/my-reviewer.md
```
装到 `~/.workbuddy/agents/`，任意对话中可作为调度素材读取。

### 4. 加一条你的研发准则
```
user/rules/my-convention.md
```
会被汇总写进 `~/.workbuddy/MEMORY.md` 的**用户准则块**（标记 `<!-- EFW-USER-RULES-START/END -->`），
与底座准则块分离，**重装不丢**，每个会话自动生效。

### 5. 加一个你自己要用的 MCP
```
user/mcp/mcp-servers.json
```
```json
{ "mcpServers": { "my-mcp": { "command": "npx", "args": ["-y", "@my/mcp"] } } }
```
含占位符（`YOUR_` / `<...>` / `REPLACE_ME` / `API_KEY_HERE`）的会被跳过，需你手动填真实密钥后再启用。

## 更新底座而不丢定制

```bash
git pull            # 拉 EFW 新版本（只动底座）
node scripts/install.mjs   # 重装：底座刷新，user/ 原样保留
node scripts/doctor.mjs    # 自检
```

`user/` 不在底座的 git 跟踪冲突范围（除非你改了同一个文件名，那是你自己的 fork 决策）。
你的 `user/rules/*.md` 写进 MEMORY.md 用户块，永不被底座准则块覆盖或清除。

## 长期适配：fork

- **小修小改** → 用上面的 `user/` 覆盖层，零冲突。
- **大改 / 想长期持有某套底座** → 直接 fork 本仓库，改底座也行。`user/` 仍保留你的私有件，pull 上游时按需 merge。

## 你的能力会自动被检索

你放进 `user/` 的能力，**不用手动登记**就能被检索机制发现：

- `node scripts/match.mjs "我是…"` 与 `efw-profile` 技能会**动态扫描** `user/skills/`、`user/agents/`，把你的自建技能/子代理和底座能力一起排序。
- 所以「拓展 → 被推荐」是自动闭环：你加了 `user/skills/my-tool`，下次说「我是做 XX 的」就会出现在推荐里。

### 把画像沉淀进你的 fork（可选）

`efw-profile` 默认把画像写进 `~/.workbuddy/MEMORY.md`（用户级，开箱即用）。
若你想把同一份画像带进自己 fork 的仓库（随仓库走、可提交），复制内容到：

```
user/rules/00-profile.md
```

重跑 `node scripts/install.mjs` 后，它会进 MEMORY.md 的**用户准则块**（`<!-- EFW-USER-RULES-START/END -->`），重装不丢、与底座准则分离。

## 自检

```bash
node scripts/doctor.mjs     # 含 [extensibility] 与 [catalog] 段，确认覆盖层与能力索引均合法
```

## 注意

- `user/` 属于**你的 fork**，不要把含密钥 / 隐私的内容 PR 回公共模板。
- 不要把底座文件（`skills/efw-*` 等）直接改来「定制」；要改就用 `user/` 覆盖层，保证可复现、可更新。
