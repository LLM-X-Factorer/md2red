import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { generatePreview, openInBrowser } from '../../preview/index.js';
import { logger } from '../../utils/logger.js';
import type { ContentStrategy } from '../../strategy/index.js';

export async function previewCommand(dir: string, opts?: { port?: string }) {
  try {
    const outputDir = resolve(dir);
    const port = parseInt(opts?.port || '0', 10); // 0 = auto-assign

    let strategy: ContentStrategy | undefined;
    try {
      const raw = await readFile(join(outputDir, 'strategy.json'), 'utf-8');
      strategy = JSON.parse(raw);
    } catch {
      // No strategy file
    }

    const previewHtml = await generatePreview({ outputDir, strategy });

    // Read the generated HTML to serve it
    const html = await readFile(previewHtml, 'utf-8');

    // Start HTTP server so the confirm button can POST publish-plan.json back
    const server = createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/save-plan') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const planPath = join(outputDir, 'publish-plan.json');
            await writeFile(planPath, body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, path: planPath }));
            logger.success(`发布方案已保存: ${planPath}`);
            logger.info('运行 md2red publish ' + outputDir + ' 发布');
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: (err as Error).message }));
          }
        });
        return;
      }

      // Serve preview HTML for all other requests
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

    server.listen(port, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      const url = `http://localhost:${actualPort}`;
      logger.success(`预览服务已启动: ${url}`);
      logger.info('Ctrl+C 关闭');
      openInBrowser(url);
    });
  } catch (err) {
    logger.error(`预览失败: ${(err as Error).message}`);
    process.exit(1);
  }
}
