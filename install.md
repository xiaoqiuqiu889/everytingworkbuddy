# EFW 安装与启用指引

按下面步骤，即可让整套 EFW 配置在 WorkBuddy 里生效。EFW 已经帮你完成了大部分**自动生效**的部分，剩下的是**需要你点一下界面**的部分。

---

## ✅ 已自动完成（无需操作）

| 项目 | 状态 | 位置 |
| --- | --- | --- |
| 6 个研发工作流 Skills | ✅ 已安装并登记 | `~/.workbuddy/skills/efw-*` |
| 研发准则核心红线 | ✅ 已并入用户级记忆（全局生效） | `~/.workbuddy/MEMORY.md` |
| 2 个无密钥第三方 MCP | ✅ 已写入配置 | `~/.workbuddy/mcp.json` |
| 9 个子代理提示词 | ✅ 就位（按需复用） | `EFW/agents/` |
| 6 份完整准则 + MCP 指引 + Automation 模板 | ✅ 就位 | `EFW/rules/`、`EFW/mcp/`、`EFW/automations/` |

> Skills 和 MEMORY.md 是**下个会话自动加载**的。当前会话若想立即用某个 skill，直接说「用 efw-tdd-workflow」即可。

---

## 🖱️ 需要你手动操作（3 步）

### 1. 启用第三方 MCP（context7 / sequential-thinking）
写入 `mcp.json` 后不会自动激活。
→ 打开**连接器管理页 → 右上角「自定义连接器」→ 对 `context7` 和 `sequential-thinking` 点「信任」**。
（首次调用会自动 `npx` 下载，稍慢正常。）

### 2. 按需授权官方连接器
研发常用的 **GitHub / TAPD / CNB / 智研构建部署 / 飞书 / 企业微信** 等，在连接器面板点「授权」即可，**无需填密钥**。
→ ⚠️ 每个项目启用 **< 10 个**，用不到的别开（省上下文）。

### 3.（可选）启用学习提炼定时任务
默认未创建。想要的话告诉我频率和目标项目，我来创建。详见 `automations/README.md`。

---

## 🚀 日常怎么用

| 想做的事 | 怎么触发 |
| --- | --- |
| 先规划再写 | 「用 efw-plan-feature 规划这个功能」 |
| TDD 实现 | 「用 efw-tdd-workflow 实现 X」 |
| 代码审查 | 「用 efw-code-review 审一下这段/这个 PR」 |
| 修构建错误 | 「用 efw-build-fix」 |
| 重构清理 | 「用 efw-refactor-clean」 |
| 安全审查 | 「用 efw-security-review」 |
| 派专项子代理 | 参考 `agents/` 里的角色，如「按 architect 提示词做技术选型」 |
| 查最新库文档 | MCP 启用后自动可用（context7） |

准则（安全/编码/测试/Git/委派/性能）已在记忆中，做研发任务时会自动遵循，无需每次提醒。

---

## 📁 在新项目启用 EFW

EFW 是用户级全局配置，新项目无需重装，只需**约定怎么用**。复制 [`examples/EFW.md`](./examples/EFW.md) 到项目根目录，按需删改即可作为团队约定说明书。它也列清了本项目启用哪些 skills / 连接器 / MCP。

自检（确认本机 EFW 组件齐全）：

```bash
node "D:/codebuddycn/EFW/scripts/verify-efw.mjs"
# 全绿 → EFW v1 components present and consistent.
```

---

## 🔄 移植到另一台机器

EFW 目录是自包含的。在新机器上：
1. 拷贝 `EFW/skills/efw-*` 到 `~/.workbuddy/skills/`；
2. 把 `rules/` 核心红线并入新机器的 `~/.workbuddy/MEMORY.md`；
3. 把 `mcp/mcp-servers.json` 的 `mcpServers` 段合并进 `~/.workbuddy/mcp.json`；
4. 按本文件重新走一遍「手动操作 3 步」。
