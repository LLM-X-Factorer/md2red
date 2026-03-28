import { createPage, persistCookies, closeBrowser } from './xhs-browser.js';
import { XHS_URLS, SELECTORS } from './xhs-selectors.js';
import { resilientFind } from './selector-resilience.js';
import { logger } from '../utils/logger.js';
import type { Page } from 'playwright';

// Shared page for auth flow (getQrCode + waitForLogin use the same page)
let authPage: Page | null = null;

export async function checkLogin(cookiePath: string): Promise<boolean> {
  const page = await createPage(cookiePath);
  try {
    await page.goto(XHS_URLS.explore, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const loggedIn = (await page.$(SELECTORS.loginSuccess.primary)) !== null;
    if (loggedIn) {
      await persistCookies(cookiePath);
    }
    return loggedIn;
  } catch {
    return false;
  }
}

export async function getQrCode(cookiePath: string): Promise<string> {
  authPage = await createPage(cookiePath);
  await authPage.goto(XHS_URLS.explore, { waitUntil: 'domcontentloaded' });
  await authPage.waitForTimeout(2000);

  if (await authPage.$(SELECTORS.loginSuccess.primary)) {
    await persistCookies(cookiePath);
    throw new Error('已经登录，无需扫码');
  }

  const qrImg = await resilientFind(authPage, 'loginQrCode', 10000);
  const src = await qrImg.getAttribute('src');
  if (!src) throw new Error('无法获取二维码图片');

  return src;
}

export async function waitForLogin(
  cookiePath: string,
  timeoutMs: number = 240000,
): Promise<boolean> {
  // Use the same page from getQrCode
  const page = authPage || await createPage(cookiePath);
  if (!authPage) {
    await page.goto(XHS_URLS.explore, { waitUntil: 'domcontentloaded' });
  }

  logger.info('等待扫码登录...');
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      if (await page.$(SELECTORS.loginSuccess.primary)) {
        await persistCookies(cookiePath);
        logger.success('登录成功');
        authPage = null;
        return true;
      }
    } catch {
      // Page might have navigated or been refreshed
    }
    await page.waitForTimeout(1000);
  }

  logger.error('扫码超时');
  authPage = null;
  return false;
}

export async function logout(cookiePath: string): Promise<void> {
  await closeBrowser();
  const { unlink } = await import('node:fs/promises');
  const { homedir } = await import('node:os');
  const resolved = cookiePath.replace(/^~/, homedir());
  try {
    await unlink(resolved);
    logger.success('已登出，cookies 已删除');
  } catch {
    logger.info('无 cookies 文件');
  }
}
