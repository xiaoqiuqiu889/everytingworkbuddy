# EFCC vs EFW：产品对比与互补优化

> 立场：两者都是 WorkBuddy / CodeBuddy / Claude / Codex 生态下的「AI 助手编排外壳」。EFW 是 WorkBuddy 原生版本，EFCC 是 Claude + Codex 双平台版本。下面按真实维度对比，并给出 EFCC 应向 EFW 借鉴什么、EFW 应向 EFCC 借鉴什么。

---

## 一、核心定位

| 维度 | EFW | EFCC |
|---|---|---|
| **目标平台** | WorkBuddy / CodeBuddy | Claude 桌面版 / Claude Code / Codex（ChatGPT/CLI） |
| **命名空间** | `efw-*` | `efc-*` |
| **核心纪律** | 四步外壳：先想再做 → 质量标准前置 → 验收 → 沉淀 | 完全复刻四步外壳 |
| **能力数量** | 11 个 efw-* 技能 + 9 子代理 + 306 条能力索引 | 12 个 efc-* 技能 + 9 子代理 + 384 条能力索引 |
| **安装哲学** | 把 GitHub 仓库链接甩给 agent：「把这个工程在我电脑中实现一遍」 | 传统：先 clone 再运行 `node EFCC/scripts/install.mjs` |

**结论**：两者纪律和框架一致，差异主要在平台适配、安装方式、测试成熟度。

---

## 二、严格维度对比

### 1. 易用性（安装上手）

| 子维度 | EFW | EFCC | 谁领先 |
|---|---|---|---|
| **安装入口** | 直接丢 GitHub 链接给 agent，agent 自动 clone + 运行 install | 用户需手动 clone 后运行 node 命令 | **EFW** |
| **安装命令** | `node scripts/install.mjs`（自动检测 WorkBuddy/CodeBuddy） | `node EFCC/scripts/install.mjs --target claude/codex/both` | **平手**（EFCC 更明确双端） |
| **安装后自检** | `scripts/verify-efw.mjs` | `scripts/doctor.mjs`（双平台 + hooks + MCP 全检） | **EFCC**（自检更全） |
| **会话激活** | 下个会话自动加载 MEMORY.md | 同左：Claude 读 CLAUDE.md，Codex 读 AGENTS.md | **平手** |
| **文档引导** | README 开头即甩链接，非常符合 WorkBuddy 聊天习惯 | install.md 偏命令行，README 偏技术说明 | **EFW**（更符合无头 agent 安装） |

**EFCC 应借鉴 EFW**：
- README/install.md 第一句改成「把这个仓库链接丢给你的 Claude/Codex」
- 提供 agent 安装 prompt 文案
- install.mjs 检测当前 agent 环境并自动选择 target

---

### 2. 可拓展性

| 子维度 | EFW | EFCC | 谁领先 |
|---|---|---|---|
| **user/ 覆盖层** | ✅ 支持 skills/rules/agents/mcp 覆盖，重装不丢 | ✅ 支持 skills/rules/agents/mcp 覆盖，重装不丢 | **平手** |
| **MCP 模板数量** | 2 个无密钥 + 模板指引（未完整模板化） | 15 个完整 JSON 模板 + mcp-install.mjs 一行安装 | **EFCC** |
| **能力索引** | 306 条，覆盖 6 大类型 | 384 条，含 GitHub 生态热度 | **EFCC**（数量 + 热度排序） |
| **新能力接入** | 复制到 user/ 下，重跑 install | 复制到 user/ 下，重跑 install | **平手** |
| **Catalog 构建** | 未提供自动化构建脚本 | `scripts/build-catalog.mjs` 可自动重新生成 | **EFCC** |
| **跨平台一致性** | 单平台（WorkBuddy/CodeBuddy 机制类似） | 双平台（Claude 自动加载 skill，Codex 手动 / 斜杠命令） | **EFCC**（更复杂但覆盖更广） |

**EFW 应借鉴 EFCC**：
- 引入 `mcp-templates/` 15 模板体系
- 引入 `scripts/popularity.mjs` 生态热度排序
- 引入 `scripts/build-catalog.mjs` 自动生成能力索引

---

### 3. 测试与可靠性

| 子维度 | EFW | EFCC | 谁领先 |
|---|---|---|---|
| **测试文件** | `scripts/verify-efw.mjs`（安装后自检） | `tests/run-all.mjs` + 6 个 .test.mjs + doctor.mjs | **EFCC**（测试矩阵更完整） |
| **断言覆盖** | 安装就位检查 | install/match/learn/mcp-install/mode/doctor 共 48 个断言 | **EFCC** |
| **端到端验证** | 自检脚本 | match 热度开关对比 + 集成测试报告 + 3 子代理真实任务 | **EFCC** |
| **Hooks 支持** | 不明确，ROUND2.md 列为待核实 | 已实现 PreToolUse/PostToolUse/SessionStart hooks 并自动注册 | **EFCC** |

**EFW 应借鉴 EFCC**：
- 建立 `tests/` 目录与 `run-all.mjs`
- 补齐 match.test.mjs 验证热度排序
- 实现 hooks 并写入 settings.json

---

### 4. 工作模式上下文

| 子维度 | EFW | EFCC | 谁领先 |
|---|---|---|---|
| **模式切换** | ROUND2.md 列为 P2 选做（M5） | 已实现 dev/review/research/ship 四模式 + mode.mjs | **EFCC** |
| **自动学习** | `automations/learn-digest.prompt.md` 模板 | 已实现 PostToolUse hook + learn.mjs 确认/丢弃 | **EFCC** |
| **身份档案** | `efw-profile` 写入 MEMORY.md | `efc-profile` 写入 CLAUDE.md / AGENTS.md | **平手** |

**EFW 应借鉴 EFCC**：
- 实现 `contexts/` 四种模式
- 实现 `scripts/learn.mjs` + hooks 联动

---

### 5. 平台适配

| 子维度 | EFW | EFCC | 谁领先 |
|---|---|---|---|
| **WorkBuddy** | ✅ 原生适配 | ❌ 未适配 | **EFW** |
| **Claude Code** | ❌ 未适配 | ✅ 原生适配 | **EFCC** |
| **Codex** | ❌ 未适配 | ✅ 原生适配 | **EFCC** |
| **双端同时安装** | ❌ | ✅ `install.mjs --target both` | **EFCC** |

**互补点**：EFW 占领 WorkBuddy 生态，EFCC 占领 Claude/Codex 生态。两者代码结构高度相似，未来可共享 `scripts/build-catalog.mjs`、`mcp-templates/`、`tests/` 等中性模块。

---

## 三、互补优化清单

### EFCC 应立即从 EFW 借鉴的 3 件事

1. **自动安装入口**
   - 在 README.md 最上方加：「把这个仓库链接丢给你的 Claude/Codex：https://github.com/xiaoqiuqiu889/everytingworkbuddy/tree/EFCC」
   - 提供 agent prompt：「请把 https://github.com/xiaoqiuqiu889/everytingworkbuddy/tree/EFCC 这个工程在我电脑上实现一遍，运行安装脚本，并完成 doctor 自检。」

2. **安装器自动检测 agent 环境**
   - `install.mjs` 默认 `--target both`，但如果检测到在 WorkBuddy 会话中，应提示「请使用 EFW」
   - 如果检测到 Codex CLI，默认 `--target codex`
   - 如果检测到 Claude Code，默认 `--target claude`

3. **更口语化的 README 引导**
   - EFW 的 README 第一句话就是甩链接，适合聊天式 agent
   - EFCC README 可以更短、更少技术细节，把「丢链接」放在 CTA

### EFW 应从 EFCC 借鉴的 5 件事

1. **MCP 模板体系**：把 `mcp/mcp-servers.json` 拆成 `mcp-templates/` 15 个 JSON + `mcp-install.mjs`
2. **生态热度排序**：`scripts/popularity.mjs` + `.popularity-cache.json` 让 match 推荐更有依据
3. **测试矩阵**：`tests/run-all.mjs` + `*.test.mjs` 覆盖 install/match/learn/mcp-install/mode
4. **Hooks 自动注册**：把 safety/learn/session-brief hooks 写入 WorkBuddy settings.json
5. **模式上下文**：实现 `contexts/dev.md` / `review.md` / `research.md` / `ship.md`

---

## 四、EFCC 安装模式改造方案

目标：把 EFCC 的安装指令改成和 EFW 一样，用户只需把 GitHub 仓库链接丢给 agent。

### 改造点 1：README.md / install.md 文案

开头改成：

```markdown
## 安装（推荐方式）

把下面仓库链接甩给你的 Claude/Codex：

> 请把这个工程在我的电脑中实现一遍：https://github.com/xiaoqiuqiu889/everytingworkbuddy/tree/EFCC

Agent 会自动 clone、运行安装脚本、并完成双平台自检。
```

### 改造点 2：install.mjs 自动检测当前 agent

```javascript
function detectTarget() {
  // 如果用户在 Claude Code 会话里调用，大概率有 CLAUDE_CODE 相关 env
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_PROJECT_DIR) return 'claude';
  // Codex CLI 常见标识
  if (process.env.CODEX_CLI || process.env.OPENAI_API_KEY && process.env.CODEX_ENV) return 'codex';
  // 兜底：both
  return 'both';
}
```

### 改造点 3：提供 agent-install-prompt.md

在 `examples/agent-install-prompt.md` 放一个标准 prompt：

```markdown
请执行以下步骤：
1. 克隆 https://github.com/xiaoqiuqiu889/everytingworkbuddy/tree/EFCC 到本地
2. 运行 node EFCC/scripts/install.mjs
3. 运行 node EFCC/scripts/doctor.mjs 确认全部通过
4. 向我汇报安装结果
```

### 改造点 4：安装后首次使用引导

安装脚本完成后，输出一句：

```
✓ EFCC 已安装。新会话中遇到实质任务，先说「用 efc」或直接描述需求即可触发四步外壳。
```

---

## 五、结论

- **EFW 强于**：WorkBuddy 原生体验、README 口语化、单平台极简安装
- **EFCC 强于**：双平台覆盖、测试矩阵、MCP 模板、生态热度排序、hooks、模式上下文
- **最佳策略**：EFCC 吸收 EFW 的「甩链接安装」体验；EFW 吸收 EFCC 的「模板+热度+测试+hooks」工程能力。两者共享中性脚本（build-catalog、popularity、mcp-install）可减少重复建设。
