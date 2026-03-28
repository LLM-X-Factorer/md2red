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

export interface CookieExpiryInfo {
  hasCookies: boolean;
  earliestExpiry: Date | null;
  isExpired: boolean;
  hoursRemaining: number | null;
}

export async function getCookieExpiry(cookiePath: string): Promise<CookieExpiryInfo> {
  const cookies = await loadCookies(cookiePath);
  if (!cookies || cookies.length === 0) {
    return { hasCookies: false, earliestExpiry: null, isExpired: true, hoursRemaining: null };
  }

  const xhsCookies = cookies.filter(
    (c) => c.domain.includes('xiaohongshu') && c.expires > 0,
  );

  if (xhsCookies.length === 0) {
    return { hasCookies: true, earliestExpiry: null, isExpired: false, hoursRemaining: null };
  }

  const earliestTs = Math.min(...xhsCookies.map((c) => c.expires));
  const earliestExpiry = new Date(earliestTs * 1000);
  const now = Date.now();
  const isExpired = earliestExpiry.getTime() < now;
  const hoursRemaining = isExpired ? 0 : (earliestExpiry.getTime() - now) / (1000 * 60 * 60);

  return { hasCookies: true, earliestExpiry, isExpired, hoursRemaining: Math.round(hoursRemaining * 10) / 10 };
}
