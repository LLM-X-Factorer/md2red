import { z } from 'zod';

const llmSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'anthropic', 'siliconflow']).default('gemini'),
  model: z.string().optional(),
  apiKey: z.string().default(''),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().default(4096),
});

const fontSchema = z.object({
  heading: z.string().default('Noto Sans SC'),
  body: z.string().default('Noto Sans SC'),
  code: z.string().default('JetBrains Mono'),
});

const imagesSchema = z.object({
  width: z.number().default(1080),
  height: z.number().default(1440),
  format: z.enum(['png', 'jpg']).default('png'),
  theme: z.string().default('dark'),
  brandColor: z.string().default('#6366f1'),
  font: fontSchema.optional().default(fontSchema.parse({})),
});

const contentSchema = z.object({
  maxCards: z.number().min(3).max(18).default(9),
  minCards: z.number().min(1).default(5),
  targetAudience: z.string().default('技术开发者'),
  style: z.enum(['technical', 'casual', 'mixed']).default('technical'),
  language: z.string().default('zh-CN'),
});

const outputSchema = z.object({
  dir: z.string().default('./md2red-output'),
  cleanOnRegenerate: z.boolean().default(true),
});

export const configSchema = z.object({
  llm: llmSchema.optional().default(llmSchema.parse({})),
  images: imagesSchema.optional().default(imagesSchema.parse({})),
  content: contentSchema.optional().default(contentSchema.parse({})),
  output: outputSchema.optional().default(outputSchema.parse({})),
}).passthrough();

export type Md2RedConfig = z.infer<typeof configSchema>;
