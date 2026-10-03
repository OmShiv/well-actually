import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CARDS, CATEGORIES } from '../src/cards.js';
import { highlight } from '../src/highlight.js';
import { formatValue, runProof } from '../src/run.js';

const here = dirname(fileURLToPath(import.meta.url));
const snapshot = JSON.parse(readFileSync(join(here, 'proofs.snapshot.json'), 'utf8'));

// ICU versions differ in spacing and a few separators (a narrow no-break
// space before AM, ’ or ' between Swiss thousands, GMT or GMT+00:00). The
// proofs are about the values, so compare without those differences.
const normalize = ({ lines, error }) => ({
  lines: lines.map((l) => l.replace(/[\u00a0\u202f]/g, ' ').replace(/\u2019/g, "'").replace(/\bGMT(?![+-])/g, 'GMT+00:00')),
  error,
});

test('every card is complete', () => {
  const ids = new Set();
  for (const card of CARDS) {
    assert.match(card.id, /^[a-z0-9-]+$/, card.id);
    assert.ok(!ids.has(card.id), `duplicate ${card.id}`);
    ids.add(card.id);
    assert.ok(CATEGORIES[card.category], `${card.id}: category`);
    assert.equal(typeof card.answer, 'boolean', `${card.id}: answer`);
    for (const field of ['claim', 'truth', 'explain']) assert.ok(card[field]?.length > 10, `${card.id}: ${field}`);
    assert.ok(card.proof || card.examples?.length, `${card.id}: needs a proof or examples`);
    assert.match(card.source?.url ?? '', /^https:\/\//, `${card.id}: source`);
    assert.ok(card.explain.length < 420, `${card.id}: explanation is too long for a card`);
  }
});

test('proofs fit on a card without scrolling', () => {
  for (const card of CARDS) {
    for (const line of card.proof?.split('\n') ?? []) assert.ok(line.length <= 66, `${card.id}: ${line}`);
  }
});

test('code spans are closed', () => {
  for (const card of CARDS) {
    for (const field of ['claim', 'truth', 'explain']) assert.equal(card[field].split('`').length % 2, 1, `${card.id}: ${field}`);
  }
});

test('the writing uses no em or en dashes', () => {
  for (const card of CARDS) {
    const text = [card.claim, card.truth, card.explain, ...(card.examples ?? [])].join(' ');
    assert.ok(!/[–—]/.test(text), card.id);
  }
});

test('the deck has enough true cards to keep players honest', () => {
  const trues = CARDS.filter((c) => c.answer).length;
  assert.ok(trues >= 8 && trues <= CARDS.length / 3, `${trues} true cards`);
  for (const category of Object.keys(CATEGORIES)) {
    assert.ok(CARDS.filter((c) => c.category === category).length >= 4, category);
  }
});

test('every proof prints what its card says', () => {
  for (const card of CARDS) {
    if (!card.proof || card.browserOnly) continue;
    assert.deepEqual(normalize(runProof(card.proof)), normalize(snapshot[card.id]), card.id);
  }
  assert.equal(Object.keys(snapshot).length, CARDS.filter((c) => c.proof && !c.browserOnly).length);
});

test('proofs give the same answers in every time zone and locale', () => {
  const envs = [
    { TZ: 'Asia/Kolkata', LANG: 'en_IN.UTF-8' },
    { TZ: 'America/Los_Angeles', LANG: 'de_DE.UTF-8', LC_ALL: 'de_DE.UTF-8' },
    { TZ: 'Pacific/Kiritimati', LANG: 'th_TH.UTF-8', LC_ALL: 'th_TH.UTF-8' },
  ];
  for (const env of envs) {
    const run = spawnSync(process.execPath, [join(here, 'print-proofs.js')], { encoding: 'utf8', env: { ...process.env, ...env } });
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), snapshot, JSON.stringify(env));
  }
});

test('false claims are actually contradicted by their proofs', () => {
  // Spot checks that the snapshot says what the explanations say.
  const out = (id) => snapshot[id].lines.join('\n');
  assert.match(out('every-day-has-24-hours'), /Mar 9, 2026, 1:00:00 AM EDT/);
  assert.match(out('point-one-plus-point-two'), /^0\.30000000000000004/);
  assert.match(out('length-counts-characters'), /^5\n3\n1$/);
  assert.match(out('timestamps-fit-in-32-bits'), /-2147483648/);
  assert.match(out('dst-is-one-hour'), /Lord_Howe GMT\+11:00 GMT\+10:30/);
  assert.match(out('time-zones-never-change'), /Saturday, December 31, 2011/);
  assert.match(out('offsets-stop-at-12'), /GMT\+14:00/);
});

test('the runner formats values like a console', () => {
  assert.equal(formatValue(-0), '-0');
  assert.equal(formatValue(['a', 1, [true]]), "['a', 1, [true]]");
  assert.equal(formatValue({ a: 'b' }), "{ a: 'b' }");
  assert.equal(formatValue(10n), '10n');
  assert.deepEqual(runProof('console.log("x", 1); throw new TypeError("boom")'), { lines: ['x 1'], error: 'TypeError: boom' });
});

test('the highlighter escapes HTML and marks tokens', () => {
  const html = highlight("const x = '<b>'; // 2 < 3\nx.length + 42");
  assert.match(html, /<span class="tok-keyword">const<\/span>/);
  assert.match(html, /<span class="tok-string">'&lt;b&gt;'<\/span>/);
  assert.match(html, /<span class="tok-comment">\/\/ 2 &lt; 3<\/span>/);
  assert.match(html, /<span class="tok-method">length<\/span>/);
  assert.match(html, /<span class="tok-number">42<\/span>/);
  assert.doesNotMatch(html.replace(/<\/?span[^>]*>/g, ''), /<b>/);
});
