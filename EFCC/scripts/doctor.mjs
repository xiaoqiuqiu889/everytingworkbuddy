#!/usr/bin/env node
// EFCC 双平台自检 (doctor.mjs) — 验证 Claude 与/或 Codex 两端组件就位且一致。
// 用法：
//   node scripts/doctor.mjs                 # 检查两端 (both)
//   node scripts/doctor.mjs --target claude # 只查 Claude
//   node scripts/doctor.mjs --target codex  # 只查 Codex
// Exit 0 = 无失败项；Exit 1 = 存在失败项（警告不阻塞）。
// 不做实际 npx 拉起（避免下载污染），仅校验声明与文件一致性。

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');
const EFCC_SKILLS = path.join(EFCC, 'skills');
const HOME = homedir();
const CLAUDE = path.join(HOME, '.claude');
const CODEX = path.join(HOME, '.codex');

function detectTarget() {
  const i = process.argv.findIndex((a) => a === '--target' || a.startsWith('--target='));
  if (i === -1) return 'both';
  if (process.argv[i].startsWith('--target=')) return process.argv[i].split('=')[1] || 'both';
  return process.argv[i + 1] || 'both';
}
let TARGET = detectTarget();
if (!['claude', 'codex', 'both'].includes(TARGET)) TARGET = 'both';
const DO_CLAUDE = TARGET === 'claude' || TARGET === 'both';
const DO_CODEX = TARGET === 'codex' || TARGET === 'both';

const SKILLS = [
  'efc',
  'efc-tdd-workflow', 'efc-plan-feature', 'efc-code-review', 'efc-build-fix',
  'efc-refactor-clean', 'efc-security-review', 'efc-verify', 'efc-checkpoint', 'efc-learn',
  'efc-github-push',
  'efc-profile',
];

let failed = 0, warned = 0;
const pass = (m) => console.log(`  ✓ ${m}`);
const warn = (m) => { warned++; console.log(`  ⚠ ${m}`); };
const fail = (m) => { failed++; console.log(`  ✗ ${m}`); };

const RULE_START = '<!-- EFCC-RULES-START -->';
const RULE_END = '<!-- EFCC-RULES-END -->';

// 校验 frontmatter 三字段
function checkFrontmatter(p, label) {
  if (!existsSync(p)) { fail(`缺失 ${label}`); return; }
  const c = readFileSync(p, 'utf8');
  const fm = c.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) { fail(`${label}: frontmatter 缺失`); return; }
  const miss = ['name:', 'description:', 'version:'].filter((k) => !fm[1].includes(k));
  miss.length === 0 ? pass(`${label}: name/description/version 齐全`) : fail(`${label}: 缺 ${miss.join(', ')}`);
}

function checkMemory(memPath, label) {
  console.log(`\n[${label}] EFCC 纪律块完整性`);
  if (!existsSync(memPath)) { fail(`缺失 ${memPath}`); return; }
  const txt = readFileSync(memPath, 'utf8');
  const hasStart = txt.includes(RULE_START);
  const hasEnd = txt.includes(RULE_END);
  hasStart ? pass('包含 EFCC-RULES-START') : fail('缺失 EFCC-RULES-START');
  hasEnd ? pass('包含 EFCC-RULES-END') : fail('缺失 EFCC-RULES-END');
  if (hasStart && hasEnd) {
    const block = txt.split(RULE_START)[1].split(RULE_END)[0];
    block.includes('能力触发纪律') ? pass('纪律块含 能力触发纪律') : fail('纪律块缺 能力触发纪律');
    block.includes('efc-verify') ? pass('纪律块含 DoD 验收闸门') : warn('纪律块未提 efc-verify');
  }
}

// ---------- Claude ----------
function doctorClaude() {
  console.log('\n========== [Claude] ~/.claude ==========');
  console.log('[claude/skills] frontmatter + 一致性');
  const skillsHome = path.join(CLAUDE, 'skills');
  for (const s of SKILLS) {
    const dst = path.join(skillsHome, s, 'SKILL.md');
    checkFrontmatter(dst, `~/.claude/skills/${s}`);
    const src = path.join(EFCC_SKILLS, s, 'SKILL.md');
    if (existsSync(src) && existsSync(dst)) {
      readFileSync(src, 'utf8') === readFileSync(dst, 'utf8')
        ? pass(`${s}: 源 = 已装`)
        : fail(`${s}: 源与已装漂移（重跑 install.mjs）`);
    }
  }
  checkMemory(path.join(CLAUDE, 'CLAUDE.md'), 'claude/memory');
  console.log('\n[claude/mcp] ~/.claude.json 声明');
  const mcp = path.join(HOME, '.claude.json');
  if (!existsSync(mcp)) { warn('缺失 ~/.claude.json（未配 MCP，非阻塞）'); }
  else {
    try {
      const srv = (JSON.parse(readFileSync(mcp, 'utf8')).mcpServers) || {};
      for (const n of ['context7', 'sequential-thinking']) {
        n in srv ? pass(`mcpServers.${n} 已声明`) : warn(`${n} 未配置`);
      }
    } catch (e) { fail('~/.claude.json 非合法 JSON: ' + e.message); }
  }
}

// ---------- Codex ----------
function doctorCodex() {
  console.log('\n========== [Codex] ~/.codex ==========');
  console.log('[codex/prompts] 斜杠命令就位');
  const promptsDir = path.join(CODEX, 'prompts');
  for (const s of SKILLS) {
    const p = path.join(promptsDir, `${s}.md`);
    existsSync(p) ? pass(`~/.codex/prompts/${s}.md（/${s}）`) : fail(`缺失 prompts/${s}.md`);
  }
  checkMemory(path.join(CODEX, 'AGENTS.md'), 'codex/memory');
  console.log('\n[codex/mcp] ~/.codex/config.toml 声明');
  const toml = path.join(CODEX, 'config.toml');
  if (!existsSync(toml)) { warn('缺失 ~/.codex/config.toml（未配 MCP，非阻塞）'); }
  else {
    const txt = readFileSync(toml, 'utf8');
    for (const n of ['context7', 'sequential-thinking']) {
      txt.includes(`[mcp_servers.${n}]`) ? pass(`[mcp_servers.${n}] 已声明`) : warn(`${n} 未配置`);
    }
  }
}

// ---------- 公共：EFCC 源健康 ----------
function doctorSource() {
  console.log('\n[source] EFCC 源健康');
  const cat = path.join(EFCC, 'catalog', 'capabilities.json');
  if (!existsSync(cat)) { warn('缺 catalog/capabilities.json（检索不可用）'); }
  else {
    try {
      const n = (JSON.parse(readFileSync(cat, 'utf8')).capabilities || []).length;
      n > 0 ? pass(`catalog 合法，含 ${n} 条能力索引`) : warn('catalog 无条目');
    } catch (e) { fail('catalog 非合法 JSON: ' + e.message); }
  }
  existsSync(path.join(EFCC, 'user', 'README.md'))
    ? pass('user/ 覆盖层机制可用')
    : warn('缺 user/README.md（覆盖层机制不可用）');
}

console.log('EFCC 双平台自检 (doctor)');
console.log(`TARGET = ${TARGET}`);
doctorSource();
if (DO_CLAUDE) doctorClaude();
if (DO_CODEX) doctorCodex();

console.log('');
if (failed > 0) {
  console.log(`RESULT: ${failed} 失败 / ${warned} 警告 ✗  修复失败项后重跑 node scripts/install.mjs`);
  process.exit(1);
} else {
  console.log(`RESULT: 全部通过 ✓${warned > 0 ? `（${warned} 条提示，非阻塞）` : ''}  EFCC 健康。`);
  process.exit(0);
}
