import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { route, json, readBody } from '../router.js';
import { getTask } from '../task-manager.js';

route('GET', '/api/preview/:taskId', async (_req, res, params) => {
  try {
    const task = getTask(params.taskId);
    if (!task || task.status !== 'completed') {
      json(res, { error: 'Task not found or not completed' }, 404);
      return;
    }

    const result = task.result as { outputDir: string };
    const outputDir = result.outputDir;

    // Read images as base64
    const files = await readdir(outputDir);
    const imageFiles = files.filter((f) => f.endsWith('.png') || f.endsWith('.jpg')).sort();
    const images = [];
    for (const f of imageFiles) {
      const buf = await readFile(join(outputDir, f));
      const ext = f.endsWith('.jpg') ? 'jpeg' : 'png';
      images.push({ name: f, base64: `data:image/${ext};base64,${buf.toString('base64')}` });
    }

    // Read strategy
    let strategy = null;
    try {
      const raw = await readFile(join(outputDir, 'strategy.json'), 'utf-8');
      strategy = JSON.parse(raw);
    } catch { /* no strategy */ }

    json(res, { images, strategy, outputDir });
  } catch (err) {
    json(res, { error: (err as Error).message }, 500);
  }
});

route('PUT', '/api/preview/:taskId', async (req, res, params) => {
  try {
    const task = getTask(params.taskId);
    if (!task || task.status !== 'completed') {
      json(res, { error: 'Task not found or not completed' }, 404);
      return;
    }

    const result = task.result as { outputDir: string };
    const plan = JSON.parse(await readBody(req));
    plan.confirmedAt = new Date().toISOString();

    await writeFile(join(result.outputDir, 'publish-plan.json'), JSON.stringify(plan, null, 2));
    json(res, { ok: true });
  } catch (err) {
    json(res, { error: (err as Error).message }, 500);
  }
});
