import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { configSchema } from './schema.js';

describe('configSchema', () => {
  it('parses empty object with all defaults', () => {
    const result = configSchema.parse({});
    assert.equal(result.llm.provider, 'gemini');
    assert.equal(result.xhs.visibility, '仅自己可见');
    assert.equal(result.images.width, 1080);
    assert.equal(result.images.height, 1440);
    assert.equal(result.content.maxCards, 9);
  });

  it('accepts valid provider values', () => {
    for (const provider of ['gemini', 'openai', 'anthropic'] as const) {
      const result = configSchema.parse({ llm: { provider } });
      assert.equal(result.llm.provider, provider);
    }
  });

  it('rejects invalid provider', () => {
    assert.throws(() => configSchema.parse({ llm: { provider: 'invalid' } }));
  });

  it('accepts visibility options', () => {
    for (const v of ['公开可见', '仅自己可见', '仅互关好友可见'] as const) {
      const result = configSchema.parse({ xhs: { visibility: v } });
      assert.equal(result.xhs.visibility, v);
    }
  });

  it('enforces maxCards range', () => {
    assert.throws(() => configSchema.parse({ content: { maxCards: 2 } }));
    assert.throws(() => configSchema.parse({ content: { maxCards: 19 } }));
    const result = configSchema.parse({ content: { maxCards: 12 } });
    assert.equal(result.content.maxCards, 12);
  });

  it('sets healthCheck defaults', () => {
    const result = configSchema.parse({});
    assert.equal(result.xhs.healthCheck.enabled, false);
    assert.equal(result.xhs.healthCheck.intervalHours, 12);
  });

  it('model is optional', () => {
    const result = configSchema.parse({ llm: { provider: 'openai' } });
    assert.equal(result.llm.model, undefined);
  });
});
