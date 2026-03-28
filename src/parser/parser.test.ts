import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown } from './index.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
