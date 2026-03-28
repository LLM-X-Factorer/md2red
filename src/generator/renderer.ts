import { chromium, type Browser } from 'playwright';
import { execSync } from 'node:child_process';

let browser: Browser | null = null;

function findChrome(): string | undefined {
  const paths = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const p of paths) {
    if (!p) continue;
    try {
      execSync(`test -x ${p}`, { stdio: 'ignore' });
      return p;
    } catch { continue; }
  }
  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    const executablePath = findChrome();
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : { channel: 'chrome' }),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
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
