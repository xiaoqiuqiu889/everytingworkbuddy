// tests/mode.test.mjs —— mode.mjs 模式切换脚本行为验证
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');

function runMode(args, env = {}) {
  return execSync(`node scripts/mode.mjs ${args}`, {
    cwd: EFCC,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: 'pipe',
  });
}

function makeHome() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'efcc-mode-test-'));
  const claudeDir = path.join(tmp, '.claude');
  const codexDir = path.join(tmp, '.codex');
  return { tmp, claudeDir, codexDir };
}

const assertions = [
  {
    name: '--list 列出 4 个模式（dev/review/research/ship）',
    check: () => {
      const out = runMode('--list');
      return ['dev', 'review', 'research', 'ship'].every((m) => out.includes(m));
    },
  },
  {
    name: '--codex 输出含模式头部注释与正文',
    check: () => {
      const out = runMode('--codex dev');
      return out.includes('EFCC mode prompt: dev') && out.includes('Mode: dev');
    },
  },
  {
    name: 'Claude 模式写入 ~/.claude/CLAUDE.md 且不堆叠',
    check: () => {
      const { tmp, claudeDir } = makeHome();
      try {
        const memPath = path.join(claudeDir, 'CLAUDE.md');
        runMode('dev', { HOME: tmp, USERPROFILE: tmp });
        const once = readFileSync(memPath, 'utf8');
        if ((once.match(/EFCC-MODE-START/g) || []).length !== 1) return false;
        if (!once.includes('Mode: dev')) return false;
        runMode('review', { HOME: tmp, USERPROFILE: tmp });
        const twice = readFileSync(memPath, 'utf8');
        if ((twice.match(/EFCC-MODE-START/g) || []).length !== 1) return false;
        if (!twice.includes('Mode: review')) return false;
        if (twice.includes('Mode: dev')) return false;
        return true;
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
  },
  {
    name: '未知模式返回非零退出码',
    check: () => {
      try {
        runMode('nope');
        return false;
      } catch (e) {
        return e.status === 2;
      }
    },
  },
  {
    name: 'contexts.json 中 4 个模式均对应存在的 .md 文件',
    check: () => {
      const cfg = JSON.parse(readFileSync(path.join(EFCC, 'contexts/contexts.json'), 'utf8'));
      return Object.entries(cfg.modes).every(([name, meta]) => {
        const p = path.join(EFCC, meta.file);
        return existsSync(p) && readFileSync(p, 'utf8').includes(`Mode: ${name}`);
      });
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
