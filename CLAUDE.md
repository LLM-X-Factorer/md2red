# CLAUDE.md

## 项目概述

md2red 是一个 TypeScript CLI 工具 + Web 控制台，将 Markdown 文档转化为小红书图文轮播帖子并发布。

## 构建

```bash
npm run build          # 编译后端 TypeScript
npm run build:web      # 构建前端 Vite SPA
npm run build:all      # 两者都构建
```

## 测试

```bash
npm test               # 单元测试（Node.js test runner + tsx）
npm run test:e2e       # E2E 测试（Playwright）
npm run test:all       # 全部测试
```

## 项目结构

```
src/                    后端（TypeScript，编译到 dist/）
├── cli/               CLI 入口 + 15 个命令
├── web/               Web 控制台后端（HTTP API + SSE）
├── parser/            Markdown 解析（remark）
├── strategy/          LLM 内容策略（Gemini/OpenAI/Anthropic）
├── generator/         React SSR 图片渲染（Playwright 截图）
├── publisher/         小红书浏览器自动化（headful Chrome）
├── preview/           交互式预览 HTML 生成
├── tracker/           发布历史和去重
├── config/            YAML 配置 + Zod 验证
└── utils/             日志、图片下载、哈希

web/                    前端（Vite + React + Tailwind，构建到 web/dist/）
├── src/pages/         7 个页面（Dashboard, Upload, Preview, Publish, Auth, History, Settings）
├── src/components/    Layout, TaskProgress, StatusBadge, CardCarousel
└── src/hooks/         useSSE（SSE 进度钩子）

e2e/                    E2E 测试（Playwright）
scripts/                部署脚本
```

## 关键约束

- **仅自己可见**：发布默认私密，这是硬性安全约束
- **headful Chrome**：auth 和 publish 必须用 headful 模式（headless 被小红书检测），本地用系统 Chrome（`channel: 'chrome'`），Docker 用 Xvfb
- **选择器脆弱**：小红书 DOM 选择器在 `src/publisher/xhs-selectors.ts` 中集中管理，XHS 更新 UI 后需要更新。用 `md2red validate` 检测
- **Cookie 有效期 ~7 天**：需要定期重新扫码登录
- **ESM 模块**：整个项目使用 ES modules（`"type": "module"`）

## 开发模式

```bash
# 后端
npm run dev            # tsc --watch

# 前端（Web 控制台）
npm run dev:web        # Vite dev server on :5173，proxy /api → :3001

# Web 服务
npm run start:web      # 启动 :3001，同时服务 API 和前端静态文件
```

## Docker

```bash
docker compose build   # 构建镜像（Chrome + Xvfb + 中文字体）
docker compose up -d   # 启动 Web 控制台 :3001
```

默认 CMD 是 `web`（启动 Web 控制台）。也可以用 CLI 模式：
```bash
docker compose run --rm md2red generate /articles/article.md
```

### Docker 开发注意事项（必读）

以下是实际部署中踩过的坑，修改相关代码时务必注意：

1. **Chrome 必须用 CDP 连接模式**：`renderer.ts` 和 `xhs-browser.ts` 都用独立启动 Chrome + `connectOverCDP()`。不要用 `executablePath`（Playwright 注入的 flags 会导致 SIGSEGV）
2. **Xvfb 后台启动**：不要用 `xvfb-run`（无法启动 node），用 `Xvfb :99 &` + `export DISPLAY=:99`
3. **Chrome spawn 传 DISPLAY**：`spawn(chrome, args, { env: { ...process.env, DISPLAY: ':99' } })`
4. **apt 镜像源用 HTTP**：base 镜像没有 ca-certificates，必须用 `http://` 而非 `https://`
5. **MD2RED_DATA_DIR**：entrypoint 必须 export，否则上传和输出路径不持久化
6. **图片上传用批量模式**：`setInputFiles(allPaths)` 一次传所有图片，逐个上传只传第一张
7. **草稿功能在 Docker 里无效**：XHS 草稿存浏览器 localStorage，Web 控制台只做"仅自己可见"发布
5. **Cookie 文件路径**：通过 symlink `~/.md2red → /data` 映射到 volume，确保 `loadCookies` 能找到
6. **CDP 连接模式**：`xhs-browser.ts` 独立启动 Chrome 再通过 CDP 连接，减少自动化检测。注意 page 生命周期——不要在 auth 流程中途关闭 page
7. **Docker build 缓存**：修改 src/ 后如果 build 没生效，`touch tsconfig.json` 让 Docker 检测到变化，避免 `--no-cache`（会重新下载 Chrome，非常慢）
8. **任何 Docker 相关改动必须在容器内验证后再推代码**

## 代码风格

- TypeScript strict mode
- ESLint + Prettier（配置在项目根目录）
- 不要给未修改的代码加注释或类型注解
- React 组件用函数组件 + hooks
- 前端组件样式用 Tailwind CSS class，不用 CSS 文件
