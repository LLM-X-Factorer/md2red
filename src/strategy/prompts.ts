import type { ParsedDocument } from '../parser/types.js';
import type { Md2RedConfig } from '../config/schema.js';

export function buildStrategyPrompt(doc: ParsedDocument, config: Md2RedConfig, feedbackContext?: string | null): string {
  const blockSummary = doc.contentBlocks
    .map((b, i) => `  ${i + 1}. [${b.type}] ${b.heading || '(无标题)'} (${b.textContent.length}字)`)
    .join('\n');

  return `你是一个小红书内容策划专家。请基于以下 Markdown 文档内容，生成小红书图文笔记的完整内容策略。

## 原始文档信息
- 标题：${doc.title}
- 总字数：${doc.metadata.wordCount}
- 内容块数：${doc.contentBlocks.length}
- 包含代码：${doc.metadata.hasCodeBlocks ? '是' : '否'}

## 内容块概览
${blockSummary}

## 文档全文摘要
${doc.contentBlocks.map((b) => b.textContent).join('\n\n').slice(0, 3000)}

## 目标受众
${config.content.targetAudience}

## 风格
${config.content.style === 'technical' ? '技术干货向，专业但易懂' : config.content.style === 'casual' ? '轻松随意，偏口语化' : '技术内容+轻松表达混合'}

## 要求

请严格按照以下 JSON 格式输出（不要输出任何其他内容）：

{
  "titles": ["标题1", "标题2", "标题3"],
  "summary": "正文摘要（≤1000字，包含适度emoji，结构：核心价值→要点概述→互动引导）",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "cardPlan": [
    {
      "index": 0,
      "type": "cover",
      "title": "封面大标题",
      "bodyText": "封面副标题/描述",
      "layoutHint": "cover-style"
    },
    {
      "index": 1,
      "type": "content",
      "title": "卡片标题",
      "bodyText": "卡片内容文字",
      "sourceBlockIndex": 0,
      "layoutHint": "text-heavy"
    }
  ]
}

## 约束
1. titles：生成 3-5 个候选标题，每个 ≤20 个中文字符，技术干货风格，有吸引力但不夸张
2. summary：≤1000 字的小红书正文，emoji 适度，末尾有互动引导
3. tags：5-10 个标签，混合大类标签和具体标签
4. cardPlan：${config.content.minCards}-${config.content.maxCards} 张卡片（含封面和总结页）
   - index=0 必须是 cover 类型
   - 最后一张必须是 summary 类型
   - 包含代码的块用 type="code"，layoutHint="code-focused"
   - 代码块的 sourceBlockIndex 指向原始 contentBlocks 的索引
   - 内容卡片的 bodyText 不要超过 200 字
5. 只输出 JSON，不要任何 markdown 包装或额外说明${feedbackContext ? '\n\n' + feedbackContext : ''}`;
}
