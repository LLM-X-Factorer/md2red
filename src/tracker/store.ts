import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export interface GenerationRecord {
  id: string;
  sourceFile: string;
  sourceHash: string;
  title: string;
  status: 'generated' | 'previewed';
  imageCount: number;
  outputDir: string;
  createdAt: string;
}

const HISTORY_PATH = join(homedir(), '.md2red', 'history.json');

export async function loadHistory(): Promise<GenerationRecord[]> {
  try {
    const raw = await readFile(HISTORY_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveHistory(records: GenerationRecord[]): Promise<void> {
  await mkdir(dirname(HISTORY_PATH), { recursive: true });
  await writeFile(HISTORY_PATH, JSON.stringify(records, null, 2));
}

export async function addRecord(record: GenerationRecord): Promise<void> {
  const history = await loadHistory();
  history.push(record);
  await saveHistory(history);
}

export async function findByHash(hash: string): Promise<GenerationRecord | undefined> {
  const history = await loadHistory();
  return history.find((r) => r.sourceHash === hash);
}

export async function updateRecord(
  id: string,
  update: Partial<GenerationRecord>,
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
