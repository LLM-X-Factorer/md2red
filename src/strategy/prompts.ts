import type { ParsedDocument } from '../parser/types.js';
import type { Md2RedConfig } from '../config/schema.js';

export function buildStrategyPrompt(doc: ParsedDocument, config: Md2RedConfig, feedbackContext?: string | null): string {
  const blockSummary = doc.contentBlocks
    .map((b, i) => `  ${i + 1}. [${b.type}] ${b.heading || '(无标题)'} (${b.textContent.length}字)`)
    .join('\n');

  return `你是一个小红书内容策划专家，精通平台算法和用户心理。请基于以下 Markdown 文档内容，生成小红书图文笔记的完整内容策略。

## 原始文档信息
- 标题：${doc.title}
- 总字数：${doc.metadata.wordCount}
- 内容块数：${doc.contentBlocks.length}
- 包含代码：${doc.metadata.hasCodeBlocks ? '是' : '否'}${doc.coverText ? `\n- 封面文案：${doc.coverText}` : ''}

## 内容块概览
${blockSummary}

## 文档全文摘要
${doc.contentBlocks.map((b) => b.textContent).join('\n\n').slice(0, 3000)}

## 目标受众
${config.content.targetAudience}

## 风格
${config.content.style === 'technical' ? '技术干货向，专业但易懂' : config.content.style === 'casual' ? '轻松随意，偏口语化' : '技术内容+轻松表达混合'}

## 标题创作规则（重要）

标题是决定笔记生死的关键。遵循以下铁律：

1. **标题留悬念，不说答案。** 用「为什么」不用「证明」，用「问题」不用「结论」。看完标题，用户还需要点进来。
2. **话题要扩大，不要缩窄。** 用普世词（赚钱、效率、省时间）替换行业术语。缩窄话题 = 缩小流量池。
3. **击中真实痛点，不是表象概念。** 问自己：受众真正想要的是什么？
4. **张力检查：至少满足 2 项。** 有对比/反差、有具体数字、有悬念/好奇心、有冲突/争议性、有时间承诺、有结果承诺。
5. **≤20 字（含标点）。** 硬性规范，超了就砍。

使用以下经过验证的标题公式（根据文档内容选择最合适的类型）：
- **认知冲突型**：「为什么 [大家觉得好的事] 其实对你有害？」— 打破认知制造停留
- **好奇缺口型**：「[一群人] 不会告诉你的建议」— 信息不对称焦虑
- **恐惧/损失型**：「[数字] 件阻碍你达成 [结果] 的事」— 激活损失厌恶
- **数字锚定型**：「[话题] 的 [数字] 个步骤」— 降低认知成本
- **结果承诺型**：「如何不 [讨厌的事]，就能在 [时间] 里达到 [结果]」— 可量化结果
- **社会证明型**：「我是如何从 [不想要的结果] 到 [想要的结果]」— 案例驱动信任
- **争议/挑衅型**：「停止 [行动]！！开始 [行动]！！」— 制造站队感

每个标题必须能追溯到上述公式类型。不要自由发挥无公式支撑的标题。

## 正文/摘要创作规则

1. **文字洁癖是底线。** 不要 Emoji 堆叠、不要晦涩词汇、不要空洞排比句、不要「请你记住」「真相是」这类祈使句。
2. **表达效率优先。** 能一句话说清楚核心观点就不要用三句话。不要用 99% 的篇幅包装 1% 的内容。
3. **结构清晰。** 核心价值 → 要点概述 → 互动引导。每个段落都要有信息增量。
4. **语言要公共的、可验证的。** 不用模糊概念，用具体事实和数据。
5. **互动引导自然。** 末尾引导评论/收藏，但不要生硬（避免「你觉得呢？快来评论吧！」）。

## 标签创作规则

- 混合大类标签（扩大流量池）和精准标签（匹配目标受众）
- 大类标签用普世词，精准标签可用行业术语

## 要求

请严格按照以下 JSON 格式输出（不要输出任何其他内容）：

{
  "titles": ["标题1", "标题2", "标题3"],
  "summary": "正文摘要（≤1000字，结构：核心价值→要点概述→互动引导）",
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
1. titles：生成 3-5 个候选标题，每个 ≤20 个中文字符，必须基于上述标题公式，至少覆盖 3 种不同公式类型
2. summary：≤1000 字的小红书正文，不要 Emoji 堆叠（最多 3-5 个点缀），末尾有自然的互动引导
3. tags：5-10 个标签，混合大类标签和具体标签
4. cardPlan：${config.content.minCards}-${config.content.maxCards} 张卡片（含封面和总结页）
   - index=0 必须是 cover 类型${doc.coverText ? '，封面副标题/bodyText 应基于文档提供的封面文案' : ''}
   - 最后一张必须是 summary 类型
   - 包含代码的块用 type="code"，layoutHint="code-focused"
   - 代码块的 sourceBlockIndex 指向原始 contentBlocks 的索引
   - 内容卡片的 bodyText 不要超过 200 字
5. 只输出 JSON，不要任何 markdown 包装或额外说明${feedbackContext ? '\n\n' + feedbackContext : ''}`;
}
