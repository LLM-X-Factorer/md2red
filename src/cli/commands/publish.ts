import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadConfig } from '../../config/index.js';
import { publishNote, closeBrowser } from '../../publisher/index.js';
import { logger } from '../../utils/logger.js';
import type { ContentStrategy } from '../../strategy/index.js';

interface PublishPlan {
  title: string;
  summary: string;
  tags: string[];
  imageOrder: string[];
  confirmedAt: string;
}

export async function publishCommand(
  dir: string,
  opts: { config?: string; dryRun?: boolean; force?: boolean; draft?: boolean },
) {
  try {
    const config = await loadConfig(opts.config);
    const outputDir = resolve(dir);

    // Priority 1: publish-plan.json (user-confirmed via preview)
    let title: string;
    let summary: string;
    let tags: string[];
    let imagePaths: string[];

    const planPath = join(outputDir, 'publish-plan.json');
    const strategyPath = join(outputDir, 'strategy.json');

    let plan: PublishPlan | null = null;
    try {
      const raw = await readFile(planPath, 'utf-8');
      plan = JSON.parse(raw);
      logger.info(`读取发布方案: ${planPath} (确认于 ${plan!.confirmedAt})`);
    } catch {
      // No publish-plan, try strategy
    }

    if (plan) {
      title = plan.title;
      summary = plan.summary;
      tags = plan.tags;
      imagePaths = plan.imageOrder.map((f) => join(outputDir, f));
    } else {
      // Priority 2: strategy.json
      let strategy: ContentStrategy;
      try {
        const raw = await readFile(strategyPath, 'utf-8');
        strategy = JSON.parse(raw);
        logger.warn('未找到 publish-plan.json，使用 strategy.json（建议先 md2red preview 确认）');
      } catch {
        logger.error(`找不到发布方案。请先运行:\n  md2red generate -s <file>\n  md2red preview ${dir}`);
        process.exit(1);
      }

      title = strategy.selectedTitle || strategy.titles[0];
      summary = strategy.summary;
      tags = strategy.tags;

      const files = await readdir(outputDir);
      imagePaths = files
        .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
        .sort()
        .map((f) => join(outputDir, f));
    }

    if (imagePaths.length === 0) {
      logger.error('没有找到图片文件');
      process.exit(1);
    }

    logger.info(`标题: ${title}`);
    logger.info(`图片: ${imagePaths.length} 张`);
    logger.info(`标签: ${tags.join(', ') || '(无)'}`);
    logger.info(`可见性: ${config.xhs.visibility}`);

    if (opts.dryRun) {
      logger.success('Dry run 完成，未实际发布');
      console.log('\n图片顺序:');
      imagePaths.forEach((p, i) => console.log(`  ${i + 1}. ${p.split('/').pop()}`));
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
      draft: opts.draft,
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
