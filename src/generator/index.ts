import React from 'react';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import type { ParsedDocument } from '../parser/types.js';
import type { ContentStrategy, CardPlan } from '../strategy/index.js';
import { getTheme } from './themes/index.js';
import { renderReactCard, closeBrowser } from './render-react.js';
import { highlightCode } from './highlighter.js';
import { CoverCard } from './components/CoverCard.js';
import { ContentCard } from './components/ContentCard.js';
import { CodeCard } from './components/CodeCard.js';
import { SummaryCard } from './components/SummaryCard.js';
import { logger } from '../utils/logger.js';

export interface GenerateOptions {
  outputDir: string;
  theme?: string;
  maxCards?: number;
}

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
    const title = card.title || '';
    const body = card.bodyText || '';

    if (card.type === 'cover') {
      await renderReactCard(
        React.createElement(CoverCard, {
          theme, title, subtitle: body,
          tags: strategy.tags.slice(0, 4),
        }),
        outPath,
      );
    } else if (card.type === 'code' && card.codeSnippet) {
      const code = truncateCode(card.codeSnippet.code, 25);
      const codeHtml = await highlightCode(code, card.codeSnippet.language, isDark);
      await renderReactCard(
        React.createElement(CodeCard, {
          theme, heading: title,
          description: body.slice(0, 150),
          language: card.codeSnippet.language, codeHtml, pageNum,
        }),
        outPath,
      );
    } else if (card.type === 'summary') {
      const points = body.split('\n').filter((l) => l.trim());
      await renderReactCard(
        React.createElement(SummaryCard, {
          theme, heading: title, points, cta: '关注我获取更多技术干货 👋',
        }),
        outPath,
      );
    } else {
      await renderReactCard(
        React.createElement(ContentCard, {
          theme, heading: title,
          bodyHtml: textToHtml(body), pageNum,
        }),
        outPath,
      );
    }

    outputPaths.push(outPath);
    logger.success(`卡片 ${card.index + 1}/${total} [${card.type}]: ${outPath}`);
  }

  await closeBrowser();
  return outputPaths;
}

export async function generateImages(
  doc: ParsedDocument,
  options: GenerateOptions,
): Promise<string[]> {
  const { outputDir, theme: themeName = 'dark', maxCards = 9 } = options;
  await mkdir(outputDir, { recursive: true });

  const theme = getTheme(themeName);
  const isDark = themeName !== 'light';
  const outputPaths: string[] = [];

  // 1. Cover
  const coverPath = join(outputDir, '01-cover.png');
  const coverSubtitle = doc.coverText || `共 ${doc.metadata.wordCount} 字 · ${doc.contentBlocks.length} 个章节`;
  await renderReactCard(
    React.createElement(CoverCard, {
      theme, title: doc.title,
      subtitle: coverSubtitle,
    }),
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
        .split('\n').filter((l) => l.trim()).slice(0, 3).join(' ').slice(0, 120);
      await renderReactCard(
        React.createElement(CodeCard, {
          theme, heading: block.heading || '代码示例',
          description: desc, language: snippet.language, codeHtml, pageNum,
        }),
        outPath,
      );
    } else {
      const bodyMd = stripHeading(block.markdownContent, block.heading ? `## ${block.heading}` : undefined)
        || stripHeading(block.markdownContent, block.heading);
      await renderReactCard(
        React.createElement(ContentCard, {
          theme, heading: block.heading || '',
          bodyHtml: textToHtml(bodyMd), pageNum,
        }),
        outPath,
      );
    }
    outputPaths.push(outPath);
    logger.success(`卡片 ${i + 2}: ${outPath}`);
  }

  // 3. Summary
  const summaryPath = join(outputDir, `${String(blocks.length + 2).padStart(2, '0')}-summary.png`);
  const points = doc.contentBlocks.filter((b) => b.heading).slice(0, 5).map((b) => b.heading!);
  await renderReactCard(
    React.createElement(SummaryCard, {
      theme, heading: '总结', points, cta: '关注我获取更多技术干货 👋',
    }),
    summaryPath,
  );
  outputPaths.push(summaryPath);
  logger.success(`总结页: ${summaryPath}`);

  // Auto-generate strategy.json for direct mode (so preview sidebar works)
  const autoStrategy = {
    titles: [doc.title],
    summary: doc.contentBlocks
      .map((b) => stripHeading(b.textContent, b.heading))
      .filter((t) => t.trim())
      .join('\n')
      .slice(0, 500),
    tags: [] as string[],
    cardPlan: outputPaths.map((p, i) => ({
      index: i,
      type: i === 0 ? 'cover' : i === outputPaths.length - 1 ? 'summary' : 'content',
      title: i === 0 ? doc.title : doc.contentBlocks[i - 1]?.heading || '',
      bodyText: '',
      layoutHint: 'text-heavy',
    })),
  };
  await writeFile(join(outputDir, 'strategy.json'), JSON.stringify(autoStrategy, null, 2));

  await closeBrowser();
  return outputPaths;
}

function textToHtml(text: string): string {
  // Try Markdown rendering first
  try {
    const result = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text);
    return String(result);
  } catch {
    // Fallback to simple paragraphs
    return text.split('\n').filter((l) => l.trim())
      .map((l) => `<p>${escapeHtml(l)}</p>`).join('\n');
  }
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
