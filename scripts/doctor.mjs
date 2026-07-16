#!/usr/bin/env node
// EFW 深度诊断 (doctor.mjs)
// 比 verify-efw.mjs 更深的健康检查：
//   - MEMORY.md 的 sentinel 准则块完整性（含 Skill 触发纪律 / efw 入口）
//   - 10 个技能 SKILL.md 的 frontmatter 合法性（name/description/version）
//   - EFW 源 vs 已装的一致性（防漂移）
//   - mcp.json 的 MCP 声明合法性
// 跨平台（Windows / macOS / Linux）。Exit 0 = 全过；Exit 1 = 存在失败项。
// 不做实际 npx 拉起（避免下载污染），仅校验声明。

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFW = path.resolve(__dirname, "..");                 // scripts/.. -> EFW 根
const EFW_SKILLS = path.join(EFW, "skills");
const HOME = homedir();
const SKILLS_HOME = path.join(HOME, ".workbuddy", "skills");
const MEMORY = path.join(HOME, ".workbuddy", "MEMORY.md");
const MCP = path.join(HOME, ".workbuddy", "mcp.json");

const SKILLS = [
  "efw",
  "efw-tdd-workflow", "efw-plan-feature", "efw-code-review", "efw-build-fix",
  "efw-refactor-clean", "efw-security-review", "efw-verify", "efw-checkpoint", "efw-learn",
  "efw-profile",
];

let failed = 0, warned = 0;
const pass = (m) => console.log(`  \u2713 ${m}`);
const warn = (m) => { warned++; console.log(`  \u26a0 ${m}`); };
const fail = (m) => { failed++; console.log(`  \u2717 ${m}`); };

// ---------- 1. MEMORY.md sentinel 准则块 ----------
console.log("\n[memory] EFW 准则块完整性");
if (!existsSync(MEMORY)) {
  fail("缺失 ~/.workbuddy/MEMORY.md");
} else {
  const txt = readFileSync(MEMORY, "utf8");
  const hasStart = txt.includes("<!-- EFW-RULES-START -->");
  const hasEnd = txt.includes("<!-- EFW-RULES-END -->");
  hasStart ? pass("包含 EFW-RULES-START") : fail("缺失 EFW-RULES-START");
  hasEnd ? pass("包含 EFW-RULES-END") : fail("缺失 EFW-RULES-END");
  if (hasStart && hasEnd) {
    const block = txt.split("<!-- EFW-RULES-START -->")[1].split("<!-- EFW-RULES-END -->")[0];
    block.includes("Skill 触发纪律") ? pass("准则块含 Skill 触发纪律") : fail("准则块缺 Skill 触发纪律");
    block.includes("efw") ? pass("准则块含 efw 统一入口") : warn("准则块未提 efw");
  }
}

// ---------- 2. skill frontmatter 合法性 ----------
console.log("\n[skills] frontmatter 合法性");
for (const s of SKILLS) {
  const p = path.join(SKILLS_HOME, s, "SKILL.md");
  if (!existsSync(p)) { fail(`缺失 ${s}/SKILL.md`); continue; }
  const c = readFileSync(p, "utf8");
  const fm = c.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { fail(`${s}: frontmatter 缺失`); continue; }
  const meta = fm[1];
  const miss = ["name:", "description:", "version:"].filter((k) => !meta.includes(k));
  miss.length === 0 ? pass(`${s}: name/description/version 齐全`) : fail(`${s}: 缺 ${miss.join(", ")}`);
}

// ---------- 3. EFW 源 vs 已装一致性 ----------
console.log("\n[drift] EFW 源 vs 已装一致性");
for (const s of SKILLS) {
  const src = path.join(EFW_SKILLS, s, "SKILL.md");
  const dst = path.join(SKILLS_HOME, s, "SKILL.md");
  if (!existsSync(src)) { warn(`${s}: EFW 源缺（跳过比对）`); continue; }
  if (!existsSync(dst)) { warn(`${s}: 已装缺（未跑 install.mjs）`); continue; }
  const a = readFileSync(src, "utf8");
  const b = readFileSync(dst, "utf8");
  a === b ? pass(`${s}: 源 = 已装`) : fail(`${s}: 源与已装不一致（漂移！重跑 install.mjs）`);
}

// ---------- 4. MCP 声明校验 ----------
console.log("\n[mcp] 声明校验");
if (!existsSync(MCP)) {
  fail("缺失 ~/.workbuddy/mcp.json");
} else {
  try {
    const cfg = JSON.parse(readFileSync(MCP, "utf8"));
    const srv = cfg.mcpServers || {};
    for (const name of ["context7", "sequential-thinking"]) {
      if (!(name in srv)) { warn(`${name}: 未配置（需在连接器面板信任）`); continue; }
      const conf = srv[name];
      if (conf.command !== "npx") { warn(`${name}: command 非 npx（${conf.command || "空"}）`); continue; }
      pass(`${name}: npx 声明合法`);
    }
  } catch (e) {
    fail("mcp.json 不是合法 JSON: " + e.message);
  }
}

// ---------- 5. extensibility overlay scaffold ----------
console.log("\n[extensibility] user/ 覆盖层脚手架");
const userReadme = path.join(EFW, "user", "README.md");
if (!existsSync(userReadme)) {
  warn("EFW 源缺失 user/README.md（覆盖层机制不可用；更新到最新 EFW）");
} else {
  pass("user/README.md 存在（用户覆盖层机制可用）");
}

// ---------- 6. capability catalog ----------
console.log("\n[catalog] 能力索引");
const catalogPath = path.join(EFW, "catalog", "capabilities.json");
if (!existsSync(catalogPath)) {
  warn("EFW 源缺失 catalog/capabilities.json（检索机制不可用；更新到最新 EFW）");
} else {
  try {
    const c = JSON.parse(readFileSync(catalogPath, "utf8"));
    const n = (c.capabilities || []).length;
    n > 0 ? pass(`catalog 合法，含 ${n} 条能力索引`) : warn("catalog 无能力条目");
  } catch (e) {
    fail("catalog/capabilities.json 不是合法 JSON: " + e.message);
  }
}

console.log("");
if (failed > 0) {
  console.log(`RESULT: ${failed} 失败 / ${warned} 警告 \u2717  修复失败项后重跑 node scripts/install.mjs`);
  process.exit(1);
} else {
  console.log(`RESULT: 全部通过 \u2713${warned > 0 ? `（${warned} 条提示，非阻塞）` : ""}  EFW 健康。`);
  process.exit(0);
}
