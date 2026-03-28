import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, LLMCallConfig } from './types.js';

export const geminiProvider: LLMProvider = {
  name: 'gemini',
  async call(prompt: string, config: LLMCallConfig): Promise<string> {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  },
};
