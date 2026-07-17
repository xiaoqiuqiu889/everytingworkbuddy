// tests/install.test.mjs —— install 脚本幂等性 + Claude/Codex 落位结构断言
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');

const assertions = [
  {
    name: 'install.mjs 二次运行幂等（不破坏 Claude 已装技能）',
    check: () => {
      const skillsDir = path.join(homedir(), '.claude', 'skills', 'efc', 'SKILL.md');
      const before = existsSync(skillsDir) ? readFileSync(skillsDir, 'utf8') : null;
      execSync('node scripts/install.mjs', { cwd: EFCC, encoding: 'utf8', stdio: 'pipe' });
      const after = existsSync(skillsDir) ? readFileSync(skillsDir, 'utf8') : null;
      return before === after; // 内容未变
    },
  },
  {
    name: '~/.claude/CLAUDE.md 仅含 1 个 EFCC-RULES-START 块（不堆叠）',
    check: () => {
      const p = path.join(homedir(), '.claude/CLAUDE.md');
      if (!existsSync(p)) return false;
      const c = readFileSync(p, 'utf8');
      const m = c.match(/EFCC-RULES-START/g) || [];
      return m.length === 1;
    },
  },
  {
    name: '~/.codex/AGENTS.md 仅含 1 个 EFCC-RULES-START 块（不堆叠）',
    check: () => {
      const p = path.join(homedir(), '.codex/AGENTS.md');
      if (!existsSync(p)) return false;
      const c = readFileSync(p, 'utf8');
      const m = c.match(/EFCC-RULES-START/g) || [];
      return m.length === 1;
    },
  },
  {
    name: '~/.codex/config.toml 含 [mcp_servers.context7]（MCP 真实写入）',
    check: () => {
      const p = path.join(homedir(), '.codex/config.toml');
      if (!existsSync(p)) return false;
      return readFileSync(p, 'utf8').includes('[mcp_servers.context7]');
    },
  },
  {
    name: '~/.claude.json 含 mcpServers.context7（Claude 端 MCP 真实写入）',
    check: () => {
      const p = path.join(homedir(), '.claude.json');
      if (!existsSync(p)) return false;
      const c = JSON.parse(readFileSync(p, 'utf8'));
      return c.mcpServers && 'context7' in c.mcpServers;
    },
  },
  {
    name: 'Codex 端 efc prompts 是从 SKILL.md 转换而来（含头部 "EFCC prompt" 注释）',
    check: () => {
      const p = path.join(homedir(), '.codex', 'prompts', 'efc.md');
      if (!existsSync(p)) return false;
      const head = readFileSync(p, 'utf8').slice(0, 200);
      return head.includes('EFCC prompt:') && head.includes('Codex 斜杠命令');
    },
  },
  {
    name: 'Codex 端无残留 YAML frontmatter（第一行非 "---"）',
    check: () => {
      const p = path.join(homedir(), '.codex', 'prompts', 'efc.md');
      if (!existsSync(p)) return false;
      const firstLine = readFileSync(p, 'utf8').split('\n')[0];
      return firstLine !== '---';
    },
  },
  {
    name: 'install --target codex 不动 Claude 端（隔离）',
    check: () => {
      const claudeBefore = existsSync(path.join(homedir(), '.claude', 'skills', 'efc', 'SKILL.md'));
      execSync('node scripts/install.mjs --target codex', { cwd: EFCC, encoding: 'utf8', stdio: 'pipe' });
      const claudeAfter = existsSync(path.join(homedir(), '.claude', 'skills', 'efc', 'SKILL.md'));
      return claudeBefore === claudeAfter; // Claude 端不变
    },
  },
  {
    name: '~/.claude/settings.json 已合并 EFCC hooks（PreToolUse/PostToolUse/SessionStart）',
    check: () => {
      const p = path.join(homedir(), '.claude', 'settings.json');
      if (!existsSync(p)) return false;
      const s = JSON.parse(readFileSync(p, 'utf8'));
      const hooks = s.hooks || {};
      const hasEfcc = (arr) => Array.isArray(arr) && arr.some((e) => (e.description || '').includes('EFCC'));
      return hasEfcc(hooks.PreToolUse) && hasEfcc(hooks.PostToolUse) && hasEfcc(hooks.SessionStart);
    },
  },
  {
    name: '重复 install 后 settings.json 不堆叠 EFCC hooks',
    check: () => {
      const p = path.join(homedir(), '.claude', 'settings.json');
      if (!existsSync(p)) return false;
      execSync('node scripts/install.mjs --target claude', { cwd: EFCC, encoding: 'utf8', stdio: 'pipe' });
      const s = JSON.parse(readFileSync(p, 'utf8'));
      const hooks = s.hooks || {};
      const countEfcc = (arr) => (Array.isArray(arr) ? arr.filter((e) => (e.description || '').includes('EFCC')).length : 0);
      return countEfcc(hooks.PreToolUse) === 1 && countEfcc(hooks.PostToolUse) === 1 && countEfcc(hooks.SessionStart) === 1;
    },
  },
];

let pass = 0, fail = 0;
const failures = [];
for (const a of assertions) {
  let ok = false, msg = '';
  try { ok = !!a.check(); } catch (e) { msg = e.message; }
  if (ok) { pass++; console.log(`  ✓ ${a.name}`); }
  else { fail++; failures.push(a.name + (msg ? ` (${msg})` : '')); console.log(`  ✗ ${a.name}`); }
}
console.log(`\n${pass}/${assertions.length} pass`);
if (fail > 0) {
  console.log('failures:\n  ' + failures.join('\n  '));
  throw new Error(`${fail} assertion(s) failed`);
}

export default function run() {
  if (fail > 0) throw new Error(`${fail} assertion(s) failed`);
}
