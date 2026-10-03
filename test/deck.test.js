import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CARDS } from '../src/cards.js';
import { DAILY_SIZE, LAUNCH, dailyDeck, dateKey, deckNumber, rankFor, shareText, streak } from '../src/deck.js';

const days = (from, count) =>
  Array.from({ length: count }, (_, i) => {
    const [y, m, d] = from.split('-').map(Number);
    return dateKey(new Date(y, m - 1, d + i));
  });

test('every daily deck follows the rules', () => {
  for (const key of days(LAUNCH, 400)) {
    const deck = dailyDeck(key);
    assert.equal(deck.length, DAILY_SIZE, key);
    assert.equal(new Set(deck.map((c) => c.id)).size, DAILY_SIZE, `${key}: duplicates`);
    const trues = deck.filter((c) => c.answer).length;
    assert.ok(trues >= 1 && trues <= 3, `${key}: ${trues} true cards`);
    assert.equal(deck[0].answer, false, `${key}: starts with a true card`);
    const perCategory = {};
    for (const c of deck) perCategory[c.category] = (perCategory[c.category] ?? 0) + 1;
    assert.ok(Math.max(...Object.values(perCategory)) <= 3, `${key}: too many from one category`);
  }
});

test('the same date always gets the same deck, and days differ', () => {
  const ids = (key) => dailyDeck(key).map((c) => c.id).join(',');
  assert.equal(ids('2026-12-01'), ids('2026-12-01'));
  assert.notEqual(ids('2026-12-01'), ids('2026-12-02'));
});

test('over a few months, every card comes up', () => {
  const seen = new Set(days(LAUNCH, 120).flatMap((key) => dailyDeck(key).map((c) => c.id)));
  assert.equal(seen.size, CARDS.length);
});

test('deck numbers count days from launch', () => {
  assert.equal(deckNumber(LAUNCH), 1);
  assert.equal(deckNumber('2026-10-04'), 2);
  assert.equal(deckNumber('2027-10-03'), 366);
  // A daylight saving change between the dates doesn't skew the count.
  assert.equal(deckNumber('2026-11-02') - deckNumber('2026-10-31'), 2);
});

test('share text', () => {
  const text = shareText('2026-10-05', [true, true, false, true, true, true, true, false, true, true], 'https://example.com/');
  assert.equal(text, 'Well, actually #3 · 8/10\n🟩🟩🟥🟩🟩🟩🟩🟥🟩🟩\nhttps://example.com/');
});

test('ranks', () => {
  assert.equal(rankFor(10), 'You wrote the RFC.');
  assert.equal(rankFor(7), 'Senior engineer. Mostly.');
  assert.equal(rankFor(0), 'Ships on Friday afternoons.');
});

test('streaks count consecutive finished days', () => {
  const done = Array(DAILY_SIZE).fill(true);
  const history = { '2026-10-08': done, '2026-10-09': done, '2026-10-10': done, '2026-10-06': done };
  assert.equal(streak(history, '2026-10-10'), 3);
  assert.equal(streak(history, '2026-10-11'), 3);
  assert.equal(streak(history, '2026-10-12'), 0);
  assert.equal(streak({ '2026-10-10': [true] }, '2026-10-10'), 0);
});
