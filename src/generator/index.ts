import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ParsedDocument } from '../parser/types.js';
import type { ContentStrategy, CardPlan } from '../strategy/index.js';
import { getTheme } from './themes/index.js';
import { renderCard, closeBrowser } from './renderer.js';
import { highlightCode } from './highlighter.js';
import { logger } from '../utils/logger.js';

export interface GenerateOptions {
  outputDir: string;
  theme?: string;
  maxCards?: number;
}

// Strategy-driven generation (Phase 2 - with LLM plan)
export async function generateFromStrategy(
  doc: ParsedDocument,
  strategy: ContentStrategy,
  options: GenerateOptions,
): Promise<string[]> {
  const { outputDir, theme: themeName = 'dark' } = options;
  await mkdir(outputDir, { recursive: true });

  const theme = getTheme(themeName);
  const isDark = themeName !== 'light';
  const outputPaths: string[] = [];
  const total = strategy.cardPlan.length;

  for (const card of strategy.cardPlan) {
    const idx = String(card.index + 1).padStart(2, '0');
    const outPath = join(outputDir, `${idx}-${card.type}.png`);
    const pageNum = `${card.index + 1} / ${total}`;

    if (card.type === 'cover') {
      const tagHtml = strategy.tags
        .slice(0, 4)
        .map((t) => `<span class="tag">#${t}</span>`)
        .join('');
      await renderCard('cover', { title: card.title, subtitle: card.bodyText, tags: tagHtml }, theme, outPath);
    } else if (card.type === 'code' && card.codeSnippet) {
      const code = truncateCode(card.codeSnippet.code, 25);
      const codeHtml = await highlightCode(code, card.codeSnippet.language, isDark);
      await renderCard(
        'code',
        {
          heading: card.title,
          description: card.bodyText.slice(0, 150),
          language: card.codeSnippet.language,
          codeHtml,
          pageNum,
        },
        theme,
        outPath,
      );
    } else if (card.type === 'summary') {
      const pointsHtml = card.bodyText
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => `<div class="point">${escapeHtml(l)}</div>`)
        .join('\n');
      await renderCard(
        'summary',
        { heading: card.title, pointsHtml, cta: '关注我获取更多技术干货 👋' },
        theme,
        outPath,
      );
    } else {
      await renderCard(
        'content',
        { heading: card.title, bodyHtml: textToHtml(card.bodyText), pageNum },
        theme,
        outPath,
      );
    }

    outputPaths.push(outPath);
    logger.success(`卡片 ${card.index + 1}/${total} [${card.type}]: ${outPath}`);
  }

  await closeBrowser();
  return outputPaths;
}

// Direct generation from parsed doc (Phase 1 fallback - no LLM needed)
export async function generateImages(
  doc: ParsedDocument,
  options: GenerateOptions,
): Promise<string[]> {
  const { outputDir, theme: themeName = 'dark', maxCards = 9 } = options;
  await mkdir(outputDir, { recursive: true });

  const theme = getTheme(themeName);
  const isDark = themeName !== 'light';
  const outputPaths: string[] = [];

  // 1. Cover card
  const coverPath = join(outputDir, '01-cover.png');
  await renderCard(
    'cover',
    {
      title: doc.title,
      subtitle: `共 ${doc.metadata.wordCount} 字 · ${doc.contentBlocks.length} 个章节`,
      tags: '',
    },
    theme,
    coverPath,
  );
  outputPaths.push(coverPath);
  logger.success(`封面图: ${coverPath}`);

  // 2. Content cards
  const blocks = doc.contentBlocks.slice(0, maxCards - 2);
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const pageNum = `${i + 2} / ${blocks.length + 2}`;
    const outPath = join(outputDir, `${String(i + 2).padStart(2, '0')}-content.png`);

    if (block.codeSnippets?.length) {
      const snippet = block.codeSnippets[0];
      const code = truncateCode(snippet.code, 25);
      const codeHtml = await highlightCode(code, snippet.language, isDark);
      const desc = stripHeading(block.textContent, block.heading)
        .split('\n')
        .filter((l) => l.trim())
        .slice(0, 3)
        .join(' ')
        .slice(0, 120);
      await renderCard(
        'code',
        { heading: block.heading || '代码示例', description: desc, language: snippet.language, codeHtml, pageNum },
        theme,
        outPath,
      );
    } else {
      const bodyText = stripHeading(block.textContent, block.heading);
      await renderCard(
        'content',
        { heading: block.heading || '', bodyHtml: textToHtml(bodyText), pageNum },
        theme,
        outPath,
      );
    }
    outputPaths.push(outPath);
    logger.success(`卡片 ${i + 2}: ${outPath}`);
  }

  // 3. Summary card
  const summaryPath = join(outputDir, `${String(blocks.length + 2).padStart(2, '0')}-summary.png`);
  const points = doc.contentBlocks
    .filter((b) => b.heading)
    .slice(0, 5)
    .map((b) => `<div class="point">${escapeHtml(b.heading!)}</div>`)
    .join('\n');

  await renderCard(
    'summary',
    { heading: '总结', pointsHtml: points, cta: '关注我获取更多技术干货 👋' },
    theme,
    summaryPath,
  );
  outputPaths.push(summaryPath);
  logger.success(`总结页: ${summaryPath}`);

  await closeBrowser();
  return outputPaths;
}

function textToHtml(text: string): string {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripHeading(text: string, heading?: string): string {
  if (!heading) return text;
  const lines = text.split('\n');
  const idx = lines.findIndex((l) => l.trim() === heading.trim());
  if (idx >= 0) lines.splice(idx, 1);
  return lines.join('\n').trim();
}

function truncateCode(code: string, maxLines: number): string {
  const lines = code.split('\n');
  if (lines.length <= maxLines) return code;
  return lines.slice(0, maxLines).join('\n') + '\n// ...';
}
