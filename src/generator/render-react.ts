import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderHtml, closeBrowser } from './renderer.js';

export { closeBrowser };

export async function renderReactCard(
  element: React.ReactElement,
  outputPath: string,
): Promise<void> {
  const markup = renderToStaticMarkup(element);
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>* { margin: 0; padding: 0; box-sizing: border-box; }</style>
</head><body>${markup}</body></html>`;

  await renderHtml(html, outputPath);
}
