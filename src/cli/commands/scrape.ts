import { loadHistory, updateMetrics } from '../../tracker/index.js';
import { scrapeNoteMetrics } from '../../publisher/xhs-scraper.js';
import { closeBrowser } from '../../publisher/xhs-browser.js';
import { loadConfig } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export async function scrapeCommand(id?: string, opts?: { config?: string }) {
  try {
    const config = await loadConfig(opts?.config);
    const records = await loadHistory();
    const targets = id
      ? records.filter((r) => r.id === id)
      : records.filter((r) => r.status === 'published' && r.noteUrl);

    if (targets.length === 0) {
      logger.info('没有可抓取指标的已发布笔记（需要 noteUrl）');
      return;
    }

    logger.info(`准备抓取 ${targets.length} 篇笔记的指标...`);

    for (const record of targets) {
      if (!record.noteUrl) {
        logger.warn(`跳过 "${record.title}"：无 noteUrl`);
        continue;
      }

      logger.info(`抓取: ${record.title}`);
      try {
        const metrics = await scrapeNoteMetrics(record.noteUrl, config.xhs.cookiePath);
        await updateMetrics(record.id, metrics);
        logger.success(`  已更新: ${metrics.likes}赞 ${metrics.collects}收藏 ${metrics.comments}评论`);
      } catch (err) {
        logger.warn(`  抓取失败: ${(err as Error).message}`);
      }
    }

    logger.success('指标抓取完成');
  } catch (err) {
    logger.error(`抓取失败: ${(err as Error).message}`);
  } finally {
    await closeBrowser();
  }
}
