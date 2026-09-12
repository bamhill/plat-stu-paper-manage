# PlatStuPaperManage R19 · Windows 部署

基线版本：`0.19.0`。正式目录：

```text
D:\workbuddy\
├─ PlatStuPaperManage\
└─ PlatShared\            # 可选；缺失时投稿平台独立运行
```

## 首次安装 / 日常启动

1. 安装 Node.js 22 LTS 或更新版本。
2. 将本目录放到 `D:\workbuddy\PlatStuPaperManage\`。
3. 直接双击 `start_windows.cmd`。

首次运行如果缺少依赖或 production build，`start_windows.cmd` 会自动调用 `install_windows.cmd`，依次执行：只读检测 PlatShared → `npm ci` → Prisma/数据库初始化 → `verify:all` → Next production build；成功后继续启动平台。以后已有依赖与 build 时，双击 `start_windows.cmd` 直接启动。

也可以单独双击 `install_windows.cmd` 做安装/重建。本源码包不内置跨平台 `node_modules`；首次安装仍需要联网取得 `package-lock.json` 锁定的 npm 依赖，但用户无需手工输入 npm 命令。

## PlatShared 边界

投稿平台只读取同级 `PlatShared\registry\` 是否存在及 JSON 是否可解析：

- 不按论文题名自动合并；
- 不把投稿平台 local ID 当共享身份；
- 不写 `work_registry.json` / `source_registry.json`；
- 不跨平台数据库写入；
- PlatShared 缺失或异常不会阻断投稿平台单独启动。

真正的跨平台身份仍以 PlatShared 的 canonical `work_id` 和已确认 binding 为准。

## 验证

双击 `verify_windows.cmd`。它会运行原 R19 数据门禁与 ModelAssist 门禁，并报告 production build 标记是否存在。

## 正式截图验收

完成首次安装后，可双击：

`screenshot_acceptance_windows.cmd`

该脚本不使用静态页面或替代服务器。它会检查 production build、执行 `verify:all`、启动真实 `next start`，并在登录后用 Edge/Chrome 实际渲染首页、投稿记录、EAAI 安全稿、Meta-SKILL 和历史 EAAI R1。截图及 DOM 证据写入 `evidence\screenshots_20260905\`，总日志写入 `evidence\windows_screenshot_acceptance_20260905.log`。
