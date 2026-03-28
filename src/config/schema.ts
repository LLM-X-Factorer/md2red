import { z } from 'zod';

const llmSchema = z.object({
  provider: z.enum(['gemini']).default('gemini'),
  model: z.string().default('gemini-2.5-flash'),
  apiKey: z.string().default(''),
});

const xhsSchema = z.object({
  cookiePath: z.string().default('~/.md2red/cookies.json'),
  visibility: z.enum(['公开可见', '仅自己可见', '仅互关好友可见']).default('仅自己可见'),
  publishDelay: z.number().default(3000),
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
  xhs: xhsSchema.optional().default(xhsSchema.parse({})),
  images: imagesSchema.optional().default(imagesSchema.parse({})),
  content: contentSchema.optional().default(contentSchema.parse({})),
  output: outputSchema.optional().default(outputSchema.parse({})),
});

export type Md2RedConfig = z.infer<typeof configSchema>;
