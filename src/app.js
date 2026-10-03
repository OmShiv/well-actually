import { CARDS, CATEGORIES } from './cards.js';
import { DAILY_SIZE, dailyDeck, dateKey, deckNumber, rankFor, shareText, shuffle, streak } from './deck.js';
import { highlight } from './highlight.js';
import { runProof } from './run.js';

const SITE = 'https://omshiv.github.io/well-actually/';
const WATERMARK = { time: '24h', text: 'Aa', numbers: '0.1', names: 'Hi', places: '§', money: '¤', web: '@' };
const app = document.getElementById('app');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ---- small helpers -----------------------------------------------------------

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Card text marks code with backticks.
const rich = (text) =>
  esc(text)
    .split('`')
    .map((part, i) => (i % 2 ? `<code>${part}</code>` : part))
    .join('');

const plain = (text) => text.replaceAll('`', '');

const byId = Object.fromEntries(CARDS.map((c) => [c.id, c]));

function toast(message) {
  const el = document.querySelector('.toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function setNav(name) {
  for (const a of document.querySelectorAll('[data-nav]')) {
    if (a.dataset.nav === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

// ---- one card, front and back -------------------------------------------------

function frontHTML(card, footLeft, footRight) {
  return `
    <article class="card front" data-cat="${card.category}" aria-live="polite">
      <span class="watermark" aria-hidden="true">${WATERMARK[card.category]}</span>
      <div><span class="chip">${CATEGORIES[card.category].label}</span></div>
      <p class="claim">${rich(card.claim)}</p>
      <div class="card-foot"><span>${footLeft}</span><span>${footRight}</span></div>
      <span class="drag-label left" style="color: var(--ink)">True</span>
      <span class="drag-label" style="color: var(--accent)">Well, actually</span>
    </article>`;
}

function backHTML(card, guess) {
  const right = guess === undefined ? null : guess === card.answer;
  const who = right === null ? '' : right ? 'You called it.' : 'It got you.';
  const proof = card.proof
    ? `<div class="proof">
        <div class="proof-bar">
          <span>Proof: runs in your browser</span>
          <button type="button" class="edit">Edit</button>
          <button type="button" class="run">Run</button>
        </div>
        <pre class="code"><code>${highlight(card.proof)}</code></pre>
        <pre class="output" aria-live="polite"></pre>
      </div>`
    : `<ul class="examples">${card.examples.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
  return `
    <article class="card back" data-cat="${card.category}">
      <div><span class="chip">${CATEGORIES[card.category].label}</span></div>
      <div class="verdict ${right === null ? '' : right ? 'ok' : 'miss'}">
        <strong>${card.answer ? 'Actually, yes.' : 'Well, actually.'}</strong>
        <span class="who">${who}</span>
      </div>
      <p class="was ${card.answer ? '' : 'false'}">${rich(card.claim)}</p>
      <p class="truth">${rich(card.truth)}</p>
      <p class="explain">${rich(card.explain)}</p>
      ${proof}
      <a class="source" href="${esc(card.source.url)}" target="_blank" rel="noopener">Source: ${esc(card.source.label)}</a>
    </article>`;
}

function runInto(cardEl, code) {
  const output = cardEl.querySelector('.output');
  if (!output) return;
  const { lines, error } = runProof(code);
  output.innerHTML = lines.map(esc).join('\n') + (error ? `${lines.length ? '\n' : ''}<span class="error">${esc(error)}</span>` : '');
  if (!lines.length && !error) output.textContent = '(nothing printed)';
}

function wireProof(cardEl, card) {
  if (!card.proof) return;
  let editor = null;
  const current = () => (editor ? editor.value : card.proof);
  runInto(cardEl, card.proof);
  cardEl.querySelector('.run').addEventListener('click', () => runInto(cardEl, current()));
  cardEl.querySelector('.edit').addEventListener('click', (event) => {
    const code = cardEl.querySelector('.code');
    if (!editor) {
      editor = document.createElement('textarea');
      editor.className = 'editor';
      editor.spellcheck = false;
      editor.value = card.proof;
      editor.rows = card.proof.split('\n').length + 1;
      editor.setAttribute('aria-label', 'Proof code');
      code.replaceWith(editor);
      editor.focus();
      event.target.textContent = 'Reset';
    } else {
      editor.value = card.proof;
      runInto(cardEl, card.proof);
    }
  });
}

// Flips the card element to show the back.
function flip(cardEl, html, done) {
  const swap = () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const back = wrapper.firstElementChild;
    cardEl.replaceWith(back);
    done(back);
    return back;
  };
  if (reducedMotion.matches) return swap();
  cardEl.classList.add('flip-out');
  cardEl.addEventListener(
    'transitionend',
    () => {
      const back = swap();
      back.classList.add('flip-in-start');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        back.classList.add('flip-in');
        back.classList.remove('flip-in-start');
      }));
    },
    { once: true },
  );
}

// Drag the front card left for True, right for "Well, actually".
function wireSwipe(cardEl, answer) {
  let startX = null;
  let dx = 0;
  const labels = cardEl.querySelectorAll('.drag-label');
  cardEl.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX = e.clientX;
    dx = 0;
    cardEl.setPointerCapture(e.pointerId);
  });
  cardEl.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    dx = e.clientX - startX;
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx / 24}deg)`;
    labels[0].style.opacity = String(Math.min(1, Math.max(0, -dx / 90)));
    labels[1].style.opacity = String(Math.min(1, Math.max(0, dx / 90)));
  });
  const end = () => {
    if (startX === null) return;
    startX = null;
    cardEl.style.transform = '';
    for (const l of labels) l.style.opacity = '0';
    if (dx < -90) answer(true);
    else if (dx > 90) answer(false);
  };
  cardEl.addEventListener('pointerup', end);
  cardEl.addEventListener('pointercancel', end);
}

// Shows `card` front-side up with True / Well, actually buttons. Calls
// onAnswer(guess) after the player answers and the back is showing.
function playCard(container, card, { footLeft = '', footRight = '', nextLabel = 'Next card', onAnswer, onNext }) {
  container.innerHTML = `
    <div class="stage">${frontHTML(card, footLeft, footRight)}</div>
    <div class="choices">
      <button type="button" class="choice true">True <kbd>←</kbd></button>
      <button type="button" class="choice actually"><em>Well, actually…</em> <kbd>→</kbd></button>
    </div>
    <p class="hint"><span class="keys">Use ← and → or </span>swipe the card.</p>`;

  const cardEl = container.querySelector('.card');
  let answered = false;
  const answer = (guess) => {
    if (answered) return;
    answered = true;
    onAnswer?.(guess);
    flip(cardEl, backHTML(card, guess), (back) => {
      wireProof(back, card);
      const choices = container.querySelector('.choices');
      choices.innerHTML = `<button type="button" class="next">${nextLabel} <kbd>Enter</kbd></button>`;
      container.querySelector('.hint').textContent = '';
      const next = choices.querySelector('.next');
      next.addEventListener('click', onNext);
      next.focus({ preventScroll: true });
    });
  };
  container.querySelector('.choice.true').addEventListener('click', () => answer(true));
  container.querySelector('.choice.actually').addEventListener('click', () => answer(false));
  wireSwipe(cardEl, answer);
  keys.handler = (e) => {
    if (e.target.closest('textarea, input')) return;
    if (!answered && (e.key === 'ArrowLeft' || e.key === 't')) answer(true);
    else if (!answered && (e.key === 'ArrowRight' || e.key === 'w')) answer(false);
    else if (answered && e.key === 'ArrowRight') onNext();
    else if (answered && e.key === 'Enter' && !e.target.closest('button, a')) onNext();
  };
}

const keys = { handler: null };
addEventListener('keydown', (e) => keys.handler?.(e));

// ---- today's ten -------------------------------------------------------------

function daily() {
  setNav('today');
  const key = dateKey();
  const deck = dailyDeck(key);
  const saved = store.get(`wa:daily:${key}`, { answers: [] });
  const results = saved.answers.map((guess, i) => guess === deck[i].answer);
  if (saved.answers.length >= DAILY_SIZE) return showResults(key, deck, saved.answers);

  const i = saved.answers.length;
  app.innerHTML = `
    <section class="play">
      <div class="meta">
        <span>Well, actually #${deckNumber(key)}</span>
        <ol class="pips" aria-label="Progress">${deck
          .map((_, n) => `<li class="${n < i ? (results[n] ? 'ok' : 'miss') : n === i ? 'now' : ''}"></li>`)
          .join('')}</ol>
      </div>
      <div class="slot"></div>
    </section>`;
  playCard(app.querySelector('.slot'), deck[i], {
    footLeft: `${i + 1} of ${DAILY_SIZE}`,
    footRight: 'True, or well, actually?',
    nextLabel: i + 1 === DAILY_SIZE ? 'See your score' : 'Next card',
    onAnswer: (guess) => {
      const answers = [...saved.answers, guess];
      store.set(`wa:daily:${key}`, { answers });
      const pip = app.querySelectorAll('.pips li')[i];
      pip.className = guess === deck[i].answer ? 'ok' : 'miss';
      if (answers.length === DAILY_SIZE) {
        const history = store.get('wa:history', {});
        history[key] = answers.map((g, n) => g === deck[n].answer);
        store.set('wa:history', history);
      }
    },
    onNext: () => daily(),
  });
}

function untilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const minutes = Math.max(1, Math.round((midnight - now) / 60000));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

function showResults(key, deck, answers) {
  const results = answers.map((g, i) => g === deck[i].answer);
  const score = results.filter(Boolean).length;
  const history = store.get('wa:history', {});
  const days = streak(history, key);
  const text = shareText(key, results, SITE);
  app.innerHTML = `
    <section class="results">
      <p class="eyebrow">Well, actually #${deckNumber(key)}</p>
      <h1 class="score">${score}<span>/${DAILY_SIZE}</span></h1>
      <p class="rank">${rankFor(score)}</p>
      <div class="squares" aria-label="${score} right, ${DAILY_SIZE - score} wrong">${results.map((ok) => (ok ? '🟩' : '🟥')).join('')}</div>
      <div class="actions">
        <button type="button" class="button primary share">Share your score</button>
        <a class="button" href="#/practice">Keep playing</a>
      </div>
      <p class="when">${days > 1 ? `${days}-day streak. ` : ''}A new deck in ${untilMidnight()}, at midnight where you are.</p>
      <h2 class="section">Today's cards</h2>
      <ol class="review">${deck
        .map(
          (card, i) => `<li>
            <span class="mark ${results[i] ? 'ok' : 'miss'}">${results[i] ? '✓' : '✗'}</span>
            <a href="#/card/${card.id}">${rich(card.claim)}</a>
            <span class="tag">${card.answer ? 'True' : 'False'}</span>
          </li>`,
        )
        .join('')}</ol>
    </section>`;
  app.querySelector('.share').addEventListener('click', async () => {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast('Copied. Paste it anywhere.');
      }
    } catch {}
  });
}

// ---- practice ----------------------------------------------------------------

function practicePicker() {
  setNav('practice');
  const tiles = Object.entries(CATEGORIES)
    .map(([id, c]) => {
      const n = CARDS.filter((card) => card.category === id).length;
      return `<a class="tile" data-cat="${id}" href="#/practice/${id}"><strong>${c.label}</strong><span>${n} cards</span></a>`;
    })
    .join('');
  app.innerHTML = `
    <section class="page">
      <h1>Practice</h1>
      <p class="lede">As many cards as you like, from one category or all of them. No score to share, just the cards.</p>
      <div class="tiles">
        <a class="tile" href="#/practice/all"><strong>Everything</strong><span>${CARDS.length} cards, shuffled</span></a>
        ${tiles}
      </div>
    </section>`;
}

const practiceState = { category: null, queue: [], right: 0, played: 0 };

function practice(category) {
  setNav('practice');
  if (category !== 'all' && !CATEGORIES[category]) return practicePicker();
  if (practiceState.category !== category) Object.assign(practiceState, { category, queue: [], right: 0, played: 0 });
  if (!practiceState.queue.length) {
    const pool = CARDS.filter((c) => category === 'all' || c.category === category);
    practiceState.queue = shuffle(pool, Math.random);
  }
  const card = practiceState.queue.shift();
  const label = category === 'all' ? 'Everything' : CATEGORIES[category].label;
  app.innerHTML = `
    <section class="play">
      <div class="meta"><span>Practice: ${label}</span><span class="tally">${practiceState.right} of ${practiceState.played} right</span></div>
      <div class="slot"></div>
    </section>`;
  playCard(app.querySelector('.slot'), card, {
    footLeft: label,
    footRight: `${practiceState.queue.length} left in the pile`,
    onAnswer: (guess) => {
      practiceState.played++;
      if (guess === card.answer) practiceState.right++;
      app.querySelector('.tally').textContent = `${practiceState.right} of ${practiceState.played} right`;
    },
    onNext: () => practice(category),
  });
}

// ---- one card by link ----------------------------------------------------------

function single(id) {
  setNav('deck');
  const card = byId[id];
  if (!card) return deckPage();
  document.title = `${plain(card.claim)} Well, actually`;
  app.innerHTML = `
    <section class="play">
      <div class="meta"><a href="#/deck">← The deck</a><a href="#/">Play today's ten</a></div>
      <div class="slot"></div>
    </section>`;
  playCard(app.querySelector('.slot'), card, {
    footLeft: 'True, or well, actually?',
    footRight: '',
    nextLabel: 'Play today\'s ten',
    onNext: () => (location.hash = '#/'),
  });
}

// ---- the deck ------------------------------------------------------------------

function deckPage() {
  setNav('deck');
  let filter = 'all';
  let query = '';
  app.innerHTML = `
    <section class="page">
      <h1>The deck</h1>
      <p class="lede">All ${CARDS.length} cards, with answers. Open one to play it, or to read and run its proof.</p>
      <div class="filters">
        <input type="search" placeholder="Search the deck" aria-label="Search the deck">
        <button type="button" data-filter="all" aria-pressed="true">All</button>
        ${Object.entries(CATEGORIES).map(([id, c]) => `<button type="button" data-filter="${id}" aria-pressed="false">${c.label}</button>`).join('')}
      </div>
      <ul class="deck-list"></ul>
    </section>`;
  const list = app.querySelector('.deck-list');
  const render = () => {
    const q = query.toLowerCase();
    const cards = CARDS.filter(
      (c) => (filter === 'all' || c.category === filter) && (!q || plain(`${c.claim} ${c.truth} ${c.explain}`).toLowerCase().includes(q)),
    );
    list.innerHTML =
      cards
        .map(
          (c) => `<li><a href="#/card/${c.id}">
            <span class="cat cat-${c.category}">${CATEGORIES[c.category].label}</span>
            <span class="claimline">${rich(c.claim)}</span>
            <span class="answer ${c.answer ? 'true' : ''}">${c.answer ? 'True' : 'False'}</span>
          </a></li>`,
        )
        .join('') || '<li><p class="lede">No cards match.</p></li>';
  };
  app.querySelector('input').addEventListener('input', (e) => {
    query = e.target.value;
    render();
  });
  for (const b of app.querySelectorAll('[data-filter]')) {
    b.addEventListener('click', () => {
      filter = b.dataset.filter;
      for (const other of app.querySelectorAll('[data-filter]')) other.setAttribute('aria-pressed', String(other === b));
      render();
    });
  }
  render();
}

// ---- about -----------------------------------------------------------------------

function about() {
  setNav('about');
  app.innerHTML = `
    <section class="page prose">
      <h1>About</h1>
      <p>Every programmer carries around a few beliefs that are almost true. Every day has 24 hours. Everyone has a first and a last name. <code>0.1 + 0.2</code> is <code>0.3</code>. Each of these is fine until the day it isn't, and then it's a bug in production.</p>
      <p><strong>Well, actually</strong> deals you ten of these beliefs a day. Decide whether each one is true, or whether it deserves a "well, actually". Then turn the card over: most cards prove their answer with a few lines of JavaScript that run right there in your browser. Press Edit to change the code and run it again. Don't take the card's word for it.</p>
      <h2>Where the cards come from</h2>
      <p>The idea of listing "falsehoods programmers believe" goes back to Patrick McKenzie's 2010 essay on names, and to the many lists that followed it, collected in Kevin Deldycke's <a href="https://github.com/kdeldycke/awesome-falsehood">awesome-falsehood</a>. Each card links to a source.</p>
      <h2>The daily deck</h2>
      <p>Everyone on the same date gets the same ten cards, and a new deck starts at midnight in your time zone. That means two people can be playing different decks at the same moment. There's a card about that.</p>
      <p>Your answers and streak stay in this browser. There are no accounts, no tracking, and nothing is sent anywhere.</p>
      <h2>Contribute a card</h2>
      <p>Cards live in <a href="https://github.com/OmShiv/well-actually/blob/main/src/cards.js"><code>src/cards.js</code></a>, and the test suite runs every proof. If you know a belief that deserves a "well, actually", <a href="https://github.com/OmShiv/well-actually">open a pull request</a>.</p>
    </section>`;
}

// ---- routing -----------------------------------------------------------------------

function route() {
  keys.handler = null;
  document.title = 'Well, actually';
  const [, page, arg] = location.hash.replace(/^#/, '').split('/');
  if (page === 'practice') arg ? practice(arg) : practicePicker();
  else if (page === 'deck') deckPage();
  else if (page === 'card') single(arg);
  else if (page === 'about') about();
  else daily();
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  scrollTo({ top: 0 });
}

addEventListener('hashchange', route);
route();
