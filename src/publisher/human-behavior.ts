import type { Page } from 'playwright';

export async function humanDelay(page: Page, min = 500, max = 2000): Promise<void> {
  const delay = min + Math.random() * (max - min);
  await page.waitForTimeout(Math.round(delay));
}

export async function humanType(page: Page, text: string): Promise<void> {
  for (const char of text) {
    await page.keyboard.type(char, { delay: 0 });
    // Variable inter-key delay: 30-150ms, occasional longer pause
    const pause = Math.random() < 0.05 ? 300 + Math.random() * 500 : 30 + Math.random() * 120;
    await page.waitForTimeout(Math.round(pause));
  }
}

export async function humanClick(page: Page, selector: string): Promise<void> {
  const el = await page.waitForSelector(selector, { timeout: 10000 });
  if (!el) throw new Error(`Element not found: ${selector}`);

  const box = await el.boundingBox();
  if (box) {
    // Click at a random point within the element, not dead center
    const x = box.x + box.width * (0.3 + Math.random() * 0.4);
    const y = box.y + box.height * (0.3 + Math.random() * 0.4);
    await page.mouse.move(x, y, { steps: 5 + Math.floor(Math.random() * 10) });
    await humanDelay(page, 50, 200);
    await page.mouse.click(x, y);
  } else {
    await el.click();
  }
}

export async function humanScroll(page: Page, distance = 300): Promise<void> {
  const steps = 3 + Math.floor(Math.random() * 5);
  const perStep = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, perStep);
    await page.waitForTimeout(50 + Math.random() * 100);
  }
}
