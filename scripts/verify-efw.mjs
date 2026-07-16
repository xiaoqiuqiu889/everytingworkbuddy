#!/usr/bin/env node
// EFW install self-check. Cross-platform (Node >=18).
// Verifies all EFW components are present and consistent.
// Exit 0 = all green; Exit 1 = any failure.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const HOME = homedir();
const SKILLS_HOME = path.join(HOME, ".workbuddy", "skills");
const MEMORY = path.join(HOME, ".workbuddy", "MEMORY.md");
const MCP = path.join(HOME, ".workbuddy", "mcp.json");
const EFW = "D:/codebuddycn/EFW";

const AGENTS = [
  "planner", "architect", "tdd-guide", "code-reviewer", "security-reviewer",
  "build-error-resolver", "e2e-runner", "refactor-cleaner", "doc-updater",
];
const RULES = [
  "security", "coding-style", "testing", "git-workflow", "agents", "performance",
];
const SKILLS = [
  "efw",
  "efw-tdd-workflow", "efw-plan-feature", "efw-code-review", "efw-build-fix",
  "efw-refactor-clean", "efw-security-review", "efw-verify", "efw-checkpoint", "efw-learn",
];

let failed = 0;
const pass = (m) => console.log(`  \u2713 ${m}`);
const fail = (m) => { failed++; console.log(`  \u2717 ${m}`); };

console.log("EFW install self-check\n");

// 1. agents/
console.log("[agents] expected " + AGENTS.length);
for (const a of AGENTS) {
  const p = path.join(EFW, "agents", `${a}.md`);
  existsSync(p) ? pass(`agents/${a}.md`) : fail(`missing agents/${a}.md`);
}

// 2. rules/
console.log("[rules] expected " + RULES.length);
for (const r of RULES) {
  const p = path.join(EFW, "rules", `${r}.md`);
  existsSync(p) ? pass(`rules/${r}.md`) : fail(`missing rules/${r}.md`);
}

// 3. installed skills (user-level)
console.log("[skills] expected " + SKILLS.length + " in ~/.workbuddy/skills");
for (const s of SKILLS) {
  const p = path.join(SKILLS_HOME, s, "SKILL.md");
  existsSync(p) ? pass(`~/.workbuddy/skills/${s}`) : fail(`missing skill ${s}`);
}

// 4. mcp.json valid + has the two keyless servers
console.log("[mcp.json]");
if (!existsSync(MCP)) {
  fail("missing ~/.workbuddy/mcp.json");
} else {
  try {
    const cfg = JSON.parse(readFileSync(MCP, "utf8"));
    const srv = cfg.mcpServers || {};
    ("context7" in srv) ? pass("mcp context7") : fail("mcp context7 missing");
    ("sequential-thinking" in srv) ? pass("mcp sequential-thinking") : fail("mcp sequential-thinking missing");
  } catch (e) {
    fail("mcp.json is not valid JSON: " + e.message);
  }
}

// 5. MEMORY.md has EFW section
console.log("[MEMORY.md]");
if (!existsSync(MEMORY)) {
  fail("missing ~/.workbuddy/MEMORY.md");
} else {
  const txt = readFileSync(MEMORY, "utf8");
  txt.includes("EFW") ? pass("MEMORY.md references EFW") : fail("MEMORY.md missing EFW section");
}

console.log("");
if (failed === 0) {
  console.log("RESULT: ALL GREEN \u2713  EFW v1 components present and consistent.");
  process.exit(0);
} else {
  console.log(`RESULT: ${failed} FAILURE(S) \u2717  Fix the items above, then re-run.`);
  process.exit(1);
}
