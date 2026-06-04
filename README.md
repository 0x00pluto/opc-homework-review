# AI Homework Review

面向训练营场景的 **AI 作业智能评审与反馈** Web 应用：学员提交作业 → 后台 Agent 自动评审 → 讲师审核发布 → 学员查看反馈与成长数据。

## 功能

- **学员端**：提交作业（文本 / 附件）、查看 AI 与讲师反馈、成长轨迹与排名
- **讲师端**：作业大厅、AI 反馈审核与发布、作业库 / 班级 / 学员 / 知识库管理、工作量统计
- **AI Agent**：提交后即时处理 + Cron 兜底（当前为 Mock，可接入 Gemini）

## 技术栈

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Turso（libSQL）· Vercel Blob

## 快速开始

```bash
pnpm install
pnpm add @libsql/client @vercel/blob @vercel/functions
pnpm remove better-sqlite3 @types/better-sqlite3
cp .env.example .env.local
pnpm dev
```

本地开发可在 `.env.local` 使用嵌入式数据库（无需 Turso Token）：

```bash
TURSO_DATABASE_URL=file:./db_data/opc_homework.db
pnpm db:migrate    # 首次或拉代码后应用 db/migrations/
pnpm db:seed       # 可选：写入演示班级与学员 stu_001
pnpm dev           # predev 也会自动 migrate
```

数据库结构以 **`db/migrations/`** 为准（详见 [`docs/db-migrations.md`](docs/db-migrations.md)）。

浏览器打开 [http://localhost:3000](http://localhost:3000)，在登录页选择学员或讲师入口。

## 测试账号

> 执行 `pnpm db:seed` 可预置演示班级与学员；否则需由讲师端录入。

| 角色 | 登录地址 | 账号 | 密码 | 说明 |
|------|----------|------|------|------|
| 讲师 | `/login/instructor` | 任意工号，如 `teach_001` | 无 | 演示模式，仅校验非空 |
| 学员 | `/login/student` | 讲师在「学员管理」中创建的学号，如 `stu_001` | 默认 `123456` | 新建学员未填密码时即为该默认值 |

**建议体验流程**

1. 讲师登录 `teach_001` → **学员管理** 录入 `stu_001` / 测试学员 / 任意班级
2. 学员登录 `stu_001` / `123456` → 提交作业
3. 约数秒后 Agent 生成 AI 反馈（状态 `PENDING_AUDIT`）
4. 讲师在 **作业大厅** 审核并发布 → 学员端可查看完整反馈

系统会自动创建示例题目「Day 2: 职业转型自述」，可直接选该题提交。

## 环境变量

复制 `.env.example` 为 `.env.local`：

| 变量 | 说明 |
|------|------|
| `GEMINI_API_KEY` | Gemini API（当前 Mock 可不填） |
| `TURSO_DATABASE_URL` | Turso 或 `file:./db_data/opc_homework.db` |
| `TURSO_AUTH_TOKEN` | 远程 Turso 必填 |
| `BLOB_READ_WRITE_TOKEN` | 本地附件上传需配置（可用 Vercel Blob CLI） |
| `CRON_SECRET` | 生产 Cron 鉴权 |

## 常用命令

```bash
pnpm dev      # 开发
pnpm build    # 构建
pnpm start    # 生产启动
pnpm lint     # ESLint
```

## 目录说明

```
src/app/          # 页面与 API 路由
src/components/   # UI 与页面组件
src/lib/          # 数据库、API 逻辑、AI Agent
db_data/          # SQLite 数据文件（gitignore）
```

更完整的架构与 API 约定见 [AGENTS.md](./AGENTS.md)。
