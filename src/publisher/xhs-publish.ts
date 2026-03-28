import type { Page } from 'playwright';
import { createPage, persistCookies } from './xhs-browser.js';
import { XHS_URLS, SELECTORS, SEL } from './xhs-selectors.js';
import { resilientFind, resilientClick, resilientExists } from './selector-resilience.js';
import { humanDelay, humanType, humanClick } from './human-behavior.js';
import { logger } from '../utils/logger.js';

export interface PublishOptions {
  title: string;
  content: string;
  imagePaths: string[];
  tags: string[];
  visibility: '公开可见' | '仅自己可见' | '仅互关好友可见';
  cookiePath: string;
  publishDelay: number;
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
  const page = await createPage(options.cookiePath);

  try {
    // 1. Navigate to publish page
    logger.info('打开创作者中心发布页...');
    await page.goto(XHS_URLS.publish, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await humanDelay(page, 1500, 3000);

    // 2. Click "上传图文" tab
    await clickTab(page, '上传图文');

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

    // 7. Set visibility
    if (options.visibility !== '公开可见') {
      logger.info(`设置可见性: ${options.visibility}`);
      await setVisibility(page, options.visibility);
    }

    // 8. Human-like delay before publish
    await humanDelay(page, options.publishDelay, options.publishDelay + 2000);

    // 9. Click publish
    logger.info('点击发布...');
    await resilientClick(page, 'publishBtn');
    await humanDelay(page, 2000, 4000);

    await persistCookies(options.cookiePath);
    logger.success('发布成功');
    return { success: true };
  } catch (err) {
    const message = (err as Error).message;
    return { success: false, error: message };
  } finally {
    await page.close();
  }
}

async function clickTab(page: Page, tabText: string): Promise<void> {
  // Remove blocking popovers
  await page.evaluate(() => {
    document.querySelectorAll('div.d-popover').forEach((el) => el.remove());
  });

  const tabs = await page.$$(SELECTORS.creatorTab.primary);
  for (const tab of tabs) {
    const text = await tab.textContent();
    if (text?.includes(tabText)) {
      await tab.click();
      await humanDelay(page, 300, 800);
      return;
    }
  }
}

async function uploadImages(page: Page, imagePaths: string[]): Promise<void> {
  for (let i = 0; i < imagePaths.length; i++) {
    const key = i === 0 ? 'uploadInputFirst' : 'uploadInputSubsequent';
    const input = await resilientFind(page, key, 15000);
    await input.setInputFiles(imagePaths[i]);

    // Wait for preview
    await page.waitForFunction(
      (args) => {
        const previews = document.querySelectorAll(args.sel);
        return previews.length >= args.count;
      },
      { sel: SEL.imagePreviewArea, count: i + 1 },
      { timeout: 60000 },
    );

    logger.info(`  图片 ${i + 1}/${imagePaths.length} 上传完成`);
    await humanDelay(page, 300, 800);
  }
}

async function fillTitle(page: Page, title: string): Promise<void> {
  const input = await resilientFind(page, 'titleInput');
  await input.click();
  await input.fill(title);
  await humanDelay(page, 200, 500);
}

async function fillBody(page: Page, content: string): Promise<void> {
  const editor = await resilientFind(page, 'bodyEditor');
  await editor.click();
  await humanType(page, content);
  await humanDelay(page, 300, 800);
}

async function addTags(page: Page, tags: string[]): Promise<void> {
  // Navigate to end of body
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  for (const tag of tags.slice(0, 5)) {
    await humanType(page, `#${tag}`);
    await humanDelay(page, 800, 1500);

    const suggestion = await page.$('#creator-editor-topic-container .item');
    if (suggestion) {
      await suggestion.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await humanDelay(page, 300, 800);
  }
}

async function setVisibility(page: Page, visibility: string): Promise<void> {
  await resilientClick(page, 'visibilityDropdown');
  await humanDelay(page, 300, 600);

  const options = await page.$$(SELECTORS.visibilityOptions.primary);
  for (const option of options) {
    const text = await option.textContent();
    if (text?.includes(visibility)) {
      await option.click();
      await humanDelay(page, 200, 500);
      return;
    }
  }

  throw new Error(`找不到可见性选项: ${visibility}`);
}
