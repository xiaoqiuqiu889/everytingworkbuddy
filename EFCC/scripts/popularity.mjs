#!/usr/bin/env node
// popularity.mjs — 抓 GitHub 公开数据得到生态热度，写入 catalog/.popularity-cache.json
// 铁律：只用 GitHub 公开数据（star/issue 提及），不读本机使用频率。
// 失败优雅降级：网络/限流 → 复用旧缓存；不阻塞 match.mjs。
//
// 用法：
//   node scripts/popularity.mjs            # 全量抓
//   node scripts/popularity.mjs --no-cache  # 忽略旧缓存，强制重抓
//   node scripts/popularity.mjs --dry-run   # 不写缓存，只看会抓什么

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');
const CATALOG = path.join(EFCC, 'catalog');
const REPOS_FILE = path.join(CATALOG, '.repos.json');
const CACHE_FILE = path.join(CATALOG, '.popularity-cache.json');
const TTL_MS = 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const NO_CACHE = args.includes('--no-cache');
const DRY_RUN = args.includes('--dry-run');

// 简单限流控制
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 简易 GitHub API 客户端
async function gh(path, { retry = 2 } = {}) {
  const url = `https://api.github.com${path}`;
  const headers = {
    'User-Agent': 'EFCC-popularity/1.0',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  for (let i = 0; i <= retry; i++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status === 403 || res.status === 429) {
      const wait = parseInt(res.headers.get('retry-after') || '10', 10);
      console.warn(`  ⚠ rate-limited on ${path}, sleep ${wait}s (try ${i + 1}/${retry + 1})`);
      await sleep(wait * 1000);
      continue;
    }
    if (res.status === 404) return null;
    if (i === retry) {
      console.warn(`  ✗ ${path}: HTTP ${res.status}`);
      return null;
    }
    await sleep(2000);
  }
  return null;
}

// 列出某仓库的技能子目录名（顶层限定一层）
async function listSkillFolders(owner, repo) {
  const items = await gh(`/repos/${owner}/${repo}/contents/skills`);
  if (!Array.isArray(items)) return [];
  return items.filter((x) => x.type === 'dir').map((x) => x.name);
}

// 统计某技能名在某仓库 issue/PR 中的提及数（取第一页 hits 即停 —— 拿到就够排序）
async function countMentions(owner, repo, skillId) {
  // GitHub search issues API：q=repo:o/n <term> in:title,body
  const q = `repo:${owner}/${repo} "${skillId}" in:title,body`;
  const data = await gh(`/search/issues?q=${encodeURIComponent(q)}&per_page=1`);
  if (!data || typeof data.total_count !== 'number') return 0;
  return data.total_count;
}

async function loadCache() {
  try { return JSON.parse(await fs.readFile(CACHE_FILE, 'utf8')); } catch { return { repos: {}, skill_mentions: {}, fetched_at: 0 }; }
}

async function saveCache(cache) {
  if (DRY_RUN) { console.log('\n[dry-run] 不写缓存'); return; }
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n', 'utf8');
  console.log(`\n✓ 缓存写入 ${CACHE_FILE}`);
}

function isFresh(fetchedAt) {
  return fetchedAt && (Date.now() - fetchedAt) < TTL_MS;
}

async function main() {
  console.log('EFCC 生态热度抓取 (popularity.mjs)');
  console.log('信号源: GitHub API (star + issue/PR 提及)');
  console.log('不读本机使用频率 — 严格遵守用户指示\n');

  const repoConfig = JSON.parse(await fs.readFile(REPOS_FILE, 'utf8'));
  const cache = NO_CACHE ? { repos: {}, skill_mentions: {}, fetched_at: 0 } : await loadCache();
  // 种子缓存（手填、缺搜索数据）必须用 --no-seed-refresh 才会被覆盖
  // —— 防止在线抓取失败时把种子里的 star 抹成空。
  if (cache.seed && !args.includes('--no-seed-refresh')) {
    console.log(`[seed] 检测到种子缓存（手填 star，无搜索提及数）。`);
    console.log(`       联网有认证时跑：node scripts/popularity.mjs --no-seed-refresh 来补充真实提及数。`);
    return;
  }
  const fresh = isFresh(cache.fetched_at);
  if (fresh && !NO_CACHE) {
    console.log(`缓存新鲜 (${Math.round((Date.now() - cache.fetched_at) / 3600000)}h ago)，跳过抓取。要重抓用 --no-cache`);
    return;
  }

  for (const r of repoConfig.repos) {
    const key = `${r.owner}/${r.name}`;
    console.log(`\n[${key}]`);

    // 1) 仓库级 star/fork（不每次都抓，缓存复用）
    if (cache.repos[key] && (Date.now() - (cache.repos[key].fetched_at || 0)) < 24 * 3600 * 1000) {
      console.log(`  ✓ star/fork 缓存复用: ${cache.repos[key].stars}★ / ${cache.repos[key].forks}f`);
    } else {
      const info = await gh(`/repos/${r.owner}/${r.name}`);
      if (!info) {
        console.warn(`  ✗ 仓库元数据获取失败，跳过此仓库`);
        continue;
      }
      cache.repos[key] = {
        stars: info.stargazers_count || 0,
        forks: info.forks_count || 0,
        fetched_at: Date.now(),
      };
      console.log(`  ✓ ${info.stargazers_count}★ / ${info.forks_count}f`);
      await sleep(1500);
    }

    // 2) 技能提及数（仅对有 skill_paths=auto 的仓库）
    if (r.skill_paths !== 'auto') continue;
    const skillKeyPrefix = key;
    const skills = await listSkillFolders(r.owner, r.name);
    if (skills.length === 0) {
      console.warn(`  ⚠ 无 skills/ 目录或为空`);
      continue;
    }
    console.log(`  发现 ${skills.length} 个技能，开始数提及...`);

    for (const sk of skills) {
      const k = `${skillKeyPrefix}/${sk}`;
      if (cache.skill_mentions[k] && (Date.now() - (cache.skill_mentions[k].fetched_at || 0)) < 24 * 3600 * 1000) {
        console.log(`    · ${sk}: ${cache.skill_mentions[k].count} mentions (cached)`);
        continue;
      }
      const count = await countMentions(r.owner, r.name, sk);
      cache.skill_mentions[k] = { count, fetched_at: Date.now() };
      console.log(`    · ${sk}: ${count} mentions`);
      // 搜索 API 限流 10/min，保守 7s 间隔
      await sleep(7000);
    }
  }

  cache.fetched_at = Date.now();
  await saveCache(cache);

  // 输出简报
  console.log('\n===== 热度摘要 =====');
  for (const [k, v] of Object.entries(cache.repos)) {
    console.log(`  ${k}: ${v.stars}★ / ${v.forks}f`);
  }
  const top = Object.entries(cache.skill_mentions)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15);
  console.log('\nTop 15 技能提及数:');
  for (const [k, v] of top) console.log(`  ${k}: ${v.count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
