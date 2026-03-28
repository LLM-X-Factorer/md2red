import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderHtml, closeBrowser } from './renderer.js';

export { closeBrowser };

const CARD_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }
p { margin-bottom: 20px; text-align: justify; }
ul, ol { margin-left: 36px; margin-bottom: 20px; }
li { margin-bottom: 8px; }
strong { font-weight: 700; }
em { font-style: italic; }
code { font-family: 'JetBrains Mono', 'Fira Code', monospace; background: rgba(99,102,241,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
a { color: inherit; text-decoration: underline; }
blockquote { border-left: 4px solid rgba(99,102,241,0.4); padding-left: 16px; margin: 16px 0; opacity: 0.85; }
`;

export async function renderReactCard(
  element: React.ReactElement,
  outputPath: string,
): Promise<void> {
  const markup = renderToStaticMarkup(element);
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>${CARD_STYLES}</style>
</head><body>${markup}</body></html>`;

  await renderHtml(html, outputPath);
}
