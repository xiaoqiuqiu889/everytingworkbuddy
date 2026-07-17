请执行以下步骤来安装 EFCC（Everything For Claude & Codex）：

1. 克隆仓库的 EFCC 分支到本地：
   git clone --branch EFCC https://github.com/xiaoqiuqiu889/everytingworkbuddy.git

2. 进入仓库根目录：
   cd everytingworkbuddy

3. 运行安装器（安装器会自动识别 Claude Code / Codex CLI 环境，默认只装对应端；若无法识别则同时装两端）：
   node EFCC/scripts/install.mjs

4. 运行双平台健康检查：
   node EFCC/scripts/doctor.mjs

5. 向我汇报安装结果：完成了多少项、跳过了多少项、失败了哪些（如有）。

注意：
- 安装器是幂等的，可以重复运行。
- 含占位符的 MCP 模板会被跳过，需手动配置真实密钥后才启用。
- 安装完成后，新会话中说「用 efc」或直接描述需求即可触发四步编排外壳。
