import { logger } from '../utils/logger.js';

export interface NotificationConfig {
  enabled: boolean;
  webhookUrl?: string;
  webhookType: 'generic' | 'wechat-work' | 'telegram';
}

export async function sendNotification(
  config: NotificationConfig,
  message: string,
): Promise<void> {
  if (!config.enabled || !config.webhookUrl) {
    logger.debug('通知未启用或未配置 webhook URL');
    return;
  }

  const body = formatBody(config.webhookType, message);

  try {
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      logger.warn(`Webhook 发送失败: ${res.status} ${res.statusText}`);
    } else {
      logger.success('通知已发送');
    }
  } catch (err) {
    logger.warn(`Webhook 请求失败: ${(err as Error).message}`);
  }
}

function formatBody(
  type: string,
  message: string,
): Record<string, unknown> {
  switch (type) {
    case 'wechat-work':
      return {
        msgtype: 'markdown',
        markdown: { content: `**md2red 告警**\n${message}` },
      };
    case 'telegram':
      return {
        text: `🔔 md2red: ${message}`,
        parse_mode: 'Markdown',
      };
    default:
      return {
        event: 'md2red.health',
        message,
        timestamp: new Date().toISOString(),
      };
  }
}
