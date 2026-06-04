#!/usr/bin/env node
import { getMigrationStatus } from "./lib/migrate-runner.mjs";

const { rows } = await getMigrationStatus();

console.log("迁移对齐（db/migrations/ → 当前 TURSO_DATABASE_URL）\n");
console.log("  Local file     | Applied");
console.log("-----------------|--------");

for (const row of rows) {
  const local = row.file.padEnd(16);
  const status = row.applied ? "yes" : "";
  console.log(`  ${local} | ${status}`);
}

const pending = rows.filter((r) => !r.applied);
if (pending.length) {
  console.log(`\n待应用 ${pending.length} 条 → 执行: pnpm db:migrate`);
} else {
  console.log("\n已全部应用。");
}
