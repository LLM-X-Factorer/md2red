import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import archiver from 'archiver';
import { route, json } from '../router.js';
import { getTask } from '../task-manager.js';

route('GET', '/api/export/:taskId', async (_req, res, params) => {
  try {
    const task = getTask(params.taskId);
    if (!task || task.status !== 'completed') {
      json(res, { error: 'Task not found or not completed' }, 404);
      return;
    }

    const result = task.result as { outputDir: string; title?: string };
    const outputDir = result.outputDir;

    // Read strategy/plan for text content
    let title = result.title || '';
    let summary = '';
    let tags: string[] = [];

    try {
      const plan = JSON.parse(await readFile(join(outputDir, 'publish-plan.json'), 'utf-8'));
      title = plan.title || title;
      summary = plan.summary || '';
      tags = plan.tags || [];
    } catch {
      try {
        const strategy = JSON.parse(await readFile(join(outputDir, 'strategy.json'), 'utf-8'));
        title = strategy.selectedTitle || strategy.titles?.[0] || title;
        summary = strategy.summary || '';
        tags = strategy.tags || [];
      } catch { /* no strategy */ }
    }

    // Build copy-paste text
    const copyText = [
      `标题：${title}`,
      '',
      `正文：`,
      summary,
      '',
      `标签：${tags.map((t) => '#' + t).join(' ')}`,
    ].join('\n');

    // Get image files
    const files = await readdir(outputDir);
    const images = files.filter((f) => f.endsWith('.png') || f.endsWith('.jpg')).sort();

    // Create zip
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(title || 'md2red')}.zip"`,
      'Access-Control-Allow-Origin': '*',
    });

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    // Add images
    for (const img of images) {
      archive.file(join(outputDir, img), { name: img });
    }

    // Add text file
    archive.append(copyText, { name: '发布文案.txt' });

    await archive.finalize();
  } catch (err) {
    json(res, { error: (err as Error).message }, 500);
  }
});
