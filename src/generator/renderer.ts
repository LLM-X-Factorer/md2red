import { chromium, type Browser } from 'playwright';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser) return browser;
  browser = await chromium.launch({ headless: true });
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    try { await browser.close(); } catch { /* ok */ }
    browser = null;
  }
}

export async function renderHtml(html: string, outputPath: string): Promise<void> {
  const b = await getBrowser();
  const contexts = b.contexts();
  const ctx = contexts.length > 0 ? contexts[0] : await b.newContext();
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1080, height: 1440 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();
}
