import type { Page } from 'playwright';
import { createPage, persistCookies, setHeadless } from './xhs-browser.js';
import { XHS_URLS, SELECTORS } from './xhs-selectors.js';
import { resilientFind, resilientClick } from './selector-resilience.js';
import { humanDelay, humanType } from './human-behavior.js';
import { logger } from '../utils/logger.js';

export interface PublishOptions {
  title: string;
  content: string;
  imagePaths: string[];
  tags: string[];
  visibility: '公开可见' | '仅自己可见' | '仅互关好友可见';
  cookiePath: string;
  publishDelay: number;
  draft?: boolean;
}

export interface PublishResult {
  success: boolean;
  noteId?: string;
  error?: string;
}

const MAX_RETRIES = 3;

export async function publishNote(options: PublishOptions): Promise<PublishResult> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      const backoff = Math.pow(2, attempt - 1) * 2000;
      logger.info(`重试 ${attempt}/${MAX_RETRIES}，等待 ${backoff / 1000}s...`);
      await new Promise((r) => setTimeout(r, backoff));
    }

    const result = await attemptPublish(options);
    if (result.success) return result;

    lastError = result.error || 'Unknown error';
    logger.warn(`发布尝试 ${attempt} 失败: ${lastError}`);
  }

  return { success: false, error: `${MAX_RETRIES} 次重试均失败: ${lastError}` };
}

async function attemptPublish(options: PublishOptions): Promise<PublishResult> {
  // Use headful for publish (more reliable against anti-bot)
  setHeadless(false);
  const page = await createPage(options.cookiePath);

  try {
    // 1. Navigate to publish page
    logger.info('打开创作者中心发布页...');
    await page.goto(XHS_URLS.publish, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await humanDelay(page, 2000, 3000);

    // 2. Click "上传图文" tab
    await clickTab(page, '上传图文');
    await humanDelay(page, 1000, 2000);

    // 3. Upload images
    logger.info(`上传 ${options.imagePaths.length} 张图片...`);
    await uploadImages(page, options.imagePaths);

    // 4. Fill title
    logger.info('填写标题...');
    await fillTitle(page, options.title);

    // 5. Fill body content
    logger.info('填写正文...');
    await fillBody(page, options.content);

    // 6. Add tags
    if (options.tags.length > 0) {
      logger.info('添加标签...');
      await addTags(page, options.tags);
    }

    // 7. Set visibility — need to scroll down to find it
    if (options.visibility !== '公开可见') {
      logger.info(`设置可见性: ${options.visibility}`);
      await setVisibility(page, options.visibility);
    }

    // 8. Human-like delay before publish
    await humanDelay(page, options.publishDelay, options.publishDelay + 2000);

    // 9. Click publish or save draft
    if (options.draft) {
      logger.info('保存草稿...');
      await clickButtonByText(page, '暂存离开');
    } else {
      logger.info('点击发布...');
      await clickButtonByText(page, '发布');
    }
    await humanDelay(page, 3000, 5000);

    await persistCookies(options.cookiePath);
    logger.success(options.draft ? '草稿保存成功' : '发布成功');
    return { success: true };
  } catch (err) {
    const message = (err as Error).message;
    return { success: false, error: message };
  } finally {
    await page.close();
  }
}

async function clickTab(page: Page, tabText: string): Promise<void> {
  await page.evaluate((text) => {
    for (const el of document.querySelectorAll('span')) {
      if (el.textContent?.trim() === text) {
        (el as HTMLElement).click();
        return;
      }
    }
  }, tabText);
  await humanDelay(page, 500, 1000);
}

async function uploadImages(page: Page, imagePaths: string[]): Promise<void> {
  // Strategy: try batch upload first, fall back to one-by-one
  const input = page.locator('.upload-input');

  // Batch upload: set all files at once (input has `multiple` attribute)
  await input.setInputFiles(imagePaths);
  logger.info(`  已提交 ${imagePaths.length} 张图片`);

  // Wait and verify all images appear in preview
  let uploadedCount = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    await page.waitForTimeout(1000);
    // Count preview thumbnails (try multiple possible selectors)
    uploadedCount = await page.evaluate(() => {
      // Count image items in the editor area
      const selectors = ['.img-item', '.image-item', '.coverImg', '.reorder-image-item', '.upload-item'];
      for (const sel of selectors) {
        const count = document.querySelectorAll(sel).length;
        if (count > 0) return count;
      }
      // Fallback: count all images in the upload/preview area
      const imgs = document.querySelectorAll('.img-container img, .publish-image img, .cover-image');
      return imgs.length;
    });

    if (uploadedCount >= imagePaths.length) {
      logger.info(`  全部 ${uploadedCount} 张图片上传完成`);
      return;
    }

    if (attempt % 10 === 9) {
      logger.info(`  已识别 ${uploadedCount}/${imagePaths.length} 张图片，继续等待...`);
    }
  }

  // If batch didn't work fully, log what we got
  if (uploadedCount > 0) {
    logger.warn(`  上传了 ${uploadedCount}/${imagePaths.length} 张图片，继续执行`);
  } else {
    logger.warn(`  无法确认上传数量，继续执行`);
  }
}

async function fillTitle(page: Page, title: string): Promise<void> {
  const input = await resilientFind(page, 'titleInput');
  await input.click();
  await input.fill(title);
  await humanDelay(page, 300, 600);
}

async function fillBody(page: Page, content: string): Promise<void> {
  const editor = await resilientFind(page, 'bodyEditor');
  await editor.click();
  await humanType(page, content);
  await humanDelay(page, 300, 800);
}

async function addTags(page: Page, tags: string[]): Promise<void> {
  for (const tag of tags.slice(0, 5)) {
    // Click topic button to activate tag input
    try {
      const topicBtn = await page.$('button.topic-btn');
      if (topicBtn) await topicBtn.click();
    } catch { /* continue without topic button */ }

    await humanDelay(page, 300, 600);
    await humanType(page, tag);
    await humanDelay(page, 800, 1500);

    // Click first suggestion if available
    const suggestion = await page.$('.publish-topic-item, .topic-item, .search-result-item');
    if (suggestion) {
      await suggestion.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await humanDelay(page, 500, 1000);
  }
}

async function setVisibility(page: Page, visibility: string): Promise<void> {
  // Scroll down to find the visibility setting
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await humanDelay(page, 500, 1000);

  // Click the visibility dropdown
  await resilientClick(page, 'visibilityDropdown');
  await humanDelay(page, 500, 800);

  // Find and click the option by text
  const options = await page.$$('.d-options-wrapper .d-grid-item');
  for (const option of options) {
    const text = await option.textContent();
    if (text?.includes(visibility)) {
      await option.click();
      await humanDelay(page, 300, 500);
      return;
    }
  }

  throw new Error(`找不到可见性选项: ${visibility}`);
}

async function clickButtonByText(page: Page, text: string): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await humanDelay(page, 300, 600);

  const btn = page.locator('button').filter({ hasText: new RegExp(`^${text}$`) });
  if ((await btn.count()) === 0) throw new Error(`找不到按钮: ${text}`);
  await btn.first().scrollIntoViewIfNeeded();
  await humanDelay(page, 200, 400);
  await btn.first().click();
}
