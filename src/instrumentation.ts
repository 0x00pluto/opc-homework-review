export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (globalThis.__opcAgentStarted) return;

  try {
    const { initDb } = await import("@/lib/db");
    const { startPollingAgents } = await import("@/lib/agents");
    initDb();
    globalThis.__opcAgentStarted = true;
    await startPollingAgents();
  } catch (err) {
    console.error(
      "\n[OPC] SQLite 原生模块未就绪，API 与 Agent 暂不可用。\n" +
        "请在项目根目录执行：\n" +
        "  pnpm approve-builds better-sqlite3   # 若 pnpm 提示需批准构建脚本\n" +
        "  pnpm rebuild better-sqlite3\n" +
        "然后重新 pnpm dev\n",
      err,
    );
  }
}
