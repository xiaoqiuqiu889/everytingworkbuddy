# EFW 第二轮拆解 · 可执行开发计划

> 目标锁定（来自你的三条确认）：
> 1. **B + C**：不复刻目录结构，复刻 everything-claude-code 的六类能力价值，按 WorkBuddy 原生机制重做，并产出「组件 → 机制」映射清单。
> 2. **交付物**：可执行的模块化开发计划（分步骤 + 验收标准）+ 功能清单与优先级，能逐任务派给便宜模型执行。
> 3. **使用场景**：个人 / 系统级日常生产力，一套每天真在用的生产级配置，可移植复现。

---

## 0. 现状对账（Gap Analysis）

对照原仓库 `worldflowai/everything-claude-code` 的实际构成，逐类对账 EFW 当前状态：

| 原仓库组件 | 类型 | EFW 现状 | 处置 |
| --- | --- | --- | --- |
| `agents/` 9 个 | 子代理 | ✅ 9 个提示词就位（`agents/`） | 已达标 |
| `rules/` 6 个 | 准则 | ✅ 6 个文件 + 核心红线并入 MEMORY | 已达标 |
| `skills/` 9 个 | 技能 | 🟡 已装 6 个工作流技能；缺 3 个进阶流程技能 | 补 M1 |
| `commands/` 10 个 | 斜杠命令 | 🟡 折叠进 6 个 `efw-*` 技能；缺 verify/checkpoint/learn | 补 M1 |
| `mcp-configs/` 15 个 | MCP | 🟡 装 2 个无密钥 + 连接器指引 + 模板 | v1 达标 |
| `hooks/` + `scripts/` | 钩子/脚本 | 🔴 仅 Automation 模板，未核实 hooks 支持 | 核实 M3 + 选做 M6 |
| `tests/` 62 个 | 测试 | 🔴 无安装自检工具 | 建 M2 |
| `contexts/` 3 个 | 模式上下文 | 🔴 未做 | 选做 M5 |
| `examples/` 2 个 | 示例 | 🟡 install.md/README 够用；缺项目级范例 | 补 M4 |

**结论**：第一层（agents/rules/核心 skills/mcp）已可用；缺口集中在「进阶流程技能、安装自检、hooks 核实、示例、模式上下文」。

---

## 1. 模块拆解 · Track 1（收尾 EFW 配置包）

每个模块含：目标 / 步骤 / 验收 / 优先级 / **建议模型档**（lite=机械活，mid=需代码或判断）。

### M1 · 补齐进阶流程技能与命令
- **目标**：把原仓库里高频的 verify / checkpoint / learn 三个流程，做成 EFW 技能，使「验证循环 / 状态保存 / 会话学习」可用。
- **步骤**：
  1. 写 `efw-verify`：定义验证循环（跑测试→看覆盖率→红则回到修复），参考原 `commands/verify.md`。
  2. 写 `efw-checkpoint`：保存当前验证状态为可恢复快照（落 `EFW/.workbuddy/memory/`）。
  3. 写 `efw-learn`：从会话提炼可复用模式，复用 `automations/learn-digest.prompt.md` 逻辑。
  4. 安装到 `~/.workbuddy/skills/` 并登记 `agent-created-skills.json`，复制源副本到 `skills/`。
- **验收**：3 个技能可被调用；SKILL.md 含 frontmatter + 清晰步骤；通过安全审查（无硬编码密钥）。
- **优先级**：P0 ｜ **模型档**：lite（纯文档写作，套用既有格式）。

### M2 · EFW 安装自检工具
- **目标**：一条命令验证 EFW 全部组件就位、mcp.json 合法，避免「装了一半不知道」。
- **步骤**：
  1. 写 `scripts/verify-efw.mjs`（Node，跨平台）：检查 `agents/` 9 文件、`rules/` 6 文件、`~/.workbuddy/skills/efw-*` 6+3 个、`mcp.json` JSON 合法、`MEMORY.md` 含 EFW 段。
  2. 输出 PASS/FAIL 清单；任一缺失则报错并指出版本。
  3. 在 `README.md` 与 `install.md` 加入「运行自检」一节。
- **验收**：`node scripts/verify-efw.mjs` 退出码 0 且全绿；人为删文件后报 FAIL。
- **优先级**：P0 ｜ **模型档**：mid（需写可运行脚本 + 错误处理）。

### M3 · 核实 WorkBuddy hooks 支持并决策
- **目标**：搞清楚 WorkBuddy 是否原生支持 `settings.json` 事件钩子；据此决定 hooks 怎么落地。
- **步骤**：
  1. 查 WorkBuddy 文档 / `settings.json` schema，确认 PreToolUse / PostToolUse / Stop 等钩子是否被支持。
  2. 若支持：把原 `hooks/hooks.json`（如 console.log 警告）转写为 WorkBuddy 格式并写入 `settings.json`（不破坏现有配置）。
  3. 若不支持：正式定性「Automation 定时任务 = hooks 的等价替代」，在 `automations/README.md` 写明哪些原 hooks 已覆盖、哪些不可覆盖。
- **验收**：产出明确结论文档；若支持则 `settings.json` 含一个无害示例钩子（如提醒勿 console.log）；若不支持则文档无歧义。
- **优先级**：P1 ｜ **模型档**：mid（需调研 + 判断 + 谨慎改配置）。

### M4 · 项目级消费范例 `EFW.md`
- **目标**：给一个真实项目看「怎么用 EFW」，降低上手成本。
- **步骤**：
  1. 写 `examples/EFW.md`：项目根级配置范例，演示如何触发 `efw-plan-feature` / `efw-tdd-workflow`、引用 `rules/`、启用连接器。
  2. 在 `install.md` 增加「在新项目启用 EFW」一节，指向该范例。
- **验收**：范例自洽、命令名与已装技能一致；install.md 链接可达。
- **优先级**：P1 ｜ **模型档**：lite（文档 + 链接）。

### M5 · 三种工作模式上下文（dev / review / research）
- **目标**：让「切模式」有现成提示词，对应原 `contexts/`。
- **步骤**：
  1. 写 `skills/efw-mode` 或在 `MEMORY.md` 加一段：三种模式的系统提示片段（dev=实现优先、review=审查优先、research=探索优先）。
  2. 提供「切换到 X 模式」触发方式。
- **验收**：说「切到 review 模式」能加载对应准则侧重。
- **优先级**：P2 ｜ **模型档**：lite。

### M6 · 可复用 Node 工具脚本（选做）
- **目标**：把原 `scripts/` 里真正有价值、与 hooks 解耦的工具（会话模式提取、包管理器探测）做成独立 CLI。
- **步骤**：写 `scripts/lib/` 下的 `package-manager.mjs`、`evaluate-session.mjs`，在 M2 自检中复用。
- **验收**：脚本可被 M2 自检调用；无外部密钥依赖。
- **优先级**：P2 ｜ **模型档**：mid。

---

## 2. 模块拆解 · Track 2（用 EFW 启动真项目）

> 原则：架构规划用强推理（opus 档）做完；执行拆成小任务派 lite/mid。

### M7 · 选定验证项目（需你给一行范围）
- **目标**：用一个真实小项目跑通 EFW 全链路，证明配置不是摆设。
- **默认提案**（待你确认或替换）：一个 **TypeScript CLI 小工具**（如「本地 Markdown → 结构化校验器」），理由：能完整用上 `efw-plan-feature`(规划) → `efw-tdd-workflow`(实现) → `efw-code-review`(审查) → `efw-security-review`(审计) → `efw-build-fix`(修错)。
- **下一步**：你给项目名 + 一句话目标，我出架构计划（强推理），再拆执行任务。
- **优先级**：P0（Track 2 入口）｜ **模型档**：架构=强推理，执行=混合。

---

## 3. 完成定义（Definition of Done）

EFW v1 视为完成，当且仅当：
- [ ] M1：9 个技能（`efw-*`）全部安装并可用。
- [ ] M2：`verify-efw.mjs` 全绿，且人为破坏能报 FAIL。
- [ ] M3：hooks 支持结论明确，配置或文档无歧义。
- [ ] M4：`examples/EFW.md` 存在且 install.md 已链接。
- [ ] M7：至少一个真项目用 EFW 跑通核心链路，产出可运行产物。

---

## 4. 建议执行顺序（依赖关系）

```
M2(自检工具) ──┐
M1(补技能)  ───┤→ 并行可跑（lite/mid 分派）
M4(范例)   ───┤
M3(hooks核实)─┘（mid，先调研后改配置）
        ↓
M5/M6（选做，P2）
        ↓
M7(真项目) ← 需你给一行范围
```

**模型档分配小结**：M1/M4/M5=lite；M2/M3/M6=mid；M7 架构=强推理、执行=混合。你后续把便宜模型挂上，按上表逐模块派发即可。
