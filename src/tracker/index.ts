import { nanoid } from 'nanoid';
import { fileHash } from '../utils/hash.js';
import { logger } from '../utils/logger.js';
import {
  addRecord,
  findByHash,
  type GenerationRecord,
} from './store.js';

export type { GenerationRecord } from './store.js';
export { loadHistory, clearHistory } from './store.js';

export async function checkDuplicate(
  sourceFile: string,
  force: boolean,
): Promise<{ isDuplicate: boolean; hash: string; existing?: GenerationRecord }> {
  const hash = await fileHash(sourceFile);
  const existing = await findByHash(hash);

  if (existing && !force) {
    logger.warn(
      `该文档已于 ${existing.createdAt} 生成过 (状态: ${existing.status})，使用 --force 强制重新生成`,
    );
    return { isDuplicate: true, hash, existing };
  }

  return { isDuplicate: false, hash };
}

export async function createRecord(
  sourceFile: string,
  hash: string,
  title: string,
  imageCount: number,
  outputDir: string,
): Promise<string> {
  const id = nanoid(12);
  await addRecord({
    id,
    sourceFile,
    sourceHash: hash,
    title,
    status: 'generated',
    imageCount,
    outputDir,
    createdAt: new Date().toISOString(),
  });
  return id;
}
