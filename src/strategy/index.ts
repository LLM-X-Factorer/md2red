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

export async function generateStrategy(
  doc: ParsedDocument,
  config: Md2RedConfig,
): Promise<ContentStrategy> {
  const feedback = await buildFeedbackContext();
  const prompt = buildStrategyPrompt(doc, config, feedback);
  const provider = createProvider(config);
  const callConfig = resolveCallConfig(config);

  logger.info(`调用 ${provider.name} (${callConfig.model}) 生成内容策略...`);
  const raw = await provider.call(prompt, callConfig);

  const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed: ContentStrategy;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM 返回的 JSON 解析失败:\n${raw.slice(0, 500)}`);
  }

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
