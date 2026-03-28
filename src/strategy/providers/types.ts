export interface LLMProvider {
  readonly name: string;
  call(prompt: string, config: LLMCallConfig): Promise<string>;
}

export interface LLMCallConfig {
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}
