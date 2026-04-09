---
name: md2red-preview
description: Preview and edit generated Xiaohongshu image cards. Use this skill when the user asks to "preview XHS cards", "edit card order", "open md2red preview", or wants to view, reorder, or export previously generated image cards.
version: 0.5.1
---

# Preview and Edit XHS Cards

Open the interactive preview editor for previously generated Xiaohongshu image cards.

## Workflow

### Step 1: Identify the Output Directory

The user provides an output directory via `$ARGUMENTS`, or you can find recent outputs:

```bash
md2red history
```

This lists all previously generated card sets with their output directories.

### Step 2: Open Preview

```bash
md2red preview "$ARGUMENTS"
```

This starts a local server and opens the interactive preview in the browser where the user can:
- **Browse cards** — Arrow keys or click thumbnails
- **Drag-sort** — Reorder cards by dragging thumbnails
- **Delete cards** — Remove unwanted cards
- **Edit title** — Select from LLM candidates or type custom title
- **Edit summary** — Modify the post body text
- **Manage tags** — Add/remove tags (displayed in `#tag#` format)
- **One-click copy** — Copy title + summary + tags to clipboard, ready to paste into Xiaohongshu
- **Export** — Download zip with all images + copytext file

### Step 3: Alternative — Direct File Preview

If the user just wants to view the preview without starting a server, they can open the `preview.html` file directly:

```bash
open "$ARGUMENTS/preview.html"
```

### Step 4: Export

The user can export from the preview page, or use the output directory directly. The exported zip contains:
- All image cards (PNG, 1080x1440px)
- `发布文案.txt` — Ready-to-use copytext with title, summary, and tags in `#tag#` XHS format
