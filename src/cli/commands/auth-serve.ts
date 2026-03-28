import { createServer } from 'node:http';
import { loadConfig } from '../../config/index.js';
import { getQrCode, waitForLogin, closeBrowser } from '../../publisher/index.js';
import { logger } from '../../utils/logger.js';

export async function authServeCommand(opts: { config?: string; port?: string }) {
  const config = await loadConfig(opts.config);
  const port = parseInt(opts.port || '9876', 10);

  let qrBase64: string;
  try {
    logger.info('获取登录二维码...');
    qrBase64 = await getQrCode(config.xhs.cookiePath);
  } catch (err) {
    logger.error((err as Error).message);
    await closeBrowser();
    return;
  }

  let loginSuccess = false;

  const server = createServer((req, res) => {
    if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ loggedIn: loginSuccess }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>md2red 登录</title>
<style>
  body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #111; font-family: sans-serif; }
  .box { text-align: center; }
  h2 { color: #fff; margin-bottom: 20px; }
  img { width: 300px; height: 300px; border-radius: 12px; }
  p { color: #888; margin-top: 20px; }
  .success { color: #4ade80; font-size: 24px; }
</style>
</head><body>
<div class="box" id="box">
  <h2>用小红书 App 扫码登录</h2>
  <img src="${qrBase64}" />
  <p>扫码后页面将自动提示登录成功</p>
</div>
<script>
  setInterval(async () => {
    const res = await fetch('/status');
    const { loggedIn } = await res.json();
    if (loggedIn) {
      document.getElementById('box').innerHTML = '<p class="success">✅ 登录成功！可以关闭此页面</p>';
    }
  }, 2000);
</script>
</body></html>`);
  });

  server.listen(port, () => {
    logger.success(`扫码页面已启动: http://localhost:${port}`);
    logger.info('用浏览器打开上述地址，用小红书 App 扫码');
  });

  // Wait for login in background
  loginSuccess = await waitForLogin(config.xhs.cookiePath, 240000);
  await closeBrowser();

  // Keep server alive briefly so frontend sees success
  setTimeout(() => {
    server.close();
    logger.info('服务已关闭');
    process.exit(loginSuccess ? 0 : 1);
  }, 5000);
}
