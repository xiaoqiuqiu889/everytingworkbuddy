#!/usr/bin/env node
// EFCC PostToolUse 自动学习 hook — 任务完成后检测可沉淀模式并提示
// 触发：Claude Code 每次工具调用后（默认低频，可配置为仅 Edit/Write）
// 行为：
//   1) 累计 Write/Edit 工具调用次数（in-memory per session）
//   2) 写到 ≥N（默认 5）次后 + 检测到"看起来可复用的"动作（修构建错误、写测试、写新模块）→
//      在 stderr 输出温和提示"考虑用 /efc-learn 沉淀"，不阻断
//   3) 退出码始终 0（绝不阻塞 Claude Code 主流程）
//
// 自带 --self-test。

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PENDING_DIR = process.env.EFCC_LEARN_PENDING_DIR || path.join(os.homedir(), '.efcc');
const PENDING_FILE = path.join(PENDING_DIR, 'pending-learn.md');
const LEARN_START = '<!-- EFCC-LEARNED-START -->';
const LEARN_END = '<!-- EFCC-LEARNED-END -->';
const SESSION_FILE = process.env.EFCC_LEARN_SESSION || '';

async function readStdin() {
  let d = '';
  return new Promise((res) => { process.stdin.on('data', (c) => (d += c)); process.stdin.on('end', () => res(d)); });
}

function detectLearnable(toolName, toolInput, toolOutput) {
  if (toolName !== 'Bash' && toolName !== 'Edit' && toolName !== 'Write') return null;
  const out = String(toolOutput?.output || toolOutput?.content || '');
  // 模式 1: 修构建错误（npm/pnpm/yarn/cargo 报错 → 修复 → 再跑成功）
  if (toolName === 'Bash' && /error|fail/i.test(out) && /\bfix\b|fixed|fixed|解决/i.test(out)) {
    return '构建/编译错误被修复 —— 适合沉淀为 efc-build-fix 案例或 memory 条目';
  }
  // 模式 2: 写了测试
  if ((toolName === 'Write' || toolName === 'Edit') && /test|spec/i.test(toolInput?.file_path || '')) {
    return '新写/改测试文件 —— 若用 TDD 模式可沉淀为 efc-tdd-workflow 经验';
  }
  // 模式 3: 写新模块
  if (toolName === 'Write' && /\.(py|js|ts|go|rs)$/i.test(toolInput?.file_path || '')) {
    const fname = (toolInput.file_path || '').split('/').pop();
    return `新增模块 ${fname} —— 若有可复用套路，用 /efc-learn 沉淀`;
  }
  return null;
}

async function main() {
  const raw = await readStdin();
  if (!raw) process.exit(0);
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const toolName = input?.tool_name || '';
  const ti = input?.tool_input || {};
  const to = input?.tool_output || {};

  // 简单计数器（写到 /tmp 不留痕）
  if (SESSION_FILE) {
    try {
      const fs = require('node:fs');
      const c = fs.existsSync(SESSION_FILE) ? parseInt(fs.readFileSync(SESSION_FILE, 'utf8'), 10) || 0 : 0;
      const next = c + 1;
      fs.writeFileSync(SESSION_FILE, String(next));
      // 每 5 次工具调用，输出一次温和提示
      if (next % 5 === 0) {
        console.error(`[efcc-auto-learn] 💡 本会话已 ${next} 次工具调用。若有可复用套路，考虑 /efc-learn 沉淀。`);
      }
    } catch { /* 静默失败不阻塞 */ }
  }

  // 检测可沉淀模式
  const hint = detectLearnable(toolName, ti, to);
  if (hint) {
    console.error(`[efcc-auto-learn] 📌 ${hint}`);
    appendPending(hint);
  }
  // 透传 stdout
  process.stdout.write(raw);
  process.exit(0);
}

function appendPending(hint) {
  try {
    const pendingDir = process.env.EFCC_LEARN_PENDING_DIR || path.join(os.homedir(), '.efcc');
    const pendingFile = path.join(pendingDir, 'pending-learn.md');
    fs.mkdirSync(pendingDir, { recursive: true });
    let body = '';
    try { body = fs.readFileSync(pendingFile, 'utf8'); } catch { /* ignore */ }
    // 已存在则不重复追加
    if (body.includes(hint)) return;
    const date = new Date().toISOString().split('T')[0];
    const title = body.includes('## 待确认沉淀') ? '' : `## 待确认沉淀 (${date})\n`;
    fs.writeFileSync(pendingFile, body + (body && !body.endsWith('\n') ? '\n' : '') + title + `- ${hint}\n`, 'utf8');
  } catch (e) {
    console.error(`[efcc-auto-learn] 写 pending 失败: ${e.message}`);
  }
}

if (process.argv.includes('--self-test')) {
  console.log('--- efcc-auto-learn self-test ---');
  const cases = [
    { name: 'Bash 报错 + 修复', input: { tool_name: 'Bash', tool_input: { command: 'npm test' }, tool_output: { output: 'error: failed. fixed and re-ran, all passing' } }, expect: /构建|fix/i },
    { name: 'Write 测试文件', input: { tool_name: 'Write', tool_input: { file_path: '/x/foo.test.js' }, tool_output: {} }, expect: /测试|TDD/i },
    { name: 'Write 普通模块', input: { tool_name: 'Write', tool_input: { file_path: '/x/util.py' }, tool_output: {} }, expect: /模块|沉淀/i },
    { name: '无关 Read 操作', input: { tool_name: 'Read', tool_input: { file_path: '/x/a.js' }, tool_output: {} }, expect: null },
  ];
  let pass = 0, fail = 0;
  for (const c of cases) {
    const hint = detectLearnable(c.input.tool_name, c.input.tool_input, c.input.tool_output);
    const matched = c.expect ? (hint && c.expect.test(hint)) : !hint;
    if (matched) { pass++; console.log(`  ✓ ${c.name}`); }
    else { fail++; console.log(`  ✗ ${c.name} (got: ${hint})`); }
  }

  // 验证 appendPending 落盘行为（隔离到临时目录）
  const tmpDir = path.join(os.tmpdir(), `efcc-auto-learn-test-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const originalEnv = process.env.EFCC_LEARN_PENDING_DIR;
  process.env.EFCC_LEARN_PENDING_DIR = tmpDir;
  try {
    appendPending('测试沉淀条目 A');
    appendPending('测试沉淀条目 A'); // 重复，应不追加
    appendPending('测试沉淀条目 B');
    const body = fs.readFileSync(path.join(tmpDir, 'pending-learn.md'), 'utf8');
    const countA = (body.match(/测试沉淀条目 A/g) || []).length;
    const countB = (body.match(/测试沉淀条目 B/g) || []).length;
    if (countA === 1 && countB === 1 && body.includes('## 待确认沉淀')) {
      pass++; console.log('  ✓ appendPending 去重落盘');
    } else {
      fail++; console.log(`  ✗ appendPending 去重落盘 (A=${countA}, B=${countB})`);
    }
  } catch (e) {
    fail++; console.log(`  ✗ appendPending 测试异常: ${e.message}`);
  } finally {
    process.env.EFCC_LEARN_PENDING_DIR = originalEnv;
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  console.log(`\nself-test: ${pass} pass / ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(() => process.exit(0));
