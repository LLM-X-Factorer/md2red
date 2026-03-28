import { test, expect } from '@playwright/test';
import { type ChildProcess, spawn } from 'node:child_process';

const PORT = 13002;
const BASE = `http://localhost:${PORT}`;
let serverProcess: ChildProcess;

test.beforeAll(async () => {
  serverProcess = spawn('node', ['dist/web/server.js'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  });

  await new Promise<void>((resolve) => {
    const check = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/api/history`);
        if (res.ok) { clearInterval(check); resolve(); }
      } catch { /* not ready */ }
    }, 200);
    setTimeout(() => { clearInterval(check); resolve(); }, 10000);
  });
});

test.afterAll(() => {
  serverProcess?.kill();
});

test.describe('web UI', () => {
  test('dashboard loads and shows title', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('h2')).toContainText('控制台');
  });

  test('navigation sidebar has all links', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('nav')).toContainText('首页');
    await expect(page.locator('nav')).toContainText('上传生成');
    await expect(page.locator('nav')).toContainText('账号登录');
    await expect(page.locator('nav')).toContainText('发布历史');
    await expect(page.locator('nav')).toContainText('设置');
  });

  test('navigate to upload page', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=上传生成');
    await expect(page.locator('h2')).toContainText('上传 Markdown');
  });

  test('navigate to auth page', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=账号登录');
    await expect(page.locator('h2')).toContainText('小红书登录');
  });

  test('navigate to history page', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=发布历史');
    await expect(page.locator('h2')).toContainText('发布历史');
  });

  test('navigate to settings page', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=设置');
    await expect(page.locator('h2')).toContainText('设置');
  });

  test('dashboard shows auth status', async ({ page }) => {
    await page.goto(BASE);
    // Wait for auth check to complete (may take a few seconds)
    await page.waitForTimeout(8000);
    const text = await page.locator('body').textContent() || '';
    // Should show login status or a login link
    const hasStatus = text.includes('已登录') || text.includes('未登录') || text.includes('去登录') || text.includes('检查中');
    expect(hasStatus).toBe(true);
  });

  test('settings page shows config sections', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText('LLM 设置');
    await expect(page.locator('body')).toContainText('图片设置');
    await expect(page.locator('body')).toContainText('内容设置');
  });

  test('upload page has drag zone', async ({ page }) => {
    await page.goto(`${BASE}/upload`);
    await expect(page.locator('body')).toContainText('拖拽');
  });
});
