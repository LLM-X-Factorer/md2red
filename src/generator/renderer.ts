import { chromium, type Browser } from 'playwright';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch();
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function renderHtml(html: string, outputPath: string): Promise<void> {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setViewportSize({ width: 1080, height: 1440 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();
}
