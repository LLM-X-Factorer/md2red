import { SELECTORS, XHS_URLS } from '../../publisher/xhs-selectors.js';
import { createPage, closeBrowser } from '../../publisher/xhs-browser.js';
import { loadConfig } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export async function validateSelectorsCommand(opts: { config?: string }) {
  try {
    const config = await loadConfig(opts.config);
    const page = await createPage(config.xhs.cookiePath);

    logger.info('打开创作者中心发布页...');
    await page.goto(XHS_URLS.publish, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\n选择器验证结果:\n');

    let passed = 0;
    let failed = 0;

    for (const [key, def] of Object.entries(SELECTORS)) {
      const primaryOk = (await page.$(def.primary)) !== null;
      let fallbackUsed = '';

      if (!primaryOk) {
        for (const fb of def.fallbacks) {
          if (await page.$(fb)) {
            fallbackUsed = fb;
            break;
          }
        }
      }

      if (primaryOk) {
        console.log(`  ✅ ${key} — ${def.description}`);
        passed++;
      } else if (fallbackUsed) {
        console.log(`  ⚠️  ${key} — 主选择器失败, fallback 可用: ${fallbackUsed}`);
        passed++;
      } else {
        console.log(`  ❌ ${key} — 所有选择器均未匹配`);
        failed++;
      }
    }

    console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);

    await page.close();
    await closeBrowser();

    if (failed > 0) process.exit(1);
  } catch (err) {
    logger.error(`验证失败: ${(err as Error).message}`);
    await closeBrowser();
    process.exit(1);
  }
}
