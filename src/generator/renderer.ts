import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright';
import type { Theme } from './themes/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'src', 'generator', 'templates');

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch();
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function renderCard(
  templateName: string,
  vars: Record<string, string>,
  theme: Theme,
  outputPath: string,
): Promise<void> {
  let templatePath = join(TEMPLATES_DIR, `${templateName}.html`);
  // Also try the source directory directly (for dev mode)
  try {
    await readFile(templatePath, 'utf-8');
  } catch {
    templatePath = join(dirname(fileURLToPath(import.meta.url)), 'templates', `${templateName}.html`);
  }

  let html = await readFile(templatePath, 'utf-8');

  const allVars = { ...theme, ...vars };
  for (const [key, value] of Object.entries(allVars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  const b = await getBrowser();
  const page = await b.newPage();
  await page.setViewportSize({ width: 1080, height: 1440 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();
}
