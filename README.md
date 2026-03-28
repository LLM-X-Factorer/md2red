# md2red

将 Markdown 文档自动转化为小红书图文轮播帖子，并发布到你的小红书账号。

**已验证：** 端到端实测通过 — Markdown → 8 张图片卡片 → 成功发布到小红书（仅自己可见）。

[English](./README_EN.md)

## 功能特性

- **Markdown 解析** — 按 H2 标题自动拆分内容块，提取代码块、图片引用和 frontmatter
- **React SSR 图片卡片** — 封面、内容、代码、总结四种卡片模板，1080×1440 像素（3:4 比例）
- **语法高亮** — Shiki 驱动的代码高亮，支持 Catppuccin 暗色/亮色主题
- **Markdown 渲染** — 列表、加粗、斜体、行内代码通过 remark-rehype 管道渲染
- **多 LLM 支持** — Gemini、OpenAI、Anthropic 三选一，生成小红书风格标题、摘要、标签和卡片布局
- **交互式预览** — 浏览器中拖拽排序、删除卡片、编辑标题/摘要/标签，确认后导出发布方案
- **内容质量闭环** — 抓取已发布笔记的互动指标，反馈给 LLM 优化下一次内容策略
- **反自动化韧性** — 浏览器指纹伪装、人类行为模拟、选择器容错、指数退避重试
- **Cookie 健康监控** — 主动检测过期、Webhook 告警（企业微信/Telegram）、远程扫码服务
- **小红书发布** — 使用系统 Chrome 自动化发布，默认"仅自己可见"，支持草稿模式
- **状态追踪** — SHA256 哈希防重复发布，发布历史记录

## 安装

```bash
git clone https://github.com/LLM-X-Factorer/md2red.git
cd md2red
npm install
npm run build
```

### 环境要求

- **Node.js 18+**
- **Google Chrome** — md2red 使用系统 Chrome 进行小红书自动化操作
- **小红书账号** — 需要在手机小红书 App 中扫码登录

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

### 第二步：登录小红书

```bash
md2red auth login
```

会弹出 Chrome 浏览器窗口，显示小红书登录页面。用小红书 App 扫码即可登录，CLI 会自动保存 Cookie。

Cookie 有效期约 7 天，随时可以检查状态：

```bash
md2red auth check
```

在远程服务器（无 GUI）上登录：

```bash
md2red auth serve --port 9876
# 用任意浏览器打开 http://服务器IP:9876 扫码登录
```

### 第三步：生成图片卡片

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

### 第四步：预览和编辑

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

点击 **「确认发布方案」** 保存为 `publish-plan.json`。

### 第五步：发布

```bash
# 发布到小红书（默认仅自己可见）
md2red publish md2red-output/我的文章/

# 保存为草稿
md2red publish --draft md2red-output/我的文章/

# 模拟发布（查看会发什么，但不实际发布）
md2red publish --dry-run md2red-output/我的文章/
```

发布命令优先读取 `publish-plan.json`（来自预览确认），否则使用 `strategy.json`。

发布过程会打开 Chrome 窗口，自动上传图片、填写标题和正文、设置"仅自己可见"，然后点击发布。

### 一键全流程

```bash
md2red run 我的文章.md
```

自动执行：解析 → LLM 策略（如有 API Key）→ 生成图片 → 打开预览。预览确认后手动 `md2red publish` 发布。

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
    --no-publish                   跳过发布提示

  md2red parse <file>              解析 Markdown 并输出结构信息
    -o, --output <path>            保存解析 JSON

  md2red generate <file>           解析并生成图片卡片
    -s, --strategy                 使用 LLM 规划内容布局
    -t, --theme <name>             主题：dark 或 light
    --cards <number>               最大卡片数量

  md2red preview <dir>             在浏览器中交互式预览编辑
    -p, --port <number>            服务端口（0 = 自动分配）

  md2red publish <dir>             发布到小红书
    --dry-run                      模拟发布
    --draft                        保存为草稿
    --force                        强制重新发布

认证管理：
  md2red auth login                扫码登录（弹出 Chrome 窗口）
  md2red auth serve                启动 HTTP 服务用于远程扫码
    -p, --port <number>            端口（默认 9876）
  md2red auth check                检查登录状态
  md2red auth logout               清除已保存的 Cookie

监控运维：
  md2red health                    检查 Cookie 健康状态
    --notify                       失败时发送 Webhook 通知
    --live                         在线检测 Session
  md2red validate                  测试小红书页面选择器
  md2red stats                     查看已发布笔记的表现数据
  md2red scrape [id]               抓取已发布笔记的指标

工具命令：
  md2red history                   查看发布历史
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

xhs:
  visibility: 仅自己可见      # 始终默认私密
  publishDelay: 3000         # 发布前延迟（毫秒）
  healthCheck:
    enabled: false
    intervalHours: 12
    notification:
      enabled: false
      webhookUrl: https://your-webhook-url
      webhookType: generic   # generic | wechat-work | telegram

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
    ↓                                        ← 历史表现数据反馈
[生成层]        React SSR → HTML → Playwright 截图 → 1080×1440 PNG
    ↓
[预览层]        交互式 HTML 编辑器（拖拽排序、编辑、确认）
    ↓                                        → publish-plan.json
[发布层]        Chrome + stealth → creator.xiaohongshu.com（仅自己可见）
    ↓
[追踪层]        ~/.md2red/history.json（去重、指标、状态）
```

## 服务器部署

md2red 可以部署在云服务器上（如腾讯云 Lighthouse）：

```bash
# 远程扫码登录（任意浏览器访问）
md2red auth serve --port 9876

# 定时健康检查（cron）
0 */12 * * * cd /path/to/project && npx md2red health --notify
```

环境要求：Node.js 18+，Google Chrome 或 Chromium。

## 注意事项

- **默认私密发布** — 所有笔记默认设为"仅自己可见"，这是安全机制，不会意外公开发布
- **非官方 API** — 小红书发布基于浏览器自动化，如果小红书更新 UI，选择器可能需要更新。运行 `md2red validate` 检查
- **Cookie 过期** — 登录态约 7 天过期，使用 `md2red health` 监控
- **AI 内容标注** — 所有生成的图片包含"AI 辅助生成"水印，符合小红书规范

## 技术栈

- **TypeScript** + Node.js (ESM)
- **React** (SSR 图片卡片渲染)
- **Playwright** (截图 + 小红书自动化)
- **unified/remark** (Markdown 解析 + rehype HTML 渲染)
- **Shiki** (语法高亮)
- **Gemini / OpenAI / Anthropic** (内容策略)
- **Zod** (配置验证)
- **Commander.js** (CLI)

## 许可证

MIT
