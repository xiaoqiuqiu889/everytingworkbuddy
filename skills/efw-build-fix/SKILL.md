---
name: efw-build-fix
description: "Diagnose and fix build/compile errors at the root cause instead of suppressing them. Use when a build fails, compilation errors appear, or the user invokes /build-fix. Fixes one error at a time and re-verifies."
description_zh: "定位并修复构建/编译错误，一次一个，重新验证"
description_en: "Fix build/compile errors at root cause"
version: 1.0.0
agent_created: true
---

# Build Fix (EFW)

快速定位并**从根因修复**构建/编译错误，而不是绕过或掩盖。

## 流程

1. **读第一个错误**：跑构建，读**最上面**的报错（后续错误常是连锁反应）。不要只看最后一行。
2. **定位根因**：错误信息 → 文件/行 → 真正原因（类型不匹配 / 缺依赖 / 配置错 / 循环引用 / 版本冲突）。
3. **最小修复**：只改导致错误处，修一个 → 重新构建 → 看下一个。
4. **验证**：完整构建干净通过，无新增警告。
5. **解释根因**：说清为什么错，避免重犯。

## 分类排查

- **类型错误**：类型定义、泛型、null/undefined、接口变更。
- **模块解析**：路径别名、tsconfig/webpack 配置、大小写敏感、缺失依赖。
- **依赖冲突**：锁文件、peer deps、版本范围；必要时清缓存重装。
- **环境不一致**：运行时版本、环境变量、平台差异（Windows/Unix 路径）。
- **配置漂移**：构建工具配置与代码不匹配。

## 禁忌

- 用 `@ts-ignore` / 关校验掩盖问题（除非有充分理由并注明）。
- 一次改一大片，无法定位是哪处修好的。
- 擅改第三方源码（应给 workaround）。
