import { createHighlighter, type Highlighter } from 'shiki';

let highlighter: Highlighter | null = null;

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['catppuccin-mocha', 'catppuccin-latte'],
      langs: [
        'typescript',
        'javascript',
        'python',
        'go',
        'rust',
        'sql',
        'bash',
        'json',
        'yaml',
        'html',
        'css',
        'java',
        'c',
        'cpp',
        'markdown',
      ],
    });
  }
  return highlighter;
}

export async function highlightCode(
  code: string,
  lang: string,
  darkMode: boolean = true,
): Promise<string> {
  const hl = await getHighlighter();
  const theme = darkMode ? 'catppuccin-mocha' : 'catppuccin-latte';
  const validLangs = hl.getLoadedLanguages();
  const actualLang = validLangs.includes(lang as never) ? lang : 'text';

  try {
    return hl.codeToHtml(code, { lang: actualLang, theme });
  } catch {
    return `<pre style="color:#cdd6f4">${escapeHtml(code)}</pre>`;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
