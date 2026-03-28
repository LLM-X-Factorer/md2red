import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export interface PublishRecord {
  id: string;
  sourceFile: string;
  sourceHash: string;
  title: string;
  noteId?: string;
  status: 'generated' | 'previewed' | 'published' | 'failed';
  imageCount: number;
  outputDir: string;
  createdAt: string;
  publishedAt?: string;
  errorMessage?: string;
}

const HISTORY_PATH = join(homedir(), '.md2red', 'history.json');

export async function loadHistory(): Promise<PublishRecord[]> {
  try {
    const raw = await readFile(HISTORY_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveHistory(records: PublishRecord[]): Promise<void> {
  await mkdir(dirname(HISTORY_PATH), { recursive: true });
  await writeFile(HISTORY_PATH, JSON.stringify(records, null, 2));
}

export async function addRecord(record: PublishRecord): Promise<void> {
  const history = await loadHistory();
  history.push(record);
  await saveHistory(history);
}

export async function findByHash(hash: string): Promise<PublishRecord | undefined> {
  const history = await loadHistory();
  return history.find((r) => r.sourceHash === hash);
}

export async function updateRecord(
  id: string,
  update: Partial<PublishRecord>,
): Promise<void> {
  const history = await loadHistory();
  const idx = history.findIndex((r) => r.id === id);
  if (idx >= 0) {
    history[idx] = { ...history[idx], ...update };
    await saveHistory(history);
  }
}

export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}
