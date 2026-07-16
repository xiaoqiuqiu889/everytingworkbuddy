#!/usr/bin/env python3
# EFW 专家填充脚本 (build_experts.py)
# 把 agents/*.md 的源提示词，转化为 9 个 WorkBuddy 专家包（补全 plugin.json + Agent MD + README）。
# 前置：已用 expert-manager 的 init_expert.py 初始化骨架。

import json
import os
from pathlib import Path

EFW_ROOT = Path(__file__).resolve().parent.parent
EXPERTS_DIR = Path(os.environ.get("WORKBUDDY_CONFIG_DIR", str(Path.home() / ".workbuddy"))) / "plugins" / "marketplaces" / "my-experts" / "plugins"

# 9 个专家元数据。src = EFW/agents 下的源文件名；name = 专家 kebab 名（agentName=文件名）。
EXPERTS = [
    {
        "name": "efw-planner", "src": "planner.md",
        "displayName": {"en": "EFW Planner", "zh": "EFW 规划师"},
        "profession": {"en": "Implementation Planner", "zh": "实现规划师"},
        "description": "EFW planning subagent: breaks a requirement into a clear, ordered, executable implementation plan with dependencies and acceptance criteria.",
        "displayDescription": {"en": "Breaks requirements into a clear, ordered, executable plan with dependencies and acceptance criteria.",
                                "zh": "把需求拆解成清晰、可执行、有顺序的实现计划，明确依赖关系与每步验收标准，只产出计划不动手写代码。"},
        "categoryId": "02-Engineering",
        "defaultInitPrompt": {"en": "Help me break this requirement into an executable plan.", "zh": "帮我把这个需求拆成可执行的实现计划"},
        "tags": [{"en": "Planning", "zh": "规划"}, {"en": "Breakdown", "zh": "任务拆解"}, {"en": "Acceptance", "zh": "验收标准"}],
        "quickPrompts": [
            {"en": "Break this requirement into an executable plan", "zh": "帮我把这个需求拆成可执行的实现计划"},
            {"en": "Identify risks and rollback points in this plan", "zh": "识别这个方案的风险和回滚点"},
            {"en": "Which steps are parallelizable vs sequential", "zh": "评估这几个步骤的依赖关系，哪些能并行"},
        ],
    },
    {
        "name": "efw-architect", "src": "architect.md",
        "displayName": {"en": "EFW Architect", "zh": "EFW 架构师"},
        "profession": {"en": "System Architect", "zh": "系统架构师"},
        "description": "EFW architecture subagent: designs systems and makes technology-selection decisions balancing scalability, performance and maintainability.",
        "displayDescription": {"en": "Designs system architecture and makes tech-selection decisions, balancing scalability, performance and maintainability.",
                                "zh": "做系统设计与技术选型决策，权衡可扩展性、性能与可维护性，产出架构方案与接口契约。"},
        "categoryId": "02-Engineering",
        "defaultInitPrompt": {"en": "Help me design the architecture for this system.", "zh": "帮我设计这个系统的架构"},
        "tags": [{"en": "Architecture", "zh": "架构设计"}, {"en": "Tech Selection", "zh": "技术选型"}, {"en": "Scalability", "zh": "可扩展性"}],
        "quickPrompts": [
            {"en": "Design the architecture for this system", "zh": "帮我设计这个系统的架构"},
            {"en": "Compare these tech-selection options", "zh": "对比这几个技术选型方案的优劣"},
            {"en": "How should this module split its responsibilities", "zh": "这个模块该怎么划分职责"},
        ],
    },
    {
        "name": "efw-tdd-guide", "src": "tdd-guide.md",
        "displayName": {"en": "EFW TDD Coach", "zh": "EFW TDD 教练"},
        "profession": {"en": "TDD Coach", "zh": "测试驱动开发教练"},
        "description": "EFW TDD subagent: guides the test-driven development loop (RED-GREEN-REFACTOR), writing failing tests before implementation.",
        "displayDescription": {"en": "Guides the TDD loop (RED-GREEN-REFACTOR), writing failing tests before implementation to guarantee coverage.",
                                "zh": "引导测试驱动开发循环（RED→GREEN→REFACTOR），先写失败测试再实现，保证关键路径覆盖。"},
        "categoryId": "02-Engineering",
        "defaultInitPrompt": {"en": "Implement this feature using TDD.", "zh": "用 TDD 帮我实现这个功能"},
        "tags": [{"en": "TDD", "zh": "测试驱动"}, {"en": "Unit Testing", "zh": "单元测试"}, {"en": "Refactor", "zh": "重构"}],
        "quickPrompts": [
            {"en": "Implement this feature using TDD", "zh": "用 TDD 帮我实现这个功能"},
            {"en": "What test covers this edge case first", "zh": "先写什么测试能覆盖这个边界"},
            {"en": "Why is this test red and how to fix it", "zh": "这个测试为什么红了，怎么修"},
        ],
    },
    {
        "name": "efw-code-reviewer", "src": "code-reviewer.md",
        "displayName": {"en": "EFW Code Reviewer", "zh": "EFW 代码审查员"},
        "profession": {"en": "Code Quality Reviewer", "zh": "代码质量审查员"},
        "description": "EFW code-review subagent: reviews correctness, readability and maintainability, flags bugs and smells with actionable fixes.",
        "displayDescription": {"en": "Reviews code for correctness, readability and maintainability; flags bugs and smells with actionable fixes.",
                                "zh": "从正确性、可读性、可维护性审查代码，指出 bug 与坏味道，给出可执行的改进建议。"},
        "categoryId": "10-ProjectQuality",
        "defaultInitPrompt": {"en": "Review the quality of this code.", "zh": "审查这段代码的质量"},
        "tags": [{"en": "Code Review", "zh": "代码评审"}, {"en": "Quality", "zh": "代码质量"}, {"en": "Maintainability", "zh": "可维护性"}],
        "quickPrompts": [
            {"en": "Review the quality of this code", "zh": "审查这段代码的质量"},
            {"en": "Are there potential bugs in this code", "zh": "这段代码有潜在的 bug 吗"},
            {"en": "How to refactor this to be clearer", "zh": "怎么重构这段让它更清晰"},
        ],
    },
    {
        "name": "efw-security-reviewer", "src": "security-reviewer.md",
        "displayName": {"en": "EFW Security Reviewer", "zh": "EFW 安全审查员"},
        "profession": {"en": "Security Reviewer", "zh": "安全合规审查员"},
        "description": "EFW security subagent: analyzes code for vulnerabilities and sensitive-data leakage (injection, XSS, secrets, authz).",
        "displayDescription": {"en": "Analyzes code for security vulnerabilities and secret leakage across injection, XSS, secrets and authorization.",
                                "zh": "分析代码中的安全漏洞与敏感信息泄露风险，覆盖注入、XSS、密钥管理与权限校验。"},
        "categoryId": "11-SecurityCompliance",
        "defaultInitPrompt": {"en": "Do a security review and find vulnerabilities.", "zh": "做安全审查，找漏洞"},
        "tags": [{"en": "Security", "zh": "安全审查"}, {"en": "Vulnerability", "zh": "漏洞分析"}, {"en": "Compliance", "zh": "合规"}],
        "quickPrompts": [
            {"en": "Do a security review and find vulnerabilities", "zh": "做安全审查，找漏洞"},
            {"en": "Any secret or sensitive data leakage here", "zh": "这段代码有没有密钥或敏感信息泄露"},
            {"en": "Is authorization missing on this endpoint", "zh": "这个接口有权限校验缺失吗"},
        ],
    },
    {
        "name": "efw-build-error-resolver", "src": "build-error-resolver.md",
        "displayName": {"en": "EFW Build Fixer", "zh": "EFW 构建修复师"},
        "profession": {"en": "Build & Compile Fixer", "zh": "构建与编译修复师"},
        "description": "EFW build-fix subagent: locates and fixes build/compile/packaging errors at root cause, never silencing the failure.",
        "displayDescription": {"en": "Locates and fixes build/compile/packaging errors at root cause, restoring a deliverable state without silencing errors.",
                                "zh": "定位并修复构建、编译、打包错误，从根因入手而非压制报错，恢复可交付状态。"},
        "categoryId": "02-Engineering",
        "defaultInitPrompt": {"en": "The build failed, help me find the root cause.", "zh": "构建报错了，帮我定位根因"},
        "tags": [{"en": "Build", "zh": "构建修复"}, {"en": "Debugging", "zh": "故障定位"}, {"en": "CI", "zh": "持续集成"}],
        "quickPrompts": [
            {"en": "Build failed, help me find the root cause", "zh": "构建报错了，帮我定位根因"},
            {"en": "What does this compile error mean and how to fix", "zh": "这个编译错误是什么意思，怎么修"},
            {"en": "Why is the CI pipeline failing", "zh": "CI 流水线为什么失败了"},
        ],
    },
    {
        "name": "efw-e2e-runner", "src": "e2e-runner.md",
        "displayName": {"en": "EFW E2E Tester", "zh": "EFW E2E 测试师"},
        "profession": {"en": "End-to-End Tester", "zh": "端到端测试师"},
        "description": "EFW e2e subagent: writes and runs end-to-end tests covering core user paths, verifying real behavior.",
        "displayDescription": {"en": "Writes and runs end-to-end tests covering core user paths, verifying real system behavior not implementation.",
                                "zh": "编写并执行端到端测试，覆盖核心用户路径，验证系统真实行为而非实现细节。"},
        "categoryId": "10-ProjectQuality",
        "defaultInitPrompt": {"en": "Write end-to-end tests for this core flow.", "zh": "为这个核心流程写端到端测试"},
        "tags": [{"en": "E2E", "zh": "端到端测试"}, {"en": "Testing", "zh": "测试"}, {"en": "Automation", "zh": "自动化"}],
        "quickPrompts": [
            {"en": "Write end-to-end tests for this core flow", "zh": "为这个核心流程写端到端测试"},
            {"en": "Why did this E2E case fail", "zh": "这个 E2E 用例为什么失败了"},
            {"en": "How to set up a stable E2E environment", "zh": "怎么搭建可稳定的 E2E 环境"},
        ],
    },
    {
        "name": "efw-refactor-cleaner", "src": "refactor-cleaner.md",
        "displayName": {"en": "EFW Refactor Cleaner", "zh": "EFW 重构清理师"},
        "profession": {"en": "Refactor & Cleanup", "zh": "重构与清理师"},
        "description": "EFW refactor subagent: removes dead code and duplicates, performs safe refactors keeping external behavior unchanged.",
        "displayDescription": {"en": "Cleans dead code and duplication, performs safe refactors that keep external behavior unchanged while improving readability.",
                                "zh": "清理死代码与重复逻辑，做安全重构，保持外部行为不变的同时提升代码可读性。"},
        "categoryId": "02-Engineering",
        "defaultInitPrompt": {"en": "Clean up the bad smells in this code.", "zh": "清理这段代码的坏味道"},
        "tags": [{"en": "Refactor", "zh": "重构"}, {"en": "Clean Code", "zh": "代码清理"}, {"en": "Dead Code", "zh": "死代码"}],
        "quickPrompts": [
            {"en": "Clean up the bad smells in this code", "zh": "清理这段代码的坏味道"},
            {"en": "How to merge this duplicated logic", "zh": "这段重复逻辑怎么合并"},
            {"en": "Help me safely refactor this function", "zh": "帮我安全重构这个函数"},
        ],
    },
    {
        "name": "efw-doc-updater", "src": "doc-updater.md",
        "displayName": {"en": "EFW Doc Syncer", "zh": "EFW 文档同步师"},
        "profession": {"en": "Documentation Syncer", "zh": "文档同步师"},
        "description": "EFW doc subagent: keeps documentation consistent with code, syncing API changes and behavior so docs reflect current implementation.",
        "displayDescription": {"en": "Keeps docs consistent with code, syncing interface changes and behavior so documentation reflects the current implementation.",
                                "zh": "保持文档与代码一致，同步接口变更与行为说明，让文档准确反映当前实现。"},
        "categoryId": "02-Engineering",
        "defaultInitPrompt": {"en": "Sync this doc with the latest code.", "zh": "同步这份文档和最新代码"},
        "tags": [{"en": "Docs", "zh": "文档同步"}, {"en": "Consistency", "zh": "一致性"}, {"en": "API", "zh": "接口说明"}],
        "quickPrompts": [
            {"en": "Sync this doc with the latest code", "zh": "同步这份文档和最新代码"},
            {"en": "What doc needs updating after this code change", "zh": "这段代码改了，文档哪里要更新"},
            {"en": "Generate interface docs for this module", "zh": "帮我生成这个模块的接口说明"},
        ],
    },
]


def build_one(e):
    d = EXPERTS_DIR / e["name"]
    # 1) plugin.json
    plugin = {
        "name": e["name"],
        "version": "1.0.0",
        "description": e["description"],
        "author": {"name": "EFW", "email": "efw@local"},
        "agents": [f"./agents/{e['name']}.md"],
        "expertType": "agent",
        "agentName": e["name"],
        "displayName": e["displayName"],
        "profession": e["profession"],
        "displayDescription": e["displayDescription"],
        "avatar": "avatars/expert.png",
        "categoryId": e["categoryId"],
        "defaultInitPrompt": e["defaultInitPrompt"],
        "plugin": e["name"],
        "tags": e["tags"],
        "quickPrompts": e["quickPrompts"],
    }
    (d / ".codebuddy-plugin" / "plugin.json").write_text(json.dumps(plugin, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # 2) agents/<name>.md —— 读取源正文，加 frontmatter
    src = EFW_ROOT / "agents" / e["src"]
    body = src.read_text(encoding="utf-8").lstrip()
    # 去掉源文件里可能残留的 "# 标题" 行由正文保留即可；统一加 frontmatter
    md = (
        "---\n"
        f"name: {e['name']}\n"
        f"description: \"{e['description']}\"\n"
        "displayName:\n"
        f"  en: \"{e['displayName']['en']}\"\n"
        f"  zh: \"{e['displayName']['zh']}\"\n"
        "profession:\n"
        f"  en: \"{e['profession']['en']}\"\n"
        f"  zh: \"{e['profession']['zh']}\"\n"
        "maxTurns: 50\n"
        "---\n\n"
        + body
    )
    (d / "agents" / f"{e['name']}.md").write_text(md, encoding="utf-8")

    # 3) README.md
    readme = (
        f"# {e['displayName']['zh']}（{e['displayName']['en']}）\n\n"
        f"{e['displayDescription']['zh']}\n\n"
        "## 类型\nAgent 型（单个 AI 专家），源自 EFW 研发配置包的子代理提示词。\n\n"
        "## 功能\n"
        "- 作为可一键拉起的专项专家，在任意对话中提供该领域的专业产出。\n"
        "- 等价于 EFW `agents/` 下的子代理提示词，但由 WorkBuddy 专家中心原生加载。\n\n"
        "## 使用示例\n"
        + "\n".join(f"- {qp['zh']}" for qp in e["quickPrompts"]) + "\n\n"
        "## 头像\n头像为占位（未生成 AI 头像）。如需替换，将 512×512 PNG 放入 `avatars/expert.png`（≤500KB）。\n"
    )
    (d / "README.md").write_text(readme, encoding="utf-8")

    # 4) 确保 avatars/.gitkeep 存在（抑制头像缺失告警）
    (d / "avatars").mkdir(parents=True, exist_ok=True)
    (d / "avatars" / ".gitkeep").touch()

    print(f"  ✓ filled: {e['name']}")


def main():
    print(f"EFW_ROOT   = {EFW_ROOT}")
    print(f"EXPERTS_DIR= {EXPERTS_DIR}\n")
    for e in EXPERTS:
        build_one(e)
    print("\nDone. 下一步运行 validate_expert.py + register_expert.py。")


if __name__ == "__main__":
    main()
