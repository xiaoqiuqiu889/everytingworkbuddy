// tests/learn.test.mjs —— learn.mjs 沉淀链路验证（不污染真实记忆）
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');

function runLearn(args, env = {}) {
  return execSync(`node scripts/learn.mjs ${args}`, {
    cwd: EFCC,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: 'pipe',
  });
}

function makeHome() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'efcc-learn-test-'));
  return { tmp };
}

const assertions = [
  {
    name: '默认生成 pending-learn.md（含 raw 输入）',
    check: () => {
      const { tmp } = makeHome();
      try {
        runLearn('"测试中沉淀：遇到构建错误先跑 efc-build-fix"', { HOME: tmp, USERPROFILE: tmp });
        const pending = path.join(tmp, '.efcc', 'pending-learn.md');
        if (!existsSync(pending)) return false;
        const body = readFileSync(pending, 'utf8');
        return body.includes('efc-build-fix') && body.includes('待确认沉淀');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
  },
  {
    name: '--confirm 把 pending 写入 ~/.claude/CLAUDE.md 与 ~/.codex/AGENTS.md',
    check: () => {
      const { tmp } = makeHome();
      try {
        runLearn('"测试中沉淀：写测试先 RED"', { HOME: tmp, USERPROFILE: tmp });
        runLearn('--confirm', { HOME: tmp, USERPROFILE: tmp });
        const claude = path.join(tmp, '.claude', 'CLAUDE.md');
        const codex = path.join(tmp, '.codex', 'AGENTS.md');
        if (!existsSync(claude) || !existsSync(codex)) return false;
        const c = readFileSync(claude, 'utf8');
        const d = readFileSync(codex, 'utf8');
        return c.includes('RED') && c.includes('EFCC-LEARNED-START') && d.includes('RED') && d.includes('EFCC-LEARNED-START');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
  },
  {
    name: '--discard 清空 pending',
    check: () => {
      const { tmp } = makeHome();
      try {
        runLearn('"会被清空的经验"', { HOME: tmp, USERPROFILE: tmp });
        runLearn('--discard', { HOME: tmp, USERPROFILE: tmp });
        const pending = path.join(tmp, '.efcc', 'pending-learn.md');
        return existsSync(pending) && readFileSync(pending, 'utf8').trim() === '';
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
  },
  {
    name: '重复 confirm 不堆叠 learned 块',
    check: () => {
      const { tmp } = makeHome();
      try {
        runLearn('"第一条"', { HOME: tmp, USERPROFILE: tmp });
        runLearn('--confirm', { HOME: tmp, USERPROFILE: tmp });
        runLearn('"第二条"', { HOME: tmp, USERPROFILE: tmp });
        runLearn('--confirm', { HOME: tmp, USERPROFILE: tmp });
        const claude = path.join(tmp, '.claude', 'CLAUDE.md');
        const c = readFileSync(claude, 'utf8');
        if ((c.match(/EFCC-LEARNED-START/g) || []).length !== 1) {
          console.log('--- CLAUDE.md actual ---\n' + c + '\n--- end ---');
          return false;
        }
        return c.includes('第一条') && c.includes('第二条');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
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
