import type { Client, InValue, Row } from "@libsql/client";
import { getClient } from "./db";

function rowToObject<T extends Record<string, unknown>>(
  row: Row,
  columns: string[],
): T {
  const obj: Record<string, unknown> = {};
  for (const col of columns) {
    obj[col] = row[col as keyof Row];
  }
  return obj as T;
}

async function execute(sql: string, args: InValue[] = []) {
  const client = getClient();
  return client.execute({ sql, args });
}

export async function dbAll<T extends Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  const result = await execute(sql, args);
  return result.rows.map((row) => rowToObject<T>(row, result.columns));
}

export async function dbOne<T extends Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T | undefined> {
  const rows = await dbAll<T>(sql, args);
  return rows[0];
}

export async function dbRun(sql: string, args: InValue[] = []): Promise<void> {
  await execute(sql, args);
}

export async function dbLastInsertId(): Promise<number> {
  const row = await dbOne<{ id: number | bigint }>(
    "SELECT last_insert_rowid() as id",
  );
  const id = row?.id ?? 0;
  return typeof id === "bigint" ? Number(id) : id;
}

export function isUniqueConstraintError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  return /UNIQUE|PRIMARY KEY|constraint failed/i.test(message);
}

export function isPrimaryKeyConstraintError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  return /PRIMARY KEY|UNIQUE constraint failed.*student_id/i.test(message);
}

export type { Client };
