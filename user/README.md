# `user/` — 你的个人拓展层（overlay）

EFW 的底座（`skills/`、`agents/`、`rules/`、`mcp/`）由项目维护，更新时可能被覆盖。
**你自己的所有定制都放这里**，与底座彻底分离：

- 重跑 `node scripts/install.mjs` 时，`user/` 永不被底座覆盖；
- 你 `git pull` 到 EFW 新版本，你的 `user/` 改动原样保留；
- `user/` 属于**你的 fork**，不要把个人隐私/密钥 PR 回公共模板。

## 怎么加东西（改完重跑 `node scripts/install.mjs` 即生效）

### 1. 加一个自己的技能
```
user/skills/my-tool/SKILL.md
```
`SKILL.md` 需带 frontmatter（`name` / `description` / `version`），格式同 `skills/efw-*/SKILL.md`。
装到 `~/.workbuddy/skills/my-tool`，WorkBuddy 会自动发现并可在对话里调用。

### 2. 覆盖 / 改写某个 EFW 底座技能
把同名技能放进 `user/`，例如想改 `efw-build-fix`：
```
user/skills/efw-build-fix/SKILL.md   # 复制底座后按你习惯改
```
安装顺序：**底座先装、`user/` 后装**，所以同名时你的版本赢。

### 3. 加一个子代理提示词
```
user/agents/my-reviewer.md
```
装到 `~/.workbuddy/agents/`，任意对话中可作为调度素材读取。

### 4. 加一条你的研发准则
```
user/rules/my-convention.md
```
会被汇总写进 `~/.workbuddy/MEMORY.md` 的**用户准则块**（独立标记，重装不丢），
每个会话自动生效，不影响 EFW 底座准则块。

### 5. 加一个你自己要用的 MCP
```
user/mcp/mcp-servers.json
```
```json
{ "mcpServers": { "my-mcp": { "command": "npx", "args": ["-y", "@my/mcp"] } } }
```
含 `YOUR_` / `<...>` / `REPLACE_ME` / `API_KEY_HERE` 占位符的会被跳过，需你手动填密钥后再启用。

## 规则
- **小改底座技能** → 用方式 2 在 `user/` 覆盖，别直接改 `skills/efw-*`（否则 pull 更新会冲掉）。
- **大改 / 长期适配** → 直接 fork，改底座也行，`user/` 仍保留你的私有件。
- `user/` 下的 `.md` / `SKILL.md` 任意命名，只要目录结构对，安装器全自动接管。
