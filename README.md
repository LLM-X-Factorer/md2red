# md2red

将 Markdown 文档转化为小红书风格的图文轮播卡片。生成的图片可导出后手动发布。

[English](./README_EN.md)

## 功能特性

- **Markdown 解析** — 按 H2 标题自动拆分内容块，提取代码块、图片引用和 frontmatter
- **React SSR 图片卡片** — 封面、内容、代码、总结四种卡片模板，1080×1440 像素（3:4 比例）
- **语法高亮** — Shiki 驱动的代码高亮，支持 Catppuccin 暗色/亮色主题
- **Markdown 渲染** — 列表、加粗、斜体、行内代码通过 remark-rehype 管道渲染
- **多 LLM 支持** — Gemini、OpenAI、Anthropic 三选一，生成小红书风格标题、摘要、标签和卡片布局
- **交互式预览** — 浏览器中拖拽排序、删除卡片、编辑标题/摘要/标签
- **导出打包** — 一键下载 zip（所有图片 + 发布文案.txt），方便手动发布到任意平台
- **状态追踪** — SHA256 哈希防重复生成，生成历史记录
- **Web 控制台** — Vite + React + Tailwind 构建的浏览器控制台，非技术用户也能操作
- **Docker 部署** — 一键容器化部署，内置 Playwright Chromium + 中文字体

## 两种使用方式

**CLI 模式** — 开发者在本地终端操作：
```bash
md2red run article.md
# 生成图片 → 打开预览 → 导出 zip 手动发布
```

**Web 控制台模式** — 部署到服务器，浏览器中操作：
```bash
docker compose up -d
# 访问 http://服务器IP:3001
```

## 安装

```bash
git clone https://github.com/LLM-X-Factorer/md2red.git
cd md2red
npm install
npm run build:all
```

### 环境要求

- **Node.js 20+**
- Playwright Chromium 会自动安装（用于图片渲染截图）

## 使用指南

### 第一步：初始化配置

```bash
md2red init
```

在当前目录生成 `md2red.config.yml` 配置文件。默认配置即可使用，无需额外设置。

如果需要 LLM 智能内容策略（更好的标题、摘要和卡片排布），设置 API Key：

```bash
# 三选一：
export GEMINI_API_KEY=your-key      # Google Gemini
export OPENAI_API_KEY=your-key      # OpenAI
export ANTHROPIC_API_KEY=your-key   # Anthropic Claude
```

### 第二步：生成图片卡片

**直接模式**（不需要 LLM）：

```bash
md2red generate 我的文章.md
```

**LLM 策略模式**（生成更好的标题、摘要、标签和卡片布局）：

```bash
md2red generate -s 我的文章.md
```

常用选项：

```bash
md2red generate 文章.md -t light     # 亮色主题
md2red generate 文章.md --cards 6    # 限制最多 6 张卡片
md2red generate 文章.md -o ./output  # 自定义输出目录
```

输出目录默认为 `md2red-output/<文件名>/`，包含：
- `01-cover.png`、`02-content.png`、... `08-summary.png` — 图片卡片
- `strategy.json` — 内容策略数据（标题、摘要、标签）

### 第三步：预览和编辑

```bash
md2red preview md2red-output/我的文章/
```

浏览器打开交互式编辑器，你可以：
- **浏览卡片** — 左右箭头键或点击缩略图
- **拖拽排序** — 拖动缩略图调整卡片顺序
- **删除卡片** — 移除不想要的卡片
- **编辑标题** — 从 LLM 候选中选择或输入自定义标题
- **编辑摘要** — 修改笔记正文
- **管理标签** — 添加或删除标签

### 第四步：导出发布

在预览页面点击 **「导出图片+文案」** 下载 zip 包，包含所有图片和发布文案，然后手动上传到小红书或其他平台。

### 一键全流程

```bash
md2red run 我的文章.md
```

自动执行：解析 → LLM 策略（如有 API Key）→ 生成图片 → 打开预览。

## Markdown 格式

md2red 适用于标准 Markdown 格式：

```markdown
---
title: 文章标题
tags: [标签1, 标签2]
---

# 主标题

这里是引言段落...

## 第一节

第一张卡片的内容...

## 第二节

- 列表项会正确渲染
- **加粗** 和 *斜体* 都支持
- `行内代码` 也可以

## 代码示例

\`\`\`typescript
function hello() {
  console.log('你好！');
}
\`\`\`

## 结语

总结内容...
```

**内容如何映射到卡片：**
- `H1` 或 frontmatter 中的 `title` → 封面卡片标题
- 每个 `H2` 章节 → 一张内容卡片
- 代码块 → 带语法高亮的代码卡片
- 最后一张 → 自动生成的总结卡片

## 命令一览

```
核心命令：
  md2red run <file>                完整流程：解析 → 策略 → 生成 → 预览
    --force                        强制重新生成

  md2red parse <file>              解析 Markdown 并输出结构信息
    -o, --output <path>            保存解析 JSON

  md2red generate <file>           解析并生成图片卡片
    -s, --strategy                 使用 LLM 规划内容布局
    -t, --theme <name>             主题：dark 或 light
    --cards <number>               最大卡片数量

  md2red preview <dir>             在浏览器中交互式预览编辑
    -p, --port <number>            服务端口（0 = 自动分配）

工具命令：
  md2red history                   查看生成历史
  md2red history clear             清除历史记录
  md2red init                      生成配置文件
```

## 配置说明

在项目根目录创建 `md2red.config.yml`（或运行 `md2red init`）：

```yaml
llm:
  provider: gemini           # gemini | openai | anthropic
  # model: gemini-2.5-flash  # 可选，按 provider 自动选择默认模型
  apiKey: ${GEMINI_API_KEY}  # 支持环境变量替换
  temperature: 0.7
  maxTokens: 4096

images:
  theme: dark                # dark | light
  brandColor: '#6366f1'

content:
  maxCards: 9                # 最大卡片数（含封面和总结）
  targetAudience: 技术开发者
  style: technical           # technical | casual | mixed
```

## 架构

```
Markdown 文件
    ↓
[解析层]        remark → MDAST → ContentBlocks
    ↓
[策略层]        LLM (Gemini/OpenAI/Claude) → 标题、摘要、标签、卡片计划
    ↓
[生成层]        React SSR → HTML → Playwright 截图 → 1080×1440 PNG
    ↓
[预览层]        交互式 HTML 编辑器（拖拽排序、编辑、确认）
    ↓
[导出]          图片 + 文案 → zip 下载 → 手动发布
```

## Web 控制台

md2red 提供了浏览器控制台，部署到服务器后，非技术用户也能通过网页完成所有操作。

**功能页面：**
- **首页** — 生成记录统计、快捷入口
- **上传生成** — 拖拽上传 Markdown → 解析 → 选择主题/LLM → 生成图片（实时进度）
- **预览编辑** — 卡片轮播、拖拽排序、编辑标题/摘要/标签、导出 zip
- **生成历史** — 所有记录的状态表格
- **设置** — LLM 提供商、主题、内容风格等配置

**本地开发：**
```bash
npm run build:all          # 构建后端 + 前端
npm run start:web          # 启动 http://localhost:3001

# 或分别开发（热更新）
npm run dev:web            # 前端 Vite dev server (5173)
node dist/web/server.js    # 后端 API (3001)
```

## Docker 部署

```bash
# 1. 克隆项目
git clone https://github.com/LLM-X-Factorer/md2red.git /opt/md2red
cd /opt/md2red

# 2. 配置环境变量（可选，用于 LLM 策略）
echo "GEMINI_API_KEY=your-key" > .env

# 3. 构建并启动
docker compose build
docker compose up -d

# 4. 访问 Web 控制台
# 浏览器打开 http://服务器IP:3001

# 后续更新代码：
git pull && CACHE_BUST=$(date +%s) docker compose build && docker compose restart
```

Docker 镜像内置 Playwright Chromium + 中文字体。

**容器内数据持久化：**
- 历史记录 → `md2red-data` volume（`/data`）
- Markdown 文件 → `./articles` 映射到 `/articles`
- 生成输出 → `./output` 映射到 `/output`

**密码保护：**
设置环境变量 `MD2RED_PASSWORD` 启用 Web 控制台登录保护：
```bash
echo "MD2RED_PASSWORD=你的密码" >> .env
```
不设置则无需密码。

**CI/CD 自动部署：**
commit message 包含 `[deploy]` 时，GitHub Actions 自动 SSH 到服务器拉取最新代码并重建容器。需在 GitHub Settings → Secrets 中配置 `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_KEY`。

## 技术栈

- **TypeScript** + Node.js (ESM)
- **React** (SSR 图片渲染 + Web 控制台前端)
- **Vite** + **Tailwind CSS** (Web 控制台构建)
- **Playwright** (headless Chromium 截图)
- **unified/remark** (Markdown 解析 + rehype HTML 渲染)
- **Shiki** (语法高亮)
- **Gemini / OpenAI / Anthropic** (内容策略)
- **Zod** (配置验证)
- **Commander.js** (CLI)
- **Docker** (容器化部署)

## 测试

```bash
npm test              # 单元测试
npm run test:e2e      # E2E 测试
npm run test:all      # 全部测试
```

## 许可证

MIT
