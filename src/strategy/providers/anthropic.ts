import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMCallConfig } from './types.js';

export const anthropicProvider: LLMProvider = {
  name: 'anthropic',
  async call(prompt: string, config: LLMCallConfig): Promise<string> {
    const client = new Anthropic({ apiKey: config.apiKey });
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [{ role: 'user', content: prompt }],
      system: '你是一个小红书内容策划专家。请严格按照用户要求的 JSON 格式输出，不要输出任何其他内容。',
    });
    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  },
};
