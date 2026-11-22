// Ember Pact — config.js
// One job: every number and label the rest of the game agrees on.
// Elements are told apart by colour AND shape, never by text alone:
//   Fire  = red-orange, triangle  ▲
//   Water = blue,       circle    ●
//   Earth = green,      square    ■
//   Storm = violet,     diamond   ◆

export const ELEMENTS = {
  fire:  { name: 'Fire',  glyph: '▲', colour: '#e5484d', dark: '#7f1d1d', light: '#fecaca' },
  water: { name: 'Water', glyph: '●', colour: '#3b82f6', dark: '#1e3a8a', light: '#bfdbfe' },
  earth: { name: 'Earth', glyph: '■', colour: '#65a30d', dark: '#365314', light: '#d9f99d' },
  storm: { name: 'Storm', glyph: '◆', colour: '#a855f7', dark: '#581c87', light: '#e9d5ff' },
};

export const TUNING = {
  heroLife: 30,          // life total each hero starts with
  maxMana: 10,           // mana crystals cap
  startHand: 3,          // cards drawn before turn one
  handLimit: 10,         // cards over this are burned on draw
  deckSize: 30,
  fatigueDamage: 2,      // damage when drawing from an empty deck
  kindleBonus: 1,        // +attack / +damage when chaining the same element
  douseBonus: 1,         // extra damage Water deals to Fire creatures
  aiThinkMs: 650,        // pause between the AI's visible actions
};

export const HEROES = {
  player: { name: 'You, the Emberkeeper', short: 'Emberkeeper', sigil: '▲' },
  enemy:  { name: 'Cinder, the Ash Herald', short: 'Ash Herald', sigil: '♨' },
};
