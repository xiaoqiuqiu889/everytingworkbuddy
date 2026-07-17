#!/usr/bin/env node
// EFCC PreToolUse safety hook — 写文件/改文件前安全检查
// 触发：Claude Code 每次 Write/Edit/MultiEdit 工具调用前
// 行为：
//   1) 拒写 .env / *key* / *.pem / *credential* 等敏感文件
//   2) 写 .md（除 README/CLAUDE/AGENTS/CONTRIBUTING）时建议并入既有文档
//   3) 写大文件（>1MB）时提醒
//   4) 检测到硬编码的 API key/secret 时阻断
//
// 协议：stdin 收 Claude Code 的 JSON {tool_name, tool_input, ...}，stdout 输出原 JSON 透传，
//       exit 0 = 允许，exit 1 = 阻断，stderr 输出告警/阻断原因。
//
// 跨平台 Node（无 shell 依赖）。自带 --self-test 模式：可独立跑通。

const path = require('node:path');

// 敏感文件路径规则（正则）
const SECRET_PATH = /(\.env($|\..+)|\.netrc|credentials|\.pem|\.key|\.p12|secrets?\.(json|ya?ml)|.*id_rsa.*|.*\.kube\/config)/i;
const ALLOW_MD = /^(README|CLAUDE|AGENTS|CONTRIBUTING|CHANGELOG|LICENSE)\.md$/i;
const HARDCODED_SECRET = /(api[_-]?key|secret|token|password|passwd|pwd)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{16,}/i;

function deny(reason) {
  console.error(`[efcc-safety] ❌ BLOCKED: ${reason}`);
  process.exit(1);
}
function warn(msg) {
  console.error(`[efcc-safety] ⚠ ${msg}`);
}
function allow(payload) {
  if (payload) process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

async function readStdin() {
  let d = '';
  return new Promise((res) => {
    process.stdin.on('data', (c) => (d += c));
    process.stdin.on('end', () => res(d));
  });
}

async function main() {
  const raw = await readStdin();
  if (!raw) allow();
  let input;
  try { input = JSON.parse(raw); } catch { allow(); }
  const toolName = input?.tool_name || '';
  const ti = input?.tool_input || {};
  const filePath = ti.file_path || ti.path || '';

  // 1) 敏感文件路径
  if (filePath && SECRET_PATH.test(filePath)) {
    deny(`禁止直接写敏感文件：${path.basename(filePath)}。请用环境变量或密钥管理服务。`);
  }

  // 2) .md 文件收敛（README/CLAUDE/AGENTS 等允许，其余建议并入）
  if (toolName === 'Write' && /\.md$/i.test(filePath) && !ALLOW_MD.test(path.basename(filePath))) {
    warn(`正在写 ${path.basename(filePath)}。建议并入 README.md 或 CLAUDE.md，避免散落。`);
    // 不阻断，只提示
  }

  // 3) 大文件
  const content = ti.content || '';
  if (content.length > 1024 * 1024) {
    warn(`文件内容 ${(content.length / 1024 / 1024).toFixed(2)} MB，确认要一次性写入？`);
  }

  // 4) 硬编码密钥检测（仅对含敏感关键词 + 长字符串的赋值）
  if (content && HARDCODED_SECRET.test(content)) {
    deny(`检测到疑似硬编码密钥（api_key/secret/token/password）。请改用环境变量。`);
  }

  allow(input);
}

if (process.argv.includes('--self-test')) {
  // 独立测试：不依赖 Claude Code stdin，直接断言
  const cases = [
    { label: '写 .env 应阻断', file: '/tmp/.env', content: 'x=1', expect: 1 },
    { label: '写 README.md 应允许', file: '/tmp/README.md', content: '# hi', expect: 0 },
    { label: '写 code.js 应允许', file: '/tmp/code.js', content: 'const x=1', expect: 0 },
    { label: '硬编码 secret 应阻断', file: '/tmp/config.js', content: 'api_key="sk-1234567890abcdef"', expect: 1 },
    { label: '写 misc.md 应提示但允许', file: '/tmp/notes.md', content: 'x', expect: 0 },
  ];
  let pass = 0, fail = 0;
  for (const c of cases) {
    // simulate stdin
    process.stdin = { on: () => {} }; // suppress
    // 直接调用内部检查：手工复现规则
    let blocked = false;
    if (SECRET_PATH.test(c.file)) blocked = true;
    else if (HARDCODED_SECRET.test(c.content)) blocked = true;
    if ((blocked ? 1 : 0) === c.expect) { pass++; console.log(`  ✓ ${c.label}`); }
    else { fail++; console.log(`  ✗ ${c.label} (expected ${c.expect}, blocked=${blocked})`); }
  }
  console.log(`\nself-test: ${pass} pass / ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('[efcc-safety] hook error (failing open):', e.message); process.exit(0); });
