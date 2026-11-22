// Ember Pact — cards.js
// One job: the card pool and how a 30-card deck is built from it.
// Every name and creature here is original to Ember Pact.
// A card is one of two kinds:
//   creature — stays on the table, attacks on later turns
//   spell    — resolves at once, then leaves the game
// Fields: id, name, kind, element, cost, attack, health (creatures),
// damage/heal/draw (spells), text (what the card does, in plain words).
// Card text is kept to two short lines so it never crowds the pips.

export const CARD_POOL = [
  // -- 1-cost creatures: the opening plays --
  { id: 'cinder-pup',   name: 'Cinder Pup',   kind: 'creature', element: 'fire',  cost: 1, attack: 2, health: 1, text: 'Kindle: +1 attack after Fire.' },
  { id: 'ash-imp',      name: 'Ash Imp',      kind: 'creature', element: 'fire',  cost: 1, attack: 1, health: 2, text: 'Kindle: +1 attack after Fire.' },
  { id: 'dew-sprite',   name: 'Dew Sprite',   kind: 'creature', element: 'water', cost: 1, attack: 1, health: 2, text: 'Douse: +1 damage vs Fire.' },
  { id: 'pebble-golem', name: 'Pebble Golem', kind: 'creature', element: 'earth', cost: 2, attack: 2, health: 3, text: '' },
  { id: 'spark-eel',    name: 'Spark Eel',    kind: 'creature', element: 'storm', cost: 2, attack: 3, health: 1, text: '' },
  { id: 'flame-hound',  name: 'Flame Hound',  kind: 'creature', element: 'fire',  cost: 2, attack: 3, health: 2, text: 'Kindle: +1 attack after Fire.' },
  { id: 'tide-crab',    name: 'Tide Crab',    kind: 'creature', element: 'water', cost: 2, attack: 1, health: 4, text: 'Douse: +1 damage vs Fire.' },
  { id: 'mossback',     name: 'Mossback',     kind: 'creature', element: 'earth', cost: 3, attack: 3, health: 4, text: '' },
  { id: 'storm-kite',   name: 'Storm Kite',   kind: 'creature', element: 'storm', cost: 3, attack: 4, health: 2, text: '' },
  { id: 'ember-knight', name: 'Ember Knight', kind: 'creature', element: 'fire',  cost: 3, attack: 3, health: 3, text: 'Kindle: +1 attack after Fire.' },
  { id: 'raincaller',   name: 'Raincaller',   kind: 'creature', element: 'water', cost: 3, attack: 2, health: 4, text: 'Heal your hero 2.' },
  { id: 'boulderback',  name: 'Boulderback',  kind: 'creature', element: 'earth', cost: 4, attack: 4, health: 5, text: '' },
  { id: 'wildfire-drake', name: 'Wildfire Drake', kind: 'creature', element: 'fire', cost: 4, attack: 5, health: 3, text: 'Kindle: +1 attack after Fire.' },
  { id: 'tempest-roc',  name: 'Tempest Roc',  kind: 'creature', element: 'storm', cost: 4, attack: 4, health: 4, text: '' },
  { id: 'frostfin',     name: 'Frostfin',     kind: 'creature', element: 'water', cost: 4, attack: 3, health: 5, text: 'Douse: +1 damage vs Fire.' },
  { id: 'magma-colossus', name: 'Magma Colossus', kind: 'creature', element: 'fire', cost: 6, attack: 7, health: 6, text: 'Kindle: +1 attack after Fire.' },
  { id: 'oakheart',     name: 'Ancient Oakheart', kind: 'creature', element: 'earth', cost: 6, attack: 5, health: 8, text: 'Heal your hero 3.' },
  { id: 'storm-sovereign', name: 'Storm Sovereign', kind: 'creature', element: 'storm', cost: 7, attack: 8, health: 6, text: 'Strike the enemy hero for 2.' },
  // -- spells --
  { id: 'fireball',     name: 'Fireball',     kind: 'spell', element: 'fire',  cost: 2, damage: 3, text: 'Deal 3 damage to any target.' },
  { id: 'douse',        name: 'Douse',        kind: 'spell', element: 'water', cost: 1, damage: 2, text: 'Deal 2 damage to a creature. +1 if it is Fire.' },
  { id: 'mend',         name: 'Mend',         kind: 'spell', element: 'water', cost: 2, heal: 5, text: 'Restore 5 life to your hero.' },
  { id: 'lightning-lash', name: 'Lightning Lash', kind: 'spell', element: 'storm', cost: 3, damage: 4, text: 'Deal 4 damage to a creature.' },
  { id: 'wild-growth',  name: 'Wild Growth',  kind: 'spell', element: 'earth', cost: 2, buff: 2, text: 'Give a friendly creature +2/+2.' },
  { id: 'ember-surge',  name: 'Ember Surge',  kind: 'spell', element: 'fire',  cost: 3, draw: 2, text: 'Draw 2 cards.' },
  { id: 'quake',        name: 'Quake',        kind: 'spell', element: 'earth', cost: 4, damage: 2, text: 'Deal 2 damage to ALL enemy creatures.' },
  { id: 'cyclone',      name: 'Cyclone',      kind: 'spell', element: 'storm', cost: 3, text: 'Return an enemy creature to its owner\'s hand.' },
];

export function cardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}

// A deck is 30 cards: two copies of the cheap core, one of each big card,
// two of each cheap spell — the same recipe for both sides, shuffled.
const DECK_RECIPE = [
  ['cinder-pup', 2], ['ash-imp', 2], ['dew-sprite', 2], ['pebble-golem', 1],
  ['spark-eel', 1], ['flame-hound', 1], ['tide-crab', 1], ['mossback', 1],
  ['storm-kite', 1], ['ember-knight', 2], ['raincaller', 1], ['boulderback', 1],
  ['wildfire-drake', 1], ['tempest-roc', 1], ['frostfin', 1],
  ['magma-colossus', 1], ['oakheart', 1], ['storm-sovereign', 1],
  ['fireball', 1], ['douse', 1], ['mend', 1], ['lightning-lash', 1],
  ['wild-growth', 1], ['ember-surge', 1], ['quake', 1], ['cyclone', 1],
];

export function buildDeck() {
  const deck = [];
  for (const [id, copies] of DECK_RECIPE) {
    const card = cardById(id);
    for (let i = 0; i < copies; i += 1) {
      deck.push({ ...card, uid: `${id}-${i}-${Math.random().toString(36).slice(2, 7)}` });
    }
  }
  return deck;
}

export function isKindleCard(card) {
  return card.element === 'fire' && card.text.includes('Kindle');
}
