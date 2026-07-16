# MCP — 连接器与 MCP 配置

对标 Everything Claude Code 的 `mcp-configs/`，但用 **WorkBuddy 的方式**做，分两条路：

## 路线 A：官方连接器（首选，一键授权，不填密钥）

WorkBuddy 内置 **60+ 官方连接器**（对话左侧/连接器面板可见）。它们通过界面「信任 / 授权」启用，**不需要也不应该往任何配置文件里手填 token**。

研发常用官方连接器（按需授权即可）：

| 连接器 | 用途 | 对应 ECC 里的 |
| --- | --- | --- |
| **GitHub** | 仓库、Issue、PR、CI | github MCP |
| **CNB / Gongfeng** | 代码托管（司内） | - |
| **TAPD** | 需求/缺陷管理 | - |
| **腾讯文档 / 金山文档** | 文档协作 | - |
| **飞书 / 企业微信 / 钉钉** | 团队协作与通知 | - |
| **智研构建部署（zhiyan-cicd）** | CI/CD | - |
| **Bugly** | 质量与崩溃监控 | Sentry 类 |

**授权方式**：打开连接器管理面板 → 找到对应连接器 → 点「信任 / 授权」→ 按引导登录。启用后即可在对话中调用。

> ⚠️ 上下文预算：**每个项目启用 < 10 个连接器**，用不到的不要开，否则挤占上下文窗口。

## 路线 B：第三方 MCP（写进 mcp.json）

官方连接器没有的第三方 MCP，写进 `~/.workbuddy/mcp.json`。

### 已为你配好（无需密钥，开箱即用）

见 [`mcp-servers.json`](./mcp-servers.json)。EFW 已把下面两个写入你的 `~/.workbuddy/mcp.json`：

| MCP | 用途 | 密钥 |
| --- | --- | --- |
| **context7** | 拉取最新的库/框架文档与示例，写代码查 API 神器 | 无 |
| **sequential-thinking** | 结构化分步推理，复杂任务拆解 | 无 |

### 需要密钥的（模板，按需自行填）

`mcp-servers.json` 里以注释形式给出了 Supabase / Vercel / Brave Search 等常见第三方 MCP 的模板。要用时：
1. 去对应平台申请 API key；
2. 把模板对应条目复制进 `~/.workbuddy/mcp.json`，替换 `YOUR_*_HERE`；
3. **切勿把真实密钥提交到任何版本库**。

## 启用后必读

- 写入 `mcp.json` 后，MCP **不会自动激活**。需到连接器管理页右上角「自定义连接器」入口，对新服务器点「信任」启用。
- 首次调用 `npx` 型 MCP 会自动下载包，稍慢属正常。
