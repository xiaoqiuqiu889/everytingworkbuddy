---
name: efw
description: "EFW 统一入口。收到研发类需求时自动路由到合适的 efw-* 子技能（plan-feature / tdd-workflow / code-review / build-fix / refactor-clean / security-review / verify / checkpoint / learn / profile）。用户说「用 efw」或「efw」时触发，也可用于「该用哪个 efw 技能」或「我该用哪些能力」的咨询。"
description_zh: "EFW 统一入口，自动路由 9 个研发技能"
description_en: "EFW entry point: route to the right efw-* skill"
version: 1.0.0
agent_created: true
---

# EFW — 统一入口

你不一定要记住 9 个 efw-* 技能的名字。说「用 efw」或描述你的研发需求，本入口会**自动判断**该走哪个子技能，然后加载并遵循它。

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
| 我是… / 我需要… / 我该用哪些能力 / 帮我检索能力 | `efw-profile`（自动检索并写入个人档案） |

## 用法

1. **自动路由**：直接说需求，例如「用 efw 帮我实现登录功能」→ 自动走 `efw-plan-feature` + `efw-tdd-workflow`。
2. **咨询该用哪个**：说「efw，这个需求该用哪个技能」→ 对照上表给出建议。
3. **显式指定**：仍可直接说「用 efw-plan-feature」，跳过路由。

## 原则

- 路由是基于需求**语义**的判断，不是关键词精确匹配；模糊需求**主动问一句**而不是乱猜。
- 复杂任务常需多个技能按依赖顺序串联（如 plan → tdd → verify），依次加载即可。
- 本入口本身不实现任何逻辑，只负责把请求交给对的子技能。
- 触发后请先用 Skill 工具加载目标子技能，再按其 SKILL.md 的步骤执行。
