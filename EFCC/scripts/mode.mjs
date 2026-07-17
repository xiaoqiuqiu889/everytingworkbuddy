#!/usr/bin/env node
// EFCC mode 切换脚本 —— 把某个 contexts/*.md 注入到 Claude 记忆或打印成 Codex 斜杠命令
// 用法：
//   node scripts/mode.mjs dev       # 把 dev.md 追加到 ~/.claude/CLAUDE.md（Claude 模式）
//   node scripts/mode.mjs ship      # 切换到 ship 模式
//   node scripts/mode.mjs --codex ship  # 打印 /mode-ship 的 prompt 文本（可放进 ~/.codex/prompts/mode-ship.md）
//   node scripts/mode.mjs --list    # 列出所有模式

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOME = os.homedir();
const EFCC = path.resolve(__dirname, '..');
const MODES_FILE = path.join(EFCC, 'contexts', 'contexts.json');
const MODE_START = '\n\n<!-- EFCC-MODE-START -->\n';
const MODE_END = '\n<!-- EFCC-MODE-END -->\n';

const args = process.argv.slice(2);
const codex = args.includes('--codex');
const listMode = args.includes('--list');
const modeName = args.find((a) => !a.startsWith('-'));

function cleanModeBlock(text) {
  return text.replace(new RegExp(MODE_START.replace(/\[/g, '\\[').replace(/\]/g, '\\]') + '[\\s\\S]*?' + MODE_END.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), '').trim();
}

function loadModes() {
  return JSON.parse(fs.readFileSync(MODES_FILE, 'utf8')).modes;
}

if (listMode) {
  const modes = loadModes();
  console.log('EFCC 可用模式:');
  for (const [k, v] of Object.entries(modes)) console.log(`  · ${k.padEnd(8)} — ${v.description}`);
  console.log('\nClaude 用: node scripts/mode.mjs <mode>');
  console.log('Codex 用: node scripts/mode.mjs --codex <mode>  > ~/.codex/prompts/mode-<mode>.md');
  process.exit(0);
}

if (!modeName) {
  console.error('用法: node scripts/mode.mjs <mode> [--codex]');
  console.error('      node scripts/mode.mjs --list');
  process.exit(2);
}

const modes = loadModes();
const mode = modes[modeName];
if (!mode) {
  console.error(`未知模式: ${modeName}。可用模式: ${Object.keys(modes).join(', ')}`);
  process.exit(2);
}

const mdPath = path.join(EFCC, mode.file);
const content = fs.readFileSync(mdPath, 'utf8');

if (codex) {
  // 输出纯文本 prompt，供 /mode-* 斜杠命令
  console.log(`<!-- EFCC mode prompt: ${modeName} — Codex 斜杠命令 /mode-${modeName} -->\n${content}`);
  process.exit(0);
}

// Claude: 追加/替换到 ~/.claude/CLAUDE.md
const memoryPath = path.join(HOME, '.claude', 'CLAUDE.md');
let existing = '';
try { existing = fs.readFileSync(memoryPath, 'utf8'); } catch { /* 不存在则创建 */ }
const cleaned = cleanModeBlock(existing);
const out = cleaned + MODE_START + content + MODE_END;
fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
fs.writeFileSync(memoryPath, out, 'utf8');
console.log(`✓ 已切换到 ${modeName} 模式（写入 ~/.claude/CLAUDE.md）`);
console.log(`  ${mode.description}`);
