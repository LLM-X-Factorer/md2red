import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { logger } from '../../utils/logger.js';

const DEFAULT_CONFIG = `# md2red configuration
llm:
  provider: gemini
  model: gemini-2.5-flash
  apiKey: \${GEMINI_API_KEY}

images:
  width: 1080
  height: 1440
  format: png
  theme: dark
  brandColor: '#6366f1'
  font:
    heading: Noto Sans SC
    body: Noto Sans SC
    code: JetBrains Mono

content:
  maxCards: 9
  minCards: 5
  targetAudience: 技术开发者
  style: technical
  language: zh-CN

output:
  dir: ./md2red-output
  cleanOnRegenerate: true
`;

export async function initCommand() {
  const configPath = resolve('md2red.config.yml');
  try {
    const { access } = await import('node:fs/promises');
    await access(configPath);
    logger.warn('md2red.config.yml 已存在，跳过');
    return;
  } catch {
    // File doesn't exist, create it
  }

  await writeFile(configPath, DEFAULT_CONFIG);
  logger.success(`配置文件已创建: ${configPath}`);
}
