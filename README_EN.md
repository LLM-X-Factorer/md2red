# md2red

Transform Markdown documents into Xiaohongshu (RED) style carousel image cards. Export generated images and post manually.

## Features

- **Markdown Parsing** — Splits Markdown into structured content blocks by H2 headings, extracts code blocks, images, and frontmatter; `## 封面` (cover) H2 auto-merges into the cover card
- **React SSR Image Cards** — Cover, content, code, and summary card templates at 1080×1440 pixels (3:4 ratio)
- **Syntax Highlighting** — Shiki-powered code highlighting with Catppuccin themes (dark/light)
- **Markdown Rendering** — Lists, bold, italic, inline code rendered via remark-rehype pipeline
- **Multi-LLM Strategy** — Gemini, OpenAI, Anthropic, or SiliconFlow for generating XHS-style titles, summaries, tags, and card plans; auto-repairs truncated JSON with retry and graceful fallback to direct mode
- **Interactive Preview** — Browser-based editor: drag-sort cards, delete cards, edit title/summary/tags
- **Export Package** — Download zip with all card images + copytext file for manual posting to any platform
- **Dark & Light Themes** — Two built-in color schemes
- **State Tracking** — Generation history with duplicate detection (SHA256 hash)
- **Web Console** — Light-themed Vite + React + Tailwind browser dashboard with export and history management
- **Docker Deployment** — One-command containerized deployment with Playwright Chromium + Chinese fonts

## Two Ways to Use

**CLI Mode** — for developers:
```bash
md2red run article.md
# Generate images → open preview → export zip for manual posting
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
npm run build:all
```

### Prerequisites

- **Node.js 20+**
- Playwright Chromium is auto-installed (used for image rendering/screenshots)

## Usage Guide

### Step 1: Initialize Configuration

```bash
md2red init
```

Creates `md2red.config.yml` in the current directory. Defaults work out of the box.

For LLM-powered content strategy (better titles, summaries, and card layout), set your API key:

```bash
# Pick one:
export GEMINI_API_KEY=your-key        # Google Gemini
export OPENAI_API_KEY=your-key        # OpenAI
export ANTHROPIC_API_KEY=your-key     # Anthropic Claude
export SILICONFLOW_API_KEY=your-key   # SiliconFlow (recommended for China)
```

### Step 2: Generate Image Cards

**Direct mode** (no LLM needed):

```bash
md2red generate my-article.md
```

**LLM strategy mode**:

```bash
md2red generate -s my-article.md
```

Options:

```bash
md2red generate my-article.md -t light     # Light theme
md2red generate my-article.md --cards 6    # Limit to 6 cards
md2red generate my-article.md -o ./output  # Custom output directory
```

Output goes to `md2red-output/<article-name>/` by default.

### Step 3: Preview and Edit

```bash
md2red preview md2red-output/my-article/
```

Interactive editor in the browser: browse cards, drag-sort, delete, edit title/summary/tags.

### Step 4: Export

Click **"Export images + copytext"** in the preview page to download a zip with all images and copytext for manual posting.

### One-Command Pipeline

```bash
md2red run my-article.md
```

Runs the full pipeline: parse → LLM strategy (if API key set) → generate images → open preview.

## Markdown Format

```markdown
---
title: Your Article Title
tags: [tag1, tag2]
---

# Main Title

## 封面

This text becomes the cover card subtitle,
instead of rendering as a separate content card.

## Section 1

Content for the first card...

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
- `## 封面` (cover) → merged into cover card as subtitle (not a separate card)
- Each `H2` section → one content card
- Code blocks → code cards with syntax highlighting
- Final card → auto-generated summary

## CLI Commands

```
Core:
  md2red run <file>                Full pipeline: parse → strategy → generate → preview
    --force                        Re-generate even if already processed

  md2red parse <file>              Parse Markdown and output structure
    -o, --output <path>            Save parsed JSON to file

  md2red generate <file>           Parse and generate image cards
    -s, --strategy                 Use LLM to plan content layout
    -t, --theme <name>             Theme: dark or light
    --cards <number>               Max number of cards

  md2red preview <dir>             Interactive preview editor in browser
    -p, --port <number>            Server port (0 = auto)

Utility:
  md2red history                   View generation history
  md2red history clear             Clear all history
  md2red init                      Generate config file
```

## Configuration

Create `md2red.config.yml` in your project root (or run `md2red init`):

```yaml
llm:
  provider: gemini           # gemini | openai | anthropic | siliconflow
  # Default models: gemini → gemini-2.5-flash, openai → gpt-4o,
  #   anthropic → claude-sonnet-4, siliconflow → Qwen3-30B-A3B
  apiKey: ${GEMINI_API_KEY}  # supports env var substitution
  temperature: 0.7
  maxTokens: 4096

images:
  theme: dark                # dark | light
  brandColor: '#6366f1'

content:
  maxCards: 9
  targetAudience: tech developers
  style: technical           # technical | casual | mixed
```

## Architecture

```
Markdown File
    ↓
[Parser]        remark → MDAST → ContentBlocks
    ↓
[Strategy]      LLM (Gemini/OpenAI/Claude/SiliconFlow) → titles, summary, tags, card plan
    ↓
[Generator]     React SSR → HTML → Playwright screenshot → 1080×1440 PNG
    ↓
[Preview]       Interactive HTML editor (drag-sort, edit, confirm)
    ↓
[Export]         Images + copytext → zip download → manual posting
```

## Docker Deployment

```bash
git clone https://github.com/LLM-X-Factorer/md2red.git /opt/md2red
cd /opt/md2red
echo "GEMINI_API_KEY=your-key" > .env
docker compose build && docker compose up -d
# Visit http://server-ip:3001
```

**Password protection:**
```bash
echo "MD2RED_PASSWORD=your-password" >> .env
```

## License

MIT
