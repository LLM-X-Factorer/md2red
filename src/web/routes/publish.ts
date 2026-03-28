import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { route, json, readBody } from '../router.js';
import { createTask, updateTask, completeTask, failTask, getTask } from '../task-manager.js';
import { publishNote, closeBrowser } from '../../publisher/index.js';
import { loadConfig } from '../../config/index.js';

route('POST', '/api/publish', async (req, res) => {
  try {
    const body = JSON.parse(await readBody(req));
    const { taskId, draft } = body;

    const genTask = getTask(taskId);
    if (!genTask || genTask.status !== 'completed') {
      json(res, { error: 'Generate task not found or not completed' }, 400);
      return;
    }

    const result = genTask.result as { outputDir: string };
    const outputDir = result.outputDir;

    // Read publish plan or strategy
    let title: string;
    let summary: string;
    let tags: string[];
    let imagePaths: string[];

    try {
      const plan = JSON.parse(await readFile(join(outputDir, 'publish-plan.json'), 'utf-8'));
      title = plan.title;
      summary = plan.summary;
      tags = plan.tags || [];
      imagePaths = (plan.imageOrder as string[]).map((f: string) => join(outputDir, f));
    } catch {
      const strategy = JSON.parse(await readFile(join(outputDir, 'strategy.json'), 'utf-8'));
      title = strategy.selectedTitle || strategy.titles[0];
      summary = strategy.summary;
      tags = strategy.tags || [];
      const { readdir } = await import('node:fs/promises');
      const files = await readdir(outputDir);
      imagePaths = files.filter((f) => f.endsWith('.png') || f.endsWith('.jpg')).sort().map((f) => join(outputDir, f));
    }

    const pubTask = createTask('publish');

    (async () => {
      try {
        const config = await loadConfig();
        updateTask(pubTask.id, { step: 1, total: 3, message: '准备发布...' });

        updateTask(pubTask.id, { step: 2, total: 3, message: draft ? '保存草稿...' : '发布中...' });
        const pubResult = await publishNote({
          title,
          content: summary,
          imagePaths,
          tags,
          visibility: config.xhs.visibility,
          cookiePath: config.xhs.cookiePath,
          publishDelay: config.xhs.publishDelay,
          draft: !!draft,
        });
        await closeBrowser();

        if (pubResult.success) {
          updateTask(pubTask.id, { step: 3, total: 3, message: '完成' });
          completeTask(pubTask.id, { success: true, draft: !!draft });
        } else {
          failTask(pubTask.id, pubResult.error || '发布失败');
        }
      } catch (err) {
        await closeBrowser();
        failTask(pubTask.id, (err as Error).message);
      }
    })();

    json(res, { taskId: pubTask.id });
  } catch (err) {
    json(res, { error: (err as Error).message }, 500);
  }
});
