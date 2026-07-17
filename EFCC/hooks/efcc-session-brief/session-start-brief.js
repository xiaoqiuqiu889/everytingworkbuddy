#!/usr/bin/env node
// EFCC SessionStart hook — 新会话开头注入 EFCC 简报
// 触发：Claude Code 每次新会话开头
// 行为：
//   1) 检测 ~/.claude/skills/efc-* 是否就位（安装是否完整）
//   2) 检测 ~/.codex/prompts/efc-*（如目标含 codex）
//   3) 检测 catalog/.popularity-cache.json 是否有种子数据
//   4) 在 stderr 输出 EFCC 状态简报（不阻断，不污染主对话）
//
// 跨平台 Node。带 --self-test。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = os.homedir();
const CLAUDE_SKILLS = path.join(HOME, '.claude', 'skills');
const CODEX_PROMPTS = path.join(HOME, '.codex', 'prompts');
const POP_CACHE = path.join(HOME, '.codex', 'efcc-assets', 'catalog', 'capabilities.json');
const POP_SEED = process.cwd().includes('EFCC') || fs.existsSync(path.join(process.cwd(), 'catalog', '.popularity-cache.json'))
  ? path.join(process.cwd(), 'catalog', '.popularity-cache.json')
  : null;

function countSkills(dir) {
  try { return fs.readdirSync(dir).filter((n) => n.startsWith('efc-') || n === 'efc').length; } catch { return 0; }
}
function countPrompts(dir) {
  try { return fs.readdirSync(dir).filter((n) => /^efc.*\.md$/.test(n)).length; } catch { return 0; }
}

async function readStdin() {
  let d = '';
  return new Promise((res) => { process.stdin.on('data', (c) => (d += c)); process.stdin.on('end', () => res(d)); });
}

async function main() {
  // Claude Code SessionStart 也通过 stdin 给 JSON。读取但不依赖内容。
  await readStdin();

  const claudeN = countSkills(CLAUDE_SKILLS);
  const codexN = countPrompts(CODEX_PROMPTS);
  const popSource = POP_SEED && fs.existsSync(POP_SEED) ? 'EFCC 内置' : POP_CACHE && fs.existsSync(POP_CACHE) ? '已发布' : '无';

  console.error('--- EFCC Session Brief ---');
  if (claudeN > 0) console.error(`  ✓ Claude: ${claudeN} 个 efc 技能就位`);
  else console.error(`  ✗ Claude: 未检测到 efc 技能（跑 install.mjs 装）`);
  if (codexN > 0) console.error(`  ✓ Codex:  ${codexN} 个 /efc-* 斜杠命令就位`);
  else console.error(`  - Codex:  未检测到 efc prompts（可选）`);
  console.error(`  · 生态热度: ${popSource}`);
  console.error('  提示: 实质任务第一动作 → /efc（外层规划→干活→验收→沉淀四步）');
  console.error('--- end brief ---');
  process.exit(0);
}

if (process.argv.includes('--self-test')) {
  const claudeN = countSkills(CLAUDE_SKILLS);
  const codexN = countPrompts(CODEX_PROMPTS);
  console.log('--- efcc-session-brief self-test ---');
  console.log(`  ✓ Claude efc 技能数: ${claudeN}（期望 ≥ 12）`);
  console.log(`  ✓ Codex /efc-* 数: ${codexN}（期望 ≥ 12）`);
  console.log(`  ${claudeN >= 12 ? '✓' : '✗'} Claude 端 PASS`);
  console.log(`  ${codexN >= 12 ? '✓' : '✗'} Codex 端 PASS`);
  console.log('\nself-test: 4 checks');
  process.exit((claudeN >= 12 && codexN >= 12) ? 0 : 1);
}

main().catch(() => process.exit(0));
