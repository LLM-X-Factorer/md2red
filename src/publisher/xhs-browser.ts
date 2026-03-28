import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { loadCookies, saveCookies, type CookieData } from './cookie.js';
import { randomUserAgent, applyStealthScripts } from './stealth.js';
import { logger } from '../utils/logger.js';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let chromeProcess: ChildProcess | null = null;
let headlessMode = process.env.MD2RED_HEADLESS !== 'false';

export function setHeadless(headless: boolean): void {
  headlessMode = headless;
}

function findChrome(): string {
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
  return 'google-chrome';
}

async function launchChromeAndConnect(): Promise<Browser> {
  const chromePath = findChrome();
  const userAgent = randomUserAgent();
  const debugPort = 19222 + Math.floor(Math.random() * 1000);

  // Launch Chrome as a normal process (not via Playwright) to avoid automation markers
  const args = [
    `--remote-debugging-port=${debugPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    `--user-agent=${userAgent}`,
    '--lang=zh-CN',
    headlessMode ? '--headless=new' : '',
    'about:blank',
  ].filter(Boolean);

  logger.debug?.(`启动 Chrome: ${chromePath} (port ${debugPort})`);

  chromeProcess = spawn(chromePath, args, {
    stdio: 'ignore',
    detached: false,
  });

  // Wait for Chrome to start accepting CDP connections
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) break;
    } catch { /* not ready */ }
  }

  // Connect Playwright to the running Chrome via CDP
  const b = await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
  logger.info('已连接到 Chrome (CDP 模式)');
  return b;
}

export async function launchBrowser(): Promise<Browser> {
  if (browser) return browser;

  // Try CDP connection mode first (better anti-detection)
  try {
    browser = await launchChromeAndConnect();
    return browser;
  } catch (err) {
    logger.debug?.(`CDP 模式失败: ${(err as Error).message}，回退到 Playwright 直接启动`);
  }

  // Fallback: Playwright direct launch
  browser = await chromium.launch({
    headless: headlessMode,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  return browser;
}

export async function getContext(cookiePath: string): Promise<BrowserContext> {
  if (context) return context;

  const b = await launchBrowser();

  // CDP mode: use the existing default context
  const contexts = b.contexts();
  if (contexts.length > 0) {
    context = contexts[0];
  } else {
    context = await b.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: randomUserAgent(),
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    });
  }

  await applyStealthScripts(context);

  const cookies = await loadCookies(cookiePath);
  if (cookies) {
    await context.addCookies(cookies);
    logger.info('已加载保存的 cookies');
  }

  return context;
}

export async function createPage(cookiePath: string): Promise<Page> {
  const ctx = await getContext(cookiePath);
  const pages = ctx.pages();
  // CDP mode may have an existing blank page
  if (pages.length > 0 && pages[0].url() === 'about:blank') {
    return pages[0];
  }
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
    try { await context.close(); } catch { /* ok */ }
    context = null;
  }
  if (browser) {
    try { await browser.close(); } catch { /* ok */ }
    browser = null;
  }
  if (chromeProcess) {
    try { chromeProcess.kill(); } catch { /* ok */ }
    chromeProcess = null;
  }
}
