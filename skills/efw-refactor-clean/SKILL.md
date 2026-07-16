---
name: efw-refactor-clean
description: "Refactor code and remove dead code without changing external behavior. Use when the user asks to clean up, refactor, or remove dead/duplicate code, or invokes /refactor-clean. Requires test safety net and small steps."
description_zh: "重构与死代码清理，行为不变、小步验证"
description_en: "Refactor and remove dead code, behavior-preserving"
version: 1.0.0
agent_created: true
---

# Refactor Clean (EFW)

在**不改变外部行为**的前提下提升代码清晰度，清理死代码。

## 流程

1. **先建安全网**：确认有测试覆盖（或先补关键测试）。无测试保护的重构是危险的。
2. **识别目标**：
   - 死代码：未被引用的函数/变量/导入/文件。
   - 重复：可提取的重复逻辑。
   - 坏味道：过长函数、深嵌套、含糊命名、魔法数字、过大模块。
3. **小步重构**：一次一个动作（重命名/提取/内联/移动），每步后跑测试确认行为不变。
4. **删除谨慎**：删死代码前全局搜索确认无引用。
5. **验证**：全套测试 + 构建通过 + 关键路径手动确认。

## 死代码删除清单（删前必查）

- [ ] 全局搜索标识符，确认无引用
- [ ] 检查动态引用（反射 / 路由表 / 配置字符串）
- [ ] 确认非对外公开 API / 导出
- [ ] 有测试保护或已手动验证

## 原则

- 行为不变是铁律；改功能不叫重构。
- 每步独立可回滚。
- 不夹带新功能。
