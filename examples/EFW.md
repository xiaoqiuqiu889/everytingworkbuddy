# EFW.md — 项目级消费范例

把这份文件当作你项目根目录的 `EFW.md`，让协作者（和你未来的自己）知道这个项目用 EFW 配置包干活。它不是必须的配置文件，而是**约定说明书**。

> 前提：EFW 已安装到用户级（见仓库 `install.md`）。本文件只描述「在这个项目里怎么用」。

---

## 本项目启用的 EFW 能力

```yaml
skills:                # 需要时直接说「用 efw-xxx」
  - efw-plan-feature   # 先规划再写
  - efw-tdd-workflow   # TDD 实现
  - efw-code-review    # 审查
  - efw-build-fix      # 修构建错误
  - efw-refactor-clean # 重构清理
  - efw-security-review# 安全审计
  - efw-verify         # 验证循环
  - efw-checkpoint     # 中途存快照
  - efw-learn          # 会话结束提炼

connectors:            # 在连接器面板授权，本项目启用 < 10 个
  - github             # 仓库/PR/Issue
  # - tapd            # 需求/缺陷（按需）
  # - cnb             # 司内代码托管（按需）

mcp:                   # 已在 mcp.json，需到自定义连接器点信任
  - context7          # 查最新库文档
  - sequential-thinking

rules:                 # 自动遵循（在用户级 MEMORY.md）
  - 安全 / 编码 / 测试 / Git / 委派 / 性能
```

## 典型工作流

1. **接需求** → 「用 efw-plan-feature 规划 <功能>」产出计划，确认后实现。
2. **实现** → 「用 efw-tdd-workflow 实现 <x>」走 RED→GREEN→REFACTOR。
3. **收尾** → 「用 efw-code-review 审一下」+「用 efw-security-review 审计」。
4. **中途暂停** → 「用 efw-checkpoint 存个快照」，下次续上。
5. **会话结束** → 「用 efw-learn 提炼今天值得留的」。

## 约定

- 提交遵循 `type(scope): subject`（见 `rules/git-workflow.md`）。
- 新功能/修 bug 先写测试；关键路径覆盖率 ≥ 80%。
- 不硬编码密钥，统一走环境变量 / 连接器授权。
- 用不到的连接器不开，保持上下文精简。

---

*本文件是 EFW 的 `examples/EFW.md` 范例。复制到你项目根目录按需删改即可。*
