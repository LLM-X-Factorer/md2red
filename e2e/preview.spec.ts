import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer, type Server } from 'node:http';

const CLI = 'node dist/cli/index.js';
const SAMPLE = 'examples/sample-article.md';

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
}

let outputDir: string;
let server: Server;
let serverUrl: string;

test.beforeAll(async () => {
  // Generate images + preview HTML
  outputDir = join(tmpdir(), `md2red-e2e-preview-${Date.now()}`);
  run(`${CLI} generate ${SAMPLE} -o ${outputDir}`);

  // Generate preview HTML
  const { generatePreview } = await import('../dist/preview/index.js');
  const strategyRaw = await readFile(join(outputDir, 'strategy.json'), 'utf-8');
  const strategy = JSON.parse(strategyRaw);
  await generatePreview({ outputDir, strategy });

  // Serve preview HTML via HTTP (like the real preview command does)
  const html = await readFile(join(outputDir, 'preview.html'), 'utf-8');
  server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/save-plan') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', async () => {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(join(outputDir, 'publish-plan.json'), body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      serverUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.afterAll(async () => {
  server?.close();
  await rm(outputDir, { recursive: true, force: true });
});

test.describe('preview page', () => {
  test('loads and shows first card', async ({ page }) => {
    await page.goto(serverUrl);
    await page.waitForTimeout(500);

    // Counter should show "1 / N"
    const counter = await page.textContent('#counter');
    expect(counter).toMatch(/^1 \/ \d+$/);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto(serverUrl);
    await page.waitForTimeout(500);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const counter = await page.textContent('#counter');
    expect(counter).toMatch(/^2 \/ \d+$/);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    const counter2 = await page.textContent('#counter');
    expect(counter2).toMatch(/^1 \/ \d+$/);
  });

  test('thumbnail click navigates to card', async ({ page }) => {
    await page.goto(serverUrl);
    await page.waitForTimeout(500);

    // Click third thumbnail
    const thumbs = page.locator('#sortable .thumb-item img');
    const count = await thumbs.count();
    expect(count).toBeGreaterThanOrEqual(5);

    await thumbs.nth(2).click();
    await page.waitForTimeout(200);
    const counter = await page.textContent('#counter');
    expect(counter).toMatch(/^3 \/ \d+$/);
  });

  test('delete card reduces count', async ({ page }) => {
    await page.goto(serverUrl);
    await page.waitForTimeout(500);

    const initialCount = await page.locator('#sortable .thumb-item').count();

    // Hover over second thumb and click delete
    const secondThumb = page.locator('#sortable .thumb-item').nth(1);
    await secondThumb.hover();
    await secondThumb.locator('.thumb-del').click();
    await page.waitForTimeout(200);

    const newCount = await page.locator('#sortable .thumb-item').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('title section shows at least one option', async ({ page }) => {
    await page.goto(serverUrl);
    const titleSection = page.locator('#titleOptions');
    const text = await titleSection.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('custom title input works', async ({ page }) => {
    await page.goto(serverUrl);
    const input = page.locator('#customTitle');
    await input.fill('自定义测试标题');
    await page.waitForTimeout(200);

    // Radio buttons should be unchecked
    const checked = await page.locator('input[name="title"]:checked').count();
    expect(checked).toBe(0);
  });

  test('summary box is editable', async ({ page }) => {
    await page.goto(serverUrl);
    const summaryBox = page.locator('#summaryBox');
    await summaryBox.fill('修改后的摘要内容');
    const value = await summaryBox.inputValue();
    expect(value).toBe('修改后的摘要内容');
  });

  test('add and remove tags', async ({ page }) => {
    await page.goto(serverUrl);

    // Add a tag
    await page.locator('#tagInput').fill('测试标签');
    await page.locator('#tagInput').press('Enter');
    await page.waitForTimeout(200);

    const tags = page.locator('#tagList .tag');
    const lastTag = await tags.last().textContent();
    expect(lastTag).toContain('测试标签');

    // Remove it
    const initialCount = await tags.count();
    await tags.last().locator('.del').click();
    await page.waitForTimeout(200);
    expect(await tags.count()).toBe(initialCount - 1);
  });

  test('confirm button saves publish-plan.json', async ({ page }) => {
    await page.goto(serverUrl);
    await page.waitForTimeout(500);

    // Set custom title
    await page.locator('#customTitle').fill('E2E测试标题');
    // Edit summary
    await page.locator('#summaryBox').fill('E2E测试摘要');

    // Click confirm
    await page.locator('.btn-confirm').click();
    await page.waitForTimeout(1000);

    // Verify publish-plan.json was saved
    const planRaw = await readFile(join(outputDir, 'publish-plan.json'), 'utf-8');
    const plan = JSON.parse(planRaw);
    expect(plan.title).toBe('E2E测试标题');
    expect(plan.summary).toBe('E2E测试摘要');
    expect(plan.imageOrder).toBeDefined();
    expect(plan.imageOrder.length).toBeGreaterThanOrEqual(1);
    expect(plan.confirmedAt).toBeDefined();
  });

  test('toast appears after confirm', async ({ page }) => {
    await page.goto(serverUrl);
    await page.waitForTimeout(500);

    await page.locator('.btn-confirm').click();
    await page.waitForTimeout(500);

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible();
    const text = await toast.textContent();
    expect(text).toContain('已保存');
  });
});
