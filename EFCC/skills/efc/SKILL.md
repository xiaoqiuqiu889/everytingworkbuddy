---
name: efc
description: "【实质任务的第一个动作，先于任何领域工具】任何会产出文件（.pdf/.xlsx/.pptx/.docx/.html/代码/设计稿…）、需 ≥3 步、或预计 ≥15 次工具调用的任务，动手前第一步先加载本技能——它是套在所有任务外的编排外壳（计划→干活→验收→沉淀），并自动路由到合适的 efc-* 子技能（plan-feature / tdd-workflow / code-review / build-fix / refactor-clean / security-review / verify / checkpoint / learn / github-push / profile）。领域技能（pdf / xlsx / pptx / docx 等）负责'干活'，但收尾的 efc-verify 逐条验收 + efc-learn 沉淀由本外壳强制、领域技能不豁免。用户说「用 efc」或报身份「我是…」也触发；也可用于「该用哪个 efc 技能 / 我该用哪些能力」的咨询。"
description_zh: "EFCC 统一入口，自动路由 11 个流程技能（Claude + Codex 双平台）"
description_en: "EFCC entry point: route to the right efc-* skill (Claude & Codex)"
version: 1.0.0
---

# EFCC — 统一入口（Claude 桌面版 / Codex 双平台）

你不必记住所有 efc-* 技能的名字。说「用 efc」或描述你的需求，本入口会**自动判断**该走哪个子技能，然后加载并遵循它。

> **本包同时服务 Claude（桌面/Code）与 Codex（ChatGPT/CLI）两套助手。**
> - 在 **Claude** 里：本技能作为 `~/.claude/skills/efc/SKILL.md`，相关时自动加载，或用 `/efc` 显式调用。
> - 在 **Codex** 里：本技能作为 `~/.codex/prompts/efc.md`，用 `/efc` 斜杠命令调用；四步外壳的常驻纪律写在 `~/.codex/AGENTS.md`，每会话自动注入。

## ⛔ 第一动作：实质任务先加载 efc，不是可选

> **默认行为（从现在起，不等用户点名）**：判定为实质任务（产出文件 / ≥3 步 / ≥15 工具调用，满足任一）→ **你的第一个动作就是加载 `efc`，先于任何领域工具（pdf/xlsx/脚本…）**。这是一个**具体动作**，不是"有这个心态就行"。

**反"暗合"替代——以下都不算触发 EFCC，别拿它们冒充：**

| 你实际做了 | ≟ | EFCC 要求的 | 判定 |
| --- | --- | --- | --- |
| 用待办/任务清单拆了任务 | ≠ | 走了编排外壳 | ❌ 暗合≠触发 |
| 自己写了个校验脚本 / 肉眼看了一眼 | ≠ | `efc-verify` 逐条结构化签收 | ❌ 不算验收 |
| 写了条 memory 笔记 | ≠ | `efc-learn` 沉淀（够阈值时存成可复用能力） | ❌ 不算沉淀 |
| "四步我心里都过了一遍" | ≠ | 实际加载并执行了 efc / efc-* | ❌ 神似≠走技能 |

> 🚦 **DoD 硬闸门**：没跑 `efc-verify`（逐条对照验收标准签收）之前，**不许对用户说"做完了 / 已完成"**。文档 / 数据 / 设计任务（pdf/xlsx/pptx/docx）最容易被当成"纯领域技能任务"而跳过——**切勿豁免**。

## 路由表（需求信号 → 子技能）

| 你的需求含这些信号 | 自动路由到 |
| --- | --- |
| 规划 / 设计 / 技术选型 / 方案 / 怎么实现 | `efc-plan-feature` |
| TDD / 先写测试 / 测试驱动 / RED-GREEN-REFACTOR | `efc-tdd-workflow` |
| 审查 / 评审 / code review / PR / 代码质量 | `efc-code-review` |
| 构建 / 编译 / 打包 / 报错了 / CI 红了 | `efc-build-fix` |
| 重构 / 清理 / 死代码 / 坏味道 / 重复逻辑 | `efc-refactor-clean` |
| 安全 / 漏洞 / XSS / 注入 / 密钥泄露 / 权限校验 | `efc-security-review` |
| 收尾 / 验证 / 跑测试 / 覆盖率 / 宣布完成 | `efc-verify` |
| 暂停 / 中断 / 存快照 / 下次接着干 | `efc-checkpoint` |
| 提炼 / 沉淀 / 学习 / 可复用模式 | `efc-learn` |
| 推到 GitHub / push / git push 卡住 / 推不上去（沙箱） | `efc-github-push` |
| 我是… / 我需要… / 我该用哪些能力 / 帮我检索能力 | `efc-profile`（自动检索并写入个人档案） |
| 非研发任务（设计 / 文档 / 数据 / 报告 / 方案） | 仍先走「先想再做」：用 `efc-plan-feature` 拆解 → 交给对口专业技能干活（docx / pptx / xlsx 等）→ `efc-verify` 自检 |

## 核心心智：EFCC 是「编排外壳」，不是「另一条路」

EFCC 套在**所有实质任务**外面，是一个固定的四步外壳：

```
① 计划  →  ② 干活  →  ③ 验收(efc-verify)  →  ④ 沉淀(efc-learn)
           ↑ 这一步可交给任何对口领域技能或原生工具
```

- **有对口领域技能时，"干活"就交给它**——EFCC 不跟它抢，也不在它之外另起一套。领域技能自带的 plan/大纲**视为满足①**，不必再叠 `efc-plan-feature`（避免双规划浪费 token）。
- **但③验收、④沉淀是外壳的一部分，跨领域强制，领域技能不豁免**——这是历史上被"领域技能吞掉外壳"的最大漏用点。无论谁干的活，收尾都要 `efc-verify`（对照验收标准逐条签收）+ `efc-learn`（沉淀可复用套路）。
- 判定"是不是实质任务"用可判据阈值：**产出文件 / ≥3 步 / ≥15 工具调用** 满足任一即是。

## 用法

1. **自动路由**：直接说需求，例如「用 efc 帮我实现登录功能」→ 自动走 `efc-plan-feature` + `efc-tdd-workflow`。
2. **咨询该用哪个**：说「efc，这个需求该用哪个技能」→ 对照上表给出建议。
3. **显式指定**：仍可直接说「用 efc-plan-feature」，跳过路由。

## 平台差异（重要）

- **Claude**：技能会在相关时**自动加载**；四步纪律也在 `~/.claude/CLAUDE.md`，每会话自动注入。
- **Codex**：`~/.codex/prompts/*.md` 是**手动斜杠命令**（不自动加载）。所以四步外壳的"常驻性"靠 `~/.codex/AGENTS.md`（每会话自动注入）保证——遇实质任务，先按 AGENTS.md 的 0 号动作用 `/efc`。

## 原则

- 路由是基于需求**语义**的判断，不是关键词精确匹配；模糊需求**主动问一句**而不是乱猜。
- 复杂任务常需多个技能按依赖顺序串联（如 plan → tdd → verify），依次加载即可。
- 本入口本身不实现任何逻辑，只负责把请求交给对的子技能。
