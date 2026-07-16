---
name: efw
description: "【实质任务的第一个动作，先于任何领域工具】任何会产出文件（.pdf/.xlsx/.pptx/.docx/.html/代码/设计稿…）、需 ≥3 步、或预计 ≥15 次工具调用的任务，动手前第一步先加载本技能——它是套在所有任务外的编排外壳（计划→干活→验收→沉淀），并自动路由到合适的 efw-* 子技能（plan-feature / tdd-workflow / code-review / build-fix / refactor-clean / security-review / verify / checkpoint / learn / github-push / profile）。领域技能（pdf / xlsx / pptx / docx / huashu-design / md-to-html-report 等）负责'干活'，但收尾的 efw-verify 逐条验收 + efw-learn 沉淀由本外壳强制、领域技能不豁免。用户说「用 efw」或报身份「我是…」也触发；也可用于「该用哪个 efw 技能 / 我该用哪些能力」的咨询。"
description_zh: "EFW 统一入口，自动路由 9 个研发技能"
description_en: "EFW entry point: route to the right efw-* skill"
version: 1.0.0
agent_created: true
---

# EFW — 统一入口

你不一定要记住 9 个 efw-* 技能的名字。说「用 efw」或描述你的研发需求，本入口会**自动判断**该走哪个子技能，然后加载并遵循它。

## ⛔ 第一动作：实质任务先加载 efw，不是可选

> **默认行为（从现在起，不等用户点名）**：判定为实质任务（产出文件 / ≥3 步 / ≥15 工具调用，满足任一）→ **你的第一个动作就是加载 `efw`，先于任何领域工具（pdf/xlsx/脚本…）**。这是一个**具体动作**，不是"有这个心态就行"。

**反"暗合"替代——以下都不算触发 EFW，别拿它们冒充：**

| 你实际做了 | ≟ | EFW 要求的 | 判定 |
| --- | --- | --- | --- |
| 用 TaskCreate 拆了任务 | ≠ | 走了编排外壳 | ❌ 暗合≠触发 |
| 自己写了个 python 校验脚本 / 肉眼看了一眼 | ≠ | `efw-verify` 逐条结构化签收 | ❌ 不算验收 |
| 写了条 memory 笔记 | ≠ | `efw-learn` 沉淀（够阈值时存成可复用 skill） | ❌ 不算沉淀 |
| "四步我心里都过了一遍" | ≠ | 实际加载并执行了 efw / efw-* | ❌ 神似≠走技能 |

> 🚦 **DoD 硬闸门**：没跑 `efw-verify`（逐条对照验收标准签收）之前，**不许对用户说"做完了 / 已完成"**。文档 / 数据 / 设计任务（pdf/xlsx/pptx/docx）最容易被当成"纯领域技能任务"而跳过——**切勿豁免**。

## 路由表（需求信号 → 子技能）

| 你的需求含这些信号 | 自动路由到 |
| --- | --- |
| 规划 / 设计 / 技术选型 / 方案 / 怎么实现 | `efw-plan-feature` |
| TDD / 先写测试 / 测试驱动 / RED-GREEN-REFACTOR | `efw-tdd-workflow` |
| 审查 / 评审 / code review / PR / 代码质量 | `efw-code-review` |
| 构建 / 编译 / 打包 / 报错了 / CI 红了 | `efw-build-fix` |
| 重构 / 清理 / 死代码 / 坏味道 / 重复逻辑 | `efw-refactor-clean` |
| 安全 / 漏洞 / XSS / 注入 / 密钥泄露 / 权限校验 | `efw-security-review` |
| 收尾 / 验证 / 跑测试 / 覆盖率 / 宣布完成 | `efw-verify` |
| 暂停 / 中断 / 存快照 / 下次接着干 | `efw-checkpoint` |
| 提炼 / 沉淀 / 学习 / 可复用模式 | `efw-learn` |
| 推到 GitHub / push / git push 卡住 / 推不上去（沙箱） | `efw-github-push` |
| 我是… / 我需要… / 我该用哪些能力 / 帮我检索能力 | `efw-profile`（自动检索并写入个人档案） |
| 非研发任务（设计 / 文档 / 数据 / 报告 / 方案） | 仍先走「先想再做」：用 `efw-plan-feature` 拆解 → 交给对口专业技能干活（huashu-design / docx / pptx / xlsx 等）→ `efw-verify` 自检 |

## 用法

1. **自动路由**：直接说需求，例如「用 efw 帮我实现登录功能」→ 自动走 `efw-plan-feature` + `efw-tdd-workflow`。
2. **咨询该用哪个**：说「efw，这个需求该用哪个技能」→ 对照上表给出建议。
3. **显式指定**：仍可直接说「用 efw-plan-feature」，跳过路由。

## 核心心智：EFW 是「编排外壳」，不是「另一条路」

EFW 套在**所有实质任务**外面，是一个固定的四步外壳：

```
① 计划  →  ② 干活  →  ③ 验收(efw-verify)  →  ④ 沉淀(efw-learn)
           ↑ 这一步可交给任何对口领域技能
             (huashu-design / md-to-html-report / earnings-analysis / ardot / xlsx …)
             或原生工具
```

- **有对口领域技能时，"干活"就交给它**——EFW 不跟它抢，也不在它之外另起一套。领域技能自带的 plan/大纲**视为满足①**，不必再叠 `efw-plan-feature`（避免双规划）。
- **但③验收、④沉淀是外壳的一部分，跨领域强制，领域技能不豁免**——这是历史上被"领域技能吞掉 EFW"的最大漏用点。无论谁干的活，收尾都要 `efw-verify`（对照验收标准逐条签收）+ `efw-learn`（沉淀可复用套路）。
- 判定"是不是实质任务"用可判据阈值：**产出文件 / ≥3 步 / ≥15 工具调用** 满足任一即是。

## 用法

1. **自动路由**：直接说需求，例如「用 efw 帮我实现登录功能」→ 自动走 `efw-plan-feature` + `efw-tdd-workflow`。
2. **咨询该用哪个**：说「efw，这个需求该用哪个技能」→ 对照上表给出建议。
3. **显式指定**：仍可直接说「用 efw-plan-feature」，跳过路由。

## 原则

- 路由是基于需求**语义**的判断，不是关键词精确匹配；模糊需求**主动问一句**而不是乱猜。
- 复杂任务常需多个技能按依赖顺序串联（如 plan → tdd → verify），依次加载即可。
- 本入口本身不实现任何逻辑，只负责把请求交给对的子技能。
- 触发后请先用 Skill 工具加载目标子技能，再按其 SKILL.md 的步骤执行。
