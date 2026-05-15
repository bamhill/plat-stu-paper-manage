# 研究生论文过程管理系统 — CLAUDE.md

Next.js 14 App Router + TypeScript + Prisma 5 + SQLite + shadcn/ui 4.x (@base-ui)。

## 启动

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

## 项目结构

```
src/
  app/          — 页面路由 (Server Components)
  components/   — UI组件 (Client Components)
  lib/          — 工具函数 (validators, prisma, timeline, settings, file-utils, paper-status)
prisma/
  schema.prisma — 数据模型 (9表)
  seed.ts       — 种子数据
data/
  config.json   — 设置文件
  dev.db        — SQLite数据库 (不上传git)
  files/        — 上传附件 (不上传git)
```

## 核心数据模型

```
Student → Paper → Submission → Revision
Student → Thesis → ThesisReview
所有实体 → Attachment (多态, relatedType + relatedId)
```

- `students.showOnDashboard` — 控制首页看板是否显示 (默认true, 查询用 `{ not: false }`)
- `papers.versionLabel` — 自定义版本标签如 "V1_202601"
- `submissions.manuscriptNo` — 稿件编号
- `thesis.expert1Score/expert2Score/expert3Score` — 三个外审专家分数
- `thesis.score` — 答辩成绩

## 关键开发规则

### 表单 (CRITICAL)
- **用 `useEffect` + `form.reset()` 同步数据**，不要依赖 Dialog `key` 属性
- **编辑时同时显示表单字段和附件上传区**，新建后创建完成才切换到附件模式
- 每个 Server Action 的 create 和 update **必须保持字段完全一致**
- 所有 FK 字段（studentId/paperId/submissionId/thesisId）在 create/update 中都要写入
- 新建表单需要 auto-select 模式：`useEffect` 监听下拉数据加载后自动填入第一个选项

### 下拉框 (CRITICAL)
- **绝对不要用 shadcn base-ui Select** — 显示英文 value、无法点击选择
- 统一用 `<NativeSelect>`（`src/components/ui/select.tsx`，React.forwardRef 包装的原生 select）
- 用 `value={field.value || ""}` 不要用 `defaultValue`

### 类型定义
- 组件内自定义接口/type **不要命名为 `Student`** — 会和 Prisma 生成的 `Student` 类型冲突
- 用 `StudentRow` 或内联到 Props

### 文件上传
- `fileRootDir` 支持绝对路径 — `resolveRoot()` 自动检测
- 中文论文标题截断12字 + 空格替换下划线
- 上传两步骤：`/api/files/upload` 存文件 → `/api/attachments` 创建 DB 记录
- 允许空 MIME 类型通过（浏览器不识别 .7z/.rar）
- ALLOWED_TYPES 包含 `application/octet-stream` 兜底
- 附件类型枚举：`submission_paper`, `submission_supplement`, `revision_review`, `revision_manuscript`, `revision_supplement`, `thesis`, `thesis_expert`, `thesis_review`
- `AttachmentUpload` 组件支持上传/下载/删除，placeholder 按类型自动匹配
- 删除附件同时删除文件和 DB 记录

### 时间线
- 从论文/投稿/返修**实际数据**派生，不依赖 `timeline_events` 表
- `eventDate` 使用实际业务日期（`submittedAt`, `receivedAt`）

### 主题
- 三档切换：浅色 / 专业蓝调(pro-theme) / 深色
- 专业蓝调：深蓝渐变侧边栏、卡边阴影、11色 Badge、button 强制白字
- CSS 集中在 `globals.css`，通过 `light`/`dark`/`pro-theme` class 控制
- 主题状态保存到 `localStorage`

### 论文详情页设计
- 左栏（2/5）：基本信息 + 我的思考 + 论文稿件版本
- 右栏（3/5）：投稿历程（彩色左强调边 + 折叠审稿意见 + 折叠返修记录 + 只读附件下载）
- 附件上传统一在投稿记录/返修记录页面管理，不在详情页

### 代码质量
- Server Action 的 create/update 字段必须一一对应，不可遗漏
- 所有表单 onSubmit 前置校验 FK 字段非零
- Prisma 查询用 `include` 避免 N+1，附件批量查用 `findMany + in`

### 环境
- npm (不是 pnpm)
- Prisma 5.x (不是 7.x)
- zod v3
- 单人本地使用，无登录

### Git 不上传
`node_modules/`, `data/dev.db`, `data/files/`, `.env`, `.next/`
