import type { LLMProvider, LLMCallConfig } from './types.js';
import type { Md2RedConfig } from '../../config/schema.js';
import { geminiProvider } from './gemini.js';
import { openaiProvider } from './openai.js';
import { anthropicProvider } from './anthropic.js';
import { siliconflowProvider } from './siliconflow.js';

export type { LLMProvider, LLMCallConfig } from './types.js';

const providers: Record<string, LLMProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  siliconflow: siliconflowProvider,
};

const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  siliconflow: 'Qwen/Qwen3-30B-A3B-Instruct-2507',
};

const ENV_KEY_MAP: Record<string, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  siliconflow: 'SILICONFLOW_API_KEY',
};

export function createProvider(config: Md2RedConfig): LLMProvider {
  const provider = providers[config.llm.provider];
  if (!provider) {
    throw new Error(`Unsupported LLM provider: ${config.llm.provider}`);
  }
  return provider;
}

export function resolveCallConfig(config: Md2RedConfig): LLMCallConfig {
  const provider = config.llm.provider;
  const apiKey = config.llm.apiKey || process.env[ENV_KEY_MAP[provider]] || '';
  if (!apiKey) {
    const envVar = ENV_KEY_MAP[provider];
    throw new Error(`API key not set for ${provider}. Set it in config or ${envVar} env var.`);
  }
  return {
    model: config.llm.model || DEFAULT_MODELS[provider] || '',
    apiKey,
    temperature: config.llm.temperature ?? 0.7,
    maxTokens: config.llm.maxTokens ?? 4096,
  };
}

export function hasApiKey(config: Md2RedConfig): boolean {
  const envVar = ENV_KEY_MAP[config.llm.provider];
  return !!(config.llm.apiKey || (envVar && process.env[envVar]));
}
