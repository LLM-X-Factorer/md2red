import { resolve, basename } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { parseMarkdown } from '../../parser/index.js';
import { generateImages, generateFromStrategy } from '../../generator/index.js';
import { generateStrategy } from '../../strategy/index.js';
import { loadConfig } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export async function generateCommand(
  file: string,
  opts: { output?: string; theme?: string; cards?: string; config?: string; strategy?: boolean },
) {
  try {
    const config = await loadConfig(opts.config);
    const slug = basename(file, '.md').replace(/\s+/g, '-').toLowerCase();
    const outputDir = opts.output || resolve(config.output.dir, slug);
    const themeName = opts.theme || config.images.theme;
    const maxCards = opts.cards ? parseInt(opts.cards, 10) : config.content.maxCards;

    logger.info(`解析 Markdown: ${file}`);
    const doc = await parseMarkdown(file);
    logger.info(`标题: ${doc.title} | ${doc.contentBlocks.length} 个内容块`);

    let paths: string[];

    if (opts.strategy) {
      const strategy = await generateStrategy(doc, config);

      if (strategy) {
        const strategyPath = resolve(outputDir, 'strategy.json');
        await writeFile(strategyPath, JSON.stringify(strategy, null, 2));
        logger.info(`策略已保存: ${strategyPath}`);
        paths = await generateFromStrategy(doc, strategy, { outputDir, theme: themeName, maxCards });
      } else {
        logger.info('策略生成失败，使用直接模式');
        paths = await generateImages(doc, { outputDir, theme: themeName, maxCards });
      }
    } else {
      logger.info(`生成图片到: ${outputDir}`);
      paths = await generateImages(doc, { outputDir, theme: themeName, maxCards });
    }

    logger.success(`完成！共生成 ${paths.length} 张图片`);
  } catch (err) {
    logger.error(`生成失败: ${(err as Error).message}`);
    process.exit(1);
  }
}
