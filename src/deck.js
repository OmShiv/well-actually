import { CARDS } from './cards.js';

// Deck #1 is the first day the game was up. Each local calendar day after that
// gets the next number, so everyone on the same date plays the same ten cards.
export const LAUNCH = '2026-10-03';
export const DAILY_SIZE = 10;

// Cards that give each other away. A daily deck uses at most one of each set.
const RELATED = [
  ['divisible-by-4-is-leap', 'year-2000-was-a-leap-year'],
  ['point-one-plus-point-two', 'money-as-floats'],
  ['number-reads-commas', 'germany-writes-1-5'],
  ['time-zones-are-whole-hours', 'offsets-stop-at-12', 'same-date-everywhere'],
  ['every-day-has-24-hours', 'local-times-happen-once'],
  ['sort-sorts-numbers', 'sort-is-alphabetical'],
  ['phone-numbers-are-numbers', 'phone-numbers-have-10-digits'],
  ['typeof-nan', 'equal-to-itself'],
];

export function dateKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function deckNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  const [ly, lm, ld] = LAUNCH.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ly, lm - 1, ld)) / 86_400_000) + 1;
}

function rngFor(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Ten cards for a date: no more than three from one category, between one and
// three that are actually true, and never two that give each other away.
export function dailyDeck(key, cards = CARDS) {
  const random = rngFor(`well-actually:${key}`);
  const pool = shuffle(cards, random);
  const picked = [];
  const perCategory = {};
  const usedGroups = new Set();
  const groupOf = (id) => RELATED.findIndex((g) => g.includes(id));

  for (const card of pool) {
    if (picked.length === DAILY_SIZE) break;
    const group = groupOf(card.id);
    const trues = picked.filter((c) => c.answer).length;
    if ((perCategory[card.category] ?? 0) >= 3) continue;
    if (group >= 0 && usedGroups.has(group)) continue;
    if (card.answer && trues >= 3) continue;
    if (!card.answer && picked.length - trues >= DAILY_SIZE - 1) continue;
    picked.push(card);
    perCategory[card.category] = (perCategory[card.category] ?? 0) + 1;
    if (group >= 0) usedGroups.add(group);
  }
  // A true card first would set the wrong expectation for the whole round.
  if (picked[0]?.answer) {
    const swap = picked.findIndex((c) => !c.answer);
    [picked[0], picked[swap]] = [picked[swap], picked[0]];
  }
  return picked;
}

export const RANKS = [
  [10, 'You wrote the RFC.'],
  [8, 'Staff engineer energy.'],
  [6, 'Senior engineer. Mostly.'],
  [4, 'Works on your machine.'],
  [0, 'Ships on Friday afternoons.'],
];

export const rankFor = (score) => RANKS.find(([min]) => score >= min)[1];

export function shareText(key, results, url) {
  const score = results.filter(Boolean).length;
  const squares = results.map((ok) => (ok ? '🟩' : '🟥')).join('');
  return `Well, actually #${deckNumber(key)} · ${score}/${results.length}\n${squares}\n${url}`;
}

// The longest run of consecutive days, ending today or yesterday, with a
// finished deck.
export function streak(history, today) {
  const day = (key, offset) => {
    const [y, m, d] = key.split('-').map(Number);
    return dateKey(new Date(y, m - 1, d + offset));
  };
  let cursor = history[today]?.length === DAILY_SIZE ? today : day(today, -1);
  let count = 0;
  while (history[cursor]?.length === DAILY_SIZE) {
    count++;
    cursor = day(cursor, -1);
  }
  return count;
}
