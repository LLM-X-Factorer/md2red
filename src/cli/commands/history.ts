import { loadHistory, clearHistory, type GenerationRecord } from '../../tracker/index.js';
import { logger } from '../../utils/logger.js';

export async function historyListCommand() {
  const records = await loadHistory();
  if (records.length === 0) {
    logger.info('暂无生成历史');
    return;
  }

  console.log(`\n共 ${records.length} 条记录:\n`);
  for (const r of records) {
    const status = statusIcon(r.status);
    console.log(`  ${status} [${r.createdAt.slice(0, 10)}] ${r.title}`);
    console.log(`     ${r.imageCount} 张图片 | ${r.outputDir}`);
    console.log();
  }
}

export async function historyClearCommand() {
  await clearHistory();
  logger.success('生成历史已清除');
}

function statusIcon(status: GenerationRecord['status']): string {
  switch (status) {
    case 'generated': return '📦';
    case 'previewed': return '👁️';
  }
}
