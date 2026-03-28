import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { homedir } from 'node:os';

export type CookieData = Array<{
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}>;

function resolvePath(cookiePath: string): string {
  return cookiePath.replace(/^~/, homedir());
}

export async function loadCookies(cookiePath: string): Promise<CookieData | null> {
  try {
    const raw = await readFile(resolvePath(cookiePath), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveCookies(cookiePath: string, cookies: CookieData): Promise<void> {
  const resolved = resolvePath(cookiePath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, JSON.stringify(cookies, null, 2));
}
