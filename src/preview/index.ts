import { readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { exec } from 'node:child_process';
import { logger } from '../utils/logger.js';
import type { ContentStrategy } from '../strategy/index.js';

export interface PreviewData {
  outputDir: string;
  strategy?: ContentStrategy;
}

export async function generatePreview(data: PreviewData): Promise<string> {
  const { outputDir } = data;
  const absDir = resolve(outputDir);

  const files = await readdir(absDir);
  const images = files
    .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
    .sort();

  if (images.length === 0) {
    throw new Error('输出目录中没有找到图片');
  }

  // Read images as base64 for self-contained HTML
  const { readFile } = await import('node:fs/promises');
  const imageDataList: { name: string; base64: string }[] = [];
  for (const img of images) {
    const buf = await readFile(join(absDir, img));
    const ext = img.endsWith('.jpg') ? 'jpeg' : 'png';
    imageDataList.push({
      name: img,
      base64: `data:image/${ext};base64,${buf.toString('base64')}`,
    });
  }

  const strategy = data.strategy;
  const titles = strategy?.titles || [];
  const summary = strategy?.summary || '';
  const tags = strategy?.tags || [];

  const html = buildPreviewHtml(imageDataList, titles, summary, tags, absDir);
  const previewPath = join(absDir, 'preview.html');
  await writeFile(previewPath, html);
  logger.success(`预览页面已生成: ${previewPath}`);

  return previewPath;
}

export function openInBrowser(filePath: string): void {
  const cmd =
    process.platform === 'darwin'
      ? `open "${filePath}"`
      : process.platform === 'win32'
        ? `start "${filePath}"`
        : `xdg-open "${filePath}"`;
  exec(cmd);
}

function buildPreviewHtml(
  images: { name: string; base64: string }[],
  titles: string[],
  summary: string,
  tags: string[],
  outputDir: string,
): string {
  const imageCards = images
    .map(
      (img, i) => `
      <div class="card" data-index="${i}">
        <img src="${img.base64}" alt="${img.name}" />
        <div class="card-label">${img.name}</div>
      </div>`,
    )
    .join('\n');

  const titleOptions = titles
    .map(
      (t, i) => `<label class="title-option">
        <input type="radio" name="title" value="${escHtml(t)}" ${i === 0 ? 'checked' : ''} />
        <span>${escHtml(t)}</span>
      </label>`,
    )
    .join('\n');

  const tagBadges = tags.map((t) => `<span class="tag">#${escHtml(t)}</span>`).join(' ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>md2red 预览</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif; background: #0f0f0f; color: #e0e0e0; }
  .header { padding: 24px 32px; border-bottom: 1px solid #222; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 20px; font-weight: 600; }
  .header .actions button { padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; margin-left: 8px; }
  .btn-confirm { background: #6366f1; color: #fff; }
  .btn-confirm:hover { background: #5558e6; }
  .btn-secondary { background: #333; color: #ccc; }
  .container { display: flex; height: calc(100vh - 73px); }
  .carousel { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .carousel .card { display: none; flex-direction: column; align-items: center; }
  .carousel .card.active { display: flex; }
  .carousel .card img { max-height: calc(100vh - 140px); max-width: 100%; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
  .carousel .card-label { margin-top: 12px; font-size: 13px; color: #666; }
  .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 24px; cursor: pointer; z-index: 10; }
  .nav-btn:hover { background: rgba(255,255,255,0.2); }
  .nav-prev { left: 16px; }
  .nav-next { right: 16px; }
  .sidebar { width: 380px; border-left: 1px solid #222; padding: 24px; overflow-y: auto; }
  .sidebar h3 { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #999; }
  .sidebar section { margin-bottom: 28px; }
  .title-option { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; border-radius: 8px; cursor: pointer; margin-bottom: 6px; }
  .title-option:hover { background: #1a1a1a; }
  .title-option input { margin-top: 3px; }
  .title-option span { font-size: 14px; line-height: 1.5; }
  .summary-box { font-size: 13px; line-height: 1.8; color: #aaa; background: #1a1a1a; border-radius: 8px; padding: 16px; max-height: 240px; overflow-y: auto; white-space: pre-wrap; }
  .tag { display: inline-block; padding: 4px 12px; border-radius: 14px; font-size: 12px; background: #1e1e3a; color: #8888ff; margin: 3px 2px; }
  .thumbnails { display: flex; gap: 6px; flex-wrap: wrap; }
  .thumbnails img { width: 56px; height: 75px; object-fit: cover; border-radius: 4px; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; border: 2px solid transparent; }
  .thumbnails img.active { opacity: 1; border-color: #6366f1; }
  .counter { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); font-size: 14px; color: #666; }
  .output-path { font-size: 12px; color: #555; margin-top: 8px; word-break: break-all; }
</style>
</head>
<body>
  <div class="header">
    <h1>md2red 预览</h1>
    <div class="actions">
      <button class="btn-secondary" onclick="window.close()">关闭</button>
    </div>
  </div>
  <div class="container">
    <div class="carousel" id="carousel">
      <button class="nav-btn nav-prev" onclick="navigate(-1)">‹</button>
      ${imageCards}
      <button class="nav-btn nav-next" onclick="navigate(1)">›</button>
      <div class="counter" id="counter"></div>
    </div>
    <div class="sidebar">
      ${titles.length > 0 ? `<section><h3>候选标题</h3>${titleOptions}</section>` : ''}
      ${summary ? `<section><h3>正文摘要</h3><div class="summary-box">${escHtml(summary)}</div></section>` : ''}
      ${tags.length > 0 ? `<section><h3>标签</h3><div>${tagBadges}</div></section>` : ''}
      <section>
        <h3>卡片缩略图 (${images.length})</h3>
        <div class="thumbnails" id="thumbs">
          ${images.map((img, i) => `<img src="${img.base64}" data-index="${i}" onclick="goTo(${i})" />`).join('\n')}
        </div>
      </section>
      <div class="output-path">输出目录: ${escHtml(outputDir)}</div>
    </div>
  </div>
<script>
let current = 0;
const cards = document.querySelectorAll('.card');
const thumbs = document.querySelectorAll('.thumbnails img');
const counter = document.getElementById('counter');
function show(idx) {
  cards.forEach((c, i) => c.classList.toggle('active', i === idx));
  thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
  counter.textContent = (idx + 1) + ' / ' + cards.length;
  current = idx;
}
function navigate(dir) {
  let next = current + dir;
  if (next < 0) next = cards.length - 1;
  if (next >= cards.length) next = 0;
  show(next);
}
function goTo(idx) { show(idx); }
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});
show(0);
</script>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
