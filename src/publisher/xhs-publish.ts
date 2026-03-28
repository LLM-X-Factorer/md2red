import type { Page } from 'playwright';
import { createPage, persistCookies } from './xhs-browser.js';
import { XHS_URLS, SEL } from './xhs-selectors.js';
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

export async function publishNote(options: PublishOptions): Promise<PublishResult> {
  const page = await createPage(options.cookiePath);

  try {
    // 1. Navigate to publish page
    logger.info('打开创作者中心发布页...');
    await page.goto(XHS_URLS.publish, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 2. Click "上传图文" tab
    await clickTab(page, SEL.tabTextImage);

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
    await page.waitForTimeout(options.publishDelay);

    // 9. Click publish
    logger.info('点击发布...');
    await page.click(SEL.publishBtn);
    await page.waitForTimeout(3000);

    // Save cookies after successful operation
    await persistCookies(options.cookiePath);

    logger.success('发布成功');
    return { success: true };
  } catch (err) {
    const message = (err as Error).message;
    logger.error(`发布失败: ${message}`);
    return { success: false, error: message };
  } finally {
    await page.close();
  }
}

async function clickTab(page: Page, tabText: string): Promise<void> {
  // Remove any popovers that might block clicks
  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove());
  }, SEL.popover);

  const tabs = await page.$$(SEL.creatorTab);
  for (const tab of tabs) {
    const text = await tab.textContent();
    if (text?.includes(tabText)) {
      await tab.click();
      await page.waitForTimeout(500);
      return;
    }
  }
  // Tab might already be selected, continue
}

async function uploadImages(page: Page, imagePaths: string[]): Promise<void> {
  for (let i = 0; i < imagePaths.length; i++) {
    const selector = i === 0 ? SEL.uploadInputFirst : SEL.uploadInputSubsequent;

    // Wait for the upload input to be available
    const input = await page.waitForSelector(selector, { timeout: 15000 });
    await input.setInputFiles(imagePaths[i]);

    // Wait for preview to show the uploaded image
    await page.waitForFunction(
      (args) => {
        const previews = document.querySelectorAll(args.sel);
        return previews.length >= args.count;
      },
      { sel: SEL.imagePreviewArea, count: i + 1 },
      { timeout: 60000 },
    );

    logger.info(`  图片 ${i + 1}/${imagePaths.length} 上传完成`);
    await page.waitForTimeout(500);
  }
}

async function fillTitle(page: Page, title: string): Promise<void> {
  const input = await page.waitForSelector(SEL.titleInput, { timeout: 10000 });
  await input.click();
  await input.fill(title);
  await page.waitForTimeout(300);
}

async function fillBody(page: Page, content: string): Promise<void> {
  // Try both editor selectors (race)
  let editor = await page.$(SEL.bodyEditor);
  if (!editor) {
    const alt = await page.$(SEL.bodyEditorAlt);
    if (alt) {
      // Find the contenteditable parent
      editor = await alt.evaluateHandle((el) => {
        let node = el.parentElement;
        while (node && node.getAttribute('role') !== 'textbox') {
          node = node.parentElement;
        }
        return node || el;
      });
      editor = editor.asElement();
    }
  }

  if (!editor) throw new Error('找不到正文编辑器');

  await editor.click();
  // Type character by character to simulate human input
  await page.keyboard.type(content, { delay: 20 });
  await page.waitForTimeout(500);
}

async function addTags(page: Page, tags: string[]): Promise<void> {
  // Navigate to end of body content first
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  for (const tag of tags.slice(0, 5)) {
    // Type # to trigger tag input
    await page.keyboard.type(`#${tag}`, { delay: 50 });
    await page.waitForTimeout(1000);

    // Click the first suggestion
    const suggestion = await page.$('#creator-editor-topic-container .item');
    if (suggestion) {
      await suggestion.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(500);
  }
}

async function setVisibility(page: Page, visibility: string): Promise<void> {
  // Open dropdown
  const dropdown = await page.waitForSelector(SEL.visibilityDropdown, { timeout: 10000 });
  await dropdown.click();
  await page.waitForTimeout(500);

  // Select option
  const options = await page.$$(SEL.visibilityOptions);
  for (const option of options) {
    const text = await option.textContent();
    if (text?.includes(visibility)) {
      await option.click();
      await page.waitForTimeout(300);
      return;
    }
  }

  throw new Error(`找不到可见性选项: ${visibility}`);
}
