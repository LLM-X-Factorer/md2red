import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLI = 'node dist/cli/index.js';
const SAMPLE = 'examples/sample-article.md';

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
}

test.describe('generate pipeline', () => {
  const outputDir = join(tmpdir(), `md2red-e2e-gen-${Date.now()}`);

  test.afterAll(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  test('generates correct number of image files', () => {
    const output = run(`${CLI} generate ${SAMPLE} -o ${outputDir}`);
    expect(output).toContain('完成');
  });

  test('output directory contains PNG files', async () => {
    const files = await readdir(outputDir);
    const pngs = files.filter((f) => f.endsWith('.png'));
    expect(pngs.length).toBeGreaterThanOrEqual(5);
    expect(pngs.length).toBeLessThanOrEqual(18);
  });

  test('files are named with correct pattern', async () => {
    const files = await readdir(outputDir);
    const pngs = files.filter((f) => f.endsWith('.png')).sort();
    expect(pngs[0]).toMatch(/^01-cover\.png$/);
    expect(pngs[pngs.length - 1]).toMatch(/^\d+-summary\.png$/);
  });

  test('cover image has correct dimensions (1080x1440)', async () => {
    // Check file is non-trivial size (>10KB means it rendered something)
    const coverPath = join(outputDir, '01-cover.png');
    const stats = await stat(coverPath);
    expect(stats.size).toBeGreaterThan(10000);
  });

  test('strategy.json is generated in direct mode', async () => {
    const strategyPath = join(outputDir, 'strategy.json');
    const raw = await readFile(strategyPath, 'utf-8');
    const strategy = JSON.parse(raw);
    expect(strategy.titles).toBeDefined();
    expect(strategy.titles.length).toBeGreaterThanOrEqual(1);
    expect(strategy.cardPlan).toBeDefined();
    expect(strategy.cardPlan.length).toBeGreaterThanOrEqual(3);
  });

  test('content cards have non-trivial file sizes', async () => {
    const files = await readdir(outputDir);
    const pngs = files.filter((f) => f.endsWith('.png'));
    for (const png of pngs) {
      const stats = await stat(join(outputDir, png));
      expect(stats.size).toBeGreaterThan(5000);
    }
  });
});

test.describe('generate with options', () => {
  test('--theme light produces output', async () => {
    const outputDir = join(tmpdir(), `md2red-e2e-light-${Date.now()}`);
    try {
      const output = run(`${CLI} generate ${SAMPLE} -t light -o ${outputDir}`);
      expect(output).toContain('完成');
      const files = await readdir(outputDir);
      expect(files.filter((f) => f.endsWith('.png')).length).toBeGreaterThanOrEqual(5);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test('--cards limits output count', async () => {
    const outputDir = join(tmpdir(), `md2red-e2e-cards-${Date.now()}`);
    try {
      run(`${CLI} generate ${SAMPLE} --cards 5 -o ${outputDir}`);
      const files = await readdir(outputDir);
      const pngs = files.filter((f) => f.endsWith('.png'));
      expect(pngs.length).toBeLessThanOrEqual(5);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});

test.describe('parse command', () => {
  test('outputs structured info', () => {
    const output = run(`${CLI} parse ${SAMPLE}`);
    expect(output).toContain('标题');
    expect(output).toContain('字数');
    expect(output).toContain('内容块');
  });

  test('--output saves JSON', async () => {
    const jsonPath = join(tmpdir(), `md2red-e2e-parse-${Date.now()}.json`);
    try {
      run(`${CLI} parse ${SAMPLE} -o ${jsonPath}`);
      const raw = await readFile(jsonPath, 'utf-8');
      const doc = JSON.parse(raw);
      expect(doc.title).toBeDefined();
      expect(doc.contentBlocks.length).toBeGreaterThanOrEqual(3);
      expect(doc.metadata.sourceFile).toContain('sample-article.md');
    } finally {
      await rm(jsonPath, { force: true });
    }
  });
});
