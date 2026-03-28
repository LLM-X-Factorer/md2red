import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { loadCookies, saveCookies, type CookieData } from './cookie.js';
import { logger } from '../utils/logger.js';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

export async function launchBrowser(): Promise<Browser> {
  if (browser) return browser;

  browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  return browser;
}

export async function getContext(cookiePath: string): Promise<BrowserContext> {
  if (context) return context;

  const b = await launchBrowser();
  context = await b.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'zh-CN',
  });

  // Stealth: hide webdriver flag
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(window, 'chrome', { get: () => ({ runtime: {} }) });
  });

  // Load saved cookies
  const cookies = await loadCookies(cookiePath);
  if (cookies) {
    await context.addCookies(cookies);
    logger.info('已加载保存的 cookies');
  }

  return context;
}

export async function createPage(cookiePath: string): Promise<Page> {
  const ctx = await getContext(cookiePath);
  return ctx.newPage();
}

export async function persistCookies(cookiePath: string): Promise<void> {
  if (!context) return;
  const cookies = (await context.cookies()) as CookieData;
  await saveCookies(cookiePath, cookies);
  logger.info('Cookies 已保存');
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}
