# AI 作业智能评审与反馈系统（OPC 评审系统）

面向「一人公司超级个体训练营」的作业提交、AI 智能评审与教务管理 Web 应用。学员提交作业后由后台 Agent 轮询处理并生成反馈，讲师可在后台审核、发布与管理教务数据。

团队 Cursor 命令见 `.cursor/commands/team/`（如 `/team:front-enginer`）；母版维护于 Obsidian Vibecoding 团队成员目录。

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 16（App Router）、React 19 |
| 语言 | TypeScript（strict） |
| 样式 | Tailwind CSS 4、`clsx` + `tailwind-merge` |
| 数据库 | SQLite（`better-sqlite3`，本地文件） |
| 图表 | Recharts |
| 图标 | lucide-react |
| 包管理 | pnpm |

## 目录结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局，挂载 AuthProvider
│   ├── login/page.tsx          # 登录入口（选择学员 / 讲师）
│   ├── login/student/page.tsx  # 学员登录
│   ├── login/instructor/page.tsx # 讲师登录
│   ├── (app)/                  # 需登录的业务路由组
│   │   ├── layout.tsx          # AppShell：角色路由守卫
│   │   ├── page.tsx            # 首页（学员→StudentDashboard，讲师→Dashboard）
│   │   ├── homeworks/          # 作业大厅 & 详情
│   │   ├── assignments/        # 作业库（题目）管理
│   │   ├── kb/                 # 知识库管理
│   │   ├── cohorts/            # 班级管理
│   │   ├── students-mgmt/      # 学员管理
│   │   ├── crm/                # 学员画像及学习进展
│   │   ├── growth/             # 学员成长轨迹（历史/趋势/雷达）
│   │   └── workload/           # 讲师工作量统计
│   └── api/                    # Route Handlers（均 runtime = "nodejs"）
├── components/
│   ├── AppShell.tsx            # 认证守卫 + 讲师侧栏布局
│   ├── Layout.tsx              # InstructorSidebar、Layout 壳
│   ├── HomePage.tsx            # 按角色分发首页
│   └── pages/                  # 各页面业务组件（Client Component）
├── context/AuthContext.tsx     # 角色与 userId（localStorage 持久化）
├── lib/
│   ├── db.ts                   # SQLite 初始化、表结构、getDb()
│   ├── api-handlers.ts         # API 业务逻辑（供 route.ts 调用）
│   ├── agents.ts               # AI Agent 轮询与作业处理
│   └── utils.ts                # cn() 等工具
├── types.ts                    # 共享类型定义
└── instrumentation.ts          # 启动时 initDb + startPollingAgents
db_data/opc_homework.db         # 默认 SQLite 文件（gitignore）
demo/                           # 原 AI Studio 原型，不参与构建（tsconfig exclude）
```

## 角色与路由

- **学员（student）**：登录后可访问 `/`（StudentDashboard）、`/growth`（成长轨迹）；`/homeworks` 及讲师专属路径（含 `/workload`）会被 AppShell 重定向。
- **讲师（instructor）**：可访问全部 `(app)` 路由，带 InstructorSidebar 布局。
- **认证**：前端 `AuthContext` + `localStorage`（`opc_role` / `opc_uid`）；学员登录走 `POST /api/students/login`，讲师为演示模式直接前端写入。

讲师侧栏路径见 `src/components/Layout.tsx` 中 `navGroups`。

## 核心业务流

```
学员提交作业 → opc_homework_records（WAITING_REVIEW）
      ↓
Agent 轮询（agents.ts，3s 间隔，最多 5 并发）
      ↓
PROCESSING → 生成 opc_ai_feedbacks → PENDING_AUDIT
      ↓
讲师审核发布 → COMPLETED（或学员修改 → MODIFIED → 可 retrigger）
```

**作业状态枚举**（`types.ts`）：`WAITING_REVIEW` | `PROCESSING` | `PENDING_AUDIT` | `COMPLETED` | `MODIFIED`

**AI Agent**：当前为 **Mock 实现**（`agents.ts` 内 `setTimeout` + 固定反馈文案），已预留 OPC 手册与任务说明常量，后续可接入 Gemini（`.env.example` 中的 `GEMINI_API_KEY`）。Agent 在 `instrumentation.ts` 与 `getDb()` 首次调用时启动轮询。

## API 约定

- 所有 Route Handler 位于 `src/app/api/**/route.ts`，**必须**声明 `export const runtime = "nodejs"`（SQLite 原生模块依赖 Node 运行时）。
- 业务逻辑集中在 `src/lib/api-handlers.ts`，route 文件只做 HTTP 适配（解析 body / params → 调用 handler → 返回 JSON）。
- 新增 API 时遵循现有命名：`GET` 列表、`POST` 创建、`PATCH`/`PUT` 更新、`DELETE` 删除；错误返回 `{ error: string }` + 合适 status。

| 路径前缀 | 用途 |
|----------|------|
| `/api/homeworks` | 作业 CRUD、按学员查询、发布 / 重触发；POST 支持 `attachments`、截止校验与 `is_late`；`publish`/`retrigger` 支持 body `{ instructor_id }` 写入审核事件 |
| `/api/students/[student_id]/growth` | `GET` 学员成长轨迹（历史、得分趋势、能力雷达、自动建议） |
| `/api/instructors/[instructor_id]/workload` | `GET` 讲师本周工作量（审核数、平均时长、打回率） |
| `/api/homeworks/[id]/feedback` | `PATCH` 保存讲师人工批注（`instructor_notes`） |
| `/api/assignments` | 作业库（题目）列表与创建；含 `deadline_at`（默认当天 20:00）、`allow_late_submit` |
| `/api/assignments/[id]` | `PATCH` 更新题目、`DELETE` 删除（有提交记录时拒绝） |
| `/api/uploads` | `POST` multipart 上传作业附件（PDF/Word/Excel/图片，最大 10MB） |
| `/api/uploads/[filename]` | `GET` 下载附件 |
| `/api/students` | 学员 CRUD、登录、排名 |
| `/api/cohorts` | 班级 CRUD |
| `/api/knowledge-base` | 知识库 |
| `/api/agents/status` | Agent 运行状态与日志 |

## 数据库

- 默认路径：`db_data/opc_homework.db`，可通过环境变量 `DATABASE_PATH` 覆盖。
- 表前缀 `opc_`（业务表）与 `sys_`（系统日志）；schema 在 `initDb()` 中自动创建，含增量 `ALTER TABLE` 兼容。
- 统计相关：`opc_ai_feedbacks.overall_score` / `dimension_scores`；`opc_homework_records.pending_audit_at` / `published_at` / `reviewed_by`；`opc_review_events`（讲师 publish/retrigger 埋点）。
- **禁止**在 Client Component 中直接访问 `getDb()`；仅 Server Route / `lib/` 服务端模块可用。
- `next.config.ts` 已配置 `serverExternalPackages: ["better-sqlite3"]`。

首次运行若 SQLite 原生模块未编译，`instrumentation.ts` 会打印 rebuild 指引：

```bash
pnpm approve-builds better-sqlite3   # 若 pnpm 提示需批准构建脚本
pnpm rebuild better-sqlite3
```

## 开发命令

```bash
pnpm dev      # 开发服务器 http://localhost:3000
pnpm build    # 生产构建
pnpm start    # 生产启动
pnpm lint     # ESLint
```

依赖安装与包变更由开发者本地手动执行（Agent 不要自动跑 `pnpm install` / `pnpm add`）。

## 环境变量

复制 `.env.example` 为 `.env.local`：

| 变量 | 说明 |
|------|------|
| `GEMINI_API_KEY` | Gemini API（当前 Mock 可不填） |
| `DATABASE_PATH` | SQLite 路径，默认 `./db_data/opc_homework.db` |

## 编码规范

- 路径别名 `@/*` → `src/*`。
- 页面路由文件（`app/**/page.tsx`）保持精简，复杂 UI 放到 `components/pages/`。
- 新增共享类型写入 `src/types.ts`。
- Client Component 文件顶部加 `"use client"`；需要服务端数据的页面优先通过 API fetch，不在客户端引 db。
- UI 文案与注释使用中文；变量 / 函数名使用英文。
- 样式用 Tailwind utility class；合并类名用 `cn()` from `@/lib/utils`。
- 遵循 KISS：复用 `api-handlers.ts` 与现有组件模式，避免过度抽象。
- `demo/` 为历史原型，修改主应用时不要依赖或同步该目录。

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 16

This is NOT the Next.js you know — APIs, conventions, and file structure may differ from your training data. **改代码前**阅读 `node_modules/next/dist/docs/` 中相关指南，留意弃用说明。
<!-- END:nextjs-agent-rules -->
