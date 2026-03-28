import { nanoid } from 'nanoid';
import { fileHash } from '../utils/hash.js';
import { logger } from '../utils/logger.js';
import {
  addRecord,
  findByHash,
  updateRecord,
  type PublishRecord,
} from './store.js';

export type { PublishRecord, NoteMetrics } from './store.js';
export { loadHistory, clearHistory } from './store.js';

export async function checkDuplicate(
  sourceFile: string,
  force: boolean,
): Promise<{ isDuplicate: boolean; hash: string; existing?: PublishRecord }> {
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

export async function markPublished(id: string, noteId?: string): Promise<void> {
  await updateRecord(id, {
    status: 'published',
    noteId,
    publishedAt: new Date().toISOString(),
  });
}

export async function markFailed(id: string, error: string): Promise<void> {
  await updateRecord(id, {
    status: 'failed',
    errorMessage: error,
  });
}

export async function updateMetrics(
  id: string,
  metrics: import('./store.js').NoteMetrics,
): Promise<void> {
  await updateRecord(id, {
    metrics,
    metricsUpdatedAt: new Date().toISOString(),
  });
}
