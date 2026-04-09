import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown } from './index.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(__dirname, '..', '..', 'examples', 'sample-article.md');

describe('parseMarkdown', () => {
  it('extracts title from frontmatter', async () => {
    const doc = await parseMarkdown(SAMPLE);
    assert.equal(doc.title, '用 TypeScript 构建 CLI 工具的完整指南');
  });

  it('extracts frontmatter fields', async () => {
    const doc = await parseMarkdown(SAMPLE);
    assert.equal(doc.frontmatter.author, 'md2red');
    assert.deepEqual(doc.frontmatter.tags, ['TypeScript', 'CLI', 'Node.js']);
  });

  it('splits into multiple content blocks', async () => {
    const doc = await parseMarkdown(SAMPLE);
    assert.ok(doc.contentBlocks.length >= 4, `Expected >=4 blocks, got ${doc.contentBlocks.length}`);
  });

  it('identifies code blocks', async () => {
    const doc = await parseMarkdown(SAMPLE);
    const codeBlocks = doc.contentBlocks.filter((b) => b.codeSnippets && b.codeSnippets.length > 0);
    assert.ok(codeBlocks.length >= 1, 'Should have at least 1 code block');
  });

  it('code snippets have language set', async () => {
    const doc = await parseMarkdown(SAMPLE);
    const withCode = doc.contentBlocks.find((b) => b.codeSnippets?.length);
    assert.ok(withCode);
    assert.ok(withCode.codeSnippets![0].language, 'Code snippet should have language');
  });

  it('sets metadata correctly', async () => {
    const doc = await parseMarkdown(SAMPLE);
    assert.ok(doc.metadata.wordCount > 0);
    assert.ok(doc.metadata.estimatedCards >= 3);
    assert.equal(doc.metadata.hasCodeBlocks, true);
    assert.ok(doc.metadata.sourceFile.endsWith('sample-article.md'));
  });

  it('textContent does not contain raw code', async () => {
    const doc = await parseMarkdown(SAMPLE);
    const codeBlock = doc.contentBlocks.find((b) => b.type === 'code-block');
    if (codeBlock) {
      // textContent should NOT contain the code itself
      assert.ok(!codeBlock.textContent.includes('npm install'), 'textContent should not contain code');
    }
  });
});

describe('cover text extraction', () => {
  const tmpFile = join(tmpdir(), `md2red-test-cover-${Date.now()}.md`);

  it('extracts coverText when first H2 is "封面"', async () => {
    const md = `# 测试标题

## 封面

AI 不是随机引用的。它有一套选人标准。

知道这 5 个信号，你的内容被引用的概率会大不一样。

## 信号一：内容匹配度

这是第一个信号的内容。
`;
    await writeFile(tmpFile, md, 'utf-8');
    const doc = await parseMarkdown(tmpFile);

    assert.ok(doc.coverText, 'coverText should be set');
    assert.ok(doc.coverText!.includes('AI 不是随机引用的'), 'coverText should contain cover content');
    // "封面" block should be removed from contentBlocks
    assert.ok(
      !doc.contentBlocks.some((b) => b.heading === '封面'),
      'contentBlocks should not contain "封面" block',
    );
    // Other content should still be present
    assert.ok(doc.contentBlocks.length > 0, 'contentBlocks should not be empty');
    assert.ok(
      doc.contentBlocks.some((b) => b.textContent.includes('信号一')),
      'contentBlocks should still contain other sections',
    );
    await unlink(tmpFile);
  });

  it('does not extract coverText when first H2 is not "封面"', async () => {
    const md = `# 测试标题

## 第一章

普通内容。

## 第二章

更多内容。
`;
    await writeFile(tmpFile, md, 'utf-8');
    const doc = await parseMarkdown(tmpFile);

    assert.equal(doc.coverText, undefined, 'coverText should be undefined');
    assert.ok(doc.contentBlocks.length >= 1, 'Should have content blocks');
    assert.ok(
      doc.contentBlocks.some((b) => b.textContent.includes('第一章')),
      'First H2 content should remain',
    );
    await unlink(tmpFile);
  });

  it('does not leak frontmatter YAML into content blocks', async () => {
    const md = `---
title: "AI决定引用谁的5个信号"
tags: [GEO优化, AI搜索]
---

# AI决定引用谁的5个信号

## 封面

AI 不是随机引用的。

## 信号一

第一个信号的内容。
`;
    await writeFile(tmpFile, md, 'utf-8');
    const doc = await parseMarkdown(tmpFile);

    // No block should contain raw frontmatter text
    for (const block of doc.contentBlocks) {
      assert.ok(
        !block.textContent.includes('tags:'),
        `Block "${block.heading}" should not contain frontmatter YAML`,
      );
    }
    // H1 title should not appear as a content block heading
    assert.ok(
      !doc.contentBlocks.some((b) => b.heading === 'AI决定引用谁的5个信号'),
      'H1 title should not appear as content block heading',
    );
    await unlink(tmpFile);
  });
});
