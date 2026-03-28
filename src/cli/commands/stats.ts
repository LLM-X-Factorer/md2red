import { loadHistory } from '../../tracker/index.js';
import { logger } from '../../utils/logger.js';

export async function statsCommand() {
  const records = await loadHistory();
  const published = records.filter((r) => r.status === 'published');

  if (published.length === 0) {
    logger.info('暂无已发布的笔记');
    return;
  }

  const withMetrics = published.filter((r) => r.metrics);
  const withoutMetrics = published.filter((r) => !r.metrics);

  if (withMetrics.length > 0) {
    console.log('\n📊 笔记表现统计\n');
    console.log('  标题                           赞    收藏   评论   互动总');
    console.log('  ' + '─'.repeat(70));

    const sorted = withMetrics
      .map((r) => ({
        ...r,
        total: r.metrics!.likes + r.metrics!.collects + r.metrics!.comments,
      }))
      .sort((a, b) => b.total - a.total);

    for (const r of sorted) {
      const m = r.metrics!;
      const title = r.title.slice(0, 25).padEnd(25);
      console.log(
        `  ${title}  ${String(m.likes).padStart(5)}  ${String(m.collects).padStart(5)}  ${String(m.comments).padStart(5)}  ${String(r.total).padStart(6)}`,
      );
    }

    const totalLikes = sorted.reduce((s, r) => s + r.metrics!.likes, 0);
    const totalCollects = sorted.reduce((s, r) => s + r.metrics!.collects, 0);
    const totalComments = sorted.reduce((s, r) => s + r.metrics!.comments, 0);
    console.log('  ' + '─'.repeat(70));
    console.log(
      `  ${'合计'.padEnd(25)}  ${String(totalLikes).padStart(5)}  ${String(totalCollects).padStart(5)}  ${String(totalComments).padStart(5)}`,
    );
  }

  if (withoutMetrics.length > 0) {
    console.log(`\n  ${withoutMetrics.length} 篇笔记尚无指标数据，运行 md2red scrape 获取\n`);
  }
}
