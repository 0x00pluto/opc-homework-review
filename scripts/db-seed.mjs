#!/usr/bin/env node
/**
 * 应用 db/seed/*.sql 种子数据（与 migration 分离，仅开发/演示）
 * 用法: pnpm db:seed [-- --env=dev] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./lib/load-env.mjs";
import {
  getTursoClientFromEnv,
  splitSqlStatements,
} from "./lib/migrate-runner.mjs";

const seedDir = path.join(repoRoot, "db", "seed");

function parseArgs(argv) {
  let env = "dev";
  let dryRun = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--env=")) env = arg.slice("--env=".length);
  }
  return { env, dryRun };
}

async function ensureMigrationsApplied(client) {
  const result = await client.execute(
    "SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='sys_schema_migrations'",
  );
  const hasTable = Number(result.rows[0]?.c ?? 0) > 0;
  if (!hasTable) {
    throw new Error("请先执行 pnpm db:migrate，再运行 db:seed");
  }
  const applied = await client.execute(
    "SELECT COUNT(*) as c FROM sys_schema_migrations",
  );
  if (Number(applied.rows[0]?.c ?? 0) === 0) {
    throw new Error("尚无已应用 migration，请先执行 pnpm db:migrate");
  }
}

function resolveSeedFiles(env) {
  if (!fs.existsSync(seedDir)) {
    throw new Error(`种子目录不存在: db/seed/`);
  }
  const envFile = path.join(seedDir, `${env}.sql`);
  if (!fs.existsSync(envFile)) {
    throw new Error(`未找到种子文件: db/seed/${env}.sql`);
  }
  return [envFile];
}

async function runSeedFile(client, filePath, dryRun) {
  const rel = path.relative(repoRoot, filePath);
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = splitSqlStatements(sql);

  if (dryRun) {
    console.log(`[dry-run] ${rel}（${statements.length} 条语句）`);
    return statements.length;
  }

  for (const statement of statements) {
    await client.execute(statement);
  }
  console.log(`已写入: ${rel}（${statements.length} 条语句）`);
  return statements.length;
}

const { env, dryRun } = parseArgs(process.argv.slice(2));

if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DB_SEED) {
  console.error(
    "拒绝在 NODE_ENV=production 下执行 seed。若确需执行请设置 ALLOW_DB_SEED=1",
  );
  process.exit(1);
}

console.log(
  dryRun
    ? `dry-run：种子环境「${env}」\n`
    : `正在写入种子数据（env=${env}）…\n`,
);

const client = getTursoClientFromEnv();
await ensureMigrationsApplied(client);

const files = resolveSeedFiles(env);
let total = 0;
for (const file of files) {
  total += await runSeedFile(client, file, dryRun);
}

console.log(
  dryRun
    ? `\n将执行 ${total} 条语句。`
    : `\n完成。学员示例: stu_001 / 123456（见 README）`,
);
