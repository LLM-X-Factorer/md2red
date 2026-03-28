import { route, json, readBody } from '../router.js';
import { createTask, updateTask, completeTask, failTask, addListener } from '../task-manager.js';
import { getQrCode, waitForLogin, closeBrowser, setHeadless } from '../../publisher/index.js';
import { loadCookies, saveCookies, getCookieExpiry, type CookieData } from '../../publisher/cookie.js';
import { loadConfig } from '../../config/index.js';

route('GET', '/api/auth/status', async (_req, res) => {
  try {
    const config = await loadConfig();
    const cookies = await loadCookies(config.xhs.cookiePath);
    if (!cookies || cookies.length === 0) {
      json(res, { loggedIn: false, reason: '无 Cookie 文件' });
      return;
    }

    const now = Date.now() / 1000;
    const KEY_COOKIES = ['a1', 'web_session', 'webId'];
    const xhsCookies = cookies.filter((c) => c.domain.includes('xiaohongshu'));
    const keyCookies = xhsCookies.filter((c) => KEY_COOKIES.includes(c.name));

    if (keyCookies.length === 0) {
      json(res, { loggedIn: false, reason: '缺少关键 Cookie' });
      return;
    }

    // Check if any key cookie with a real expiry has expired
    // expires=-1 means session cookie (valid until browser closes, treat as valid)
    const expiredKey = keyCookies.find((c) => c.expires > 0 && c.expires < now);
    if (expiredKey) {
      json(res, { loggedIn: false, reason: `Cookie "${expiredKey.name}" 已过期` });
      return;
    }

    // Calculate hours remaining from key cookies (ignore session cookies with expires=-1)
    const keyWithExpiry = keyCookies.filter((c) => c.expires > 0);
    const hoursRemaining = keyWithExpiry.length > 0
      ? Math.round((Math.min(...keyWithExpiry.map((c) => c.expires)) - now) / 3600 * 10) / 10
      : null;

    json(res, { loggedIn: true, hoursRemaining });
  } catch {
    json(res, { loggedIn: false });
  }
});

route('POST', '/api/auth/login', async (_req, res) => {
  try {
    const config = await loadConfig();
    setHeadless(false);

    const qrCode = await getQrCode(config.xhs.cookiePath);
    const task = createTask('auth-login');

    // Wait for login in background
    (async () => {
      updateTask(task.id, { step: 1, total: 1, message: '等待扫码...' });
      const success = await waitForLogin(config.xhs.cookiePath, 240000);
      await closeBrowser();
      if (success) {
        completeTask(task.id, { loggedIn: true });
      } else {
        failTask(task.id, '扫码超时');
      }
    })();

    json(res, { taskId: task.id, qrCode });
  } catch (err) {
    await closeBrowser();
    json(res, { error: (err as Error).message }, 500);
  }
});

route('GET', '/api/auth/poll/:taskId', (req, res, params) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  addListener(params.taskId, res);
});

route('POST', '/api/auth/cookie', async (req, res) => {
  try {
    const config = await loadConfig();
    const body = JSON.parse(await readBody(req));
    const rawCookie: string = body.cookie;

    let cookies: CookieData;

    // Try parsing as JSON array first (e.g. from EditThisCookie export)
    try {
      const parsed = JSON.parse(rawCookie);
      if (Array.isArray(parsed)) {
        cookies = parsed.map((c: Record<string, unknown>) => ({
          name: String(c.name || ''),
          value: String(c.value || ''),
          domain: String(c.domain || '.xiaohongshu.com'),
          path: String(c.path || '/'),
          expires: Number(c.expirationDate || c.expires || -1),
          httpOnly: Boolean(c.httpOnly),
          secure: Boolean(c.secure),
          sameSite: (c.sameSite as 'Lax') || 'Lax',
        }));
      } else {
        throw new Error('not array');
      }
    } catch {
      // Parse as "key=value; key=value" string format
      cookies = rawCookie
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((pair) => {
          const idx = pair.indexOf('=');
          return {
            name: pair.slice(0, idx).trim(),
            value: pair.slice(idx + 1).trim(),
            domain: '.xiaohongshu.com',
            path: '/',
            expires: -1,
            httpOnly: false,
            secure: true,
            sameSite: 'Lax' as const,
          };
        })
        .filter((c) => c.name);
    }

    if (cookies.length === 0) {
      json(res, { ok: false, error: 'Cookie 解析失败，格式不正确' }, 400);
      return;
    }

    await saveCookies(config.xhs.cookiePath, cookies);
    json(res, { ok: true, count: cookies.length });
  } catch (err) {
    json(res, { ok: false, error: (err as Error).message }, 500);
  }
});
