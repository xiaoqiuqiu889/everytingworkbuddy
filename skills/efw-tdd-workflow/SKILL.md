---
name: efw-tdd-workflow
description: "测试驱动开发：先写失败测试再实现，走 RED→GREEN→REFACTOR，关键路径覆盖 80%+。当用户说\"先写测试/测试驱动/TDD/边写边测/用tdd做\"时触发。Test-driven development workflow."
description_zh: "测试驱动开发工作流，RED-GREEN-REFACTOR 循环"
description_en: "TDD workflow: RED-GREEN-REFACTOR loop"
version: 1.0.0
agent_created: true
---

# TDD Workflow (EFW)

严格的测试驱动开发。**先写测试，再写实现。** 适用于新功能实现、bug 修复（先写复现测试）。

## 循环：RED → GREEN → REFACTOR

### 0. 定义契约
明确目标单元的输入、输出、边界条件、错误行为。写下来再动手。

### 1. RED —— 写一个失败的测试
- 只针对**一个**最小行为写测试。
- 运行测试，**确认它因为正确的原因失败**（不是语法错、不是找不到文件）。
- 命名规范：`场景_条件_预期结果`。

### 2. GREEN —— 最小实现
- 写**刚好**让测试通过的代码，不多写、不提前泛化。
- 运行，确认通过。

### 3. REFACTOR —— 在绿色下重构
- 消除重复、改善命名、理顺结构。
- 每次小改动后重跑测试，保持绿色。

### 4. 循环
回到 RED，覆盖下一个行为，直到覆盖所有分支与边界。

### 5. 验证覆盖率
- 关键路径目标 **≥ 80%**。
- 报告未覆盖分支及原因。

## 检查清单

- [ ] 每个实现前都有先失败的测试
- [ ] 边界：空值 / 极值 / 异常 / 并发（如适用）
- [ ] 测试测行为而非实现细节（不脆弱）
- [ ] Arrange-Act-Assert 结构清晰
- [ ] 全套测试 + 构建通过

## 常见运行命令（按项目自动识别）

```bash
# JS/TS
npm test / npm run test:watch / npx jest --coverage / npx vitest run --coverage
# Python
pytest / pytest --cov / pytest -k "test_name"
# Go
go test ./... -cover
```

## 禁忌

- 没有失败测试就写实现代码。
- 一个循环塞多个行为。
- 为了绿色而删测试 / 弱化断言。
