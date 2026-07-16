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

> ⚠️ **EFW 是"编排外壳"，不是"另一条路"。** 它套在你所有任务外面（规划→干活→验收→沉淀），中间"干活"那步交给谁都行——领域技能（huashu-design / md-to-html-report / earnings-analysis / ardot / xlsx…）或原生工具都可以。**有对口领域技能时用领域技能干活，但外壳的"验收"和"沉淀"两步不因此豁免。** 别把 EFW 当成和领域技能二选一的并列选项而整段跳过——这是最常见的漏用。

### 第一层：通用编排外壳（所有实质任务必走，全领域，与领域技能并存）

**什么算"实质任务"（满足任一即是，别再靠手感判断）**：① 会产出文件/交付物（报告、PPT、网页、代码、设计稿…，含 .xlsx/.pptx/.docx/.pdf/.html 等）；或 ② 需要 ≥3 步；或 ③ 预计 ≥15 次工具调用。简单问答 / 查一条资料 / 闲聊不算。

> ⛔ **0 号动作（机械默认，不等用户点名）**：一旦判定为实质任务，**你的第一个动作就是加载 \`efw\` 技能**（先于任何领域工具/脚本）。EFW 是"外壳"但载体是可选 skill——系统**不会**因为任务实质就自动加载它，**必须你显式发起**。这是一个具体动作，不是"有编排外壳的心态就行"。
>
> 🚫 **反"暗合"替代（别拿这些冒充走了 EFW）**：用 TaskCreate 拆任务 ≠ 走了外壳；自写校验脚本/肉眼看一眼 ≠ efw-verify 的逐条结构化签收；写条 memory 笔记 ≠ efw-learn 沉淀；"四步我心里过了一遍" ≠ 实际加载执行了 efw-*。**神似≠触发**，四步必须真的走技能。

> 🚦 **完成定义（DoD，硬闸门）**：一个实质任务只有在跑完 **③验收** 后才算"完成"。**没跑 efw-verify（逐条结构化验收，不是自写脚本抽查）之前，不许对用户说"做完了/已完成"。** 用领域技能（pdf/xlsx/pptx/docx/设计…）产文件也一样——文档/数据/设计任务最容易被当成"领域技能任务"而跳过闸门，切勿豁免。
>
> 🔗 **把闸门钉进任务清单**：当你用 TaskCreate 拆解实质任务时，**最后一项固定加上"efw-verify 交付前验收 + efw-learn 沉淀（如够阈值）"**，让收尾闸门变成任务列表里绕不过去的一项，而不是靠临场记得。验收清单可直接从你拆的各项任务反推（每项任务 = 一条验收标准）。

- **① 先想再做（计划）**：先拆解——目标、交付物长什么样、分几步、每步验收标准。
  - **判据**：若已加载对口领域技能，且它自带 plan/大纲/工作流（如 md-to-html-report 的 plan.md、ardot 的 Step0-8），**视为已满足本步**，不必再叠 efw-plan-feature（避免双规划浪费 token）。
  - **仅当**没有对口领域技能、或任务是纯"规划/方案/拆解"本身时，才显式用 efw-plan-feature / agent-planner。
- **② 质量标准前置**：动手前明确"做到什么程度算合格"。设计=视觉规范/交互/响应式；文档报告=术语准确/事实可核验/来源标注；数据=口径一致/结论有依据；代码=TDD/审查/安全（第二层）。没有标准就先问。
- **③ 交付前验收（跨领域强制闸门，领域技能不豁免）**：产出后**必须**跑 efw-verify——对照第②步的验收标准**逐条勾选、产出可核验的验收清单**，而不是肉眼看截图或临时写个 python 抽查就算数。领域技能自带的 QC 不能替代这一步的"结构化逐条签收"。这是 EFW 最容易被吞掉、也最该守住的一步。
- **④ 做完沉淀（强制）**：≥15 工具调用或发现可复用套路的任务，收尾用 efw-learn 写长期记忆；若是可复用的多步流程，直接 SkillManage 存成新 skill（如"财报 Earnings Update 生成""武侠发布会幻灯片"）。不问用户、默认执行。

### 第二层：工程专项约束（仅写代码/改代码场景额外遵守）

> 下面这些只在碰代码时生效。做设计/写文案/做分析不需要遵守这一层。

- 安全：绝不硬编码密钥/token/密码，一律走环境变量；\`.env\` 不进库；外部输入零信任（防注入/XSS/路径穿越）；示例不写真实凭据。
- 编码：不可变优先、小函数小文件、命名达意、早返回减嵌套、显式错误处理不吞异常；一致性 > 个人偏好；不写 YAGNI 抽象。
- 测试：新功能/修 bug 先写测试（TDD：RED→GREEN→REFACTOR）；关键路径覆盖 ≥80%；测行为不测实现；不为绿色删测试。
- Git：语义化提交 \`type(scope): subject\`；提交小而聚焦；不 \`--force\` 共享分支、不 \`--no-verify\`（除非用户明确要求）。
- 委派：广域搜索/探索用只读子代理（Explore/Plan），改代码用 general-purpose；子代理 prompt 必须自包含；产出要亲自核对。**子代理读不到本 MEMORY（独立上下文），派实质任务给它时要把 EFW 编排外壳摘要（计划→干活→验收→沉淀 + 实质任务阈值）写进它的 prompt，否则它不会用 EFW**（详见 rules/agents.md）。
- 上下文预算：不要一次性启用所有 MCP/连接器；每项目启用 <10 个，活动工具 <80；简单任务用 lite 模型、复杂推理用 reasoning。

### 第三层：能力触发纪律（全领域，不限于研发）

> 收到**任何**实质任务时，先判断下面哪个 efw 能力能帮上忙，**主动加载**——不要求用户喊名字。
> 记住第一层的定位：**领域技能负责"干活"，EFW 外壳负责"验收+沉淀"——两者并存，不是二选一。** 无论走了哪个领域技能，收尾的 efw-verify（结构化逐条验收）+ efw-learn（沉淀）都不豁免。

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
| 研究/查证/综述/深度报告 | 领域搜索/研究技能干活 + **第一层外壳** | 金价/行业/竞品/学术等研究：领域技能负责检索+交叉验证+输出，EFW 外壳负责验收(efw-verify 逐条核对来源/结论强度)+沉淀 |
| 设计/原型/PPT/视觉 | \`huashu-design\`/\`md-to-html-report\`/\`ardot-*\` 干活 + **第一层外壳** | 领域技能自带 plan/build 即满足计划步；收尾仍**强制** efw-verify(对照设计规范逐条签收)+ efw-learn |
| 文档/报告/长文 | \`docx\`/\`pptx\`/\`md-to-html-report\` 干活 + **第一层外壳** | 同上，验收+沉淀不豁免 |
| 数据/分析/报表 | \`xlsx\`/\`data-analysis\`/\`data-viz\` 干活 + **第一层外壳** | 同上 |
| 产品/OKR/运营/业务方案 | \`efw-plan-feature\` 或 \`agent-planner\` | 属"规划/方案/拆解"一等触发项，与工程方案同权，别因"非代码"漏判 |

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
  console.log('\n💡 让"子 agent / 子代理"也遵循 EFW（用户级 MEMORY.md 只对主对话生效，子 agent 不读它）：');
  console.log(`   ① 把 ${path.join(EFW_ROOT, 'examples', 'AGENTS.md')} 复制到项目根（命名 AGENTS.md 或并入 CODEBUDDY.md）；`);
  console.log(`   ② 把 ${path.join(EFW_ROOT, 'examples', 'efw-shell.rule.md')} 复制到项目的 .workbuddy/rules/efw-shell.md（alwaysApply，每会话注入、子 agent 也读）。`);
  console.log('   两者都是项目级文件，触达面比用户级 MEMORY 广——含"实质任务先加载 efw"的 0 号动作与反暗合闸门。');
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
