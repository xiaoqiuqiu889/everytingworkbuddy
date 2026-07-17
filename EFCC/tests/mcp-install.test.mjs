// tests/mcp-install.test.mjs —— mcp-install.mjs 安装行为验证
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');

function runMcp(args, env = {}) {
  return execSync(`node scripts/mcp-install.mjs ${args}`, {
    cwd: EFCC,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: 'pipe',
  });
}

function makeHome() {
  return mkdtempSync(path.join(os.tmpdir(), 'efcc-mcp-test-'));
}

const assertions = [
  {
    name: 'list 命令列出 15 个模板',
    check: () => {
      const out = runMcp('list');
      const ids = ['github', 'supabase', 'vercel', 'linear', 'notion', 'slack', 'postgres', 'brave-search', 'perplexity', 'filesystem', 'figma', 'google-drive', 'atlassian', 'jira', 'railway'];
      return ids.every((id) => out.includes(id));
    },
  },
  {
    name: 'install filesystem（无密钥）写入 ~/.claude.json',
    check: () => {
      const tmp = makeHome();
      try {
        runMcp('install filesystem --args "C:/project"', { HOME: tmp, USERPROFILE: tmp });
        const cfg = JSON.parse(readFileSync(path.join(tmp, '.claude.json'), 'utf8'));
        return cfg.mcpServers.filesystem?.args[0] === 'C:/project';
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
  },
  {
    name: 'install filesystem 也写入 ~/.codex/config.toml',
    check: () => {
      const tmp = makeHome();
      try {
        runMcp('install filesystem --args "C:/project"', { HOME: tmp, USERPROFILE: tmp });
        const toml = readFileSync(path.join(tmp, '.codex', 'config.toml'), 'utf8');
        return toml.includes('[mcp_servers.filesystem]') && toml.includes('C:/project');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
  },
  {
    name: '缺 --key 时安装需密钥模板返回非零退出码',
    check: () => {
      const tmp = makeHome();
      try {
        runMcp('install supabase', { HOME: tmp, USERPROFILE: tmp });
        return false;
      } catch (e) {
        return e.status === 2;
      } finally {
        try { rmSync(tmp, { recursive: true, force: true }); } catch {}
      }
    },
  },
  {
    name: '重复 install 同一模板不堆叠',
    check: () => {
      const tmp = makeHome();
      try {
        runMcp('install filesystem --args "C:/a"', { HOME: tmp, USERPROFILE: tmp });
        runMcp('install filesystem --args "C:/b"', { HOME: tmp, USERPROFILE: tmp });
        const cfg = JSON.parse(readFileSync(path.join(tmp, '.claude.json'), 'utf8'));
        const names = Object.keys(cfg.mcpServers);
        return names.filter((n) => n === 'filesystem').length === 1;
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
