# AI 作业智能评审与反馈系统（OPC 评审系统）

面向「一人公司超级个体训练营」的作业提交、AI 智能评审与教务管理 Web 应用。学员提交作业后由后台 Agent 处理并生成反馈，讲师可在后台审核、发布与管理教务数据。

团队 Cursor 命令见 `.cursor/commands/team/`（如 `/team:front-enginer`）；母版维护于 Obsidian Vibecoding 团队成员目录。

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 16（App Router）、React 19 |
| 语言 | TypeScript（strict） |
| 样式 | Tailwind CSS 4、`clsx` + `tailwind-merge` |
| 数据库 | Turso（libSQL，`@libsql/client`） |
| 附件存储 | Vercel Blob（`@vercel/blob`） |
| 图表 | Recharts |
| 图标 | lucide-react |
| 包管理 | pnpm |

## 目录结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局，挂载 AuthProvider
│   ├── login/                  # 登录入口
│   ├── (app)/                  # 需登录的业务路由组
│   └── api/                    # Route Handlers（均 runtime = "nodejs"）
│       └── cron/process-homework/  # Vercel Cron 兜底处理 WAITING_REVIEW
├── components/
├── context/AuthContext.tsx
├── lib/
│   ├── db.ts                   # Turso 客户端单例、ensureDb()
│   ├── db-query.ts             # dbAll / dbOne / dbRun 异步查询
│   ├── api-handlers.ts         # API 业务逻辑
│   ├── agents.ts               # AI Agent 作业处理（Mock）
│   ├── agent-queue.ts          # 提交触发与 Cron 批量 dequeue
│   └── uploads.ts              # Vercel Blob 上传
├── types.ts
└── instrumentation.ts          # 启动时 ensureDb()
db/migrations/                  # DDL 单一事实源（Turso，见 docs/db-migrations.md）
supabase/migrations/            # 迁 Supabase 后使用（Postgres）
demo/                           # 历史原型，不参与构建
```

## 角色与路由

- **学员（student）**：登录后可访问 `/`（StudentDashboard）、`/growth`（成长轨迹）；`/homeworks` 及讲师专属路径（含 `/workload`）会被 AppShell 重定向。
- **讲师（instructor）**：可访问全部 `(app)` 路由，带 InstructorSidebar 布局。
- **认证**：前端 `AuthContext` + `localStorage`（`opc_role` / `opc_uid`）；学员登录走 `POST /api/students/login`，讲师为演示模式直接前端写入。

## 核心业务流

```
学员提交作业 → opc_homework_records（WAITING_REVIEW）
      ↓
waitUntil 立即触发 + Vercel Cron 每分钟兜底（agent-queue.ts）
      ↓
PROCESSING → 生成 opc_ai_feedbacks → PENDING_AUDIT
      ↓
讲师审核发布 → COMPLETED（或学员修改 → MODIFIED → 可 retrigger）
```

**作业状态枚举**（`types.ts`）：`WAITING_REVIEW` | `PROCESSING` | `PENDING_AUDIT` | `COMPLETED` | `MODIFIED`

**AI Agent**：当前为 **Mock 实现**（`agents.ts` 内 `setTimeout` + 固定反馈文案），后续可接入 Gemini（`GEMINI_API_KEY`）。

## API 约定

- 所有 Route Handler **必须**声明 `export const runtime = "nodejs"`。
- 业务逻辑集中在 `src/lib/api-handlers.ts`；route 内先 `await ensureDb()` 再调用 handler。
- 错误返回 `{ error: string }` + 合适 status。

| 路径前缀 | 用途 |
|----------|------|
| `/api/homeworks` | 作业 CRUD、发布 / 重触发 |
| `/api/cron/process-homework` | Cron 鉴权后批量处理 WAITING_REVIEW |
| `/api/uploads` | Blob 上传；`/api/uploads/[filename]` 代理下载 |
| 其余 | 学员、班级、题目、知识库、Agent 状态等（见原表） |

## 数据库（Turso）

- **Migration 单一事实源**：[`db/migrations/`](db/migrations/)，流程见 [`docs/db-migrations.md`](docs/db-migrations.md)（对齐团队 Supabase 迁移最佳实践，当前用 Turso 执行）。
- **常用命令**：

```bash
pnpm db:migration:new -- <name>   # 新建迁移文件（UTC 时间戳）
pnpm db:migration:list            # 本地文件 vs 已应用版本
pnpm db:migrate                   # 应用到当前 TURSO_DATABASE_URL
pnpm db:seed                    # 开发种子（db/seed/dev.sql，幂等）
```

- `pnpm dev` 前会通过 `predev` 自动执行 `db:migrate`（仅应用未执行的文件）。
- **本地开发**（`.env.local`）：`TURSO_DATABASE_URL=file:./db_data/opc_homework.db`（无需 Token）。
- **生产 / Vercel**：部署前对目标库执行 `pnpm db:migrate`；应用运行时**不会**自动建表。
- 迁 **Supabase** 后：DDL 改到 `supabase/migrations/`，用 Supabase CLI `db push`，勿改写已发布的 Turso 历史文件。
- 查询通过 `db-query.ts`；**禁止**在 Client Component 中访问数据库。

## Vercel 部署检查清单

1. 安装依赖（见下方命令）并关联 Turso / Blob 集成。
2. 环境变量：`TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`BLOB_READ_WRITE_TOKEN`、`CRON_SECRET`。
3. 对远程库执行 `pnpm db:migrate`。
4. Deploy 后验证：学员登录 → 提交作业 → 状态变为 `PENDING_AUDIT`（即时或 1 分钟内 Cron）。

`vercel.json` 已配置 Cron：`/api/cron/process-homework`（每分钟）。

## 开发命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

**依赖变更后请在本机执行：**

```bash
pnpm add @libsql/client @vercel/blob @vercel/functions
pnpm remove better-sqlite3 @types/better-sqlite3
pnpm install
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

| 变量 | 说明 |
|------|------|
| `GEMINI_API_KEY` | Gemini API（Mock 可不填） |
| `TURSO_DATABASE_URL` | Turso 或 `file:./db_data/...` |
| `TURSO_AUTH_TOKEN` | 远程 Turso 必填 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `CRON_SECRET` | Cron 路由 Bearer 鉴权 |

## 编码规范

- 路径别名 `@/*` → `src/*`。
- 页面路由保持精简，复杂 UI 放 `components/pages/`。
- 新增共享类型写入 `src/types.ts`。
- Client Component 通过 API 取数，不直接引 db。
- UI 文案与注释使用中文；变量 / 函数名使用英文。
- `demo/` 不参与主应用构建。

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 16

This is NOT the Next.js you know — APIs, conventions, and file structure may differ from your training data. **改代码前**阅读 `node_modules/next/dist/docs/` 中相关指南，留意弃用说明。
<!-- END:nextjs-agent-rules -->
