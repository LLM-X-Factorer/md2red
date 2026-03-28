# md2red

Markdown to Xiaohongshu (RED) image-text note converter & publisher.

Transform your technical articles into beautifully formatted carousel posts (1080×1440 image cards), ready for publishing to Xiaohongshu.

## Features

- **Markdown Parsing** — Splits Markdown into structured content blocks by H2 headings, extracts code blocks, images, and frontmatter
- **Image Card Generation** — Generates 1080×1440 PNG cards via Playwright screenshot (cover, content, code, summary templates)
- **Syntax Highlighting** — Shiki-powered code highlighting with Catppuccin theme
- **LLM Content Strategy** — Optional Gemini API integration for generating XHS-style titles, summaries, tags, and card layout plans
- **Dark & Light Themes** — Two built-in color schemes
- **XHS Publishing** — Playwright-based browser automation for publishing to Xiaohongshu creator center (private visibility by default)
- **QR Code Auth** — Headless-compatible login via QR code scan
- **Config System** — YAML config with Zod validation and env var support

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Parse a Markdown file (view structure)
node dist/cli/index.js parse examples/sample-article.md

# Generate image cards (direct mode)
node dist/cli/index.js generate examples/sample-article.md

# Generate with LLM strategy (requires GEMINI_API_KEY)
GEMINI_API_KEY=your-key node dist/cli/index.js generate -s examples/sample-article.md

# Generate with light theme
node dist/cli/index.js generate -t light examples/sample-article.md
```

## CLI Commands

```
md2red parse <file>              Parse Markdown and output structure info
  -o, --output <path>            Save parsed JSON to file

md2red generate <file>           Parse and generate image cards
  -o, --output <dir>             Output directory
  -t, --theme <name>             Theme: dark or light
  -s, --strategy                 Use LLM to plan content layout
  --cards <number>               Max number of cards
  -c, --config <path>            Config file path

md2red publish <dir>             Publish to Xiaohongshu
  --dry-run                      Simulate without posting
  --force                        Force re-publish

md2red auth login                Login via QR code scan
md2red auth check                Check login status
md2red auth logout               Clear saved cookies
```

## Configuration

Create `md2red.config.yml` in your project root:

```yaml
llm:
  provider: gemini
  model: gemini-2.5-flash
  apiKey: ${GEMINI_API_KEY}

xhs:
  visibility: 仅自己可见   # ALWAYS private by default
  publishDelay: 3000

images:
  theme: dark              # dark | light
  brandColor: '#6366f1'

content:
  maxCards: 9
  targetAudience: 技术开发者
  style: technical         # technical | casual | mixed
```

## Architecture

```
Markdown File
    ↓
[Parser]        remark → MDAST → ContentBlocks
    ↓
[Strategy]      Gemini API → titles, summary, tags, card plan (optional)
    ↓
[Generator]     HTML templates + Playwright → 1080×1440 PNG cards
    ↓
[Publisher]     Playwright → creator.xiaohongshu.com (private visibility)
```

## Project Structure

```
src/
├── cli/            CLI entry point & commands
├── parser/         Markdown parsing & content splitting
├── strategy/       LLM content strategy (Gemini)
├── generator/      HTML templates → PNG rendering (Playwright + Shiki)
├── publisher/      XHS browser automation (auth, publish)
├── config/         YAML config loading & validation
└── utils/          Logger, image download, hashing
```

## Tech Stack

- TypeScript + Node.js
- Playwright (image generation & XHS automation)
- unified/remark (Markdown parsing)
- Shiki (syntax highlighting)
- Gemini API (content strategy)
- Zod (config validation)
- Commander.js (CLI)

## Development Status

- [x] Phase 1: Project setup, CLI, parser, basic image generation
- [x] Phase 2: Config system, Gemini integration, Shiki highlighting, publisher scaffold
- [ ] Phase 3: Preview page, state tracker, publish testing, error handling

## License

MIT
