export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { ensureDb } = await import("@/lib/db");
    await ensureDb();
  } catch (err) {
    console.error(
      "\n[OPC] Turso 数据库未就绪，API 暂不可用。\n" +
        "请配置 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN（本地可用 file:./db_data/opc_homework.db）。\n" +
        "然后执行：pnpm db:migrate\n",
      err,
    );
  }
}
