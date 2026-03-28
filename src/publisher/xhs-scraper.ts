import { createPage, closeBrowser } from './xhs-browser.js';
import { logger } from '../utils/logger.js';
import type { NoteMetrics } from '../tracker/store.js';

const METRIC_SELECTORS = {
  likes: ['.engage-bar .like-wrapper .count', '.like-count', '[data-type="like"] .count'],
  collects: ['.engage-bar .collect-wrapper .count', '.collect-count', '[data-type="collect"] .count'],
  comments: ['.engage-bar .chat-wrapper .count', '.comment-count', '[data-type="comment"] .count'],
};

export async function scrapeNoteMetrics(
  noteUrl: string,
  cookiePath: string,
): Promise<NoteMetrics> {
  const page = await createPage(cookiePath);

  try {
    await page.goto(noteUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const metrics: NoteMetrics = {
      views: 0,
      likes: await extractCount(page, METRIC_SELECTORS.likes),
      comments: await extractCount(page, METRIC_SELECTORS.comments),
      collects: await extractCount(page, METRIC_SELECTORS.collects),
      shares: 0,
    };

    logger.info(`指标: ${metrics.likes} 赞, ${metrics.collects} 收藏, ${metrics.comments} 评论`);
    return metrics;
  } finally {
    await page.close();
  }
}

async function extractCount(
  page: import('playwright').Page,
  selectors: string[],
): Promise<number> {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        const text = (await el.textContent()) || '0';
        const num = parseMetricText(text.trim());
        if (num >= 0) return num;
      }
    } catch {
      continue;
    }
  }
  return 0;
}

function parseMetricText(text: string): number {
  if (!text || text === '') return 0;
  // Handle "1.2万" or "1.2w" format
  if (text.includes('万') || text.toLowerCase().includes('w')) {
    const num = parseFloat(text);
    return Math.round(num * 10000);
  }
  const num = parseInt(text.replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}
