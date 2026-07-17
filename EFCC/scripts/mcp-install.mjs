#!/usr/bin/env node
// EFCC mcp-install.mjs —— 一行命令安装单个 MCP 模板到 Claude/Codex 配置
// 用法：
//   node scripts/mcp-install.mjs list                        # 列出所有模板
//   node scripts/mcp-install.mjs install github              # 安装 github（无密钥）
//   node scripts/mcp-install.mjs install supabase --key xxx  # 安装 supabase，自动替换密钥
//   node scripts/mcp-install.mjs install filesystem --args "C:/project" # 按目录授权
//
// 安全原则：
//   · 带密钥模板不会把真实值写进仓库，只写进 ~/.claude.json / ~/.codex/config.toml
//   · 默认跳过含占位符模板，必须显式传 --key 才替换

import { promises as fs, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HOME = os.homedir();
const EFCC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES_DIR = path.join(EFCC, 'mcp-templates');
const INDEX = path.join(TEMPLATES_DIR, 'index.json');
const CLAUDE_MCP = path.join(HOME, '.claude.json');
const CODEX_MCP = path.join(HOME, '.codex', 'config.toml');

const args = process.argv.slice(2);
const cmd = args[0];
const templateId = args[1];
const keyArgIdx = args.findIndex((a) => a === '--key');
const keyValue = keyArgIdx >= 0 ? args[keyArgIdx + 1] : undefined;
const argsArgIdx = args.findIndex((a) => a === '--args');
const argsValue = argsArgIdx >= 0 ? args[argsArgIdx + 1] : undefined;

function markTemplate(template, key) {
  // 简单替换所有 YOUR_*_HERE / <...> / 以 "$" 开头的占位
  let t = JSON.stringify(template, null, 2);
  if (key) t = t.replace(/YOUR_[A-Z_]+/g, key).replace(/"<[A-Z_]+>"/g, `"${key}"`);
  return JSON.parse(t);
}

function loadTemplate(id) {
  const idx = JSON.parse(readFileSync(INDEX, 'utf8')).templates;
  const meta = idx.find((t) => t.id === id);
  if (!meta) return null;
  const file = path.join(TEMPLATES_DIR, `${id}.json`);
  const config = JSON.parse(readFileSync(file, 'utf8'));
  return { meta, config };
}

async function list() {
  const idx = JSON.parse(await fs.readFile(INDEX, 'utf8'));
  console.log('EFCC MCP 模板库:');
  for (const t of idx.templates) {
    const safe = t.needs_api_key ? '🔐 需密钥' : '🔓 无密钥';
    const platforms = t.platforms.join('/');
    console.log(`  · ${t.id.padEnd(15)} ${t.name.padEnd(14)} ${safe} [${platforms}] ${t.note}`);
  }
  console.log('\n安装示例:');
  console.log('  node scripts/mcp-install.mjs install filesystem --args "C:/project"');
  console.log('  node scripts/mcp-install.mjs install supabase --key sb-xxx');
}

async function installClaude(config) {
  let cur = { mcpServers: {} };
  if (existsSync(CLAUDE_MCP)) {
    try { cur = JSON.parse(await fs.readFile(CLAUDE_MCP, 'utf8')); } catch { /* ignore */ }
  }
  if (!cur.mcpServers) cur.mcpServers = {};
  for (const [name, srv] of Object.entries(config.mcpServers || {})) {
    if (cur.mcpServers[name]) { console.log(`  → Claude ~/.claude.json 已含 ${name}，跳过`); continue; }
    cur.mcpServers[name] = srv;
    console.log(`  ✓ Claude  ~/.claude.json <- ${name}`);
  }
  await fs.writeFile(CLAUDE_MCP, JSON.stringify(cur, null, 2) + '\n', 'utf8');
}

function tomlValue(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(tomlValue).join(', ')}]`;
  return String(v);
}

async function installCodex(config) {
  let toml = '';
  if (existsSync(CODEX_MCP)) toml = await fs.readFile(CODEX_MCP, 'utf8');
  for (const [name, srv] of Object.entries(config.mcpServers || {})) {
    if (toml.includes(`[mcp_servers.${name}]`)) { console.log(`  → Codex config.toml 已含 ${name}，跳过`); continue; }
    let block = `\n[mcp_servers.${name}]\n`;
    for (const [k, v] of Object.entries(srv)) {
      if (k === 'env') {
        block += `[mcp_servers.${name}.env]\n`;
        for (const [ek, ev] of Object.entries(v)) block += `${ek} = ${tomlValue(ev)}\n`;
      } else {
        block += `${k} = ${tomlValue(v)}\n`;
      }
    }
    toml += block;
    console.log(`  ✓ Codex   [mcp_servers.${name}]`);
  }
  await fs.mkdir(path.dirname(CODEX_MCP), { recursive: true });
  await fs.writeFile(CODEX_MCP, toml, 'utf8');
}

async function install() {
  if (!templateId) { console.error('用法: node scripts/mcp-install.mjs install <template-id> [--key ...] [--args ...]'); process.exit(2); }
  const tpl = loadTemplate(templateId);
  if (!tpl) { console.error(`未知模板: ${templateId}`); process.exit(2); }
  const { meta, config } = tpl;

  console.log(`安装 MCP: ${meta.name}`);
  if (meta.needs_api_key && !keyValue) {
    console.error(`❌ ${meta.name} 需要 API key。请传 --key <your-key>`);
    console.error(`   ${meta.note}`);
    process.exit(2);
  }

  let finalConfig = config;
  if (keyValue) finalConfig = markTemplate(config, keyValue);
  if (argsValue && finalConfig.mcpServers) {
    // 简单把 --args 填进第一个服务器的 args（若模板预留 PATH 占位）
    const first = Object.keys(finalConfig.mcpServers)[0];
    if (first) finalConfig.mcpServers[first].args = [argsValue];
  }

  await installClaude(finalConfig);
  await installCodex(finalConfig);
  console.log('完成。请在 Claude/Codex 面板信任/启用该 MCP。');
}

if (cmd === 'list' || !cmd) await list();
else if (cmd === 'install') await install();
else { console.error('未知命令。用法: node scripts/mcp-install.mjs list | install <id>'); process.exit(2); }
