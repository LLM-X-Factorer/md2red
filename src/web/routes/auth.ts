import { route, json } from '../router.js';
import { createTask, updateTask, completeTask, failTask, addListener } from '../task-manager.js';
import { checkLogin, getQrCode, waitForLogin, closeBrowser, setHeadless } from '../../publisher/index.js';
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
