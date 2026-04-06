import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dispatch, json, readBody } from './router.js';
import { isAuthEnabled, checkAuth, handleLogin, handleLogout, serveLoginPage } from './auth-middleware.js';

// Import all route registrations
import './routes/upload.js';
import './routes/generate.js';
import './routes/preview.js';
import './routes/history.js';
import './routes/config.js';
import './routes/tasks.js';
import './routes/export.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const STATIC_DIR = resolve(__dirname, '..', '..', 'web', 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Login/logout endpoints (always accessible)
  if (req.url === '/api/console-login' && req.method === 'POST') {
    const body = await readBody(req);
    handleLogin(req, res, body);
    return;
  }
  if (req.url === '/api/console-logout' && req.method === 'POST') {
    handleLogout(req, res);
    return;
  }
  // Auth status (check if auth is enabled and if user is logged in)
  if (req.url === '/api/console-auth') {
    json(res, { authEnabled: isAuthEnabled(), loggedIn: checkAuth(req) });
    return;
  }

  // Auth check — if password is set, require login
  if (isAuthEnabled() && !checkAuth(req)) {
    // API requests get 401
    if (req.url?.startsWith('/api/')) {
      json(res, { error: '未登录' }, 401);
      return;
    }
    // Static assets (js/css) still need to be served for login page SPA
    const url = (req.url || '/').split('?')[0];
    const ext = extname(url);
    if (ext && ext !== '.html') {
      // Serve static assets even when not logged in
      try {
        const filePath = join(STATIC_DIR, url);
        const content = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
        return;
      } catch { /* fall through to login page */ }
    }
    // Show login page
    serveLoginPage(res);
    return;
  }

  // API routes
  if (req.url?.startsWith('/api/')) {
    const handled = dispatch(req, res);
    if (!handled) {
      json(res, { error: 'Not found' }, 404);
    }
    return;
  }

  // Static file serving (SPA)
  try {
    const url = (req.url || '/').split('?')[0];
    let filePath = join(STATIC_DIR, url === '/' ? 'index.html' : url);

    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = join(filePath, 'index.html');
    } catch {
      filePath = join(STATIC_DIR, 'index.html');
    }

    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>md2red</h1><p>Frontend not built. Run: npm run build:web</p></body></html>');
  }
});

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`md2red web console: http://0.0.0.0:${PORT}`);
  if (isAuthEnabled()) {
    console.log('Password protection: enabled');
  }
});
