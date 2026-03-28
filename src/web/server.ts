import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dispatch, json } from './router.js';

// Import all route registrations
import './routes/auth.js';
import './routes/upload.js';
import './routes/generate.js';
import './routes/preview.js';
import './routes/publish.js';
import './routes/history.js';
import './routes/config.js';
import './routes/tasks.js';

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
      // File not found, serve index.html (SPA fallback)
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
});
