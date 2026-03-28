import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { route, json, readBody } from '../router.js';
import { loadConfig } from '../../config/index.js';

route('GET', '/api/config', async (_req, res) => {
  const config = await loadConfig();
  // Mask API keys
  const masked = {
    ...config,
    llm: { ...config.llm, apiKey: config.llm.apiKey ? '***' : '' },
  };
  json(res, masked);
});

route('PUT', '/api/config', async (req, res) => {
  const body = JSON.parse(await readBody(req));
  const configPath = resolve('md2red.config.yml');

  // Simple YAML generation
  const { stringify } = await import('yaml');
  const current = await loadConfig();
  const merged = deepMerge(current, body);
  await writeFile(configPath, stringify(merged));
  json(res, { ok: true });
});

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge((target[key] || {}) as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
