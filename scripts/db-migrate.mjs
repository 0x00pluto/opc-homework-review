#!/usr/bin/env node
import { runPendingMigrations } from "./lib/migrate-runner.mjs";

const dryRun = process.argv.includes("--dry-run");

console.log(
  dryRun
    ? "dry-run：仅列出将应用的 migration\n"
    : "正在应用待执行 migration…\n",
);

const result = await runPendingMigrations({ dryRun });

if (result.applied.length === 0) {
  console.log("\n无待应用 migration。");
} else {
  console.log(`\n完成：本次 ${dryRun ? "将应用" : "已应用"} ${result.applied.length} 条。`);
}
