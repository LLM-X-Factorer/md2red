import type { Root, Content, Heading, Code, Image } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { nanoid } from 'nanoid';
import type { ContentBlock, CodeSnippet, ImageReference } from './types.js';

const SHORT_THRESHOLD = 50;
const LONG_THRESHOLD = 300;

export function splitIntoBlocks(tree: Root): ContentBlock[] {
  const sections = splitByH2(tree.children);
  const blocks: ContentBlock[] = [];

  for (const section of sections) {
    const raw = buildBlock(section);
    if (raw.textContent.length > LONG_THRESHOLD) {
      blocks.push(...subSplit(section));
    } else {
      blocks.push(raw);
    }
  }

  return mergeShortBlocks(blocks);
}

function splitByH2(nodes: Content[]): Content[][] {
  const sections: Content[][] = [];
  let current: Content[] = [];

  for (const node of nodes) {
    // Skip YAML frontmatter and H1 — already extracted by parser
    if (node.type === 'yaml') continue;
    if (node.type === 'heading' && (node as Heading).depth === 1) continue;

    if (node.type === 'heading' && (node as Heading).depth === 2) {
      if (current.length > 0) sections.push(current);
      current = [node];
    } else {
      current.push(node);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections;
}

function subSplit(nodes: Content[]): ContentBlock[] {
  const sub: Content[][] = [];
  let current: Content[] = [];

  for (const node of nodes) {
    const isBreak =
      (node.type === 'heading' && (node as Heading).depth === 3) ||
      (node.type === 'code');
    if (isBreak && current.length > 0) {
      sub.push(current);
      current = [node];
    } else {
      current.push(node);
    }
  }
  if (current.length > 0) sub.push(current);
  return sub.map(buildBlock);
}

function mergeShortBlocks(blocks: ContentBlock[]): ContentBlock[] {
  const merged: ContentBlock[] = [];
  for (const block of blocks) {
    const prev = merged[merged.length - 1];
    if (prev && prev.textContent.length < SHORT_THRESHOLD) {
      prev.textContent += '\n' + block.textContent;
      prev.markdownContent += '\n\n' + block.markdownContent;
      prev.type = 'mixed';
      if (block.codeSnippets?.length) {
        prev.codeSnippets = [...(prev.codeSnippets || []), ...block.codeSnippets];
      }
      if (block.images?.length) {
        prev.images = [...(prev.images || []), ...block.images];
      }
      prev.estimatedLength = estimateLength(prev.textContent);
    } else {
      merged.push(block);
    }
  }
  return merged;
}

function buildBlock(nodes: Content[]): ContentBlock {
  let heading: string | undefined;
  const codeSnippets: CodeSnippet[] = [];
  const images: ImageReference[] = [];
  const mdParts: string[] = [];
  const textParts: string[] = [];

  let hasCode = false;
  let hasImage = false;

  for (const node of nodes) {
    if (node.type === 'heading') {
      const text = toString(node);
      heading = text;
      textParts.push(text);
      mdParts.push('#'.repeat((node as Heading).depth) + ' ' + text);
    } else if (node.type === 'code') {
      hasCode = true;
      const code = node as Code;
      codeSnippets.push({
        language: code.lang || 'text',
        code: code.value,
        filename: code.meta || undefined,
      });
      mdParts.push('```' + (code.lang || '') + '\n' + code.value + '\n```');
    } else if (node.type === 'image') {
      hasImage = true;
      const img = node as Image;
      images.push({
        originalPath: img.url,
        localPath: img.url,
        alt: img.alt || '',
        isLocal: !img.url.startsWith('http'),
      });
      mdParts.push(`![${img.alt || ''}](${img.url})`);
    } else {
      const text = toString(node);
      textParts.push(text);
      mdParts.push(text);
    }
  }

  const fullText = textParts.join('\n');
  const type: ContentBlock['type'] = hasCode
    ? 'code-block'
    : hasImage
      ? 'image-block'
      : heading
        ? 'heading-section'
        : 'mixed';

  return {
    id: nanoid(8),
    type,
    heading,
    textContent: fullText,
    markdownContent: mdParts.join('\n\n'),
    codeSnippets: codeSnippets.length ? codeSnippets : undefined,
    images: images.length ? images : undefined,
    estimatedLength: estimateLength(fullText),
  };
}

function estimateLength(text: string): 'short' | 'medium' | 'long' {
  const len = text.length;
  if (len < SHORT_THRESHOLD) return 'short';
  if (len < LONG_THRESHOLD) return 'medium';
  return 'long';
}
