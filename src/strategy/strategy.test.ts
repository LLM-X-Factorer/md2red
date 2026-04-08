import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tryRepairJson } from './index.js';

describe('strategy JSON parsing', () => {
  it('parses valid strategy JSON', () => {
    const raw = JSON.stringify({
      titles: ['Title 1', 'Title 2'],
      summary: 'A summary',
      tags: ['tag1', 'tag2'],
      cardPlan: [
        { index: 0, type: 'cover', title: 'Cover', bodyText: 'Sub', layoutHint: 'cover-style' },
        { index: 1, type: 'content', title: 'Card', bodyText: 'Body', layoutHint: 'text-heavy' },
      ],
    });

    const parsed = JSON.parse(raw);
    assert.equal(parsed.titles.length, 2);
    assert.equal(parsed.cardPlan.length, 2);
    assert.equal(parsed.cardPlan[0].type, 'cover');
  });

  it('handles JSON wrapped in markdown code blocks', () => {
    const raw = '```json\n{"titles":["T1"],"summary":"S","tags":[],"cardPlan":[]}\n```';
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    assert.deepEqual(parsed.titles, ['T1']);
  });

  it('throws on invalid JSON', () => {
    assert.throws(() => JSON.parse('not json at all'));
  });

  it('handles extra whitespace and newlines', () => {
    const raw = '  \n  {"titles":["A"],"summary":"B","tags":[],"cardPlan":[]}  \n  ';
    const parsed = JSON.parse(raw.trim());
    assert.deepEqual(parsed.titles, ['A']);
  });
});

describe('tryRepairJson', () => {
  it('returns valid JSON as-is', () => {
    const json = '{"titles":["A"],"summary":"B","tags":[],"cardPlan":[]}';
    const result = tryRepairJson(json);
    assert.ok(result);
    assert.deepEqual(JSON.parse(result), JSON.parse(json));
  });

  it('strips markdown code blocks', () => {
    const raw = '```json\n{"titles":["T1"],"summary":"S","tags":[],"cardPlan":[]}\n```';
    const result = tryRepairJson(raw);
    assert.ok(result);
    assert.deepEqual(JSON.parse(result!).titles, ['T1']);
  });

  it('repairs truncated JSON with missing closing braces', () => {
    const raw = '{"titles":["A","B"],"summary":"S","tags":["t1"],"cardPlan":[{"index":0,"type":"cover","title":"T","bodyText":"B","layoutHint":"cover-style"}';
    const result = tryRepairJson(raw);
    assert.ok(result);
    const parsed = JSON.parse(result!);
    assert.deepEqual(parsed.titles, ['A', 'B']);
    assert.equal(parsed.cardPlan[0].type, 'cover');
  });

  it('repairs JSON truncated mid-string value', () => {
    const raw = '{"titles":["A"],"summary":"This is a long summary that got tru';
    const result = tryRepairJson(raw);
    assert.ok(result);
    const parsed = JSON.parse(result!);
    assert.deepEqual(parsed.titles, ['A']);
  });

  it('returns null for completely broken content', () => {
    const result = tryRepairJson('not json at all');
    assert.equal(result, null);
  });

  it('repairs truncated JSON with trailing comma', () => {
    const raw = '{"titles":["A"],"tags":["t1","t2"],';
    const result = tryRepairJson(raw);
    assert.ok(result);
    const parsed = JSON.parse(result!);
    assert.deepEqual(parsed.titles, ['A']);
  });
});
