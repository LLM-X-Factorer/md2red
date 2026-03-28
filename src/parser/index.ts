import { readFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join, extname } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { toString } from 'mdast-util-to-string';
import { parse as parseYaml } from 'yaml';
import type { Root, Heading, Yaml } from 'mdast';
import { splitIntoBlocks } from './splitter.js';
import { downloadImage } from '../utils/image.js';
import { logger } from '../utils/logger.js';
import type { ParsedDocument, ImageReference } from './types.js';

export type { ParsedDocument, ContentBlock, CodeSnippet, ImageReference } from './types.js';

export async function parseMarkdown(filePath: string): Promise<ParsedDocument> {
  const absPath = resolve(filePath);
  const raw = await readFile(absPath, 'utf-8');
  const sourceDir = dirname(absPath);

  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .parse(raw) as Root;

  const frontmatter = extractFrontmatter(tree);
  const title = extractTitle(tree, frontmatter);
  const contentBlocks = splitIntoBlocks(tree);
  const images = collectImages(contentBlocks);

  // Resolve image paths and download remote images
  await resolveImages(images, sourceDir);

  const hasCodeBlocks = contentBlocks.some((b) => b.codeSnippets && b.codeSnippets.length > 0);
  const wordCount = contentBlocks.reduce((sum, b) => sum + b.textContent.length, 0);

  return {
    frontmatter,
    title,
    contentBlocks,
    images,
    metadata: {
      wordCount,
      estimatedCards: Math.min(9, Math.max(3, contentBlocks.length + 1)),
      hasCodeBlocks,
      sourceFile: absPath,
    },
  };
}

async function resolveImages(images: ImageReference[], sourceDir: string): Promise<void> {
  const tmpDir = join(sourceDir, '.md2red-tmp', 'images');

  for (const img of images) {
    if (img.isLocal) {
      img.localPath = resolve(sourceDir, img.originalPath);
    } else {
      try {
        await mkdir(tmpDir, { recursive: true });
        const ext = extname(new URL(img.originalPath).pathname) || '.png';
        const filename = `img-${Date.now()}${ext}`;
        const destPath = join(tmpDir, filename);
        logger.info(`下载图片: ${img.originalPath}`);
        await downloadImage(img.originalPath, destPath);
        img.localPath = destPath;
        logger.success(`图片已下载: ${destPath}`);
      } catch (err) {
        logger.warn(`图片下载失败: ${img.originalPath} - ${(err as Error).message}`);
      }
    }
  }
}

function extractFrontmatter(tree: Root): Record<string, unknown> {
  const yamlNode = tree.children.find((n) => n.type === 'yaml') as Yaml | undefined;
  if (!yamlNode) return {};
  try {
    return parseYaml(yamlNode.value) || {};
  } catch {
    return {};
  }
}

function extractTitle(tree: Root, frontmatter: Record<string, unknown>): string {
  if (typeof frontmatter.title === 'string') return frontmatter.title;
  const h1 = tree.children.find(
    (n) => n.type === 'heading' && (n as Heading).depth === 1,
  ) as Heading | undefined;
  return h1 ? toString(h1) : 'Untitled';
}

function collectImages(blocks: Array<{ images?: ImageReference[] }>): ImageReference[] {
  return blocks.flatMap((b) => b.images || []);
}
