import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { generatePreview, openInBrowser } from '../../preview/index.js';
import { logger } from '../../utils/logger.js';
import type { ContentStrategy } from '../../strategy/index.js';

export async function previewCommand(dir: string) {
  try {
    const outputDir = resolve(dir);

    // Try to load strategy.json if it exists
    let strategy: ContentStrategy | undefined;
    try {
      const raw = await readFile(join(outputDir, 'strategy.json'), 'utf-8');
      strategy = JSON.parse(raw);
    } catch {
      // No strategy file, preview without it
    }

    const previewPath = await generatePreview({ outputDir, strategy });
    openInBrowser(previewPath);
    logger.info('已在浏览器中打开预览');
  } catch (err) {
    logger.error(`预览失败: ${(err as Error).message}`);
    process.exit(1);
  }
}
