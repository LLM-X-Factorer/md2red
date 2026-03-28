import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function downloadImage(url: string, destPath: string): Promise<void> {
  await mkdir(dirname(destPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
}
