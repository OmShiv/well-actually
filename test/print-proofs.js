// Prints every card's proof output as JSON. The tests run this under several
// time zones and locales and expect the same answers everywhere.
import { CARDS } from '../src/cards.js';
import { runProof } from '../src/run.js';

const out = {};
for (const card of CARDS) {
  if (card.proof && !card.browserOnly) out[card.id] = runProof(card.proof);
}
process.stdout.write(JSON.stringify(out, null, 2));
