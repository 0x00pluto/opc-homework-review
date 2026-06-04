import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { loadEnvFiles, repoRoot } from "./load-env.mjs";

export const migrationsDir = path.join(repoRoot, "db", "migrations");

const MIGRATIONS_TABLE = "sys_schema_migrations";

export function getTursoClientFromEnv() {
  loadEnvFiles();
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("缺少 TURSO_DATABASE_URL（请在 .env.local 配置）");
  }
  const isFileDb = url.startsWith("file:");
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!isFileDb && !authToken) {
    throw new Error("远程 Turso 需要 TURSO_AUTH_TOKEN");
  }
  if (isFileDb) {
    const raw = url.replace(/^file:/, "");
    const abs = path.isAbsolute(raw) ? raw : path.join(repoRoot, raw);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    return createClient({ url: `file:${abs}` });
  }
  return createClient({ url, authToken });
}

/** 将 migration 文件拆为可执行语句（忽略纯注释行） */
export function splitSqlStatements(sql) {
  const withoutBlockComments = sql.replace(/\/\*[\s\S]*?\*\//g, "");
  const chunks = withoutBlockComments.split(";");
  const statements = [];
  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"));
    const statement = lines.join("\n").trim();
    if (statement.length > 0) statements.push(statement);
  }
  return statements;
}

export function listMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function parseMigrationFileName(fileName) {
  const match = /^(\d{14})_(.+)\.sql$/.exec(fileName);
  if (!match) {
    throw new Error(
      `迁移文件名不符合规范 <YYYYMMDDHHmmss>_<name>.sql: ${fileName}`,
    );
  }
  return { version: match[1], name: match[2] };
}

async function ensureMigrationsTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      version TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedVersions(client) {
  await ensureMigrationsTable(client);
  const result = await client.execute(
    `SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version`,
  );
  return new Set(result.rows.map((row) => String(row.version)));
}

export async function getMigrationStatus() {
  const client = getTursoClientFromEnv();
  const files = listMigrationFiles();
  const applied = await getAppliedVersions(client);
  const rows = files.map((file) => {
    const { version, name } = parseMigrationFileName(file);
    return {
      file,
      version,
      name,
      applied: applied.has(version),
    };
  });
  return { rows, appliedCount: [...applied].length };
}

/**
 * 应用尚未执行的 migration（按文件名时间戳顺序，每条 migration 一个 batch）
 * @param {{ dryRun?: boolean }} opts
 */
export async function runPendingMigrations(opts = {}) {
  const { dryRun = false } = opts;
  const client = getTursoClientFromEnv();
  const files = listMigrationFiles();
  const applied = await getAppliedVersions(client);
  const pending = files.filter((f) => {
    const { version } = parseMigrationFileName(f);
    return !applied.has(version);
  });

  if (pending.length === 0) {
    return { applied: [], skipped: files.length };
  }

  const appliedNow = [];

  for (const file of pending) {
    const { version, name } = parseMigrationFileName(file);
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    const statements = splitSqlStatements(sql);

    if (dryRun) {
      console.log(`[dry-run] 将应用: ${file}（${statements.length} 条语句）`);
      appliedNow.push(file);
      continue;
    }

    const batch = [
      ...statements.map((statement) => ({ sql: statement })),
      {
        sql: `INSERT INTO ${MIGRATIONS_TABLE} (version, name) VALUES (?, ?)`,
        args: [version, name],
      },
    ];

    try {
      await client.batch(batch, "write");
      appliedNow.push(file);
      console.log(`已应用: ${file}`);
    } catch (err) {
      throw new Error(`迁移失败 ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return { applied: appliedNow, skipped: files.length - pending.length };
}
