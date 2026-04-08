import type { ParsedDocument, CodeSnippet, ImageReference } from '../parser/types.js';
import type { Md2RedConfig } from '../config/schema.js';
import { buildStrategyPrompt } from './prompts.js';
import { buildFeedbackContext } from './feedback.js';
import { createProvider, resolveCallConfig } from './providers/index.js';
import { logger } from '../utils/logger.js';

export interface ContentStrategy {
  titles: string[];
  selectedTitle?: string;
  summary: string;
  tags: string[];
  cardPlan: CardPlan[];
}

export interface CardPlan {
  index: number;
  type: 'cover' | 'content' | 'code' | 'summary';
  title: string;
  bodyText: string;
  codeSnippet?: CodeSnippet;
  image?: ImageReference;
  layoutHint: 'text-heavy' | 'code-focused' | 'image-with-caption' | 'cover-style';
  sourceBlockIndex?: number;
}

const MAX_RETRIES = 1;

/**
 * Try to fix truncated JSON by closing unclosed brackets/braces/strings.
 */
export function tryRepairJson(raw: string): string | null {
  let s = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // Try parsing as-is first
  try {
    JSON.parse(s);
    return s;
  } catch { /* needs repair */ }

  // Remove trailing incomplete key-value (e.g. `"summary": "some text that got cu`)
  // by trimming back to last complete value
  s = s.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
  s = s.replace(/,\s*"[^"]*":\s*$/, '');
  s = s.replace(/,\s*$/, '');

  // Close unclosed strings
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) s += '"';

  // Close unclosed brackets/braces
  const stack: string[] = [];
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && (i === 0 || s[i - 1] !== '\\')) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }
  while (stack.length > 0) {
    const open = stack.pop();
    s += open === '{' ? '}' : ']';
  }

  try {
    JSON.parse(s);
    return s;
  } catch {
    return null;
  }
}

export async function generateStrategy(
  doc: ParsedDocument,
  config: Md2RedConfig,
): Promise<ContentStrategy | null> {
  const feedback = await buildFeedbackContext();
  const prompt = buildStrategyPrompt(doc, config, feedback);
  const provider = createProvider(config);
  const callConfig = resolveCallConfig(config);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      logger.warn(`JSON 解析失败，第 ${attempt} 次重试...`);
    }
    logger.info(`调用 ${provider.name} (${callConfig.model}) 生成内容策略...`);

    let raw: string;
    try {
      raw = await provider.call(prompt, callConfig);
    } catch (err) {
      logger.warn(`LLM 调用失败: ${(err as Error).message}`);
      continue;
    }

    const repaired = tryRepairJson(raw);
    if (!repaired) {
      logger.warn(`LLM 返回的 JSON 无法解析:\n${raw.slice(0, 300)}`);
      continue;
    }

    let parsed: ContentStrategy;
    try {
      parsed = JSON.parse(repaired);
    } catch {
      continue;
    }

    // Validate minimum structure
    if (!parsed.cardPlan || !Array.isArray(parsed.cardPlan) || parsed.cardPlan.length === 0) {
      logger.warn('LLM 返回的 JSON 缺少有效的 cardPlan');
      continue;
    }

    // Normalize
    return normalizeStrategy(parsed, doc);
  }

  logger.warn('策略生成失败，将 fallback 到直接模式');
  return null;
}

function normalizeStrategy(parsed: ContentStrategy, doc: ParsedDocument): ContentStrategy {
  // Normalize titles: ensure array, add doc.title as fallback
  if (!Array.isArray(parsed.titles) || parsed.titles.length === 0) {
    parsed.titles = [doc.title];
  }
  // Add original doc title if not already included
  if (!parsed.titles.includes(doc.title)) {
    parsed.titles.push(doc.title);
  }

  // Normalize tags: ensure array
  if (!Array.isArray(parsed.tags)) parsed.tags = [];

  // Normalize summary
  if (typeof parsed.summary !== 'string') parsed.summary = '';

  for (const card of parsed.cardPlan) {
    if (card.type === 'code' && card.sourceBlockIndex != null) {
      const block = doc.contentBlocks[card.sourceBlockIndex];
      if (block?.codeSnippets?.length) {
        card.codeSnippet = block.codeSnippets[0];
      }
    }
  }

  logger.success(`策略生成完成: ${parsed.titles.length} 个标题, ${parsed.cardPlan.length} 张卡片`);
  return parsed;
}
