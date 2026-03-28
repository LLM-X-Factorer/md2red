import { route, json, readBody } from '../router.js';
import { createTask, updateTask, completeTask, failTask, addListener } from '../task-manager.js';
import { checkLogin, getQrCode, waitForLogin, closeBrowser, setHeadless } from '../../publisher/index.js';
import { saveCookies, type CookieData } from '../../publisher/cookie.js';
import { loadConfig } from '../../config/index.js';

route('GET', '/api/auth/status', async (_req, res) => {
  try {
    const config = await loadConfig();
    const loggedIn = await checkLogin(config.xhs.cookiePath);
    await closeBrowser();
    json(res, { loggedIn });
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
