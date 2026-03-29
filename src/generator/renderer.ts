import { chromium, type Browser } from 'playwright';
import { spawn, execSync, type ChildProcess } from 'node:child_process';

let browser: Browser | null = null;
let chromeProcess: ChildProcess | null = null;

function findChrome(): string {
  const paths = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
  ];
  for (const p of paths) {
    if (!p) continue;
    try { execSync(`test -x ${p}`, { stdio: 'ignore' }); return p; } catch { continue; }
  }
  return '';
}

async function getBrowser(): Promise<Browser> {
  if (browser) return browser;

  const chromePath = findChrome();

  // If system Chrome available, try CDP mode (avoids Playwright flag issues in Docker)
  if (chromePath) {
    try {
      const port = 29222 + Math.floor(Math.random() * 1000);
      chromeProcess = spawn(chromePath, [
        `--remote-debugging-port=${port}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        'about:blank',
      ], { stdio: 'ignore' });

      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 300));
        try {
          const res = await fetch(`http://127.0.0.1:${port}/json/version`);
          if (res.ok) break;
        } catch { /* not ready */ }
      }

      browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      return browser;
    } catch {
      // CDP failed, clean up and fall through to Playwright
      if (chromeProcess) { try { chromeProcess.kill(); } catch {} chromeProcess = null; }
    }
  }

  // Fallback: Playwright bundled Chromium (works in CI)
  browser = await chromium.launch({ headless: true });
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    try { await browser.close(); } catch { /* ok */ }
    browser = null;
  }
  if (chromeProcess) {
    try { chromeProcess.kill(); } catch { /* ok */ }
    chromeProcess = null;
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
