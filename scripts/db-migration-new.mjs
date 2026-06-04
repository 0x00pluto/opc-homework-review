#!/usr/bin/env node
/**
 * 在 db/migrations/ 下创建空迁移文件（UTC 时间戳前缀）。
 * 用法: pnpm db:migration:new -- add_invoice_table
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./lib/load-env.mjs";
import { migrationsDir } from "./lib/migrate-runner.mjs";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function utcMigrationStamp() {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}` +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds())
  );
}

function sanitizeMigrationName(raw) {
  return raw
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function usage() {
  console.error("用法: pnpm db:migration:new -- <migration_name>");
  console.error("示例: pnpm db:migration:new -- add_user_prefs");
}

const rawName = process.argv.slice(2).join("_").trim();
if (!rawName) {
  usage();
  process.exit(1);
}

const safeName = sanitizeMigrationName(rawName);
if (!safeName) {
  console.error("错误: 迁移名称清洗后为空。");
  process.exit(1);
}

const stamp = utcMigrationStamp();
const fileName = `${stamp}_${safeName}.sql`;
const filePath = path.join(migrationsDir, fileName);

if (fs.existsSync(filePath)) {
  console.error(`错误: 文件已存在: ${path.relative(repoRoot, filePath)}`);
  process.exit(1);
}

fs.mkdirSync(migrationsDir, { recursive: true });
const body = `-- ${safeName}\n\n`;
fs.writeFileSync(filePath, body, "utf8");
console.log(`已创建: ${path.relative(repoRoot, filePath)}`);
