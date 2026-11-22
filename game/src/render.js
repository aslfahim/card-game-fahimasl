// Ember Pact — render.js
// One job: turn the game state into the table you see. Cards are DOM
// elements, so they slide, flip and snap with plain CSS transitions:
// a dealt hand fades in card by card, a played card flips onto the
// board, an attacker lunges and a damage number floats up and fades.
// Every value on a card is shown twice: a number and a shape, and the
// element by colour and glyph, so the table reads at thumbnail size.

import { ELEMENTS, HEROES } from './config.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function elementBadge(element) {
  const info = ELEMENTS[element];
  const badge = el('span', 'element-badge');
  badge.style.setProperty('--element', info.colour);
  badge.style.setProperty('--element-dark', info.dark);
  badge.style.setProperty('--element-light', info.light);
  const glyph = el('span', 'element-glyph', info.glyph);
  const name = el('span', 'element-name', info.name);
  badge.append(glyph, name);
  return badge;
}

function statPip(kind, value) {
  const pip = el('span', `stat-pip ${kind}`);
  const icon = el('span', 'stat-icon', kind === 'attack' ? '⚔' : '♥');
  const num = el('span', 'stat-num', String(value));
  pip.append(icon, num);
  return pip;
}

// A face-up card: cost gem, element badge, art sigil, name, text and
// attack / health pips for creatures, damage / heal for spells.
export function cardElement(card, opts = {}) {
  const info = ELEMENTS[card.element];
  const node = el('div', `card element-${card.element}`);
  node.style.setProperty('--element', info.colour);
  node.style.setProperty('--element-dark', info.dark);
  node.style.setProperty('--element-light', info.light);
  node.dataset.uid = card.uid;

  const cost = el('div', 'card-cost', String(card.cost));
  const art = el('div', 'card-art', cardArtGlyph(card));
  const name = el('div', 'card-name', card.name);
  const text = el('div', 'card-text', card.text || elementLine(card));
  node.append(cost, elementBadge(card.element), art, name, text);

  if (card.kind === 'creature') {
    const stats = el('div', 'card-stats');
    stats.append(statPip('attack', card.attack), statPip('health', card.health));
    node.append(stats);
    if (card.canAttack === false) node.classList.add('sick'); // board creatures only: hand cards carry no canAttack yet
  } else {
    const effect = el('div', 'card-stats');
    if (card.damage) effect.append(statPip('attack', card.damage));
    if (card.heal) effect.append(statPip('health', `+${card.heal}`));
    if (card.draw) effect.append(el('span', 'stat-pip draw', `Draw ${card.draw}`));
    if (card.buff) effect.append(el('span', 'stat-pip draw', `+${card.buff}/+${card.buff}`));
    node.append(effect);
  }
  if (opts.selected) node.classList.add('selected');
  if (opts.playable) node.classList.add('playable');
  if (opts.disabled) node.classList.add('disabled');
  return node;
}

function cardArtGlyph(card) {
  const art = {
    fire: '🔥', water: '💧', earth: '🌿', storm: '⚡',
  };
  return art[card.element] || '✦';
}

function elementLine(card) {
  return card.kind === 'creature' ? 'Creature' : 'Spell';
}

// A face-down card back: the Ash Herald's hand, counted but unreadable.
export function cardBackElement() {
  const node = el('div', 'card card-back');
  node.append(el('div', 'card-back-sigil', '♨'));
  node.append(el('div', 'card-back-word', 'EMBER PACT'));
  return node;
}

function heroPanel(game, who) {
  const side = game[who];
  const hero = HEROES[who];
  const panel = el('div', `hero-panel ${who}`);
  const sigil = el('div', 'hero-sigil', hero.sigil);
  const names = el('div', 'hero-names');
  names.append(el('div', 'hero-name', hero.name));
  const life = el('div', 'hero-life');
  life.append(el('span', 'life-heart', '♥'));
  life.append(el('span', 'life-num', `${Math.max(0, side.life)}`));
  life.append(el('span', 'life-max', `/ ${side.maxLife}`));
  names.append(life);
  const mana = el('div', 'hero-mana');
  mana.append(el('span', 'mana-gem', '◆'));
  mana.append(el('span', 'mana-num', `${side.mana} / ${side.maxMana}`));
  mana.append(el('span', 'mana-label', 'mana'));
  const deck = el('div', 'hero-deck', `Deck ${side.deck.length}`);
  panel.append(sigil, names, mana, deck);
  if (game.active === who && game.phase === 'play') panel.classList.add('active-turn');
  return panel;
}

function boardRow(game, who, onAttacker, onTarget) {
  const row = el('div', `board-row ${who}`);
  for (const creature of game[who].board) {
    const node = cardElement(creature, {
      selected: game.selectedAttacker === creature.uid,
      playable: who === 'player' && creature.canAttack && game.active === 'player',
    });
    node.classList.add('on-board');
    if (who === 'player') {
      node.addEventListener('click', () => onAttacker(creature.uid));
    } else {
      node.addEventListener('click', () => onTarget({ kind: 'creature', who: 'enemy', uid: creature.uid }));
    }
    row.append(node);
  }
  if (game[who].board.length === 0) {
    row.append(el('div', 'board-empty', who === 'player' ? 'Your side of the table is empty — play a creature.' : 'Cinder has no creatures out.'));
  }
  return row;
}
// Renders the whole table into #table: the enemy hero and hand at the
// top, the two boards in the middle, your hero, hand and controls below.
// A floating damage number is a one-shot span: it rises, fades, and
// removes itself, so the table never needs a second render pass for it.
export function renderTable(game, hooks) {
  const table = document.getElementById('table');
  table.innerHTML = '';

  const top = el('div', 'table-top');
  top.append(heroPanel(game, 'enemy'));
  const enemyHand = el('div', 'hand enemy-hand');
  game.enemy.hand.forEach(() => enemyHand.append(cardBackElement()));
  enemyHand.append(el('div', 'hand-count', `${game.enemy.hand.length} cards`));
  top.append(enemyHand);
  table.append(top);

  table.append(boardRow(game, 'enemy', hooks.onAttacker, hooks.onTarget));
  const middle = el('div', 'table-middle');
  middle.append(el('div', 'turn-banner', game.phase === 'play'
    ? (game.active === 'player' ? `Turn ${game.turn} — your move` : `Turn ${game.turn} — Cinder is thinking…`)
    : ''));
  if (game.comboNote) middle.append(el('div', 'combo-banner', game.comboNote));
  table.append(middle);
  table.append(boardRow(game, 'player', hooks.onAttacker, hooks.onTarget));

  const bottom = el('div', 'table-bottom');
  bottom.append(heroPanel(game, 'player'));
  const hand = el('div', 'hand player-hand');
  game.player.hand.forEach((card, i) => {
    const node = cardElement(card, {
      selected: game.selectedHand === card.uid,
      playable: game.active === 'player' && game.player.mana >= card.cost,
      disabled: game.active !== 'player' || game.player.mana < card.cost,
    });
    node.style.animationDelay = `${i * 70}ms`;
    node.addEventListener('click', () => hooks.onHandCard(card.uid));
    hand.append(node);
  });
  hand.append(el('div', 'hand-count', `${game.player.hand.length} cards · keys 1–${Math.min(9, game.player.hand.length)} select`));
  bottom.append(hand);
  table.append(bottom);

  const controls = el('div', 'controls');
  const endTurn = el('button', 'btn end-turn', game.active === 'player' ? 'End turn  (E)' : 'Cinder’s turn…');
  endTurn.disabled = game.active !== 'player' || game.phase !== 'play';
  endTurn.addEventListener('click', hooks.onEndTurn);
  const newGame = el('button', 'btn', 'New game  (N)');
  newGame.addEventListener('click', hooks.onNewGame);
  const mute = el('button', 'btn', hooks.muted ? 'Sound off  (M)' : 'Sound on  (M)');
  mute.addEventListener('click', hooks.onMute);
  const hint = el('div', 'hint', 'Click a hand card to play it · click your creature, then an enemy, to attack · spells ask for a target.');
  controls.append(endTurn, newGame, mute, hint);
  table.append(controls);

  const log = el('div', 'game-log');
  log.append(el('div', 'log-title', 'The pact so far'));
  game.log.forEach((line) => log.append(el('div', 'log-line', line)));
  table.append(log);
}

// Full-screen overlays: title, victory and defeat.
export function renderOverlay(game, hooks) {
  const overlay = document.getElementById('overlay');
  overlay.innerHTML = '';
  if (game.phase === 'play') {
    overlay.classList.remove('shown');
    return;
  }
  overlay.classList.add('shown');
  const panel = el('div', 'overlay-panel');
  if (game.phase === 'title') {
    panel.classList.add('title-panel');
    panel.append(el('div', 'title-emblem', '🔥'));
    panel.append(el('h1', 'game-title', 'EMBER PACT'));
    panel.append(el('div', 'game-tagline', 'An elemental duel of creatures and spells. Break the Ash Herald’s life to 0 — before yours breaks.'));
    const rules = el('div', 'title-rules');
    rules.append(el('div', 'rule-line', '▲ Fire feeds Fire — chain Fire cards to Kindle +1.'));
    rules.append(el('div', 'rule-line', '● Water douses Fire — Water deals +1 to Fire creatures.'));
    rules.append(el('div', 'rule-line', '◆ Mana grows each turn. Creatures strike the turn they are played.'));
    panel.append(rules);
    const play = el('button', 'btn btn-big', 'Begin the duel');
    play.addEventListener('click', hooks.onStart);
    panel.append(play);
    panel.append(el('div', 'title-foot', 'Mouse and keyboard · 1–9 select a card · E ends your turn'));
  } else if (game.phase === 'won') {
    panel.classList.add('win-panel');
    panel.append(el('div', 'title-emblem', '🏆'));
    panel.append(el('h1', 'game-title', 'VICTORY'));
    panel.append(el('div', 'game-tagline', `The Ash Herald falls. Your life stands at ${Math.max(0, game.player.life)} — the pact is yours.`));
    const again = el('button', 'btn btn-big', 'Duel again  (N)');
    again.addEventListener('click', hooks.onNewGame);
    panel.append(again);
    spawnEmbers(overlay);
  } else if (game.phase === 'lost') {
    panel.classList.add('loss-panel');
    panel.append(el('div', 'title-emblem', '🥀'));
    panel.append(el('h1', 'game-title', 'DEFEAT'));
    panel.append(el('div', 'game-tagline', `Cinder’s embers take you. The Herald stands at ${Math.max(0, game.enemy.life)} life — the pact is broken.`));
    const again = el('button', 'btn btn-big', 'Try again  (N)');
    again.addEventListener('click', hooks.onNewGame);
    panel.append(again);
  }
  overlay.append(panel);
}

function spawnEmbers(overlay) {
  for (let i = 0; i < 36; i += 1) {
    const ember = el('span', 'ember');
    ember.style.left = `${(i * 37) % 100}%`;
    ember.style.animationDelay = `${(i % 12) * 0.12}s`;
    ember.style.background = ['#f97316', '#ef4444', '#fbbf24', '#f59e0b'][i % 4];
    overlay.append(ember);
  }
}

// A floating damage / heal number over a hero panel or a board card.
export function floatNumber(targetEl, text, kind) {
  if (!targetEl) return;
  const floater = el('span', `float-num ${kind}`, text);
  const rect = targetEl.getBoundingClientRect();
  const host = document.getElementById('table');
  const hostRect = host.getBoundingClientRect();
  floater.style.left = `${rect.left - hostRect.left + rect.width / 2}px`;
  floater.style.top = `${rect.top - hostRect.top}px`;
  host.append(floater);
  setTimeout(() => floater.remove(), 1200);
}
