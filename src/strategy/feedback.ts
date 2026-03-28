import { loadHistory, type PublishRecord } from '../tracker/index.js';

export async function buildFeedbackContext(): Promise<string | null> {
  const history = await loadHistory();
  const withMetrics = history.filter((r) => r.metrics && r.status === 'published');

  if (withMetrics.length < 3) return null;

  // Sort by engagement (likes + collects + comments)
  const ranked = withMetrics
    .map((r) => ({
      ...r,
      engagement: (r.metrics!.likes + r.metrics!.collects + r.metrics!.comments),
    }))
    .sort((a, b) => b.engagement - a.engagement);

  const top = ranked.slice(0, 5);
  const avg = ranked.reduce((sum, r) => sum + r.engagement, 0) / ranked.length;

  const lines = top.map(
    (r) => `- "${r.title}" (${r.metrics!.likes}赞/${r.metrics!.collects}收藏/${r.metrics!.comments}评论)`,
  );

  return `## 历史表现参考
你之前发布的笔记中，表现最好的几篇是：
${lines.join('\n')}

平均互动数：${Math.round(avg)}

请参考这些高互动笔记的标题风格和内容组织方式，生成更有吸引力的内容。`;
}
