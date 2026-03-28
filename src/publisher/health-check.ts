import { getCookieExpiry, type CookieExpiryInfo } from './cookie.js';
import { checkLogin } from './xhs-auth.js';
import { closeBrowser } from './xhs-browser.js';

export interface HealthStatus {
  healthy: boolean;
  cookieInfo: CookieExpiryInfo;
  sessionValid?: boolean;
  reason?: string;
}

export async function checkCookieHealth(
  cookiePath: string,
  liveCheck = false,
): Promise<HealthStatus> {
  const cookieInfo = await getCookieExpiry(cookiePath);

  if (!cookieInfo.hasCookies) {
    return { healthy: false, cookieInfo, reason: '无 cookies 文件，需要登录' };
  }

  if (cookieInfo.isExpired) {
    return { healthy: false, cookieInfo, reason: 'Cookies 已过期，需要重新登录' };
  }

  if (cookieInfo.hoursRemaining !== null && cookieInfo.hoursRemaining < 24) {
    const status: HealthStatus = {
      healthy: false,
      cookieInfo,
      reason: `Cookies 将在 ${cookieInfo.hoursRemaining} 小时后过期`,
    };

    if (liveCheck) {
      try {
        status.sessionValid = await checkLogin(cookiePath);
        if (!status.sessionValid) {
          status.reason = 'Session 已失效（服务端已过期）';
        }
      } finally {
        await closeBrowser();
      }
    }

    return status;
  }

  if (liveCheck) {
    try {
      const sessionValid = await checkLogin(cookiePath);
      return {
        healthy: sessionValid,
        cookieInfo,
        sessionValid,
        reason: sessionValid ? undefined : 'Session 验证失败',
      };
    } finally {
      await closeBrowser();
    }
  }

  return { healthy: true, cookieInfo };
}
