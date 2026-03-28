import type { IncomingMessage, ServerResponse } from 'node:http';

export type Handler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => void | Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

export function route(method: string, path: string, handler: Handler): void {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' + path.replace(/:(\w+)/g, (_, key) => { keys.push(key); return '([^/]+)'; }) + '$',
  );
  routes.push({ method, pattern, keys, handler });
}

export function dispatch(req: IncomingMessage, res: ServerResponse): boolean {
  const method = req.method || 'GET';
  const url = (req.url || '/').split('?')[0];

  for (const r of routes) {
    if (r.method !== method) continue;
    const match = url.match(r.pattern);
    if (!match) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((key, i) => { params[key] = match[i + 1]; });
    r.handler(req, res, params);
    return true;
  }
  return false;
}

export function json(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
