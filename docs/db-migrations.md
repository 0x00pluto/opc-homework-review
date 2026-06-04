# 数据库迁移（Turso → 未来 Supabase）

本文对齐团队 [Supabase 工程最佳实践](https://github.com/) 中的 **Migration 治理** 思想，在当前阶段用 **Turso / libSQL** 落地；迁到 Supabase 后改为 `supabase/migrations/` + Supabase CLI，流程不变。

## 单一事实源

| 阶段 | 目录 | 说明 |
|------|------|------|
| **当前（Turso）** | [`db/migrations/`](../db/migrations/) | 所有 DDL 仅通过此处入库 Git |
| **开发种子** | [`db/seed/`](../db/seed/) | 演示账号等 DML，`pnpm db:seed`（与 migration 分离） |
| **未来（Supabase）** | `supabase/migrations/` | Postgres 语法；禁止再改已发布的 Turso 历史文件，用新文件做 PG 移植 |

**禁止双轨**：不要只在 Turso Dashboard / Supabase Dashboard 点表结构却不补 migration，也不要保留独立的 `schema.sql` 快照作为执行入口。

## 命名与顺序

- 文件名：`<YYYYMMDDHHmmss>_<snake_case>.sql`（UTC 14 位时间戳，**禁止手抄旧时间戳**）
- 合并前拉最新 `db/migrations/`，保证时间戳单调递增
- 一条 migration ≈ 一次 PR / 一个业务意图；外键依赖：被引用表先于引用表

## 常用命令（`package.json` scripts）

```bash
# 新建空迁移文件
pnpm db:migration:new -- add_some_column

# 查看本地文件 vs 当前库已应用版本
pnpm db:migration:list

# 对当前 TURSO_DATABASE_URL 应用待执行迁移
pnpm db:migrate

# 仅预览将应用哪些文件
pnpm db:migrate -- --dry-run

# 写入开发种子（班级、演示学员等，幂等）
pnpm db:seed
pnpm db:seed -- --dry-run
```

执行 `db:migrate` / `db:migration:list` 前请确认 `.env.local` 中的 **`TURSO_DATABASE_URL` 指向目标库**（避免连错生产）。

## 工作流（四步）

1. `pnpm db:migration:new -- <name>` 生成文件  
2. 编写 SQL，在**开发库**执行 `pnpm db:migrate` 验证  
3. 更新本说明或业务文档（若有表语义变更）  
4. 合并后：本地 / CI / 发布前对 staging·production 各执行一次 `pnpm db:migrate`

## 版本表

应用记录写入 `sys_schema_migrations(version, name, applied_at)`，语义类似 Supabase 的 `supabase_migrations.schema_migrations`。

## SQL 习惯（libSQL / 日后 Postgres）

- 新建：`CREATE TABLE IF NOT EXISTS`（在语义允许时）
- 改表：**不能**用 `IF NOT EXISTS` 糊弄；用**新 migration** 前滚，勿改已上线历史文件
- 删列 / 收紧约束：分步发布（先停写 → 部署 → 再 DDL）
- migration 内**禁止**写密钥、环境专属 URL

## Vercel 部署

应用**不会**在运行时自动建表。发布前对生产 Turso 执行：

```bash
pnpm db:migrate
```

或在 CI 增加一步（使用生产 `TURSO_*` secret）。

## 迁到 Supabase 时

1. 在 Supabase 项目执行 `supabase init`，迁移目录改为 `supabase/migrations/`
2. 将 `db/migrations/` 中逻辑**按时间顺序**改写为 Postgres（类型、`SERIAL`/`UUID`、`TIMESTAMPTZ`、RLS 等单独 migration）
3. 采用 `pnpm db:migration:new` → `supabase db push` 等价脚本（见团队 Supabase 最佳实践文档 §2.12）
4. RLS / `service_role` 密钥分层见该文档 §3–§4；本应用当前为服务端 Route 访问 DB，迁 PG 后仍保持 **禁止 Client 直连**

## PR 检查（Migration）

- [ ] DDL 仅在 `db/migrations/`（或未来 `supabase/migrations/`）
- [ ] 文件名时间戳晚于仓库已有最新一条
- [ ] 未修改已发布过的历史 migration；修复用新文件
- [ ] `pnpm db:migration:list` 与 `pnpm db:migrate` 已在目标开发库验证
- [ ] `pnpm build` 通过
