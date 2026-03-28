import { writeFile } from 'node:fs/promises';
import { parseMarkdown } from '../../parser/index.js';
import { logger } from '../../utils/logger.js';

export async function parseCommand(file: string, opts: { output?: string }) {
  try {
    const doc = await parseMarkdown(file);

    logger.info(`标题: ${doc.title}`);
    logger.info(`字数: ${doc.metadata.wordCount}`);
    logger.info(`内容块: ${doc.contentBlocks.length}`);
    logger.info(`预估卡片数: ${doc.metadata.estimatedCards}`);
    logger.info(`包含代码块: ${doc.metadata.hasCodeBlocks ? '是' : '否'}`);
    logger.info(`图片引用: ${doc.images.length}`);

    console.log('\n--- 内容块详情 ---');
    for (const block of doc.contentBlocks) {
      console.log(
        `  [${block.type}] ${block.heading || '(无标题)'} (${block.estimatedLength}, ${block.textContent.length}字)`,
      );
    }

    if (opts.output) {
      await writeFile(opts.output, JSON.stringify(doc, null, 2));
      logger.success(`JSON 已保存到: ${opts.output}`);
    }
  } catch (err) {
    logger.error(`解析失败: ${(err as Error).message}`);
    process.exit(1);
  }
}
