import { loadConfig } from '../../config/index.js';
import { checkCookieHealth } from '../../publisher/health-check.js';
import { sendNotification } from '../../publisher/notify.js';
import { logger } from '../../utils/logger.js';

export async function healthCommand(opts: { config?: string; notify?: boolean; live?: boolean }) {
  try {
    const config = await loadConfig(opts.config);
    const status = await checkCookieHealth(config.xhs.cookiePath, !!opts.live);

    if (status.healthy) {
      logger.success('Cookie 状态健康');
      if (status.cookieInfo.hoursRemaining !== null) {
        logger.info(`距离过期: ${status.cookieInfo.hoursRemaining} 小时`);
      }
      if (status.sessionValid !== undefined) {
        logger.info(`Session 验证: ${status.sessionValid ? '有效' : '无效'}`);
      }
    } else {
      logger.error(`Cookie 状态异常: ${status.reason}`);

      if (opts.notify && config.xhs.healthCheck?.notification) {
        await sendNotification(
          config.xhs.healthCheck.notification,
          status.reason || 'Cookie 状态异常',
        );
      }

      process.exit(1);
    }
  } catch (err) {
    logger.error(`健康检查失败: ${(err as Error).message}`);
    process.exit(1);
  }
}
