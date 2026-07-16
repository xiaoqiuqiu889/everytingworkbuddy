---
name: efw-code-review
description: "代码审查：从正确性、可读性、可维护性审查代码或 diff/PR，按严重级别给出问题和修复建议。当用户说\"看看这段代码/审一下/code review/PR 有没有问题/代码质量怎么样/帮我review\"时触发。Review code graded by severity with fixes."
description_zh: "代码审查：正确性/可读性/可维护性，按severity分级"
description_en: "Code review graded by severity with fixes"
version: 1.0.0
agent_created: true
---

# Code Review (EFW)

对代码做建设性审查，按严重程度分级并给出可执行修复。适用于 PR 审查、提交前自检、他人代码评估。

## 审查维度

1. **正确性**：逻辑、边界、错误处理、空值、并发。
2. **可读性**：命名、意图清晰度、必要注释（解释「为什么」）。
3. **结构**：单一职责、重复、抽象层次。
4. **可维护性**：耦合、测试覆盖、可扩展性。
5. **一致性**：符合项目既有风格与约定。
6. **性能**：N+1、无谓循环、内存/资源泄漏。

## 输出格式

```
## 🔴 必须修复（Blocker）
- file:line → 问题 → 修复建议

## 🟡 建议改进（Should）
- ...

## 🟢 可选优化（Nice-to-have）
- ...

## 亮点
- 值得肯定的做法
```

## 原则

- 对事不对人。
- 每个问题都给方案，不只挑刺。
- 区分优先级：风格问题 ≠ 正确性问题。
- 好实现要点名肯定。
