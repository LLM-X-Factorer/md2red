import type { Md2RedConfig } from './schema.js';

export const defaultConfig: Md2RedConfig = {
  llm: {
    provider: 'gemini',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 4096,
  },
  images: {
    width: 1080,
    height: 1440,
    format: 'png',
    theme: 'dark',
    brandColor: '#6366f1',
    font: {
      heading: 'Noto Sans SC',
      body: 'Noto Sans SC',
      code: 'JetBrains Mono',
    },
  },
  content: {
    maxCards: 9,
    minCards: 5,
    targetAudience: '技术开发者',
    style: 'technical',
    language: 'zh-CN',
  },
  output: {
    dir: './md2red-output',
    cleanOnRegenerate: true,
  },
};
