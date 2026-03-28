import { loadConfig } from '../../config/index.js';
import { checkLogin, waitForLogin, logout, closeBrowser } from '../../publisher/index.js';
import { setHeadless, createPage, persistCookies } from '../../publisher/xhs-browser.js';
import { XHS_URLS, SELECTORS } from '../../publisher/xhs-selectors.js';
import { logger } from '../../utils/logger.js';

export async function authCheckCommand(opts: { config?: string }) {
  try {
    const config = await loadConfig(opts.config);
    const loggedIn = await checkLogin(config.xhs.cookiePath);
    if (loggedIn) {
      logger.success('登录状态有效');
    } else {
      logger.warn('未登录或 cookies 已过期，请运行 `md2red auth login` 重新登录');
    }
  } catch (err) {
    logger.error(`检查失败: ${(err as Error).message}`);
  } finally {
    await closeBrowser();
  }
}

export async function authLoginCommand(opts: { config?: string }) {
  try {
    const config = await loadConfig(opts.config);

    // Use headful mode so user can see and interact with the real XHS page
    setHeadless(false);

    logger.info('打开小红书登录页（浏览器窗口）...');
    const page = await createPage(config.xhs.cookiePath);
    await page.goto(XHS_URLS.explore, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check if already logged in
    if (await page.$(SELECTORS.loginSuccess.primary)) {
      await persistCookies(config.xhs.cookiePath);
      logger.success('已经登录，无需扫码');
      await page.close();
      await closeBrowser();
      return;
    }

    logger.info('请在弹出的浏览器窗口中用小红书 App 扫码登录');
    logger.info('等待扫码（最多 4 分钟）...');

    // Poll for login success
    const deadline = Date.now() + 240000;
    while (Date.now() < deadline) {
      if (await page.$(SELECTORS.loginSuccess.primary)) {
        await persistCookies(config.xhs.cookiePath);
        logger.success('登录成功！Cookies 已保存');
        await page.close();
        await closeBrowser();
        return;
      }
      await page.waitForTimeout(1000);
    }

    logger.error('扫码超时');
    await page.close();
    await closeBrowser();
    process.exit(1);
  } catch (err) {
    logger.error(`登录失败: ${(err as Error).message}`);
    await closeBrowser();
    process.exit(1);
  }
}

export async function authLogoutCommand(opts: { config?: string }) {
  const config = await loadConfig(opts.config);
  await logout(config.xhs.cookiePath);
}
