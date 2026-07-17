#!/usr/bin/env node
// EFCC 一键安装器 (install.mjs) — Everything For Claude & Codex
// 把同一套能力包（编排外壳 + 流程技能 + 准则 + MCP）同时装进两款 AI 助手：
//   • Claude（桌面 / Claude Code）→ ~/.claude/{skills,agents,CLAUDE.md} + ~/.claude.json
//   • Codex（ChatGPT / Codex CLI） → ~/.codex/{prompts,AGENTS.md,config.toml}
//
// 用法：
//   node scripts/install.mjs                 # 默认装两端 (both)
//   node scripts/install.mjs --target claude # 只装 Claude
//   node scripts/install.mjs --target codex  # 只装 Codex
//   node scripts/install.mjs --target both   # 两端都装（同默认）
// 幂等：可重复运行；已存在则刷新，sentinel 块整体替换，不重复堆叠。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();

// ---------- 目标平台 ----------
function detectTarget() {
  const i = process.argv.findIndex((a) => a === '--target' || a.startsWith('--target='));
  if (i === -1) return 'both';
  if (process.argv[i].startsWith('--target=')) return process.argv[i].split('=')[1] || 'both';
  return process.argv[i + 1] || 'both';
}
let TARGET = detectTarget();
if (!['claude', 'codex', 'both'].includes(TARGET)) TARGET = 'both';
const DO_CLAUDE = TARGET === 'claude' || TARGET === 'both';
const DO_CODEX = TARGET === 'codex' || TARGET === 'both';

const CLAUDE = path.join(HOME, '.claude');
const CODEX = path.join(HOME, '.codex');

let ok = 0, skip = 0, fail = 0;
const done = (m) => { ok++; console.log(`  ✓ ${m}`); };
const note = (m) => { skip++; console.log(`  → ${m}`); };
const bad = (m) => { fail++; console.log(`  ✗ ${m}`); };

const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };
const ensureDir = async (p) => { await fs.mkdir(p, { recursive: true }); };

const SKILLS = [
  'efc',
  'efc-tdd-workflow', 'efc-plan-feature', 'efc-code-review', 'efc-build-fix',
  'efc-refactor-clean', 'efc-security-review', 'efc-verify', 'efc-checkpoint', 'efc-learn',
  'efc-github-push',
  'efc-profile',
];

// ============================================================
// 共享：EFCC 编排外壳纪律块（写进 CLAUDE.md / AGENTS.md）
// ============================================================
const START = '<!-- EFCC-RULES-START -->';
const END = '<!-- EFCC-RULES-END -->';
function rulesBlock(platform) {
  const memHint = platform === 'codex'
    ? '技能载体在 `~/.codex/prompts/*.md`（斜杠命令 `/efc`，**不自动加载**，需你显式发起）；本纪律写在 `~/.codex/AGENTS.md`，每会话自动注入。'
    : '技能载体在 `~/.claude/skills/efc-*`（相关时自动加载，或 `/efc` 显式调用）；本纪律写在 `~/.claude/CLAUDE.md`，每会话自动注入。';
  return `${START}
## EFCC 思考与执行纪律（Everything For Claude & Codex）

> ⚠️ **EFCC 是"编排外壳"，不是"另一条路"。** 它套在你所有实质任务外面（计划→干活→验收→沉淀），中间"干活"那步交给谁都行——领域技能或原生工具。**有对口领域技能时用它干活，但外壳的"验收"和"沉淀"两步不因此豁免。** 别把 EFCC 当成和领域技能二选一而整段跳过——这是最常见的漏用。
> ${memHint}

### 第一层：通用编排外壳（所有实质任务必走）

**什么算"实质任务"（满足任一即是）**：① 产出文件/交付物（.xlsx/.pptx/.docx/.pdf/.html/代码/设计稿…）；或 ② 需 ≥3 步；或 ③ 预计 ≥15 次工具调用。简单问答 / 查一条资料 / 闲聊不算。

> ⛔ **0 号动作（机械默认，不等用户点名）**：一旦判定为实质任务，**第一个动作就是加载 \`efc\` 技能/命令**（先于任何领域工具/脚本）。EFCC 是"外壳"但载体是可选 skill/prompt——系统**不会**自动加载，**必须你显式发起**。
> 🚫 **反"暗合"替代**：用待办清单拆任务 ≠ 走了外壳；自写校验脚本/肉眼看一眼 ≠ efc-verify 的逐条结构化签收；写条 memory 笔记 ≠ efc-learn 沉淀。**神似≠触发**，四步必须真的走技能。
> 🚦 **完成定义（DoD 硬闸门）**：没跑 \`efc-verify\`（逐条对照验收标准签收）之前，**不许说"做完了/已完成"**。文档/数据/设计任务最易被当"纯领域任务"跳过闸门——切勿豁免。

- **① 计划**：拆解目标、交付物形态、分步、每步验收标准。对口领域技能自带 plan/大纲的**视为满足**，不必再叠 \`efc-plan-feature\`。
- **② 干活**：交给最对口的领域技能或原生工具。EFCC 不跟它抢。
- **③ 验收（跨领域强制闸门）**：产出后跑 \`efc-verify\`，对照第①步标准**逐条勾选、产出可核验清单**，不是肉眼看或临时抽查。
- **④ 沉淀**：≥15 工具调用或有可复用套路 → \`efc-learn\` 写长期记忆；可复用流程存成新 skill/prompt。

### 第二层：工程专项约束（仅写代码/改代码时叠加）

- 安全：绝不硬编码密钥/token，走环境变量；\`.env\` 不进库；外部输入零信任（防注入/XSS/路径穿越）。
- 编码：不可变优先、小函数小文件、命名达意、早返回、显式错误处理不吞异常；一致性 > 个人偏好；不写 YAGNI 抽象。
- 测试：新功能/修 bug 先写测试（RED→GREEN→REFACTOR）；关键路径覆盖 ≥80%；测行为不测实现。
- Git：语义化提交 \`type(scope): subject\`；提交小而聚焦；不 \`--force\` 共享分支、不 \`--no-verify\`（除非用户明确要求）。
- 委派/子代理：子代理是独立上下文，读不到本记忆——派实质任务给它时，把上面四步外壳摘要写进它的 prompt，否则它不会用 EFCC。
- 上下文预算：不要一次性启用所有 MCP；每项目启用 <10 个。

### 第三层：能力触发纪律（全领域）

| 任务类型 | 触发的 EFCC 能力 |
| --- | --- |
| 规划/方案/拆解 | \`efc-plan-feature\` |
| 写测试/TDD | \`efc-tdd-workflow\` |
| 审查/评审/质检 | \`efc-code-review\` |
| 报错/构建失败 | \`efc-build-fix\` |
| 重构/清理/优化 | \`efc-refactor-clean\` |
| 安全/漏洞/合规 | \`efc-security-review\` |
| 验收/自检/收尾 | \`efc-verify\`（强制闸门） |
| 存快照/断点 | \`efc-checkpoint\` |
| 提炼/沉淀/复盘 | \`efc-learn\` |
| 推 GitHub 卡住 | \`efc-github-push\` |
| 报身份「我是…」/检索能力 | \`efc-profile\` |
| 设计/文档/数据/报告 | 领域技能干活 + 外壳（验收+沉淀不豁免） |

- 模糊需求**主动问一句**，不乱猜。
- 完整能力包在 \`${EFCC_ROOT}\`（skills / agents / rules / mcp / catalog）。
${END}
`;
}

async function writeMemoryBlock(memPath, platform, label) {
  let content = (await exists(memPath)) ? await fs.readFile(memPath, 'utf8') : '';
  const cleaned = content
    .replace(new RegExp('\\n?' + START + '[\\s\\S]*?' + END + '\\n?'), '\n')
    .replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  const body = (cleaned ? cleaned + '\n\n' : '') + rulesBlock(platform);
  await ensureDir(path.dirname(memPath));
  await fs.writeFile(memPath, body + '\n', 'utf8');
  done(`${label} 已写入/刷新 EFCC 编排外壳纪律块`);
}

// ============================================================
// Claude 安装
// ============================================================
async function installClaude() {
  console.log('\n========== [Claude] ~/.claude ==========');
  console.log('[claude/skills]');
  const dstRoot = path.join(CLAUDE, 'skills');
  await ensureDir(dstRoot);
  for (const s of SKILLS) {
    const src = path.join(EFCC_ROOT, 'skills', s);
    if (!(await exists(path.join(src, 'SKILL.md')))) { bad(`源缺失 skills/${s}/SKILL.md`); continue; }
    await fs.cp(src, path.join(dstRoot, s), { recursive: true });
    done(`~/.claude/skills/${s}`);
  }
  await bundleProfileAssets(dstRoot);
  await installUserSkills(dstRoot);
  console.log('[claude/rules]');
  await writeMemoryBlock(path.join(CLAUDE, 'CLAUDE.md'), 'claude', '~/.claude/CLAUDE.md');
  await installUserRules(path.join(CLAUDE, 'CLAUDE.md'));
  console.log('[claude/agents]');
  const agDst = path.join(CLAUDE, 'agents');
  await ensureDir(agDst);
  await copyAgents(agDst, 'claude');
  console.log('[claude/mcp]');
  await installClaudeMcp();
  console.log('[claude/hooks]');
  await installClaudeHooks();
}

async function installClaudeHooks() {
  const src = path.join(EFCC_ROOT, 'hooks', 'hooks.json');
  if (!(await exists(src))) { note('hooks 源缺失，跳过'); return; }
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(src, 'utf8')); } catch (e) { bad(`hooks.json 解析失败: ${e.message}`); return; }
  const settingsPath = path.join(CLAUDE, 'settings.json');
  let settings = {};
  if (await exists(settingsPath)) {
    try { settings = JSON.parse(await fs.readFile(settingsPath, 'utf8')); } catch (e) { bad(`settings.json 解析失败: ${e.message}`); return; }
  }
  if (!settings.hooks) settings.hooks = {};

  // 把 ${CLAUDE_PROJECT_DIR}/EFCC 替换为 EFCC_ROOT 绝对路径（仅匹配该模板，不全局替换 /）
  const replacePath = (obj) => {
    if (typeof obj === 'string') return obj.replace(/\$\{CLAUDE_PROJECT_DIR\}\/EFCC/g, EFCC_ROOT);
    if (Array.isArray(obj)) return obj.map(replacePath);
    if (obj && typeof obj === 'object') return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, replacePath(v)]));
    return obj;
  };

  for (const [hookType, entries] of Object.entries(manifest.hooks || {})) {
    const existing = settings.hooks[hookType] || [];
    const efccDescs = new Set();
    const efccCommands = new Set();
    for (const e of entries) {
      if (e.description) efccDescs.add(e.description);
      for (const h of e.hooks || []) {
        const cmd = typeof h.command === 'string' ? h.command : (h.args || []).join(' ');
        if (cmd.includes(EFCC_ROOT)) efccCommands.add(cmd);
      }
    }
    // 去重：description 匹配或 command 包含 EFCC_ROOT
    const isEfcc = (e) => {
      if (e.description && efccDescs.has(e.description)) return true;
      for (const h of e.hooks || []) {
        const cmd = typeof h.command === 'string' ? h.command : (h.args || []).join(' ');
        if (efccCommands.has(cmd) || cmd.includes(EFCC_ROOT)) return true;
      }
      return false;
    };
    const filtered = existing.filter((e) => !isEfcc(e));
    settings.hooks[hookType] = [...filtered, ...replacePath(entries)];
    done(`~/.claude/settings.json hooks.${hookType} 已合并 EFCC hooks`);
  }
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

async function installClaudeMcp() {
  const src = path.join(EFCC_ROOT, 'mcp', 'mcp-servers.json');
  if (!(await exists(src))) { note('mcp 源缺失，跳过'); return; }
  const servers = (JSON.parse(await fs.readFile(src, 'utf8')).mcpServers) || {};
  const dst = path.join(HOME, '.claude.json');
  let cur = {};
  if (await exists(dst)) { try { cur = JSON.parse(await fs.readFile(dst, 'utf8')); } catch { cur = {}; } }
  if (!cur.mcpServers) cur.mcpServers = {};
  for (const [name, conf] of Object.entries(servers)) {
    if (/YOUR_|<|>|REPLACE_ME|API_KEY_HERE/.test(JSON.stringify(conf))) { note(`跳过含占位符的 ${name}`); continue; }
    const { description, ...clean } = conf;
    cur.mcpServers[name] = clean;
    done(`~/.claude.json <- mcpServers.${name}`);
  }
  await fs.writeFile(dst, JSON.stringify(cur, null, 2) + '\n', 'utf8');
}

// ============================================================
// Codex 安装
// ============================================================
async function installCodex() {
  console.log('\n========== [Codex] ~/.codex ==========');
  console.log('[codex/prompts]');
  const promptsDir = path.join(CODEX, 'prompts');
  await ensureDir(promptsDir);
  for (const s of SKILLS) {
    const src = path.join(EFCC_ROOT, 'skills', s, 'SKILL.md');
    if (!(await exists(src))) { bad(`源缺失 skills/${s}/SKILL.md`); continue; }
    const body = await skillToPrompt(await fs.readFile(src, 'utf8'), s);
    await fs.writeFile(path.join(promptsDir, `${s}.md`), body, 'utf8');
    done(`~/.codex/prompts/${s}.md（斜杠命令 /${s}）`);
  }
  const assets = path.join(CODEX, 'efcc-assets');
  await ensureDir(assets);
  if (await exists(path.join(EFCC_ROOT, 'catalog'))) {
    await fs.cp(path.join(EFCC_ROOT, 'catalog'), path.join(assets, 'catalog'), { recursive: true });
    done('~/.codex/efcc-assets/catalog（能力索引）');
  }
  if (await exists(path.join(EFCC_ROOT, 'scripts', 'match.mjs'))) {
    await fs.copyFile(path.join(EFCC_ROOT, 'scripts', 'match.mjs'), path.join(assets, 'match.mjs'));
    done('~/.codex/efcc-assets/match.mjs（检索器）');
  }
  await installUserPrompts(promptsDir);
  console.log('[codex/rules]');
  await writeMemoryBlock(path.join(CODEX, 'AGENTS.md'), 'codex', '~/.codex/AGENTS.md');
  await installUserRules(path.join(CODEX, 'AGENTS.md'));
  console.log('[codex/agents]');
  await copyAgents(promptsDir, 'codex');
  console.log('[codex/mcp]');
  await installCodexMcp();
}

// SKILL.md -> Codex prompt：剥离 frontmatter，顶部加标题与说明，保留正文
async function skillToPrompt(raw, id) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  let desc = '';
  if (m) {
    const d = m[1].match(/^description:\s*(.+)$/m);
    if (d) desc = d[1].replace(/^["']|["']$/g, '').trim();
  }
  const body = m ? raw.slice(m[0].length) : raw;
  const head = `<!-- EFCC prompt: ${id} — 由 SKILL.md 自动转换，Codex 斜杠命令 /${id} -->\n` +
    (desc ? `> **何时用**：${desc}\n\n` : '');
  return head + body.trimStart();
}

async function installCodexMcp() {
  const src = path.join(EFCC_ROOT, 'mcp', 'mcp-servers.json');
  if (!(await exists(src))) { note('mcp 源缺失，跳过'); return; }
  const servers = (JSON.parse(await fs.readFile(src, 'utf8')).mcpServers) || {};
  const dst = path.join(CODEX, 'config.toml');
  await ensureDir(CODEX);
  let toml = (await exists(dst)) ? await fs.readFile(dst, 'utf8') : '';
  for (const [name, conf] of Object.entries(servers)) {
    if (/YOUR_|<|>|REPLACE_ME|API_KEY_HERE/.test(JSON.stringify(conf))) { note(`跳过含占位符的 ${name}`); continue; }
    const header = `[mcp_servers.${name}]`;
    if (toml.includes(header)) { note(`config.toml 已含 ${name}，跳过（避免覆盖你的改动）`); continue; }
    const argsStr = (conf.args || []).map((a) => JSON.stringify(a)).join(', ');
    let block = `\n${header}\ncommand = ${JSON.stringify(conf.command)}\nargs = [${argsStr}]\n`;
    if (conf.env && Object.keys(conf.env).length) {
      block += `[mcp_servers.${name}.env]\n`;
      for (const [k, v] of Object.entries(conf.env)) block += `${k} = ${JSON.stringify(v)}\n`;
    }
    toml += block;
    done(`~/.codex/config.toml <- [mcp_servers.${name}]`);
  }
  await fs.writeFile(dst, toml, 'utf8');
}

// ============================================================
// 共享子过程
// ============================================================
async function bundleProfileAssets(skillsRoot) {
  const skillDir = path.join(skillsRoot, 'efc-profile');
  if (!(await exists(skillDir))) return;
  if (await exists(path.join(EFCC_ROOT, 'catalog'))) {
    await fs.cp(path.join(EFCC_ROOT, 'catalog'), path.join(skillDir, 'catalog'), { recursive: true });
    done('efc-profile/catalog（能力索引已打包）');
  }
  const m = path.join(EFCC_ROOT, 'scripts', 'match.mjs');
  if (await exists(m)) {
    await ensureDir(path.join(skillDir, 'scripts'));
    await fs.copyFile(m, path.join(skillDir, 'scripts', 'match.mjs'));
    done('efc-profile/scripts/match.mjs（检索器已打包）');
  }
}

async function copyAgents(dstRoot, platform) {
  const srcRoot = path.join(EFCC_ROOT, 'agents');
  if (!(await exists(srcRoot))) { note('agents 源缺失'); return; }
  await ensureDir(dstRoot);
  const files = (await fs.readdir(srcRoot)).filter((f) => f.endsWith('.md') && f !== 'README.md');
  for (const f of files) {
    if (platform === 'codex') {
      const raw = await fs.readFile(path.join(srcRoot, f), 'utf8');
      await fs.writeFile(path.join(dstRoot, `agent-${f}`), raw, 'utf8');
      done(`~/.codex/prompts/agent-${f}（子代理提示词，可 /agent-${f.replace(/\.md$/, '')}）`);
    } else {
      await fs.copyFile(path.join(srcRoot, f), path.join(dstRoot, f));
      done(`~/.claude/agents/${f}`);
    }
  }
}

// ---------- user overlay ----------
const USER_ROOT = path.join(EFCC_ROOT, 'user');
const USTART = '<!-- EFCC-USER-RULES-START -->';
const UEND = '<!-- EFCC-USER-RULES-END -->';

async function installUserSkills(dstRoot) {
  const srcRoot = path.join(USER_ROOT, 'skills');
  if (!(await exists(srcRoot))) return;
  for (const name of await fs.readdir(srcRoot)) {
    const src = path.join(srcRoot, name);
    try { if (!(await fs.stat(src)).isDirectory()) continue; } catch { continue; }
    if (!(await exists(path.join(src, 'SKILL.md')))) continue;
    await fs.cp(src, path.join(dstRoot, name), { recursive: true });
    done(`skills/${name}（用户覆盖/新增）`);
  }
}

async function installUserPrompts(promptsDir) {
  const srcRoot = path.join(USER_ROOT, 'skills');
  if (!(await exists(srcRoot))) return;
  for (const name of await fs.readdir(srcRoot)) {
    const src = path.join(srcRoot, name, 'SKILL.md');
    if (!(await exists(src))) continue;
    const body = await skillToPrompt(await fs.readFile(src, 'utf8'), name);
    await fs.writeFile(path.join(promptsDir, `${name}.md`), body, 'utf8');
    done(`~/.codex/prompts/${name}.md（用户覆盖/新增）`);
  }
}

async function installUserRules(memPath) {
  const srcRoot = path.join(USER_ROOT, 'rules');
  if (!(await exists(srcRoot))) return;
  const files = (await fs.readdir(srcRoot)).filter((f) => f.endsWith('.md') && f !== 'README.md');
  if (files.length === 0) return;
  let body = `${USTART}\n## 我的准则（用户自定义，EFCC 重装不丢）\n`;
  for (const f of files) {
    const txt = (await fs.readFile(path.join(srcRoot, f), 'utf8')).trim();
    body += `\n### ${f.replace(/\.md$/, '')}\n${txt}\n`;
  }
  body += UEND + '\n';
  let content = (await exists(memPath)) ? await fs.readFile(memPath, 'utf8') : '';
  const cleaned = content
    .replace(new RegExp('\\n?' + USTART + '[\\s\\S]*?' + UEND + '\\n?'), '\n')
    .replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  await fs.writeFile(memPath, cleaned + '\n\n' + body, 'utf8');
  done(`${path.basename(memPath)} 已写入用户准则块（${files.length} 个）`);
}

// ============================================================
async function main() {
  console.log('EFCC 一键安装器 — Everything For Claude & Codex');
  console.log(`EFCC_ROOT = ${EFCC_ROOT}`);
  console.log(`TARGET    = ${TARGET}`);
  if (DO_CLAUDE) await installClaude();
  if (DO_CODEX) await installCodex();
  console.log(`\nRESULT: ${ok} 完成 / ${skip} 跳过 / ${fail} 失败`);
  console.log('\n💡 让"子代理 / 别的会话"也遵循 EFCC：');
  console.log(`   • 项目级：把 ${path.join(EFCC_ROOT, 'examples', 'AGENTS.md')} 复制到项目根（Claude 用 CLAUDE.md，Codex 用 AGENTS.md），每会话注入、子代理也读。`);
  console.log('   • Codex：prompts 是手动斜杠命令，四步外壳的"常驻性"靠 ~/.codex/AGENTS.md（已写入）保证。');
  console.log('   • MCP：Claude 写入 ~/.claude.json、Codex 写入 ~/.codex/config.toml；context7 / sequential-thinking 无需密钥。');
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
