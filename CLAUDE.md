# CLAUDE.md

## 项目概述

md2red 是一个 TypeScript CLI 工具 + Web 控制台，将 Markdown 文档转化为小红书风格的图文轮播卡片。生成的图片可通过导出功能下载后手动发布。

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
├── cli/               CLI 入口（run, parse, generate, preview, history, init）
├── web/               Web 控制台后端（HTTP API + SSE）
├── parser/            Markdown 解析（remark），封面 H2 提取
├── strategy/          LLM 内容策略（Gemini/OpenAI/Anthropic/SiliconFlow），含重试/修复/fallback
├── generator/         React SSR 图片渲染（Playwright headless 截图）
├── preview/           交互式预览 HTML 生成
├── tracker/           生成历史和去重
├── config/            YAML 配置 + Zod 验证
└── utils/             日志、图片下载、哈希

web/                    前端（Vite + React + Tailwind，构建到 web/dist/）
├── src/pages/         5 个页面（Dashboard, Upload, Preview, History, Settings）
├── src/components/    Layout, TaskProgress, StatusBadge
└── src/hooks/         useSSE（SSE 进度钩子）

e2e/                    E2E 测试（Playwright）
scripts/                部署脚本
```

## 关键约束

- **ESM 模块**：整个项目使用 ES modules（`"type": "module"`）
- **Playwright headless**：图片渲染用 Playwright Chromium headless 截图，不需要系统 Chrome

## 关键行为

- **封面 H2 提取**：parser 检测第一个 H2 标题为"封面"时，将其内容提取为 `coverText` 并从 contentBlocks 中移除，用作封面卡片副标题
- **LLM 策略容错**：`generateStrategy()` 返回 `ContentStrategy | null`。截断 JSON 会尝试自动修复（`tryRepairJson`），失败后重试 1 次，仍失败则返回 `null`，调用方 fallback 到直接模式
- **默认模型**：SiliconFlow 默认 `Qwen/Qwen3-30B-A3B-Instruct-2507`（速度快、约束遵从好、成本低）

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
docker compose build   # 构建镜像（Playwright Chromium + 中文字体）
docker compose up -d   # 启动 Web 控制台 :3001
```

默认 CMD 是 `web`（启动 Web 控制台）。也可以用 CLI 模式：
```bash
docker compose run --rm md2red generate /articles/article.md
```

### Docker 开发注意事项

1. **apt 镜像源用 HTTP**：base 镜像没有 ca-certificates，必须用 `http://` 而非 `https://`
2. **MD2RED_DATA_DIR**：entrypoint 必须 export，否则上传和输出路径不持久化
3. **Docker build 缓存**：修改 src/ 后如果 build 没生效，`touch tsconfig.json` 让 Docker 检测到变化，避免 `--no-cache`（会重新安装 Chromium，较慢）
4. **任何 Docker 相关改动必须在容器内验证后再推代码**

## 代码风格

- TypeScript strict mode
- ESLint + Prettier（配置在项目根目录）
- 不要给未修改的代码加注释或类型注解
- React 组件用函数组件 + hooks
- 前端组件样式用 Tailwind CSS class，不用 CSS 文件
