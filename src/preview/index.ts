import { readdir, writeFile, readFile } from 'node:fs/promises';
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
  const images = files.filter((f) => f.endsWith('.png') || f.endsWith('.jpg')).sort();

  if (images.length === 0) throw new Error('输出目录中没有找到图片');

  const imageDataList: { name: string; base64: string }[] = [];
  for (const img of images) {
    const buf = await readFile(join(absDir, img));
    const ext = img.endsWith('.jpg') ? 'jpeg' : 'png';
    imageDataList.push({ name: img, base64: `data:image/${ext};base64,${buf.toString('base64')}` });
  }

  const strategy = data.strategy;
  const html = buildPreviewHtml(imageDataList, strategy, absDir);
  const previewPath = join(absDir, 'preview.html');
  await writeFile(previewPath, html);
  logger.success(`预览页面已生成: ${previewPath}`);
  return previewPath;
}

export function openInBrowser(filePath: string): void {
  const cmd = process.platform === 'darwin' ? `open "${filePath}"` : process.platform === 'win32' ? `start "${filePath}"` : `xdg-open "${filePath}"`;
  exec(cmd);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildPreviewHtml(
  images: { name: string; base64: string }[],
  strategy: ContentStrategy | undefined,
  outputDir: string,
): string {
  const titles = strategy?.titles || [];
  const summary = strategy?.summary || '';
  const tags = strategy?.tags || [];

  const imagesJson = JSON.stringify(images.map((img) => ({ name: img.name, base64: img.base64 })));
  const titlesJson = JSON.stringify(titles);
  const tagsJson = JSON.stringify(tags);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>md2red 预览</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'PingFang SC','Noto Sans SC',sans-serif;background:#0f0f0f;color:#e0e0e0}
.header{padding:20px 32px;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between}
.header h1{font-size:18px;font-weight:600}
.actions button{padding:8px 20px;border-radius:8px;border:none;cursor:pointer;font-size:14px;margin-left:8px}
.btn-confirm{background:#6366f1;color:#fff}.btn-confirm:hover{background:#5558e6}
.btn-secondary{background:#333;color:#ccc}
.container{display:flex;height:calc(100vh - 65px)}
.carousel{flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.carousel .card{display:none;flex-direction:column;align-items:center}
.carousel .card.active{display:flex}
.carousel .card img{max-height:calc(100vh - 130px);max-width:100%;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.5)}
.carousel .card-label{margin-top:10px;font-size:12px;color:#555}
.nav-btn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:22px;cursor:pointer;z-index:10}
.nav-btn:hover{background:rgba(255,255,255,.2)}
.nav-prev{left:12px}.nav-next{right:12px}
.counter{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:13px;color:#555}
.sidebar{width:400px;border-left:1px solid #222;padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:20px}
.sidebar h3{font-size:13px;font-weight:600;color:#888;margin-bottom:8px}
section{background:#161616;border-radius:10px;padding:16px}
.title-option{display:flex;align-items:flex-start;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;margin-bottom:4px}
.title-option:hover{background:#1e1e1e}
.title-option input{margin-top:3px}
.title-option span{font-size:13px;line-height:1.5}
.custom-title{width:100%;margin-top:8px;padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:13px}
.summary-box{width:100%;min-height:100px;max-height:200px;overflow-y:auto;font-size:12px;line-height:1.8;color:#aaa;background:#1a1a1a;border-radius:6px;padding:12px;border:1px solid #333;resize:vertical}
.tag-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.tag{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:14px;font-size:11px;background:#1e1e3a;color:#8888ff}
.tag .del{cursor:pointer;opacity:.5;font-size:14px}.tag .del:hover{opacity:1}
.tag-input{display:flex;gap:6px}
.tag-input input{flex:1;padding:6px 10px;border-radius:6px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:12px}
.tag-input button{padding:6px 14px;border-radius:6px;border:none;background:#333;color:#ccc;cursor:pointer;font-size:12px}
.sortable{display:flex;gap:6px;flex-wrap:wrap;min-height:80px;padding:4px;border-radius:8px}
.thumb-item{position:relative;cursor:grab;user-select:none;transition:transform .15s}
.thumb-item.dragging{opacity:.4;transform:scale(.95)}
.thumb-item.over{transform:scale(1.05);outline:2px solid #6366f1;outline-offset:2px;border-radius:4px}
.thumb-item img{width:54px;height:72px;object-fit:cover;border-radius:4px;display:block}
.thumb-item.active img{outline:2px solid #6366f1;outline-offset:1px;border-radius:4px}
.thumb-del{position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#e44;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity .15s}
.thumb-item:hover .thumb-del{opacity:1}
.output-path{font-size:11px;color:#444;word-break:break-all}
.toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#6366f1;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;display:none;z-index:100;box-shadow:0 4px 20px rgba(0,0,0,.4)}
</style>
</head>
<body>
<div class="header">
  <h1>md2red 预览</h1>
  <div class="actions">
    <button class="btn-secondary" onclick="window.close()">关闭</button>
    <button class="btn-confirm" onclick="exportPlan()">确认发布方案</button>
  </div>
</div>
<div class="container">
  <div class="carousel" id="carousel">
    <button class="nav-btn nav-prev" onclick="nav(-1)">‹</button>
    <div id="cards"></div>
    <button class="nav-btn nav-next" onclick="nav(1)">›</button>
    <div class="counter" id="counter"></div>
  </div>
  <div class="sidebar">
    <section>
      <h3>标题</h3>
      <div id="titleOptions"></div>
      <input class="custom-title" id="customTitle" placeholder="自定义标题..." oninput="onCustomTitle()"/>
    </section>
    <section>
      <h3>正文摘要</h3>
      <textarea class="summary-box" id="summaryBox">${esc(summary)}</textarea>
    </section>
    <section>
      <h3>标签</h3>
      <div class="tag-list" id="tagList"></div>
      <div class="tag-input"><input id="tagInput" placeholder="添加标签..." onkeydown="if(event.key==='Enter')addTag()"/><button onclick="addTag()">+</button></div>
    </section>
    <section>
      <h3>卡片顺序 (<span id="cardCount"></span>)</h3>
      <div class="sortable" id="sortable"></div>
    </section>
    <div class="output-path">${esc(outputDir)}</div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
const allImages = ${imagesJson};
const allTitles = ${titlesJson};
let currentTags = ${tagsJson};
let imageOrder = allImages.map(img => img.name);
let current = 0;

// --- Cards ---
function renderCards() {
  const container = document.getElementById('cards');
  container.innerHTML = imageOrder.map((name, i) => {
    const img = allImages.find(x => x.name === name);
    return '<div class="card'+(i===current?' active':'')+'"><img src="'+img.base64+'"/><div class="card-label">'+name+'</div></div>';
  }).join('');
  document.getElementById('counter').textContent = (current+1)+' / '+imageOrder.length;
}
function nav(dir) {
  current = (current+dir+imageOrder.length) % imageOrder.length;
  renderCards();
  renderSortable();
}
function goTo(i) { current = i; renderCards(); renderSortable(); }

// --- Titles ---
function renderTitles() {
  const box = document.getElementById('titleOptions');
  if (!allTitles.length) { box.innerHTML = '<span style="font-size:12px;color:#555">无候选标题</span>'; return; }
  box.innerHTML = allTitles.map((t, i) =>
    '<label class="title-option"><input type="radio" name="title" value="'+i+'" '+(i===0?'checked':'')+' onchange="onTitleSelect()"/><span>'+escH(t)+'</span></label>'
  ).join('');
}
function onTitleSelect() { document.getElementById('customTitle').value = ''; }
function onCustomTitle() {
  document.querySelectorAll('input[name="title"]').forEach(r => r.checked = false);
}
function getSelectedTitle() {
  const custom = document.getElementById('customTitle').value.trim();
  if (custom) return custom;
  const checked = document.querySelector('input[name="title"]:checked');
  return checked ? allTitles[parseInt(checked.value)] : (allTitles[0] || '');
}

// --- Tags ---
function renderTags() {
  document.getElementById('tagList').innerHTML = currentTags.map((t, i) =>
    '<span class="tag">'+escH(t)+'<span class="del" onclick="removeTag('+i+')">&times;</span></span>'
  ).join('');
}
function addTag() {
  const input = document.getElementById('tagInput');
  const v = input.value.trim().replace(/^#/, '');
  if (v && !currentTags.includes(v)) { currentTags.push(v); renderTags(); }
  input.value = '';
}
function removeTag(i) { currentTags.splice(i, 1); renderTags(); }

// --- Sortable thumbnails ---
let dragIdx = null;
function renderSortable() {
  const box = document.getElementById('sortable');
  document.getElementById('cardCount').textContent = imageOrder.length;
  box.innerHTML = imageOrder.map((name, i) => {
    const img = allImages.find(x => x.name === name);
    return '<div class="thumb-item'+(i===current?' active':'')+'" draggable="true" data-idx="'+i+'">' +
      '<img src="'+img.base64+'" onclick="goTo('+i+')"/>' +
      '<span class="thumb-del" onclick="removeCard('+i+')">&times;</span></div>';
  }).join('');
  box.querySelectorAll('.thumb-item').forEach(el => {
    el.addEventListener('dragstart', e => { dragIdx = parseInt(el.dataset.idx); el.classList.add('dragging'); });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); dragIdx = null; box.querySelectorAll('.thumb-item').forEach(x=>x.classList.remove('over')); });
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('over');
      const dropIdx = parseInt(el.dataset.idx);
      if (dragIdx !== null && dragIdx !== dropIdx) {
        const item = imageOrder.splice(dragIdx, 1)[0];
        imageOrder.splice(dropIdx, 0, item);
        if (current === dragIdx) current = dropIdx;
        else if (dragIdx < current && dropIdx >= current) current--;
        else if (dragIdx > current && dropIdx <= current) current++;
        renderCards(); renderSortable();
      }
    });
  });
}
function removeCard(i) {
  if (imageOrder.length <= 1) return;
  imageOrder.splice(i, 1);
  if (current >= imageOrder.length) current = imageOrder.length - 1;
  renderCards(); renderSortable();
}

// --- Export ---
function exportPlan() {
  const plan = {
    title: getSelectedTitle(),
    summary: document.getElementById('summaryBox').value,
    tags: currentTags,
    imageOrder: imageOrder,
    confirmedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(plan, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'publish-plan.json';
  a.click();
  showToast('publish-plan.json 已下载，运行 md2red publish 发布');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 4000);
}
function escH(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') nav(-1);
  if (e.key === 'ArrowRight') nav(1);
});

renderCards(); renderTitles(); renderTags(); renderSortable();
</script>
</body>
</html>`;
}
