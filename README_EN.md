# md2red

Markdown to Xiaohongshu (RED) image-text note converter & publisher.

Transform your technical articles into beautifully formatted carousel posts (1080×1440 image cards), ready for publishing to Xiaohongshu.

**Verified:** End-to-end tested — Markdown → 8 image cards → published to Xiaohongshu (private) successfully.

## Features

- **Markdown Parsing** — Splits Markdown into structured content blocks by H2 headings, extracts code blocks, images, and frontmatter
- **React SSR Image Cards** — React components rendered to 1080×1440 PNG via Playwright (cover, content, code, summary)
- **Syntax Highlighting** — Shiki-powered code highlighting with Catppuccin themes (dark/light)
- **Markdown Rendering** — Lists, bold, italic, inline code rendered via remark-rehype pipeline
- **Multi-LLM Strategy** — Gemini, OpenAI, or Anthropic for generating XHS-style titles, summaries, tags, and card plans
- **Interactive Preview** — Browser-based editor: drag-sort cards, delete cards, edit title/summary/tags, export publish plan
- **Content Quality Loop** — Scrape published note metrics, feed top-performing patterns back into LLM prompts
- **Anti-Automation** — Browser stealth, human behavior simulation, selector resilience with fallbacks, exponential backoff retry
- **Cookie Health Monitoring** — Proactive expiry detection, webhook alerts (WeChat Work/Telegram), remote QR login server
- **XHS Publishing** — Headful Chrome automation for creator center, private visibility by default, draft mode support
- **Dark & Light Themes** — Two built-in color schemes with typed Theme interface
- **State Tracking** — Publish history with duplicate detection (SHA256 hash)
- **Web Console** — Vite + React + Tailwind browser dashboard for non-technical users
- **Docker Deployment** — One-command containerized deployment with Chrome + Xvfb

## Two Ways to Use

**CLI Mode** — for developers:
```bash
md2red generate article.md && md2red preview md2red-output/article/ && md2red publish md2red-output/article/
```

**Web Console Mode** — deploy to server, operate via browser:
```bash
docker compose up -d    # visit http://server-ip:3001
```

## Installation

```bash
git clone https://github.com/LLM-X-Factorer/md2red.git
cd md2red
npm install
npm run build
```

### Prerequisites

- **Node.js 20+**
- **Google Chrome** — md2red uses your system Chrome for XHS automation (not Chromium)
- **Xiaohongshu account** — you need the XHS mobile app to scan QR code for login

## Usage Guide

### Step 1: Initialize Configuration

```bash
md2red init
```

This creates `md2red.config.yml` in the current directory. The defaults work out of the box — no configuration is required for basic usage.

If you want LLM-powered content strategy (better titles, summaries, and card layout), set your API key:

```bash
# Pick one:
export GEMINI_API_KEY=your-key      # Google Gemini
export OPENAI_API_KEY=your-key      # OpenAI
export ANTHROPIC_API_KEY=your-key   # Anthropic Claude
```

### Step 2: Login to Xiaohongshu

```bash
md2red auth login
```

A Chrome window will open showing the Xiaohongshu login page. Use your XHS mobile app to scan the QR code. Once scanned, the CLI will save cookies automatically.

Cookies last about 7 days. Check status anytime:

```bash
md2red auth check
```

For remote servers (no GUI), use the HTTP login server:

```bash
md2red auth serve --port 9876
# Open http://your-server:9876 in any browser to scan QR code
```

### Step 3: Generate Image Cards

**Direct mode** (no LLM needed):

```bash
md2red generate my-article.md
```

**LLM strategy mode** (generates better titles, summaries, tags, and card layout):

```bash
md2red generate -s my-article.md
```

Options:

```bash
md2red generate my-article.md -t light     # Light theme
md2red generate my-article.md --cards 6    # Limit to 6 cards
md2red generate my-article.md -o ./output  # Custom output directory
```

Output goes to `md2red-output/<article-name>/` by default, containing:
- `01-cover.png`, `02-content.png`, ... `08-summary.png` — image cards
- `strategy.json` — content strategy data (titles, summary, tags)

### Step 4: Preview and Edit

```bash
md2red preview md2red-output/my-article/
```

A browser window opens with an interactive editor where you can:
- **Browse cards** — arrow keys or click thumbnails
- **Drag-sort** — rearrange card order by dragging thumbnails
- **Delete cards** — remove cards you don't want
- **Edit title** — select from LLM candidates or type a custom one
- **Edit summary** — modify the post body text
- **Add/remove tags** — manage hashtags

Click **"确认发布方案"** to save your choices as `publish-plan.json`.

### Step 5: Publish

```bash
# Publish to Xiaohongshu (private visibility by default)
md2red publish md2red-output/my-article/

# Save as draft instead
md2red publish --draft md2red-output/my-article/

# Dry run (see what would be published, without actually posting)
md2red publish --dry-run md2red-output/my-article/
```

The publish command reads `publish-plan.json` (from preview) if available, otherwise falls back to `strategy.json`.

Publishing opens a Chrome window, uploads images, fills in title/body, sets visibility to "仅自己可见" (private), and clicks publish.

### One-Command Pipeline

```bash
md2red run my-article.md
```

This runs the full pipeline: parse → LLM strategy (if API key set) → generate images → open preview. After previewing, publish manually with `md2red publish`.

## Markdown Format

md2red works best with standard Markdown:

```markdown
---
title: Your Article Title
tags: [tag1, tag2]
---

# Main Title

Introduction paragraph...

## Section 1

Content for the first card...

## Section 2

- List items are supported
- **Bold** and *italic* work
- `inline code` too

## Code Example

\`\`\`typescript
function hello() {
  console.log('Hello!');
}
\`\`\`

## Conclusion

Summary content...
```

**How content maps to cards:**
- `H1` or frontmatter `title` → cover card title
- Each `H2` section → one content card
- Code blocks → code cards with syntax highlighting
- Final card → auto-generated summary

## CLI Commands

```
Core:
  md2red run <file>                Full pipeline: parse → strategy → generate → preview
    --force                        Re-generate even if already processed
    --no-publish                   Skip publish prompt

  md2red parse <file>              Parse Markdown and output structure
    -o, --output <path>            Save parsed JSON to file

  md2red generate <file>           Parse and generate image cards
    -s, --strategy                 Use LLM to plan content layout
    -t, --theme <name>             Theme: dark or light
    --cards <number>               Max number of cards

  md2red preview <dir>             Interactive preview editor in browser
    -p, --port <number>            Server port (0 = auto)

  md2red publish <dir>             Publish to Xiaohongshu
    --dry-run                      Simulate without posting
    --draft                        Save as draft instead of publishing
    --force                        Force publish even if already published

Authentication:
  md2red auth login                Login via QR code (opens Chrome window)
  md2red auth serve                Start HTTP server for remote QR login
    -p, --port <number>            Port (default: 9876)
  md2red auth check                Check login session status
  md2red auth logout               Clear saved cookies

Monitoring:
  md2red health                    Check cookie health status
    --notify                       Send webhook on failure
    --live                         Do live session check
  md2red validate                  Test XHS page selectors
  md2red stats                     View published notes performance
  md2red scrape [id]               Scrape metrics for published notes

Utility:
  md2red history                   View publish history
  md2red history clear             Clear all history
  md2red init                      Generate config file
```

## Configuration

Create `md2red.config.yml` in your project root (or run `md2red init`):

```yaml
llm:
  provider: gemini           # gemini | openai | anthropic
  # model: gemini-2.5-flash  # optional, auto-resolved per provider
  apiKey: ${GEMINI_API_KEY}  # supports env var substitution
  temperature: 0.7
  maxTokens: 4096

xhs:
  visibility: 仅自己可见      # ALWAYS private by default
  publishDelay: 3000
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
  maxCards: 9
  targetAudience: 技术开发者
  style: technical           # technical | casual | mixed
```

## Architecture

```
Markdown File
    ↓
[Parser]        remark → MDAST → ContentBlocks
    ↓
[Strategy]      LLM (Gemini/OpenAI/Claude) → titles, summary, tags, card plan
    ↓                                        ← feedback from historical metrics
[Generator]     React SSR → HTML → Playwright screenshot → 1080×1440 PNG
    ↓
[Preview]       Interactive HTML editor (drag-sort, edit, confirm)
    ↓                                        → publish-plan.json
[Publisher]     Headful Chrome + stealth → creator.xiaohongshu.com (private)
    ↓
[Tracker]       ~/.md2red/history.json (dedup, metrics, status)
```

## Server Deployment

md2red can run on a headless server (e.g., Tencent Cloud Lighthouse):

```bash
# Remote QR login (access from any browser)
md2red auth serve --port 9876

# Cron-based health monitoring
0 */12 * * * cd /path/to/project && npx md2red health --notify
```

Requirements: Node.js 20+, Google Chrome or Chromium.

## Important Notes

- **Private by default** — all notes are published as "仅自己可见" (private). This is a safety measure and cannot be accidentally overridden.
- **No official API** — XHS publishing uses browser automation. If Xiaohongshu updates their UI, selectors may need updating. Run `md2red validate` to check.
- **Cookie expiration** — login sessions last ~7 days. Use `md2red health` to monitor.
- **AI content labeling** — all generated images include an "AI 辅助生成" watermark per XHS requirements.

## License

MIT
