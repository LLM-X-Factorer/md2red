import type { Page, ElementHandle } from 'playwright';
import { SELECTORS, type SelectorDef } from './xhs-selectors.js';
import { logger } from '../utils/logger.js';

export async function resilientFind(
  page: Page,
  key: string,
  timeout = 10000,
): Promise<ElementHandle> {
  const def = SELECTORS[key];
  if (!def) throw new Error(`Unknown selector key: ${key}`);

  // Try primary
  try {
    const el = await page.waitForSelector(def.primary, { timeout: timeout / 2 });
    if (el) return el;
  } catch {
    // primary failed, try fallbacks
  }

  // Try fallbacks
  for (const fb of def.fallbacks) {
    try {
      const el = await page.waitForSelector(fb, { timeout: 3000 });
      if (el) {
        logger.debug(`选择器 [${key}] 主选择器失败，使用 fallback: ${fb}`);
        return el;
      }
    } catch {
      continue;
    }
  }

  throw new Error(`选择器 [${key}] 所有选择器均失败 (${def.description})`);
}

export async function resilientClick(
  page: Page,
  key: string,
  timeout = 10000,
): Promise<void> {
  const el = await resilientFind(page, key, timeout);
  await el.click();
}

export async function resilientFill(
  page: Page,
  key: string,
  value: string,
  timeout = 10000,
): Promise<void> {
  const el = await resilientFind(page, key, timeout);
  await el.click();
  await el.fill(value);
}

export async function resilientExists(
  page: Page,
  key: string,
  timeout = 3000,
): Promise<boolean> {
  try {
    await resilientFind(page, key, timeout);
    return true;
  } catch {
    return false;
  }
}
