# EFCC 可拓展性指南（Extensibility）

EFCC 的设计目标：**底座由项目维护，你的个人定制永远留在你这边，互不干扰。**

核心机制是 **`user/` 覆盖层**——你所有按需求优化的内容都放这里，与 `skills/`、`agents/`、`rules/`、`mcp/` 底座彻底分离。

## 心智模型

```
EFCC/
├── skills/  agents/  rules/  mcp/     ← 底座（项目维护，更新时可能变）
└── user/                              ← 你的层（永远属于你，更新不丢）
    ├── skills/<你的技能>/SKILL.md
    ├── agents/<你的子代理>.md
    ├── rules/<你的准则>.md
    └── mcp/mcp-servers.json
```

安装顺序：**底座先装 → `user/` 后装**。同名文件 `user/` 赢（覆盖底座），不同名则共存。改完任意一项，重跑一次即生效：

```bash
node scripts/install.mjs            # 两端刷新
node scripts/doctor.mjs             # 自检
```

## 五种扩展方式

### 1. 新增自己的技能
```
user/skills/my-tool/SKILL.md
```
`SKILL.md` 需 frontmatter：
```yaml
---
name: my-tool
description: 一句话说明何时用（助手靠它自动匹配）
version: 1.0.0
---
（技能正文…）
```
- **Claude** 侧装到 `~/.claude/skills/my-tool`，自动发现、可 `/my-tool`。
- **Codex** 侧转换为 `~/.codex/prompts/my-tool.md`，可 `/my-tool`。

### 2. 改写某个 EFCC 底座技能
不要直接改 `skills/efc-*/`（更新会冲掉），复制到 `user/skills/efc-*/SKILL.md` 后改（`user/` 后装、同名覆盖）。

### 3. 新增子代理提示词
```
user/agents/my-reviewer.md
```

### 4. 加一条你的准则
```
user/rules/my-convention.md
```
会被写进两端记忆文件（CLAUDE.md / AGENTS.md）的**用户准则块**（`<!-- EFCC-USER-RULES-START/END -->`），与底座块分离，**重装不丢**。

### 5. 加你自己的 MCP
```
user/mcp/mcp-servers.json
```
含占位符（`YOUR_` / `<...>` / `REPLACE_ME` / `API_KEY_HERE`）的会被跳过，需你手动填真实密钥后再启用。

## 你的能力会自动被检索

放进 `user/` 的能力不用手动登记：`scripts/match.mjs` 与 `efc-profile` 会动态扫描 `~/.claude/skills`、`~/.codex/prompts`、以及 `user/`，把你的自建能力和底座能力一起排序。「拓展 → 被推荐」是自动闭环。

## 注意

- `user/` 属于**你的 fork**，不要把含密钥/隐私的内容 PR 回公共模板。
- 要定制底座技能就用 `user/` 覆盖层，别直接改底座文件，保证可复现、可更新。
