# md2red

Markdown to Xiaohongshu (RED) image-text note converter & publisher.

Transform your technical articles into beautifully formatted carousel posts (1080×1440 image cards), ready for publishing to Xiaohongshu.

## Features

- **Markdown Parsing** — Splits Markdown into structured content blocks by H2 headings, extracts code blocks, images, and frontmatter
- **React SSR Image Cards** — React components rendered to 1080×1440 PNG via Playwright (cover, content, code, summary)
- **Syntax Highlighting** — Shiki-powered code highlighting with Catppuccin themes (dark/light)
- **Multi-LLM Strategy** — Gemini, OpenAI, or Anthropic for generating XHS-style titles, summaries, tags, and card plans
- **Content Quality Loop** — Scrape published note metrics, feed top-performing patterns back into LLM prompts
- **Anti-Automation** — Browser stealth, human behavior simulation, selector resilience with fallbacks, exponential backoff retry
- **Cookie Health Monitoring** — Proactive expiry detection, webhook alerts (WeChat Work/Telegram), remote QR login server
- **XHS Publishing** — Playwright browser automation for creator center, private visibility by default
- **Dark & Light Themes** — Two built-in color schemes with typed Theme interface
- **State Tracking** — Publish history with duplicate detection (SHA256 hash)

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Initialize config file
md2red init

# Parse a Markdown file (view structure)
md2red parse examples/sample-article.md

# Generate image cards (direct mode, no LLM needed)
md2red generate examples/sample-article.md

# Generate with LLM strategy (pick one provider)
GEMINI_API_KEY=xxx md2red generate -s examples/sample-article.md
OPENAI_API_KEY=xxx md2red generate -s examples/sample-article.md
ANTHROPIC_API_KEY=xxx md2red generate -s examples/sample-article.md

# Full pipeline: parse → strategy → generate → preview
md2red run examples/sample-article.md

# Preview generated cards in browser
md2red preview md2red-output/sample-article/
```

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

  md2red preview <dir>             Preview cards in browser (standalone HTML)
  md2red publish <dir>             Publish to Xiaohongshu
    --dry-run                      Simulate without posting

Authentication:
  md2red auth login                Login via QR code scan (local)
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
[Preview]       Standalone HTML with carousel, thumbnails, keyboard nav
    ↓
[Publisher]     Playwright + stealth → creator.xiaohongshu.com (private)
    ↓
[Tracker]       ~/.md2red/history.json (dedup, metrics, status)
```

## Project Structure

```
src/
├── cli/               CLI entry point & 14 commands
├── parser/            Markdown parsing & H2-based content splitting
├── strategy/
│   ├── providers/     LLM provider abstraction (Gemini, OpenAI, Anthropic)
│   ├── feedback.ts    Historical performance → prompt enhancement
│   └── prompts.ts     LLM prompt templates
├── generator/
│   ├── components/    React card components (Cover, Content, Code, Summary)
│   ├── themes/        Dark & light theme definitions
│   ├── highlighter.ts Shiki syntax highlighting
│   └── render-react.ts  React SSR → Playwright screenshot pipeline
├── publisher/
│   ├── stealth.ts     Browser fingerprint masking
│   ├── human-behavior.ts  Natural delays, typing, mouse movement
│   ├── selector-resilience.ts  Primary + fallback selector system
│   ├── xhs-publish.ts  Publishing with retry
│   ├── xhs-auth.ts    QR code login flow
│   ├── xhs-scraper.ts  Note metrics scraping
│   ├── health-check.ts Cookie health monitoring
│   └── notify.ts      Webhook notifications
├── preview/           Standalone HTML preview generator
├── tracker/           Publish history & duplicate detection
├── config/            YAML config with Zod validation
└── utils/             Logger, image download, hashing
```

## Tech Stack

- **TypeScript** + Node.js (ESM)
- **React** (SSR for image card rendering)
- **Playwright** (screenshot + XHS automation)
- **unified/remark** (Markdown parsing)
- **Shiki** (syntax highlighting)
- **Gemini / OpenAI / Anthropic** (content strategy)
- **Zod** (config validation)
- **Commander.js** (CLI)

## Server Deployment

md2red can run on a headless server (e.g., Tencent Cloud Lighthouse):

```bash
# Remote QR login (access from any browser)
md2red auth serve --port 9876

# Cron-based health monitoring
0 */12 * * * cd /path/to/project && npx md2red health --notify
```

Requirements: Node.js 18+, Chromium (installed by Playwright).

## License

MIT
