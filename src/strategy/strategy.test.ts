import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

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
