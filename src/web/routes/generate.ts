import { resolve, basename } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { route, json, readBody } from '../router.js';
import { createTask, updateTask, completeTask, failTask } from '../task-manager.js';
import { parseMarkdown } from '../../parser/index.js';
import { generateImages, generateFromStrategy } from '../../generator/index.js';
import { generateStrategy } from '../../strategy/index.js';
import { hasApiKey } from '../../strategy/providers/index.js';
import { loadConfig } from '../../config/index.js';

const OUTPUT_BASE = process.env.MD2RED_DATA_DIR
  ? resolve(process.env.MD2RED_DATA_DIR, 'output')
  : resolve(process.cwd(), 'md2red-output');

route('POST', '/api/generate', async (req, res) => {
  try {
    const body = JSON.parse(await readBody(req));
    const { filePath, useStrategy, theme, maxCards } = body;

    if (!filePath) {
      json(res, { error: 'filePath is required' }, 400);
      return;
    }

    const task = createTask('generate');

    // Run generation in background
    (async () => {
      try {
        const config = await loadConfig();

        // Step 1: Parse
        updateTask(task.id, { step: 1, total: 4, message: '解析 Markdown...' });
        const doc = await parseMarkdown(filePath);

        const slug = basename(filePath, '.md').replace(/\s+/g, '-').toLowerCase().replace(/^\d+-/, '');
        const outputDir = resolve(OUTPUT_BASE, slug);

        const themeName = theme || config.images.theme;
        const cards = maxCards || config.content.maxCards;

        let paths: string[];
        let strategy;

        if (useStrategy && hasApiKey(config)) {
          // Step 2: LLM Strategy
          updateTask(task.id, { step: 2, total: 4, message: '生成内容策略 (LLM)...' });
          strategy = await generateStrategy(doc, config);
          await mkdir(outputDir, { recursive: true });
          await writeFile(resolve(outputDir, 'strategy.json'), JSON.stringify(strategy, null, 2));

          // Step 3: Generate images
          updateTask(task.id, { step: 3, total: 4, message: '渲染图片卡片...' });
          paths = await generateFromStrategy(doc, strategy, { outputDir, theme: themeName, maxCards: cards });
        } else {
          updateTask(task.id, { step: 2, total: 4, message: '跳过 LLM 策略' });

          // Step 3: Generate images (direct mode)
          updateTask(task.id, { step: 3, total: 4, message: '渲染图片卡片...' });
          paths = await generateImages(doc, { outputDir, theme: themeName, maxCards: cards });
        }

        // Step 4: Done
        updateTask(task.id, { step: 4, total: 4, message: '完成' });

        completeTask(task.id, {
          outputDir,
          imageCount: paths.length,
          title: doc.title,
          slug,
        });
      } catch (err) {
        failTask(task.id, (err as Error).message);
      }
    })();

    json(res, { taskId: task.id });
  } catch (err) {
    json(res, { error: (err as Error).message }, 500);
  }
});
