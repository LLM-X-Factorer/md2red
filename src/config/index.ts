import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { configSchema, type Md2RedConfig } from './schema.js';
import { defaultConfig } from './defaults.js';

export type { Md2RedConfig } from './schema.js';

const CONFIG_FILES = ['md2red.config.yml', 'md2red.config.yaml', '.md2red.yml'];

function resolveEnvVars(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const envKey = value.slice(2, -1);
      result[key] = process.env[envKey] || '';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = resolveEnvVars(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function loadConfig(configPath?: string): Promise<Md2RedConfig> {
  if (configPath) {
    return loadFromFile(resolve(configPath));
  }

  for (const name of CONFIG_FILES) {
    try {
      return await loadFromFile(resolve(name));
    } catch {
      continue;
    }
  }

  return defaultConfig;
}

async function loadFromFile(filePath: string): Promise<Md2RedConfig> {
  const raw = await readFile(filePath, 'utf-8');
  const parsed = parseYaml(raw) || {};
  const resolved = resolveEnvVars(parsed);
  return configSchema.parse(resolved);
}
