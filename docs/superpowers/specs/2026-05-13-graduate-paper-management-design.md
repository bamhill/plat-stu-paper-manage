# 研究生论文过程管理系统 — 设计文档

**日期**: 2026-05-13  
**状态**: 已确认

---

## 1. 系统定位

研究生论文过程管理系统。核心对象是学生论文的完整生命周期：
小论文（撰写→投稿→审稿→返修→接收/拒稿）+ 大论文（开题→中期→提交→外审→答辩）。

### 第1版范围（MVP）

| 模块 | 功能 |
|------|------|
| 学生管理 | 增删改查，按状态/年级筛选 |
| 小论文管理 | 增删改查，版本历史，状态追踪 |
| 投稿与返修管理 | 投稿记录、审稿意见、返修轮次 |
| 大论文管理 | 各阶段记录、审稿意见 |
| 附件与时间线 | 关联任意对象、自动写入事件 |

### 不做

知识库、文献笔记、AI推荐、复杂权限、统计大屏、多角色协作、拖拽交互。

---

## 2. 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 框架 | Next.js App Router | React 服务端组件优先 |
| 语言 | TypeScript | 严格模式 |
| 数据库 | SQLite | 单文件，零运维 |
| ORM | Prisma | 类型安全，自动迁移 |
| 样式 | Tailwind CSS | 原子化CSS |
| 组件库 | shadcn/ui | 可定制，基于Radix |
| 表单 | React Hook Form + Zod | 客户端校验 |
| 文件存储 | 本地文件系统 | `/data/files/` 目录 |
| 包管理 | pnpm | 快速，节省磁盘 |

---

## 3. 数据模型

### 核心表

```
Student
  ├── Paper (1:N)
  │     ├── Submission (1:N)
  │     │     └── Revision (1:N)
  │     └── PaperVersion (1:N)
  ├── Thesis (1:1)
  │     └── ThesisReview (1:N)
  ├── Attachment (多态 1:N)
  └── TimelineEvent (1:N)
```

### 表结构

**students**
- id (INTEGER PK)
- name (TEXT)
- student_no (TEXT, unique)
- degree_type (TEXT: master/phd/joint/exchange)
- enrollment_year (INTEGER)
- graduation_year (INTEGER nullable)
- direction (TEXT)
- supervisor (TEXT)
- co_supervisor (TEXT nullable)
- status (TEXT: active/graduated/delayed/suspended)
- notes (TEXT nullable)
- created_at, updated_at

**papers**
- id (INTEGER PK)
- student_id (FK → students)
- title (TEXT)
- paper_type (TEXT: journal/conference)
- direction (TEXT)
- first_author (TEXT)
- corresponding_author (TEXT)
- status (TEXT: writing/ready_to_submit/submitted/minor_revision/major_revision/accepted/rejected/published)
- target_venue (TEXT nullable)
- current_version (INTEGER, default 1)
- notes (TEXT nullable)
- my_thoughts (TEXT nullable) — 导师自己的思考/判断
- created_at, updated_at

**paper_versions**
- id (INTEGER PK)
- paper_id (FK → papers)
- version_number (INTEGER)
- file_name (TEXT)
- file_path (TEXT) — 相对路径
- file_size (INTEGER)
- description (TEXT nullable)
- uploaded_at

**submissions**
- id (INTEGER PK)
- paper_id (FK → papers)
- venue_name (TEXT)
- submission_round (INTEGER)
- submitted_at (DATETIME nullable)
- decision_at (DATETIME nullable)
- decision (TEXT: under_review/minor_revision/major_revision/reject/accept)
- editor_comments (TEXT nullable)
- reviewer_comments (TEXT nullable)
- status (TEXT: pending/under_review/decisioned)
- notes (TEXT nullable)
- created_at, updated_at

**revisions**
- id (INTEGER PK)
- submission_id (FK → submissions)
- revision_round (INTEGER)
- received_at (DATETIME nullable)
- due_at (DATETIME nullable)
- submitted_at (DATETIME nullable)
- revision_type (TEXT: minor/major/resubmit)
- comments_summary (TEXT nullable)
- response_summary (TEXT nullable)
- status (TEXT: pending/revising/submitted/completed)
- notes (TEXT nullable)
- created_at, updated_at

**theses**
- id (INTEGER PK)
- student_id (FK → students)
- title (TEXT)
- degree_type (TEXT)
- stage (TEXT: proposal/midterm/draft/review/revision/defense/archived)
- proposal_date, midterm_date, submitted_at, reviewed_at, defense_date (nullable)
- score (TEXT nullable)
- review_comments (TEXT nullable)
- revision_notes (TEXT nullable)
- status (TEXT: in_progress/submitted/reviewed/revision/defended)
- created_at, updated_at

**thesis_reviews**
- id (INTEGER PK)
- thesis_id (FK → theses)
- reviewer_name (TEXT)
- reviewer_type (TEXT: internal/external/anonymous)
- score (TEXT nullable)
- decision (TEXT: pass/minor_revision/major_revision/fail)
- comments (TEXT nullable)
- reviewed_at (DATETIME nullable)
- created_at

**attachments**
- id (INTEGER PK)
- related_type (TEXT: student/paper/submission/revision/thesis/thesis_review)
- related_id (INTEGER)
- file_name (TEXT)
- file_path (TEXT)
- file_type (TEXT)
- file_size (INTEGER)
- description (TEXT nullable)
- uploaded_at

**timeline_events**
- id (INTEGER PK)
- student_id (FK → students)
- related_type (TEXT)
- related_id (INTEGER)
- event_type (TEXT: paper_created/submitted/decisioned/revision_submitted/thesis_reviewed/...)
- title (TEXT)
- description (TEXT nullable)
- event_date (DATETIME)
- created_at

---

## 4. 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 重定向 | → /dashboard |
| `/dashboard` | 首页 | 按年级分组卡片：研一/研二学生论文进展便签 + 审稿意见便签 |
| `/students` | 学生列表 | 在读/已毕业分Tab显示，表格+搜索+筛选（状态/年级）。已毕业学生可查看其大论文、审稿意见、分数、小论文及投稿历程 |
| `/students/[id]` | 学生详情 | **核心页面**：个人信息+小论文列表+投稿+返修+大论文+附件+时间线 |
| `/papers` | 小论文列表 | 全部小论文，筛选状态 |
| `/papers/[id]` | 小论文详情 | 版本历史+投稿历程+返修记录+附件 |
| `/theses` | 大论文列表 | 全部大论文，筛选阶段 |
| `/theses/[id]` | 大论文详情 | 各阶段记录+审稿意见+附件 |
| `/submissions` | 投稿列表 | 全部投稿记录，筛选状态 |
| `/revisions` | 返修列表 | 全部返修记录，筛选状态 |

---

## 5. 布局与组件

### 整体布局

左侧边栏固定 + 右侧内容区滚动。侧边栏包含 Logo/标题和导航链接。

### 组件选用（shadcn/ui）

- **Sidebar**: 导航侧边栏
- **Card**: Dashboard 便签卡片
- **Table / DataTable**: 列表页表格
- **Dialog**: 新建/编辑弹窗（不跳页）
- **Form + Input + Select + Textarea**: 表单控件
- **Breadcrumb**: 面包屑导航
- **Badge**: 状态标签
- **Tabs**: 学生详情页内切换小论文/投稿/返修/大论文/附件/时间线
- **DropdownMenu**: 操作菜单（编辑/删除）
- **AlertDialog**: 删除确认
- **Sonner (Toast)**: 操作反馈通知

### 关键交互

- 新建/编辑操作用 Dialog 弹窗，不跳页
- 删除操作先弹 AlertDialog 确认
- 操作完成后自动刷新列表
- 所有关键操作自动写入 timeline_events

---

## 6. Dashboard 设计

按年级分组（研一/研二/其他），每组内展示：
- 该年级学生列表（姓名首字为头像 + 状态标签）
- 每位学生的活跃小论文卡片（标题 + 状态标签 + 目标期刊）
- 最近的审稿意见摘要卡片（期刊名 + 决定 + 关键意见摘要）

布局：年级标题 → 学生卡片横排 → 每张学生卡片内嵌套论文便签和审稿意见便签。

---

## 7. 文件存储

- 所有文件存在 `data/files/` 下
- 按类型分子目录：`papers/`, `submissions/`, `revisions/`, `theses/`
- 文件名包含时间戳防止冲突：`{entity_type}_{entity_id}_{timestamp}_{original_name}`
- 版本历史通过 paper_versions 表追踪
- 文件上传通过 Next.js API Route 处理

---

## 8. 技术实现要点

### 数据库
- Prisma schema 文件定义所有模型
- `npx prisma db push` 同步到 SQLite
- Prisma Client 用作数据访问层

### 后端（Next.js API Routes / Server Actions）
- Server Actions 用于表单提交（创建/更新/删除）
- API Routes 用于文件上传下载
- 所有数据操作在服务端执行

### 前端
- Server Components 用于数据读取
- Client Components 用于交互（Dialog、表单）
- React Hook Form + Zod 用于表单校验
- shadcn/ui 组件统一视觉风格

### 时间线自动生成
封装工具函数 `createTimelineEvent()`，在 Server Action 中每次关键操作后调用。

---

## 9. 开发顺序

### 第1步：项目脚手架
Next.js + TypeScript + Tailwind + shadcn/ui + Prisma 初始化

### 第2步：数据库
Prisma schema → 迁移 → seed 脚本

### 第3步：布局
侧边栏 + 面包屑 + 全局 Layout

### 第4步：CRUD 页面（按依赖顺序）
1. 学生管理 (students)
2. 小论文管理 (papers)
3. 投稿管理 (submissions)
4. 返修管理 (revisions)
5. 大论文管理 (theses)
6. 附件上传
7. 时间线

### 第5步：学生详情页整合
Tabs 组织所有子模块 + 时间线

### 第6步：Dashboard
按年级分组卡片渲染

---

## 10. 非功能需求

- 操作后页面即时反映变化（revalidatePath / router.refresh）
- 删除必须二次确认
- 文件上传大小限制 50MB
- 表单校验前后端一致（Zod schema 共享）
- 错误处理：操作失败显示 toast 通知
