#!/usr/bin/env node
// EFW 一键安装器 (install.mjs)
// 跨平台（Windows / macOS / Linux）：把 EFW 配置包安装到用户级 ~/.workbuddy/ 或 ~/.codebuddy/
// 用法：
//   node scripts/install.mjs                 # 默认装到 WorkBuddy (~/.workbuddy)
//   node scripts/install.mjs --product codebuddy   # 装到 CodeBuddy   (~/.codebuddy)
//   node scripts/install.mjs --product=codebuddy
// 幂等：可重复运行；已存在则刷新，避免重复。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFW_ROOT = path.resolve(__dirname, '..');           // scripts/.. -> EFW 根
const HOME = os.homedir();

// ---------- 目标产品：workbuddy（默认） / codebuddy ----------
function detectProduct() {
  const i = process.argv.findIndex((a) => a === '--product' || a.startsWith('--product='));
  if (i === -1) return 'workbuddy';
  if (process.argv[i].startsWith('--product=')) return process.argv[i].split('=')[1] || 'workbuddy';
  return process.argv[i + 1] || 'workbuddy';
}
const PRODUCT = ['codebuddy', 'workbuddy'].includes(detectProduct()) ? detectProduct() : 'workbuddy';
const ROOT_NAME = PRODUCT === 'codebuddy' ? '.codebuddy' : '.workbuddy';
const WB = path.join(HOME, ROOT_NAME);
const RH = '~/' + ROOT_NAME; // 用于打印的简写

let ok = 0, skip = 0, fail = 0;
const done = (m) => { ok++; console.log(`  \u2713 ${m}`); };
const note = (m) => { skip++; console.log(`  \u2192 ${m}`); };
const bad  = (m) => { fail++; console.log(`  \u2717 ${m}`); };

const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };
const ensureDir = async (p) => { await fs.mkdir(p, { recursive: true }); };

const SKILLS = [
  'efw',
  'efw-tdd-workflow', 'efw-plan-feature', 'efw-code-review', 'efw-build-fix',
  'efw-refactor-clean', 'efw-security-review', 'efw-verify', 'efw-checkpoint', 'efw-learn',
  'efw-github-push',
  'efw-profile',
];

// ---------- 1. Skills ----------
async function installSkills() {
  console.log('\n[skills]');
  const dstRoot = path.join(WB, 'skills');
  await ensureDir(dstRoot);
  for (const s of SKILLS) {
    const src = path.join(EFW_ROOT, 'skills', s, 'SKILL.md');
    if (!(await exists(src))) { bad(`源码缺失 skills/${s}/SKILL.md`); continue; }
    await fs.cp(path.join(EFW_ROOT, 'skills', s), path.join(dstRoot, s), { recursive: true });
    done(`${RH}/skills/${s}`);
  }
}

// ---------- 2. Rules -> MEMORY.md ----------
const START = '<!-- EFW-RULES-START -->';
const END = '<!-- EFW-RULES-END -->';
const RULES_BLOCK = `${START}
## EFW 思考与执行纪律（效仿 Everything Claude Code）

> ⚠️ **这是全局纪律，对所有实质性任务生效**——不只是写代码。设计方案、写报告、做分析、画原型、排计划……任何需要"思考→产出→验收"的任务，都要过一遍下面的框架。

### 第一层：通用思考框架（所有任务必走）

- **先想再做**：收到任何实质性任务（不是简单问答/查资料），先用 efw-plan-feature 或 agent-planner 做一次拆解：目标是什么、交付物长什么样、分几步、每步的验收标准。哪怕只花 30 秒想清楚再动手，也比闷头干回头返工强。
- **质量标准前置**：动手前明确"做到什么程度算合格"。设计任务=视觉规范/交互完整性/响应式/可访问性；文档=术语准确/事实可核验/结构清晰；数据=来源标注/口径一致/结论有依据；代码=TDD/审查/安全（见第二层）。**没有标准就先问，不要自己猜。**
- **产出必须自检**：做完后跑一遍 efw-verify（或等效自检）：对照开工时的验收标准逐条勾选；缺什么补什么。不做"交差了事"的半成品。
- **做完要沉淀**：有价值的经验/模式/踩坑记录，用 efw-learn 写入长期记忆。下次同类任务直接复用，不从零开始。

### 第二层：工程专项约束（仅写代码/改代码场景额外遵守）

> 下面这些只在碰代码时生效。做设计/写文案/做分析不需要遵守这一层。

- 安全：绝不硬编码密钥/token/密码，一律走环境变量；\`.env\` 不进库；外部输入零信任（防注入/XSS/路径穿越）；示例不写真实凭据。
- 编码：不可变优先、小函数小文件、命名达意、早返回减嵌套、显式错误处理不吞异常；一致性 > 个人偏好；不写 YAGNI 抽象。
- 测试：新功能/修 bug 先写测试（TDD：RED→GREEN→REFACTOR）；关键路径覆盖 ≥80%；测行为不测实现；不为绿色删测试。
- Git：语义化提交 \`type(scope): subject\`；提交小而聚焦；不 \`--force\` 共享分支、不 \`--no-verify\`（除非用户明确要求）。
- 委派：广域搜索/探索用只读子代理（Explore/Plan），改代码用 general-purpose；子代理 prompt 必须自包含；产出要亲自核对。
- 上下文预算：不要一次性启用所有 MCP/连接器；每项目启用 <10 个，活动工具 <80；简单任务用 lite 模型、复杂推理用 reasoning。

### 第三层：能力触发纪律（全领域，不限于研发）

> 收到**任何**实质任务时，先判断下面哪个 efw 能力能帮上忙，**主动加载**——不要求用户喊名字。

| 任务类型 | 应触发的 EFW 能力 | 说明 |
| --- | --- | --- |
| 规划/方案/拆解 | \`efw-plan-feature\` 或 \`agent-planner\` | 不管是产品方案、设计方案、运营方案还是工程方案 |
| 写测试/红绿灯 | \`efw-tdd-workflow\` | 仅代码场景 |
| 审查/评审/质检 | \`efw-code-review\` | 代码 PR / 设计稿评审 / 文档审校 都适用 |
| 报错/构建失败 | \`efw-build-fix\` | 编译报错/部署失败/流水线卡住 |
| 重构/清理/优化 | \`efw-refactor-clean\` | 代码重构 / 文档瘦身 / 流程精简 |
| 安全/漏洞/合规 | \`efw-security-review\` | 代码漏洞 / 数据合规 / 内容合规检查 |
| 验收/自检/收尾 | \`efw-verify\` | 所有任务的交付前自检 |
| 存快照/断点保存 | \`efw-checkpoint\` | 复杂任务中途存档 |
| 提炼沉淀/复盘 | \`efw-learn\` | 任务结束后的经验固化 |
| 推 GitHub/push 卡住 | \`efw-github-push\` | 沙箱/无头环境 git push 卡凭据时的非交互推送流程 |
| 设计/原型/PPT/视觉 | \`huashu-design\` + \`md-to-html-report\` + 第一层框架 | 设计类任务走专业 skill，但**仍需套第一层思考框架**（先想再做+质量标准+自检） |
| 文档/报告/长文 | \`docx\`/\`pptx\`/\`md-to-html-report\` + \`efw-doc-updater\`(agent) | 专业 skill 干活，第一层框架管质量 |
| 数据/分析/报表 | \`xlsx\`/\`data-analysis\`/\`data-viz\` + agent-data-engineer | 同上 |

- **模糊时主动问一句**，不要乱猜。用户没说清楚需求时，先问清再动手。
- 说「用 efw」或说身份（如「我是游戏策划」）→ 用 \`efw-profile\` 自动检索匹配的能力组合。
- **启用方式差异**：技能（skill）说需求即触发；子代理（agent）由主 AI 调度；专家（expert）需用户从左侧「专家」面板点开；MCP/连接器需在连接器面板「信任/授权」。推荐能力时要按这四类分别说明怎么启用，别让用户以为都能立刻触发。
- 完整配置包在 \`${EFW_ROOT}\`（agents / skills / rules / mcp / automations / catalog 306 条索引）。
${END}
`;

async function installRules() {
  console.log('\n[rules]');
  const memPath = path.join(WB, 'MEMORY.md');
  let content = (await exists(memPath)) ? await fs.readFile(memPath, 'utf8') : '';
  // 移除旧 EFW 块（sentinel 包裹的，或旧的无 sentinel 标题块）
  let cleaned = content
    .replace(new RegExp('\\n?' + START + '[\\s\\S]*?' + END + '\\n?'), '\n')
    .replace(/\n?## EFW 研发准则[^\n]*\n(?:- .*\n)*/, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
  await fs.writeFile(memPath, cleaned + '\n' + RULES_BLOCK, 'utf8');
  done(`${RH}/MEMORY.md 已写入/刷新 EFW 思考纪律`);
  if (PRODUCT === 'codebuddy') {
    note('CodeBuddy 的自动记忆在 memery/ 目录、不自动读 MEMORY.md；若要让研发准则每会话自动生效，请把上面写入的 EFW 研发准则块内容，手动粘贴进你的 CodeBuddy 记忆。');
  }
}

// ---------- 3. MCP ----------
async function installMcp() {
  console.log('\n[mcp]');
  const src = path.join(EFW_ROOT, 'mcp', 'mcp-servers.json');
  const dst = path.join(WB, 'mcp.json');
  const srcCfg = JSON.parse(await fs.readFile(src, 'utf8'));
  const servers = srcCfg.mcpServers || {};
  const cur = (await exists(dst)) ? JSON.parse(await fs.readFile(dst, 'utf8')) : { mcpServers: {} };
  if (!cur.mcpServers) cur.mcpServers = {};
  for (const [name, conf] of Object.entries(servers)) {
    const txt = JSON.stringify(conf);
    if (/YOUR_|<|>|REPLACE_ME|API_KEY_HERE/.test(txt)) {
      note(`跳过含占位符的 ${name}（需手动填密钥后才启用）`);
      continue;
    }
    cur.mcpServers[name] = conf;
    done(`${RH}/mcp.json <- ${name}`);
  }
  await fs.writeFile(dst, JSON.stringify(cur, null, 2) + '\n', 'utf8');
}

// ---------- 4. Agents（参考素材，落用户级以便任意对话读取）----------
async function installAgents() {
  console.log('\n[agents]');
  const srcRoot = path.join(EFW_ROOT, 'agents');
  const dstRoot = path.join(WB, 'agents');
  await ensureDir(dstRoot);
  const files = (await fs.readdir(srcRoot)).filter((f) => f.endsWith('.md') && f !== 'README.md');
  for (const f of files) {
    await fs.copyFile(path.join(srcRoot, f), path.join(dstRoot, f));
    done(`${RH}/agents/${f}（参考素材）`);
  }
}

// ---------- 5. User overlay（用户拓展层，重装不丢、同名覆盖底座）----------
const USER_ROOT = path.join(EFW_ROOT, 'user');
const USTART = '<!-- EFW-USER-RULES-START -->';
const UEND = '<!-- EFW-USER-RULES-END -->';

async function installUserSkills() {
  console.log('\n[user/skills]');
  const srcRoot = path.join(USER_ROOT, 'skills');
  if (!(await exists(srcRoot))) { note('user/skills 不存在，跳过'); return; }
  const dstRoot = path.join(WB, 'skills');
  await ensureDir(dstRoot);
  for (const name of await fs.readdir(srcRoot)) {
    const src = path.join(srcRoot, name);
    if (!((await fs.stat(src)).isDirectory())) continue;
    await fs.cp(src, path.join(dstRoot, name), { recursive: true });
    done(`${RH}/skills/${name}（用户覆盖/新增）`);
  }
}

async function installUserAgents() {
  console.log('\n[user/agents]');
  const srcRoot = path.join(USER_ROOT, 'agents');
  if (!(await exists(srcRoot))) { note('user/agents 不存在，跳过'); return; }
  const dstRoot = path.join(WB, 'agents');
  await ensureDir(dstRoot);
  for (const f of (await fs.readdir(srcRoot)).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
    await fs.copyFile(path.join(srcRoot, f), path.join(dstRoot, f));
    done(`${RH}/agents/${f}（用户）`);
  }
}

async function installUserMcp() {
  console.log('\n[user/mcp]');
  const src = path.join(USER_ROOT, 'mcp', 'mcp-servers.json');
  if (!(await exists(src))) { note('user/mcp 不存在，跳过'); return; }
  const dst = path.join(WB, 'mcp.json');
  const servers = JSON.parse(await fs.readFile(src, 'utf8')).mcpServers || {};
  const cur = (await exists(dst)) ? JSON.parse(await fs.readFile(dst, 'utf8')) : { mcpServers: {} };
  if (!cur.mcpServers) cur.mcpServers = {};
  for (const [name, conf] of Object.entries(servers)) {
    const txt = JSON.stringify(conf);
    if (/YOUR_|<|>|REPLACE_ME|API_KEY_HERE/.test(txt)) { note(`跳过含占位符的 ${name}`); continue; }
    cur.mcpServers[name] = conf;
    done(`${RH}/mcp.json <- ${name}（用户）`);
  }
  await fs.writeFile(dst, JSON.stringify(cur, null, 2) + '\n', 'utf8');
}

async function installUserRules() {
  console.log('\n[user/rules]');
  const srcRoot = path.join(USER_ROOT, 'rules');
  if (!(await exists(srcRoot))) { note('user/rules 不存在，跳过'); return; }
  const files = (await fs.readdir(srcRoot)).filter((f) => f.endsWith('.md') && f !== 'README.md');
  if (files.length === 0) { note('user/rules 为空，跳过'); return; }
  let body = `${USTART}\n## 我的研发准则（用户自定义，EFW 重装不丢）\n`;
  for (const f of files) {
    const txt = (await fs.readFile(path.join(srcRoot, f), 'utf8')).trim();
    body += `\n### ${f.replace(/\.md$/, '')}\n${txt}\n`;
  }
  body += UEND + '\n';
  const memPath = path.join(WB, 'MEMORY.md');
  let content = (await exists(memPath)) ? await fs.readFile(memPath, 'utf8') : '';
  const cleaned = content
    .replace(new RegExp('\\n?' + USTART + '[\\s\\S]*?' + UEND + '\\n?'), '\n')
    .replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
  await fs.writeFile(memPath, cleaned + '\n' + body, 'utf8');
  done(`${RH}/MEMORY.md 已写入用户准则块（${files.length} 个）`);
}

// ---------- 6. 把能力索引 + 检索器打包进 efw-profile 技能（开箱即用检索）----------
async function bundleProfileAssets() {
  console.log('\n[profile-assets]');
  const skillDir = path.join(WB, 'skills', 'efw-profile');
  if (!(await exists(skillDir))) { note('efw-profile 未安装，跳过打包'); return; }
  const catSrc = path.join(EFW_ROOT, 'catalog');
  if (await exists(catSrc)) {
    await fs.cp(catSrc, path.join(skillDir, 'catalog'), { recursive: true });
    done(`${RH}/skills/efw-profile/catalog（能力索引）`);
  }
  const m = path.join(EFW_ROOT, 'scripts', 'match.mjs');
  if (await exists(m)) {
    await ensureDir(path.join(skillDir, 'scripts'));
    await fs.copyFile(m, path.join(skillDir, 'scripts', 'match.mjs'));
    done(`${RH}/skills/efw-profile/scripts/match.mjs（检索器）`);
  }
}

async function main() {
  console.log('EFW 一键安装器');
  console.log(`EFW_ROOT = ${EFW_ROOT}`);
  console.log(`PRODUCT  = ${PRODUCT}`);
  console.log(`TARGET   = ${WB}`);
  await ensureDir(WB);
  await installSkills();        // 底座技能（先）
  await bundleProfileAssets();  // 把索引+检索器打包进 efw-profile（开箱即用）
  await installUserSkills();    // 用户技能（后，同名覆盖底座）
  await installRules();         // 底座准则块
  await installUserRules();     // 用户准则块（独立标记，重装不丢）
  await installMcp();           // 底座 MCP
  await installUserMcp();       // 用户 MCP
  await installAgents();        // 底座子代理
  await installUserAgents();    // 用户子代理
  console.log(`\nRESULT: ${ok} 完成 / ${skip} 跳过 / ${fail} 失败`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
