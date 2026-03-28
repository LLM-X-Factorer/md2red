import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../config/index.js';
import { checkLogin, getQrCode, waitForLogin, logout, closeBrowser } from '../../publisher/index.js';
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

    // Get QR code
    logger.info('获取登录二维码...');
    const qrBase64 = await getQrCode(config.xhs.cookiePath);

    // Save QR code to temp file for easy access
    const qrPath = join(tmpdir(), 'md2red-qrcode.html');
    const html = `<!DOCTYPE html><html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111"><div style="text-align:center"><h2 style="color:#fff;margin-bottom:20px">用小红书 App 扫码登录</h2><img src="${qrBase64}" style="width:300px;height:300px"/><p style="color:#888;margin-top:20px">扫码后此页面将自动关闭</p></div></body></html>`;
    await writeFile(qrPath, html);
    logger.info(`二维码已保存，用浏览器打开: ${qrPath}`);

    // Try to open in browser
    const { exec } = await import('node:child_process');
    exec(`open "${qrPath}" 2>/dev/null || xdg-open "${qrPath}" 2>/dev/null`);

    // Wait for scan
    const success = await waitForLogin(config.xhs.cookiePath, 240000);
    if (!success) {
      process.exit(1);
    }
  } catch (err) {
    logger.error(`登录失败: ${(err as Error).message}`);
  } finally {
    await closeBrowser();
  }
}

export async function authLogoutCommand(opts: { config?: string }) {
  const config = await loadConfig(opts.config);
  await logout(config.xhs.cookiePath);
}
