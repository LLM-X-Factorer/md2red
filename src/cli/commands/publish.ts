import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadConfig } from '../../config/index.js';
import { publishNote, closeBrowser } from '../../publisher/index.js';
import { logger } from '../../utils/logger.js';
import type { ContentStrategy } from '../../strategy/index.js';

export async function publishCommand(
  dir: string,
  opts: { config?: string; dryRun?: boolean; force?: boolean },
) {
  try {
    const config = await loadConfig(opts.config);
    const outputDir = resolve(dir);

    // Read strategy.json for title, summary, tags
    const strategyPath = join(outputDir, 'strategy.json');
    let strategy: ContentStrategy;
    try {
      const raw = await readFile(strategyPath, 'utf-8');
      strategy = JSON.parse(raw);
    } catch {
      logger.error(`找不到 ${strategyPath}，请先运行 md2red generate -s <file>`);
      process.exit(1);
    }

    // Collect image paths in order
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(outputDir);
    const imagePaths = files
      .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
      .sort()
      .map((f) => join(outputDir, f));

    if (imagePaths.length === 0) {
      logger.error('输出目录中没有找到图片');
      process.exit(1);
    }

    const title = strategy.selectedTitle || strategy.titles[0];
    const summary = strategy.summary;
    const tags = strategy.tags;

    logger.info(`标题: ${title}`);
    logger.info(`图片: ${imagePaths.length} 张`);
    logger.info(`标签: ${tags.join(', ')}`);
    logger.info(`可见性: ${config.xhs.visibility}`);

    if (opts.dryRun) {
      logger.success('Dry run 完成，未实际发布');
      return;
    }

    const result = await publishNote({
      title,
      content: summary,
      imagePaths,
      tags,
      visibility: config.xhs.visibility,
      cookiePath: config.xhs.cookiePath,
      publishDelay: config.xhs.publishDelay,
    });

    if (result.success) {
      logger.success('发布成功！');
    } else {
      logger.error(`发布失败: ${result.error}`);
      process.exit(1);
    }
  } catch (err) {
    logger.error(`发布失败: ${(err as Error).message}`);
    process.exit(1);
  } finally {
    await closeBrowser();
  }
}
