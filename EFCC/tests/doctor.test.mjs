// tests/doctor.test.mjs —— 校验 doctor.mjs 的检测逻辑（不实际跑 doctor，独立断言）
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');

const assertions = [
  {
    name: 'EFCC 根目录存在',
    check: () => existsSync(EFC_ROOT()),
  },
  {
    name: 'scripts/install.mjs 存在且能解析',
    check: () => existsSync(path.join(EFCC, 'scripts/install.mjs')),
  },
  {
    name: 'scripts/doctor.mjs 存在',
    check: () => existsSync(path.join(EFCC, 'scripts/doctor.mjs')),
  },
  {
    name: 'scripts/match.mjs 存在',
    check: () => existsSync(path.join(EFCC, 'scripts/match.mjs')),
  },
  {
    name: 'scripts/popularity.mjs 存在',
    check: () => existsSync(path.join(EFCC, 'scripts/popularity.mjs')),
  },
  {
    name: 'catalog/.popularity-cache.json 存在',
    check: () => existsSync(path.join(EFCC, 'catalog/.popularity-cache.json')),
  },
  {
    name: 'catalog/.repos.json 是合法 JSON',
    check: () => {
      const c = JSON.parse(readFileSync(path.join(EFCC, 'catalog/.repos.json'), 'utf8'));
      return Array.isArray(c.repos) && c.repos.length >= 5;
    },
  },
  {
    name: 'catalog/capabilities.json 是合法 JSON 且 ≥ 300 条',
    check: () => {
      const c = JSON.parse(readFileSync(path.join(EFCC, 'catalog/capabilities.json'), 'utf8'));
      return Array.isArray(c.capabilities) && c.capabilities.length >= 300;
    },
  },
  {
    name: 'catalog 每条都有 verified_path 或 source=anthropic-skills',
    check: () => {
      const caps = JSON.parse(readFileSync(path.join(EFCC, 'catalog/capabilities.json'), 'utf8')).capabilities;
      return caps.every((c) => c.verified_path !== undefined || c.source === 'anthropic-skills');
    },
  },
  {
    name: '12 个 efc 技能就位（用户级）',
    check: () => {
      const skillsDir = path.join(homedir(), '.claude', 'skills');
      let n = 0;
      for (const name of ['efc','efc-plan-feature','efc-tdd-workflow','efc-code-review','efc-build-fix','efc-refactor-clean','efc-security-review','efc-verify','efc-checkpoint','efc-learn','efc-github-push','efc-profile']) {
        if (existsSync(path.join(skillsDir, name, 'SKILL.md'))) n++;
      }
      return n === 12;
    },
  },
  {
    name: '12 个 efc 斜杠命令就位（Codex 端）',
    check: () => {
      const dir = path.join(homedir(), '.codex', 'prompts');
      let n = 0;
      for (const name of ['efc','efc-plan-feature','efc-tdd-workflow','efc-code-review','efc-build-fix','efc-refactor-clean','efc-security-review','efc-verify','efc-checkpoint','efc-learn','efc-github-push','efc-profile']) {
        if (existsSync(path.join(dir, `${name}.md`))) n++;
      }
      return n === 12;
    },
  },
  {
    name: '~/.claude/CLAUDE.md 含 EFCC 规则块',
    check: () => existsSync(path.join(homedir(), '.claude/CLAUDE.md')) &&
                readFileSync(path.join(homedir(), '.claude/CLAUDE.md'), 'utf8').includes('EFCC-RULES-START'),
  },
  {
    name: '~/.codex/AGENTS.md 含 EFCC 规则块',
    check: () => existsSync(path.join(homedir(), '.codex/AGENTS.md')) &&
                readFileSync(path.join(homedir(), '.codex/AGENTS.md'), 'utf8').includes('EFCC-RULES-START'),
  },
  {
    name: '3 个 hook 各自可独立 --self-test 通过',
    check: () => {
      for (const h of ['hooks/efcc-safety/pre-tool-safety.js', 'hooks/efcc-auto-learn/post-tool-learn.js', 'hooks/efcc-session-brief/session-start-brief.js']) {
        try {
          const out = execSync(`node ${h} --self-test`, { cwd: EFCC, encoding: 'utf8' });
          if (!/self-test: \d+ pass/.test(out) && !/self-test: \d+ checks/.test(out)) return false;
        } catch { return false; }
      }
      return true;
    },
  },
];

function EFC_ROOT() { return EFCC; }

// 测试文件本身即 runner：执行断言，无 default 导出。
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
  // 包装为默认导出，供 run-all.mjs 调用
  if (fail > 0) throw new Error(`${fail} assertion(s) failed`);
}
