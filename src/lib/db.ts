import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let ensured = false;

function getTursoConfig() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("缺少环境变量 TURSO_DATABASE_URL");
  }
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const isFileDb = url.startsWith("file:");
  if (!isFileDb && !authToken) {
    throw new Error("远程 Turso 库需要 TURSO_AUTH_TOKEN");
  }
  return { url, authToken: isFileDb ? undefined : authToken };
}

export function getClient(): Client {
  if (!client) {
    const { url, authToken } = getTursoConfig();
    client = createClient({ url, authToken });
  }
  return client;
}

/** @deprecated 使用 getClient()；保留别名减少迁移噪声 */
export function getDb(): Client {
  return getClient();
}

export async function ensureDb(): Promise<Client> {
  if (!ensured) {
    await getClient().execute("SELECT 1");
    ensured = true;
  }
  return getClient();
}

/** @deprecated 使用 ensureDb() */
export async function initDb(): Promise<Client> {
  return ensureDb();
}
