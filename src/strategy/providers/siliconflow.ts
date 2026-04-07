import OpenAI from 'openai';
import type { LLMProvider, LLMCallConfig } from './types.js';

export const siliconflowProvider: LLMProvider = {
  name: 'siliconflow',
  async call(prompt: string, config: LLMCallConfig): Promise<string> {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://api.siliconflow.cn/v1',
    });
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: '你是一个小红书内容策划专家。请严格按照用户要求的 JSON 格式输出。' },
        { role: 'user', content: prompt },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });
    return response.choices[0]?.message?.content || '';
  },
};
