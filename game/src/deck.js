// Ember Pact — deck.js
// One job: randomness and the deck. A tiny seeded generator keeps the
// staged screenshot scenes identical on every load; live games seed
// from the clock so no two duels play alike.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, random) {
  const pile = deck.slice();
  for (let i = pile.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
  return pile;
}

// Draw the top card. Returns null when the deck is empty (fatigue).
export function drawCard(side) {
  return side.deck.length > 0 ? side.deck.pop() : null;
}

export function burnTopCard(side) {
  side.deck.pop();
}
