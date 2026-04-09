---
name: md2red-generate
description: Convert Markdown files to Xiaohongshu (RED) style carousel image cards. Use this skill when the user asks to "generate XHS cards", "convert markdown to xiaohongshu images", "create RED post images", "make social media cards from markdown", or wants to turn a .md file into visual carousel cards for Xiaohongshu/RED platform.
version: 0.5.1
---

# Markdown to Xiaohongshu Image Cards

Convert Markdown documents into Xiaohongshu (RED) style carousel image cards using the `md2red` CLI tool.

## Prerequisites Check

Before generating, verify md2red is installed:

```bash
md2red --version
```

If not installed, guide the user:
```bash
git clone https://github.com/LLM-X-Factorer/md2red.git
cd md2red && npm install && npm run build:all
```

## Workflow

### Step 1: Identify the Markdown File

The user provides a Markdown file path via `$ARGUMENTS` or in conversation context. If no file is specified, check the current directory for `.md` files and ask the user which one to convert.

### Step 2: Generate Image Cards

**With LLM strategy** (recommended — generates better titles, summaries, tags, and card layouts):

```bash
md2red generate -s "$ARGUMENTS"
```

Requires one of these environment variables set: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `SILICONFLOW_API_KEY`.

**Direct mode** (no LLM needed):

```bash
md2red generate "$ARGUMENTS"
```

**Common options:**

| Flag | Description |
|------|-------------|
| `-s, --strategy` | Use LLM to plan content layout |
| `-t, --theme <name>` | Theme: `dark` (default) or `light` |
| `--cards <number>` | Max number of cards (default: 9) |
| `-o, --output <dir>` | Custom output directory |

### Step 3: Report Results

After generation completes, report to the user:
1. Number of images generated
2. Output directory path
3. Mention they can open `preview.html` in a browser to preview and edit
4. Mention they can use the "one-click copy" button in preview to copy title + summary + tags (in `#tag#` format) for pasting directly into Xiaohongshu

### Step 4: Full Pipeline (Alternative)

For a complete one-command flow (parse + strategy + generate + open preview):

```bash
md2red run "$ARGUMENTS"
```

This automatically opens the interactive preview in the browser after generation.

## Markdown Format Guide

The ideal Markdown structure for XHS cards:

```markdown
---
title: Article Title
---

## Cover

This text becomes the cover card subtitle.

## Section 1

Content for the first card...

## Section 2

- Lists render correctly
- **Bold** and *italic* supported

## Code Example

\`\`\`python
def hello():
    print("Hello!")
\`\`\`
```

**Key rules:**
- `H1` or frontmatter `title` becomes the cover card title
- `## Cover` (or `## 封面`) merges into the cover card as subtitle
- Each `H2` section becomes one content card
- Code blocks become syntax-highlighted code cards
- A summary card is auto-generated as the last card

## Output

Generated files in the output directory:
- `01-cover.png`, `02-content.png`, ... — Image cards (1080x1440px, 3:4 ratio)
- `strategy.json` — Content strategy data (titles, summary, tags)
- `preview.html` — Interactive preview page (open in browser)

## Configuration

If the user needs to customize settings, they can create `md2red.config.yml`:

```bash
md2red init
```

Key config options:
- `llm.provider`: `gemini` | `openai` | `anthropic` | `siliconflow`
- `images.theme`: `dark` | `light`
- `content.maxCards`: Max cards (default 9)
- `content.minCards`: Min cards (default 5, auto-supplements if LLM generates fewer)
