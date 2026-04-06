import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readdir, readFile, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLI = 'node dist/cli/index.js';
const SAMPLE = 'examples/sample-article.md';

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
}

test.describe('full pipeline', () => {
  const outputDir = join(tmpdir(), `md2red-e2e-pipe-${Date.now()}`);

  test.afterAll(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  test('generate → preview roundtrip', async () => {
    // 1. Generate
    const genOutput = run(`${CLI} generate ${SAMPLE} -o ${outputDir}`);
    expect(genOutput).toContain('完成');

    // 2. Verify outputs
    const files = await readdir(outputDir);
    const pngs = files.filter((f) => f.endsWith('.png')).sort();
    expect(pngs.length).toBeGreaterThanOrEqual(5);
    expect(pngs[0]).toBe('01-cover.png');

    // 3. strategy.json exists and is valid
    const strategy = JSON.parse(await readFile(join(outputDir, 'strategy.json'), 'utf-8'));
    expect(strategy.titles[0]).toBeTruthy();
    expect(strategy.cardPlan.length).toBe(pngs.length);

    // 4. preview.html can be generated
    const { generatePreview } = await import('../dist/preview/index.js');
    const previewPath = await generatePreview({ outputDir, strategy });
    expect(previewPath).toContain('preview.html');
    const previewHtml = await readFile(previewPath, 'utf-8');
    expect(previewHtml).toContain('md2red');
  });
});

test.describe('duplicate detection', () => {
  const outputDir = join(tmpdir(), `md2red-e2e-dedup-${Date.now()}`);

  test.afterAll(async () => {
    await rm(outputDir, { recursive: true, force: true });
    try { run(`${CLI} history clear`); } catch { /* ok */ }
  });

  test('run detects duplicate and skips', async () => {
    // First run
    run(`${CLI} run ${SAMPLE} -o ${outputDir}`);

    // Second run should detect duplicate
    const output2 = run(`${CLI} run ${SAMPLE} -o ${outputDir} 2>&1 || true`);
    expect(output2).toContain('已');
    expect(output2).toContain('--force');
  });
});

test.describe('error handling', () => {
  test('parse nonexistent file exits with error', () => {
    try {
      run(`${CLI} parse /nonexistent/file.md`);
      expect(true).toBe(false); // should not reach
    } catch (err: unknown) {
      const error = err as { status: number; stderr: string };
      expect(error.status).toBe(1);
    }
  });
});

test.describe('cli basics', () => {
  test('--version returns version', () => {
    const output = run(`${CLI} --version`);
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('--help lists all commands', () => {
    const output = run(`${CLI} --help`);
    expect(output).toContain('run');
    expect(output).toContain('parse');
    expect(output).toContain('generate');
    expect(output).toContain('preview');
    expect(output).toContain('history');
    expect(output).toContain('init');
  });
});
