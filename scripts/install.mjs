#!/usr/bin/env node
// EFW 一键安装器 (install.mjs)
// 跨平台（Windows / macOS / Linux）：把 EFW 配置包安装到用户级 ~/.workbuddy/
// 幂等：可重复运行；已存在则刷新，避免重复。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFW_ROOT = path.resolve(__dirname, '..');           // scripts/.. -> EFW 根
const HOME = os.homedir();
const WB = path.join(HOME, '.workbuddy');

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
    done(`~/.workbuddy/skills/${s}`);
  }
}

// ---------- 2. Rules -> MEMORY.md ----------
const START = '<!-- EFW-RULES-START -->';
const END = '<!-- EFW-RULES-END -->';
const RULES_BLOCK = `${START}
## EFW 研发准则（工程/写代码场景生效，效仿 Everything Claude Code）
- 完整配置包在 \`${EFW_ROOT}\`（agents / skills / rules / mcp / automations）。做软件工程任务时遵循以下红线；非研发场景（写作/设计/查询等）不受此约束。
- 安全：绝不硬编码密钥/token/密码，一律走环境变量；\`.env\` 不进库；外部输入零信任（防注入/XSS/路径穿越）；示例不写真实凭据。
- 编码：不可变优先、小函数小文件、命名达意、早返回减嵌套、显式错误处理不吞异常；一致性 > 个人偏好；不写 YAGNI 抽象。
- 测试：新功能/修 bug 先写测试（TDD：RED→GREEN→REFACTOR）；关键路径覆盖 ≥80%；测行为不测实现；不为绿色删测试。
- Git：语义化提交 \`type(scope): subject\`；提交小而聚焦；不 \`--force\` 共享分支、不 \`--no-verify\`（除非用户明确要求）。
- 委派：广域搜索/探索用只读子代理（Explore/Plan），改代码用 general-purpose；子代理 prompt 必须自包含；产出要亲自核对。
- 上下文预算：不要一次性启用所有 MCP/连接器；每项目启用 <10 个，活动工具 <80；简单任务用 lite 模型、复杂推理用 reasoning。
- 可用研发技能（已装用户级，共 9 个研发流程技能 + efw 统一入口）：\`efw\`（自动路由） / \`efw-tdd-workflow\` / \`efw-plan-feature\` / \`efw-code-review\` / \`efw-build-fix\` / \`efw-refactor-clean\` / \`efw-security-review\` / \`efw-verify\` / \`efw-checkpoint\` / \`efw-learn\`。
- **Skill 触发纪律（核心诉求）**：收到研发类需求时，**先**对照 9 个 efw-* 的 description（或说「用 efw」由统一入口自动路由）判断是否匹配，**主动加载并遵守**——不要求用户喊"用 efw-xxx"。常见映射：规划/方案→efw-plan-feature，TDD/先写测试→efw-tdd-workflow，审查/PR→efw-code-review，构建报错→efw-build-fix，重构/死代码→efw-refactor-clean，安全/漏洞→efw-security-review，收尾验证→efw-verify，存快照→efw-checkpoint，提炼沉淀→efw-learn。请求模糊时**主动问一句**而不是乱猜。
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
  done('~/.workbuddy/MEMORY.md 已写入/刷新 EFW 研发准则');
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
    done(`~/.workbuddy/mcp.json <- ${name}`);
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
    done(`~/.workbuddy/agents/${f}（参考素材）`);
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
    done(`~/.workbuddy/skills/${name}（用户覆盖/新增）`);
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
    done(`~/.workbuddy/agents/${f}（用户）`);
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
    done(`~/.workbuddy/mcp.json <- ${name}（用户）`);
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
  done(`~/.workbuddy/MEMORY.md 已写入用户准则块（${files.length} 个）`);
}

async function main() {
  console.log('EFW 一键安装器');
  console.log(`EFW_ROOT = ${EFW_ROOT}`);
  console.log(`TARGET   = ${WB}`);
  await ensureDir(WB);
  await installSkills();        // 底座技能（先）
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
