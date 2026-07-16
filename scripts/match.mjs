#!/usr/bin/env node
// EFW 能力检索器 (match.mjs)
// 用法：
//   node scripts/match.mjs "我是前端，做组件库，常写测试"
//   echo "我是安全工程师" | node scripts/match.mjs --json
//
// 检索来源（自增长，不封顶）：
//   1) catalog/capabilities.json —— EFW 策展能力库（用户价值导向，基于 WorkBuddy 生态公开使用热度 + 多角色覆盖调研，持续丰富，当前 300 级条；非以单一用户本地已装为准）
//   2) 已装技能目录 —— 同时扫描 ~/.workbuddy/skills 与 ~/.codebuddy/skills（跨产品兼容，自动发现你装的全部技能，含 WorkBuddy/CodeBuddy 内置技能）
//   3) EFW/user/skills、EFW/user/agents —— 你自己拓展的能力
// 对输入自述做 触发词/标签/语义 token 重叠 打分，输出最匹配的能力及理由。
// 跨平台；Exit 0。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFW = path.resolve(__dirname, '..');
const CATALOG = path.join(EFW, 'catalog', 'capabilities.json');
const USER = path.join(EFW, 'user');

const HOME = process.env.USERPROFILE || process.env.HOME || '';
// 已装技能目录候选：WorkBuddy + CodeBuddy 用户级真实目录 + 打包后可能的相邻目录
const SKILLS_CANDIDATES = [
  HOME ? path.join(HOME, '.workbuddy', 'skills') : null,
  HOME ? path.join(HOME, '.codebuddy', 'skills') : null,
  path.resolve(__dirname, '..', '..'), // 打包进 ~/.workbuddy/skills/efw-profile/ 时 = ~/.workbuddy/skills
].filter(Boolean);

const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };
const compact = (s) => (s || '').replace(/\s+/g, ' ').trim();

// 简易 YAML frontmatter 解析：取 name / description（兼容引号与多行折叠）
async function parseSkillFrontmatter(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const m = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!m) {
      // 无 frontmatter：拿首个 # 标题与首段当 name/summary
      const h = raw.match(/^#\s+(.+)$/m);
      const firstLine = (raw.split('\n').find((l) => l.trim() && !l.startsWith('#')) || '').trim();
      return { name: h ? h[1].trim() : path.basename(path.dirname(file)), description: firstLine };
    }
    const block = m[1];
    const pick = (key) => {
      // 行内：key: value
      const line = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
      if (line) {
        let v = line[1].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        return v;
      }
      // 折叠块：key: \n  "多行..."
      const folded = block.match(new RegExp(`^${key}:\\s*\\n\\s*["']([\\s\\S]*?)["']`, 'm'));
      if (folded) return folded[1].replace(/\n/g, ' ').trim();
      return '';
    };
    const name = pick('name');
    const description = pick('description');
    return {
      name: name || path.basename(path.dirname(file)),
      description: compact(description),
    };
  } catch {
    return { name: path.basename(path.dirname(file)), description: '' };
  }
}

// 把文本拆成可比较的 token 集合：中文按 2-gram，英文/数字按词
function tokenize(text) {
  const t = (text || '').toLowerCase();
  const tokens = new Set();
  const cjk = t.match(/[一-鿿]+/g) || [];
  for (const run of cjk) {
    if (run.length === 1) tokens.add(run);
    else for (let i = 0; i < run.length - 1; i++) tokens.add(run.slice(i, i + 2));
  }
  for (const w of t.match(/[a-z0-9]{3,}/g) || []) tokens.add(w);
  return tokens;
}

async function discoverInstalledSkills() {
  const found = [];
  const seen = new Set();
  for (const dir of SKILLS_CANDIDATES) {
    if (!(await exists(dir))) continue;
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const skillDir = path.join(dir, e.name);
      const skillFile = path.join(skillDir, 'SKILL.md');
      if (!(await exists(skillFile))) continue;
      if (seen.has(e.name)) continue; // 同 id 只取首个（用户级优先）
      seen.add(e.name);
      const { name, description } = await parseSkillFrontmatter(skillFile);
      found.push({
        id: e.name,
        type: 'skill',
        title: name || e.name,
        summary: description || `${name} 技能`,
        triggers: [],
        tags: [],
        activate: 'call_skill',
        source: 'installed',
      });
    }
  }
  return found;
}

async function loadCapabilities() {
  const data = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
  const caps = (data.capabilities || []).map((c) => ({ ...c, source: c.source || 'curated' }));

  // 2) 动态发现已装技能
  const installed = await discoverInstalledSkills();
  const installedIds = new Set(installed.map((s) => s.id));
  const curatedIds = new Set(caps.map((c) => c.id));
  // 给 curated 的 skill 条目标记本机是否真的装了——用于区分「现在可用」vs「推荐安装」
  for (const c of caps) {
    if (c.type === 'skill') c.ready = installedIds.has(c.id);
    else if (['expert', 'mcp'].includes(c.type)) c.ready = false; // 专家/MCP 需侧栏点开或信任，非即时可触发
    else c.ready = true; // agent/rule/workflow 视为随对话可用
  }
  for (const s of installed) {
    if (curatedIds.has(s.id)) continue; // curated 优先（triggers 更精准）
    caps.push({ ...s, ready: true });
  }

  // 3) 动态纳入 user/ 下用户自建能力（覆盖底座之外的个人拓展）
  if (await exists(USER)) {
    const sk = path.join(USER, 'skills');
    if (await exists(sk)) {
      for (const name of await fs.readdir(sk)) {
        const d = path.join(sk, name);
        if ((await fs.stat(d)).isDirectory() && await exists(path.join(d, 'SKILL.md'))) {
          if (curatedIds.has(name)) continue;
          caps.push({ id: name, type: 'skill', title: `用户技能 ${name}`, summary: 'user/ 下自建技能', triggers: [name], tags: ['通用'], activate: 'call_skill', source: 'user' });
        }
      }
    }
    const ag = path.join(USER, 'agents');
    if (await exists(ag)) {
      for (const f of await fs.readdir(ag)) {
        if (f.endsWith('.md') && f !== 'README.md') {
          const id = f.replace(/\.md$/, '');
          if (curatedIds.has(id)) continue;
          caps.push({ id, type: 'agent', title: `用户子代理 ${f}`, summary: 'user/ 下自建子代理', triggers: [id], tags: ['通用'], activate: 'schedule', source: 'user' });
        }
      }
    }
  }
  return { caps, activateLabels: data.activate || {}, totalInstalled: installed.length };
}

function score(cap, q) {
  const query = q.toLowerCase();
  let s = 0;
  const reasons = [];

  // 精准层：显式 triggers（按长度加权——多字口语短语命中比单字更可信）
  for (const t of cap.triggers || []) {
    const tl = t.toLowerCase();
    if (query.includes(tl)) {
      // 2 字以内 +4，3-4 字 +6，5 字以上 +9：让"帮我看看这段代码"这类长口语强命中
      const w = tl.length >= 5 ? 9 : (tl.length >= 3 ? 6 : 4);
      s += w;
      reasons.push(`触发词「${t}」`);
    }
  }
  for (const tg of cap.tags || []) {
    if (query.includes(tg.toLowerCase())) { s += 2; reasons.push(`标签「${tg}」`); }
  }

  // 模糊层：中文 bigram + 英文词 token 重叠（让无 triggers 的发现型技能也能命中）
  // 关键：单个 bigram 重叠噪声很大（如"代码"命中一堆无关条目），故 0.5 权重并封顶，
  //       仅作为"精准层未命中时的兜底"，不喧宾夺主。
  const hay = tokenize([cap.summary, cap.title, cap.id, (cap.triggers || []).join(' '), (cap.tags || []).join(' ')].join(' '));
  const qTokens = tokenize(q);
  const ov = new Set();
  for (const tk of qTokens) if (hay.has(tk)) ov.add(tk);
  if (ov.size > 0) {
    s += Math.min(ov.size * 0.5, 3); // 每个共享 token +0.5，最多 +3，避免泛词堆分
    reasons.push(`语义「${[...ov].slice(0, 4).join('/')}」`);
  }

  // 整段摘要被查询包含（兜底）
  if ((cap.summary || '').toLowerCase().includes(query) && query.length > 1) { s += 1; }
  return { score: s, reasons: [...new Set(reasons)] };
}

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

const SOURCE_LABEL = { curated: '内置', installed: '已装技能', user: '用户自建' };

async function main() {
  const { opts, query } = parseArgs(process.argv.slice(2));
  let q = query;
  if (!q) {
    q = await new Promise((res) => {
      let d = ''; process.stdin.on('data', (c) => (d += c)); process.stdin.on('end', () => res(d.trim()));
    });
  }
  if (!q) {
    console.error('用法: node scripts/match.mjs "我是…做…"  [--json] [--top N]');
    process.exit(2);
  }
  const { caps, activateLabels, totalInstalled } = await loadCapabilities();
  const ranked = caps
    .map((c) => ({ cap: c, ...score(c, q) }))
    .filter((x) => x.score > 0)
    // 同分时：本机可用(ready) 优先于 需安装；再 curated 优先于动态发现
    .sort((a, b) =>
      b.score - a.score ||
      (a.cap.ready === b.cap.ready ? 0 : a.cap.ready ? -1 : 1) ||
      (a.cap.source === 'curated' ? -1 : 1)
    )
    .slice(0, opts.top);

  if (opts.json) {
    console.log(JSON.stringify({
      query: q,
      totalIndexed: caps.length,
      installedDiscovered: totalInstalled,
      count: ranked.length,
      matches: ranked.map((x) => ({ ...x.cap, ready: !!x.cap.ready, score: x.score, reasons: x.reasons })),
    }, null, 2));
    return;
  }
  console.log(`\n检索自述：${q}`);
  console.log(`索引规模：${caps.length} 条（内置 + 已装技能动态纳入 ${totalInstalled} 个）\n`);
  if (ranked.length === 0) {
    console.log('未命中具体能力。建议从通用能力起步：efw（入口）/ efw-learn（沉淀）/ efw-profile（再细化你的画像）。');
    return;
  }
  const readyList = ranked.filter((x) => x.cap.ready);
  const needList = ranked.filter((x) => !x.cap.ready);
  const render = (x, i) => {
    const label = activateLabels[x.cap.activate] || x.cap.activate;
    const src = SOURCE_LABEL[x.cap.source] || x.cap.source || '';
    console.log(`${i + 1}. [${x.cap.type}] ${x.cap.title}  (${x.cap.id})  ·  ${src}`);
    console.log(`   摘要：${x.cap.summary}`);
    console.log(`   启用：${label}`);
    console.log(`   命中：${x.reasons.join('、')}\n`);
  };
  if (readyList.length) {
    console.log(`✅ 现在就能用（${readyList.length} 项，直接说需求即可触发）：\n`);
    readyList.forEach(render);
  }
  if (needList.length) {
    console.log(`📦 推荐安装 / 授权后可用（${needList.length} 项，需先装技能 / 侧栏点开专家 / 连接器信任）：\n`);
    needList.forEach(render);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
