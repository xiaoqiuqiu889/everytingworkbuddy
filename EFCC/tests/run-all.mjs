#!/usr/bin/env node
// EFCC tests/run-all.mjs —— 跑全测试套件
// 用法：node tests/run-all.mjs
// 退出码 0 = 全绿，1 = 有失败。
// 设计原则：每个测试一个 .test.mjs 文件，export 一个 async function() {pass/fail/throw} 的 runner。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EFCC = path.resolve(__dirname, '..');

const tests = [];
async function discover() {
  const files = (await fs.readdir(__dirname)).filter((f) => f.endsWith('.test.mjs'));
  for (const f of files) tests.push({ name: f.replace('.test.mjs', ''), path: path.join(__dirname, f) });
}

let pass = 0, fail = 0, err = 0;
const failures = [];

async function run() {
  await discover();
  console.log(`EFCC 测试套件 —— 共 ${tests.length} 个测试文件\n`);
  for (const t of tests) {
    const mod = await import(pathToFileURL(t.path).href);
    const start = Date.now();
    try {
      await mod.default();
      pass++;
      console.log(`  ✓ ${t.name} (${Date.now() - start}ms)`);
    } catch (e) {
      fail++;
      failures.push({ name: t.name, err: e });
      console.log(`  ✗ ${t.name} — ${e.message || e}`);
    }
  }
  console.log(`\nRESULT: ${pass} pass / ${fail} fail`);
  if (failures.length) {
    console.log('\n失败详情:');
    for (const f of failures) console.log(`  · ${f.name}: ${f.err.stack || f.err.message || f.err}`);
  }
  process.exit(fail > 0 ? 1 : 0);
}

run();
