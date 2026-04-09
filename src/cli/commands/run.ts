import { resolve, basename } from 'node:path';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { parseMarkdown } from '../../parser/index.js';
import { generateImages, generateFromStrategy } from '../../generator/index.js';
import { generateStrategy } from '../../strategy/index.js';
import { hasApiKey as checkHasApiKey } from '../../strategy/providers/index.js';
import { generatePreview, openInBrowser } from '../../preview/index.js';
import { loadConfig } from '../../config/index.js';
import { checkDuplicate, createRecord } from '../../tracker/index.js';
import { logger } from '../../utils/logger.js';

export async function runCommand(
  file: string,
  opts: {
    output?: string;
    config?: string;
    theme?: string;
    cards?: string;
    force?: boolean;
    noPublish?: boolean;
  },
) {
  try {
    const config = await loadConfig(opts.config);
    const slug = basename(file, '.md').replace(/\s+/g, '-').toLowerCase();
    const outputDir = opts.output || resolve(config.output.dir, slug);
    const themeName = opts.theme || config.images.theme;
    const maxCards = opts.cards ? parseInt(opts.cards, 10) : config.content.maxCards;

    // 1. Check duplicate
    const absFile = resolve(file);
    const { isDuplicate, hash } = await checkDuplicate(absFile, !!opts.force);
    if (isDuplicate) return;

    // 2. Parse
    logger.info('Step 1/4: 解析 Markdown');
    const doc = await parseMarkdown(file);
    logger.info(`  标题: ${doc.title} | ${doc.contentBlocks.length} 个内容块`);

    // 3. Strategy (if API key available)
    let paths: string[];
    let strategy;
    if (checkHasApiKey(config)) {
      logger.info('Step 2/4: 生成内容策略 (LLM)');
      strategy = await generateStrategy(doc, config);
      if (strategy) {
        await mkdir(outputDir, { recursive: true });
        await writeFile(resolve(outputDir, 'strategy.json'), JSON.stringify(strategy, null, 2));
        logger.info('Step 3/4: 生成图片卡片');
        try {
          paths = await generateFromStrategy(doc, strategy, { outputDir, theme: themeName, maxCards });
        } catch (renderErr) {
          logger.warn(`策略渲染失败: ${(renderErr as Error).message}，fallback 到直接模式`);
          paths = await generateImages(doc, { outputDir, theme: themeName, maxCards });
        }
      } else {
        logger.info('Step 3/4: 生成图片卡片 (fallback 直接模式)');
        paths = await generateImages(doc, { outputDir, theme: themeName, maxCards });
      }
    } else {
      logger.info('Step 2/4: 跳过 LLM 策略 (未设置 GEMINI_API_KEY)');
      logger.info('Step 3/4: 生成图片卡片 (直接模式)');
      paths = await generateImages(doc, { outputDir, theme: themeName, maxCards });
    }

    // 4. Track
    await createRecord(absFile, hash, doc.title, paths.length, outputDir);

    // 5. Preview — load strategy from file (works for both LLM and direct modes)
    logger.info('Step 4/4: 生成预览');
    if (!strategy) {
      try {
        const raw = await readFile(resolve(outputDir, 'strategy.json'), 'utf-8');
        strategy = JSON.parse(raw);
      } catch { /* no strategy available */ }
    }
    const previewPath = await generatePreview({ outputDir, strategy });
    openInBrowser(previewPath);

    logger.success(`\n完成！共生成 ${paths.length} 张图片`);
    logger.info(`预览: ${previewPath}`);
    logger.info(`输出: ${outputDir}`);

    logger.info('导出请运行: md2red preview ' + outputDir);
  } catch (err) {
    logger.error(`运行失败: ${(err as Error).message}`);
    process.exit(1);
  }
}
