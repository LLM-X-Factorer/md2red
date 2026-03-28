import { test, expect } from '@playwright/test';
import { execSync, type ChildProcess, spawn } from 'node:child_process';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PORT = 13001;
const BASE = `http://localhost:${PORT}`;
let serverProcess: ChildProcess;

async function sendMultipart(url: string, filename: string, content: string): Promise<{ status: number; data: any }> {
  const boundary = '----FormBoundary' + Date.now();
  const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/markdown\r\n\r\n${content}\r\n--${boundary}--\r\n`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  return { status: res.status, data: await res.json() };
}

test.beforeAll(async () => {
  // Start web server
  serverProcess = spawn('node', ['dist/web/server.js'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  });

  // Wait for server to start
  await new Promise<void>((resolve) => {
    const check = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/api/history`);
        if (res.ok) { clearInterval(check); resolve(); }
      } catch { /* not ready */ }
    }, 200);
    setTimeout(() => { clearInterval(check); resolve(); }, 10000);
  });
});

test.afterAll(() => {
  serverProcess?.kill();
});

test.describe('web API', () => {
  test('GET /api/history returns array', async () => {
    const res = await fetch(`${BASE}/api/history`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/config returns config object', async () => {
    const res = await fetch(`${BASE}/api/config`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.llm).toBeDefined();
    expect(data.images).toBeDefined();
    expect(data.content).toBeDefined();
  });

  test('GET /api/config masks API key', async () => {
    const res = await fetch(`${BASE}/api/config`);
    const data = await res.json() as any;
    // apiKey should be masked or empty, never exposed raw
    expect(data.llm.apiKey).toMatch(/^(\*\*\*|)$/);
  });

  test('GET /api/auth/status returns loggedIn field', async () => {
    const res = await fetch(`${BASE}/api/auth/status`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(typeof data.loggedIn).toBe('boolean');
  });

  test('POST /api/upload accepts file and returns parsed info', async () => {
    const res = await sendMultipart(`${BASE}/api/upload`, 'test.md', '# Test Title\n\n## Section 1\n\nHello world\n\n## Section 2\n\nMore content');
    expect(res.status).toBe(200);
    const data = res.data;
    expect(data.parsed.title).toBe('Test Title');
    expect(data.parsed.blockCount).toBeGreaterThanOrEqual(1);
    expect(data.filePath).toBeTruthy();
  });

  test('POST /api/generate starts task and returns taskId', async () => {
    // First upload
    const uploadRes = await sendMultipart(`${BASE}/api/upload`, 'gen-test.md', '# Gen Test\n\n## Part 1\n\nContent\n\n## Part 2\n\nMore');
    const uploadData = uploadRes.data;

    // Start generation
    const genRes = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: uploadData.filePath, theme: 'dark' }),
    });
    expect(genRes.status).toBe(200);
    const genData = await genRes.json() as any;
    expect(genData.taskId).toBeTruthy();

    // Poll until complete (or timeout)
    let taskStatus = 'pending';
    for (let i = 0; i < 60; i++) {
      const taskRes = await fetch(`${BASE}/api/tasks/${genData.taskId}`);
      const task = await taskRes.json() as any;
      taskStatus = task.status;
      if (task.status === 'completed' || task.status === 'failed') break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(taskStatus).toBe('completed');
  });

  test('GET /api/tasks/:id returns 404 for unknown task', async () => {
    const res = await fetch(`${BASE}/api/tasks/nonexistent`);
    expect(res.status).toBe(404);
  });

  test('GET / serves frontend HTML', async () => {
    const res = await fetch(BASE);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="root"');
  });

  test('SPA fallback serves index.html for unknown routes', async () => {
    const res = await fetch(`${BASE}/upload`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="root"');
  });
});
