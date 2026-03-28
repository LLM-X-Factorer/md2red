import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Md2RedConfig } from '../config/schema.js';

export async function callGemini(prompt: string, config: Md2RedConfig): Promise<string> {
  const apiKey = config.llm.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set. Set it in config or environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: config.llm.model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text;
}
