#!/usr/bin/env node
// EFW 能力检索器 (match.mjs)
// 用法：
//   node scripts/match.mjs "我是前端，做组件库，常写测试"
//   echo "我是安全工程师" | node scripts/match.mjs --json
// 读取 catalog/capabilities.json（底座索引），并动态扫描 user/ 下用户自建能力，
// 对输入的自述做 触发词/标签/摘要 打分，输出最匹配的能力及理由。
// 跨平台；Exit 0。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFW = path.resolve(__dirname, '..');
const CATALOG = path.join(EFW, 'catalog', 'capabilities.json');
const USER = path.join(EFW, 'user');

const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };

function parseArgs(argv) {
  const opts = { json: false, top: 8 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--top') opts.top = parseInt(argv[++i], 10) || 8;
    else rest.push(a);
  }
  return { opts, query: rest.join(' ').trim() };
}

async function loadCapabilities() {
  const data = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
  const caps = data.capabilities || [];
  // 动态纳入 user/ 下的用户自建能力
  if (await exists(USER)) {
    const sk = path.join(USER, 'skills');
    if (await exists(sk)) {
      for (const name of await fs.readdir(sk)) {
        const d = path.join(sk, name);
        if ((await fs.stat(d)).isDirectory() && await exists(path.join(d, 'SKILL.md'))) {
          caps.push({ id: name, type: 'skill', title: `用户技能 ${name}`, summary: 'user/ 下自建技能', triggers: [name], tags: ['通用'], activate: 'call_skill' });
        }
      }
    }
    const ag = path.join(USER, 'agents');
    if (await exists(ag)) {
      for (const f of await fs.readdir(ag)) {
        if (f.endsWith('.md') && f !== 'README.md') {
          caps.push({ id: f.replace(/\.md$/, ''), type: 'agent', title: `用户子代理 ${f}`, summary: 'user/ 下自建子代理', triggers: [f.replace(/\.md$/, '')], tags: ['通用'], activate: 'schedule' });
        }
      }
    }
  }
  return { caps, activateLabels: data.activate || {} };
}

function score(cap, q) {
  const query = q.toLowerCase();
  let s = 0;
  const reasons = [];
  for (const t of cap.triggers || []) {
    if (query.includes(t.toLowerCase())) { s += 3; reasons.push(`触发词「${t}」`); }
  }
  for (const tg of cap.tags || []) {
    if (query.includes(tg.toLowerCase())) { s += 2; reasons.push(`标签「${tg}」`); }
  }
  if ((cap.summary || '').toLowerCase().includes(query) && query.length > 1) { s += 1; }
  // 英文单词重叠（摘要 vs 查询）
  const qw = new Set(query.split(/[^a-z0-9]+/).filter((w) => w.length > 2));
  for (const w of qw) {
    if ((cap.summary || '').toLowerCase().includes(w)) { s += 1; reasons.push(`关键词「${w}」`); }
  }
  return { score: s, reasons: [...new Set(reasons)] };
}

async function main() {
  const { opts, query } = parseArgs(process.argv.slice(2));
  if (!query) {
    const stdin = await new Promise((res) => {
      let d = ''; process.stdin.on('data', (c) => (d += c)); process.stdin.on('end', () => res(d.trim()));
    });
    query = stdin;
  }
  if (!query) {
    console.error('用法: node scripts/match.mjs "我是…做…"  [--json] [--top N]');
    process.exit(2);
  }
  const { caps, activateLabels } = await loadCapabilities();
  const ranked = caps
    .map((c) => ({ cap: c, ...score(c, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.top);

  if (opts.json) {
    console.log(JSON.stringify({ query, count: ranked.length, matches: ranked.map((x) => ({ ...x.cap, score: x.score, reasons: x.reasons })), }, null, 2));
    return;
  }
  console.log(`\n检索自述：${query}\n`);
  if (ranked.length === 0) {
    console.log('未命中具体能力。建议从通用能力起步：efw（入口）/ efw-learn（沉淀）/ efw-profile（再细化你的画像）。');
    return;
  }
  console.log(`匹配到 ${ranked.length} 项能力：\n`);
  ranked.forEach((x, i) => {
    const label = activateLabels[x.cap.activate] || x.cap.activate;
    console.log(`${i + 1}. [${x.cap.type}] ${x.cap.title}  (${x.cap.id})`);
    console.log(`   摘要：${x.cap.summary}`);
    console.log(`   启用：${label}`);
    console.log(`   命中：${x.reasons.join('、')}\n`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
