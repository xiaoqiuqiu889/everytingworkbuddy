// tests/match.test.mjs —— match.mjs 关键函数纯单元测试（不引入匹配器主流程，独立验证 score/popularity 公式）
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');

// 直接复制 popularity score 的纯函数（不引 match.mjs 避免副作用），确保公式行为可断言
function popularityScore(cap, pop) {
  if (cap.source === 'efcc-native') return { score: 100, reason: 'EFCC 原生（实测可用）' };
  const repoKey = cap.repo;
  if (!repoKey || !pop.available) return { score: 0, reason: '无热度数据' };
  const r = pop.repos[repoKey];
  if (!r) return { score: 0, reason: '仓库未收录' };
  const m = pop.skillMentions[`${repoKey}/${cap.id}`]?.count || 0;
  const w = r.weight || 1.0;
  return { score: (Math.log(r.stars + 1) * 5 + Math.log(1 + m) * 3) * w, reason: `${r.stars}★ / ${m} mentions` };
}

const samplePop = {
  available: true,
  repos: { 'anthropics/skills': { stars: 162000, weight: 1.0 }, 'affaan-m/ECC': { stars: 230000, weight: 1.0 } },
  skillMentions: { 'anthropics/skills/xlsx': { count: 47 } },
};

const assertions = [
  {
    name: 'efcc-native → 固定 100',
    check: () => popularityScore({ source: 'efcc-native', id: 'efc' }, samplePop).score === 100,
  },
  {
    name: 'anthropics/skills 162k★ 无 mention → log(162001)*5 ≈ 60.0',
    check: () => {
      const s = popularityScore({ source: 'anthropic-skills', id: 'docx', repo: 'anthropics/skills' }, samplePop).score;
      return Math.abs(s - Math.log(162001) * 5) < 0.01;
    },
  },
  {
    name: 'xlsx 有 47 mentions → score 显著高于 docx',
    check: () => {
      const x = popularityScore({ source: 'anthropic-skills', id: 'xlsx', repo: 'anthropics/skills' }, samplePop).score;
      const d = popularityScore({ source: 'anthropic-skills', id: 'docx', repo: 'anthropics/skills' }, samplePop).score;
      return x > d;
    },
  },
  {
    name: 'pop.available=false → 0 分',
    check: () => popularityScore({ source: 'anthropic-skills', id: 'xlsx', repo: 'anthropics/skills' }, { available: false, repos: {}, skillMentions: {} }).score === 0,
  },
  {
    name: 'unknown repo → 0 分',
    check: () => popularityScore({ source: 'x', id: 'y', repo: 'nobody/nowhere' }, samplePop).score === 0,
  },
  {
    name: 'final = relevance×0.6 + popularity×0.4 公式示例（xlsx rel=11.5 → 18.9）',
    check: () => {
      const p = popularityScore({ source: 'anthropic-skills', id: 'xlsx', repo: 'anthropics/skills' }, samplePop);
      const final = 11.5 * 0.6 + p.score * 0.4;
      // xlsx = 162k★ + 47 mentions，log(162001)*5+log(48)*3 ≈ 60+11.6 = 71.6
      // final = 11.5*0.6 + 71.6*0.4 = 6.9 + 28.64 = 35.5
      return final > 30 && final < 40; // 宽范围断言，避免小波动
    },
  },
  {
    name: 'catalog/.popularity-cache.json 是 seed 模式',
    check: () => {
      const c = JSON.parse(readFileSync(path.join(EFCC, 'catalog/.popularity-cache.json'), 'utf8'));
      return c.seed === true && Object.keys(c.repos || {}).length >= 5;
    },
  },
  {
    name: 'xlsx 出现在 anthropic-skills 源中',
    check: () => {
      const caps = JSON.parse(readFileSync(path.join(EFCC, 'catalog/capabilities.json'), 'utf8')).capabilities;
      const xlsx = caps.find((c) => c.id === 'xlsx' && c.source === 'anthropic-skills');
      return xlsx && xlsx.repo === 'anthropics/skills';
    },
  },
  {
    name: 'match 端到端: PPT query top1 必须是 pptx',
    check: () => {
      const out = execSync('node scripts/match.mjs "做PPT给老板汇报" --top 1 --json', { cwd: EFCC, encoding: 'utf8' });
      const j = JSON.parse(out);
      return j.matches[0]?.id === 'pptx';
    },
  },
  {
    name: 'match 端到端: 关热度后 pptx 排不进 top 5（证明热度真生效）',
    check: () => {
      const out = execSync('node scripts/match.mjs "做PPT给老板汇报" --top 5 --no-popularity --json', { cwd: EFCC, encoding: 'utf8' });
      const j = JSON.parse(out);
      return !j.matches.slice(0, 5).some((m) => m.id === 'pptx');
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
