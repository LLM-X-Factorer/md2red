import type { Page } from 'playwright';
import { createPage, persistCookies, closeBrowser } from './xhs-browser.js';
import { XHS_URLS, SELECTORS } from './xhs-selectors.js';
import { resilientFind, resilientExists } from './selector-resilience.js';
import { logger } from '../utils/logger.js';

export interface AuthStatus {
  loggedIn: boolean;
  qrCodeBase64?: string;
}

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
  } finally {
    await page.close();
  }
}

export async function getQrCode(cookiePath: string): Promise<string> {
  const page = await createPage(cookiePath);
  try {
    await page.goto(XHS_URLS.explore, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check if already logged in
    if (await page.$(SELECTORS.loginSuccess.primary)) {
      await persistCookies(cookiePath);
      throw new Error('已经登录，无需扫码');
    }

    // Extract QR code base64
    const qrImg = await resilientFind(page, 'loginQrCode', 10000);
    const src = await qrImg.getAttribute('src');
    if (!src) throw new Error('无法获取二维码图片');

    return src; // data:image/png;base64,...
  } finally {
    await page.close();
  }
}

export async function waitForLogin(
  cookiePath: string,
  timeoutMs: number = 240000,
): Promise<boolean> {
  const page = await createPage(cookiePath);
  try {
    await page.goto(XHS_URLS.explore, { waitUntil: 'domcontentloaded' });

    logger.info('等待扫码登录...');
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (await page.$(SELECTORS.loginSuccess.primary)) {
        await persistCookies(cookiePath);
        logger.success('登录成功');
        return true;
      }
      await page.waitForTimeout(1000);
    }

    logger.error('扫码超时');
    return false;
  } finally {
    await page.close();
  }
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
