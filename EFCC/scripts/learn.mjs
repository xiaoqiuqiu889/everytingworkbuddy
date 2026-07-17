#!/usr/bin/env node
// EFCC learn.mjs —— 从本会话工作痕迹提取可沉淀模式，生成待确认条目
// 用法：
//   node scripts/learn.mjs                         # 生成 ~/.efcc/pending-learn.md
//   node scripts/learn.mjs --confirm               # 把 pending 条目写入两端记忆（等用户确认后）
//   node scripts/learn.mjs --discard               # 清空 pending
//
// 设计：不自动写记忆，必须用户确认。避免污染长期记忆。

import { promises as fs, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();
const PENDING_DIR = path.join(HOME, '.efcc');
const PENDING_FILE = path.join(PENDING_DIR, 'pending-learn.md');
const CLAUDE_MEMORY = path.join(HOME, '.claude', 'CLAUDE.md');
const CODEX_MEMORY = path.join(HOME, '.codex', 'AGENTS.md');
const LEARN_START = '<!-- EFCC-LEARNED-START -->';
const LEARN_END = '<!-- EFCC-LEARNED-END -->';

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const discard = args.includes('--discard');
const raw = args.filter((a) => !a.startsWith('-'))[0];

const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

function readMemory(memPath) {
  try { return readFileSync(memPath, 'utf8'); } catch { return ''; }
}

function extractEntries(content) {
  const entries = [];
  let startIdx = content.indexOf(LEARN_START);
  if (startIdx === -1) return entries;
  const endIdx = content.indexOf(LEARN_END, startIdx);
  if (endIdx === -1) return entries;
  const block = content.slice(startIdx + LEARN_START.length, endIdx);
  for (const line of block.split('\n')) {
    const t = line.trim();
    if (t.startsWith('- ')) entries.push(t.replace(/^- /, '').trim());
  }
  return entries;
}

function appendLearned(memPath, newEntries, title) {
  if (!newEntries.length) return;
  mkdirSync(path.dirname(memPath), { recursive: true });
  let content = '';
  try { content = readFileSync(memPath, 'utf8'); } catch { /* ignore */ }
  const oldEntries = extractEntries(content);
  const merged = [...new Set([...oldEntries, ...newEntries])];

  // 去掉旧块
  let cleaned = content;
  let startIdx = cleaned.indexOf(LEARN_START);
  while (startIdx !== -1) {
    const endIdx = cleaned.indexOf(LEARN_END, startIdx);
    if (endIdx === -1) break;
    const before = cleaned.slice(0, startIdx);
    const after = cleaned.slice(endIdx + LEARN_END.length);
    cleaned = (before + after).replace(/\n{3,}/g, '\n\n').trim();
    startIdx = cleaned.indexOf(LEARN_START);
  }
  const block = `${LEARN_START}\n## ${title}\n${merged.map((e) => `- ${e}`).join('\n')}\n${LEARN_END}\n`;
  writeFileSync(memPath, (cleaned ? cleaned + '\n\n' : '') + block, 'utf8');
}

async function main() {
  await ensureDir(PENDING_DIR);

  if (discard) {
    await fs.writeFile(PENDING_FILE, '', 'utf8');
    console.log('已清空 pending-learn.md');
    return;
  }

  if (confirm) {
    if (!(await exists(PENDING_FILE))) { console.log('没有待确认的沉淀条目。'); return; }
    const pending = await fs.readFile(PENDING_FILE, 'utf8');
    const lines = pending.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('## '));
    if (!lines.length) { console.log('pending 文件为空。'); return; }
    const titleLine = lines.find((l) => l.trim().startsWith('## ')) || '## 从会话沉淀的模式';
    const entries = lines.filter((l) => l.trim().startsWith('- ')).map((l) => l.replace(/^- /, '').trim());
    const date = new Date().toISOString().split('T')[0];
    const title = `${titleLine.replace(/^##\s*/, '')} (${date})`;
    appendLearned(CLAUDE_MEMORY, entries, title);
    appendLearned(CODEX_MEMORY, entries, title);
    await fs.writeFile(PENDING_FILE, '', 'utf8');
    console.log(`✓ 已把 ${entries.length} 条沉淀写入:`);
    console.log(`  · ~/.claude/CLAUDE.md`);
    console.log(`  · ~/.codex/AGENTS.md`);
    return;
  }

  // 默认：扫描最近 git diff / 当前工作目录修改，生成 pending 建议
  let suggestions = [];
  // 1) 如果有 raw 输入（用户直接给了一条经验），加入
  if (raw) suggestions.push(raw);
  // 2) 扫描当前目录的 .md / .mjs / .py 修改（简版启发式）
  try {
    const { execSync } = await import('node:child_process');
    const files = execSync('git diff --name-only HEAD 2>/dev/null || echo ""', { encoding: 'utf8', stdio: 'pipe' }).trim().split('\n').filter(Boolean);
    if (files.length) {
      suggestions.push(`本次会话修改了 ${files.length} 个文件：${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
    }
  } catch { /* ignore git errors */ }

  if (!suggestions.length) {
    console.log('暂无自动检测到的可沉淀条目。你可以手动追加：');
    console.log(`  echo "- 你的经验" >> ${PENDING_FILE}`);
    return;
  }

  const date = new Date().toISOString().split('T')[0];
  const body = `## 待确认沉淀 (${date})\n${suggestions.map((s) => `- ${s}`).join('\n')}\n\n确认写入长期记忆：\n  node scripts/learn.mjs --confirm\n放弃：\n  node scripts/learn.mjs --discard\n`;
  await fs.writeFile(PENDING_FILE, body, 'utf8');
  console.log('已生成待确认沉淀：');
  console.log(body);
}

main().catch((e) => { console.error(e); process.exit(1); });
