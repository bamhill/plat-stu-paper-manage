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
- **编辑时不要隐藏表单字段**，新建后创建完成才切换到附件模式
- 每个 Server Action 的 create 和 update 必须同时包含新增字段

### 下拉框 (CRITICAL)
- **绝对不要用 shadcn base-ui Select** — 显示英文 value、无法点击选择
- 统一用 `<NativeSelect>` (`src/components/ui/select.tsx`)
- 用 `value={field.value || ""}` 不要用 `defaultValue`

### 类型定义
- 组件内自定义接口 **不要命名为 `Student`** — 会和 Prisma 生成的 `Student` 类型冲突
- 改名如 `StudentRow` 或内联到 Props 中

### 文件上传
- `fileRootDir` 支持绝对路径 (`d:\研究生管理\`) — `resolveRoot()` 自动检测
- 中文论文标题做截断（12字）+ 空格替换下划线
- 上传分两步：`/api/files/upload` 存文件 → `/api/attachments` 创建记录
- 允许空 MIME 类型通过（浏览器不识别 .7z/.rar 等格式）
- 附件类型区分：`submission_paper`, `submission_supplement`, `revision_review`, `revision_manuscript`, `revision_supplement`, `thesis`, `thesis_expert`, `thesis_review`
- 附件有独立的 `AttachmentUpload` 组件，支持上传/下载/删除，placeholder 自动按类型匹配

### 时间线
- 从论文/投稿/返修**实际数据**派生，不依赖 `timeline_events` 表
- `eventDate` 使用实际业务日期（`submittedAt`, `receivedAt` 等），不用 `new Date()`

### 主题
- 三档切换：浅色模式 / 专业蓝调(pro-theme) / 深色模式
- 主题相关 CSS 集中在 `globals.css`，通过 `light`/`dark`/`pro-theme` class 控制

### 环境
- npm (不是 pnpm)
- Prisma 5.x (不是 7.x)
- zod v3
- 单人本地使用，无登录

### Git 不上传
`node_modules/`, `data/dev.db`, `data/files/`, `.env`, `.next/`
