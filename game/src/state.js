// Ember Pact — state.js
// One job: the rules. A duel is two sides (player, enemy), each with a
// hero (life), a hand, a deck, a board of creatures and a mana pool.
// Turns: gain a mana crystal, refill mana, draw a card, play cards,
// attack with creatures, end turn. Creatures strike the turn they are
// played. Reduce the enemy hero to 0 life and the pact is yours.
//
// Elemental combos — the decisions in every hand:
//   KINDLE: playing a Fire card right after another Fire card this turn
//           gives it +1 attack (creature) or +1 damage (spell).
//   DOUSE:  Water cards deal +1 damage to Fire creatures.
//   The last element played this turn is tracked on the side, so a hand
//   is a puzzle: chain one element, or answer the enemy's Fire with Water.

import { TUNING } from './config.js';
import { buildDeck, cardById } from './cards.js';
import { drawCard, mulberry32, shuffle } from './deck.js';

export function newSide(seed) {
  const random = mulberry32(seed);
  return {
    life: TUNING.heroLife,
    maxLife: TUNING.heroLife,
    mana: 0,
    maxMana: 0,
    hand: [],
    deck: shuffle(buildDeck(), random),
    board: [],
    lastElement: null, // element of the last card played this turn
    fatigue: 0,        // grows each time an empty deck is drawn from
  };
}

export function createGame(seed = (Date.now() % 2147483647) || 1) {
  const game = {
    seed,
    turn: 1,
    active: 'player',
    phase: 'play', // title | play | won | lost
    winner: null,
    log: [],
    player: newSide(seed),
    enemy: newSide(seed + 7919),
    selectedHand: null,   // uid of the hand card picked up
    selectedAttacker: null, // uid of the board creature ready to strike
    comboNote: '',
  };
  for (let i = 0; i < TUNING.startHand; i += 1) {
    game.player.hand.push(drawCard(game.player));
    game.enemy.hand.push(drawCard(game.enemy));
  }
  startTurn(game, 'player');
  return game;
}

export function say(game, text) {
  game.log.unshift(text);
  if (game.log.length > 8) game.log.length = 8;
}

export function startTurn(game, who) {
  const side = game[who];
  game.active = who;
  side.maxMana = Math.min(TUNING.maxMana, side.maxMana + 1);
  side.mana = side.maxMana;
  side.lastElement = null;
  side.board.forEach((c) => { c.canAttack = true; });
  const drawn = drawCard(side);
  if (drawn) {
    if (side.hand.length >= TUNING.handLimit) {
      say(game, `${who === 'player' ? 'You' : 'Cinder'} burned ${drawn.name} — hand full.`);
    } else {
      side.hand.push(drawn);
    }
  } else {
    side.fatigue += 1;
    const hurt = TUNING.fatigueDamage * side.fatigue;
    side.life -= hurt;
    say(game, `${who === 'player' ? 'You' : 'Cinder'} take ${hurt} fatigue — the deck is empty.`);
  }
  checkEnd(game);
}

export function kindleBonusFor(game, who, card) {
  const side = game[who];
  return card.element === 'fire' && side.lastElement === 'fire' ? TUNING.kindleBonus : 0;
}

export function canAfford(side, card) {
  return side.mana >= card.cost;
}

// Play a hand card. Creatures land on the board; spells need a target
// first (target: { kind: 'hero'|'creature', who, uid }) — the caller
// resolves targeting, this function resolves the effect.
export function playCard(game, who, uid, target) {
  const side = game[who];
  const foe = game[who === 'player' ? 'enemy' : 'player'];
  const index = side.hand.findIndex((c) => c.uid === uid);
  if (index < 0) return { ok: false, why: 'card not in hand' };
  const card = side.hand[index];
  if (!canAfford(side, card)) return { ok: false, why: 'not enough mana' };
  if (game.phase !== 'play' || game.active !== who) return { ok: false, why: 'not your turn' };

  const kindle = kindleBonusFor(game, who, card);
  side.mana -= card.cost;
  side.hand.splice(index, 1);
  side.lastElement = card.element;

  if (card.kind === 'creature') {
    // Creatures strike the turn they are played: a creature left standing
    // hits every turn, so the table is a race to hold the board.
    const placed = { ...card, health: card.health, maxHealth: card.health, attack: card.attack + kindle, canAttack: true };
    side.board.push(placed);
    if (card.id === 'raincaller') { side.life = Math.min(side.maxLife, side.life + 2); }
    if (card.id === 'oakheart') { side.life = Math.min(side.maxLife, side.life + 3); }
    if (card.id === 'storm-sovereign') { foe.life -= 2; }
    say(game, `${who === 'player' ? 'You' : 'Cinder'} played ${card.name}${kindle ? ' — KINDLED +1!' : ''}.`);
    game.comboNote = kindle ? 'KINDLED! Fire feeds fire: +1 attack.' : '';
  } else {
    resolveSpell(game, who, card, target, kindle);
  }
  checkEnd(game);
  return { ok: true };
}

function hurtCreature(game, who, uid, amount) {
  const side = game[who];
  const target = side.board.find((c) => c.uid === uid);
  if (!target) return;
  target.health -= amount;
  if (target.health <= 0) {
    side.board = side.board.filter((c) => c.uid !== uid);
    say(game, `${target.name} is destroyed.`);
  }
}

function resolveSpell(game, who, card, target, kindle) {
  const side = game[who];
  const foe = game[who === 'player' ? 'enemy' : 'player'];
  const foeWho = who === 'player' ? 'enemy' : 'player';
  const me = who === 'player' ? 'You' : 'Cinder';
  let amount = (card.damage || 0) + kindle;

  switch (card.id) {
    case 'fireball': {
      if (!target) return;
      if (target.kind === 'hero') {
        (target.who === 'player' ? game.player : game.enemy).life -= amount;
      } else {
        hurtCreature(game, target.who, target.uid, amount);
      }
      say(game, `${me} hurled Fireball for ${amount}.`);
      break;
    }
    case 'douse': {
      if (!target || target.kind !== 'creature') return;
      const victim = game[target.who].board.find((c) => c.uid === target.uid);
      const bonus = victim && victim.element === 'fire' ? TUNING.douseBonus : 0;
      hurtCreature(game, target.who, target.uid, amount + bonus);
      say(game, `${me} doused ${victim ? victim.name : 'a creature'} for ${amount + bonus}.`);
      break;
    }
    case 'mend':
      side.life = Math.min(side.maxLife, side.life + (card.heal || 0));
      say(game, `${me} mended ${card.heal} life.`);
      break;
    case 'lightning-lash': {
      if (!target || target.kind !== 'creature') return;
      hurtCreature(game, target.who, target.uid, amount);
      say(game, `${me} lashed a creature for ${amount}.`);
      break;
    }
    case 'wild-growth': {
      if (!target || target.kind !== 'creature' || target.who !== who) return;
      const friend = side.board.find((c) => c.uid === target.uid);
      if (friend) { friend.attack += card.buff; friend.health += card.buff; friend.maxHealth += card.buff; }
      say(game, `${me} grew ${friend ? friend.name : 'a creature'} +${card.buff}/+${card.buff}.`);
      break;
    }
    case 'ember-surge': {
      for (let i = 0; i < (card.draw || 0); i += 1) {
        const drawn = drawCard(side);
        if (drawn && side.hand.length < TUNING.handLimit) side.hand.push(drawn);
      }
      say(game, `${me} surged and drew ${card.draw} cards.`);
      break;
    }
    case 'quake': {
      foe.board.slice().forEach((c) => hurtCreature(game, foeWho, c.uid, amount));
      say(game, `${me} quaked the enemy board for ${amount}.`);
      break;
    }
    case 'cyclone': {
      if (!target || target.kind !== 'creature' || target.who === who) return;
      const victim = game[target.who].board.find((c) => c.uid === target.uid);
      if (victim) {
        game[target.who].board = game[target.who].board.filter((c) => c.uid !== target.uid);
        if (game[target.who].hand.length < TUNING.handLimit) {
          game[target.who].hand.push({ ...cardById(victim.id), uid: victim.uid });
        }
      }
      say(game, `${me} cycloned ${victim ? victim.name : 'a creature'} back to hand.`);
      break;
    }
    default:
      break;
  }
  game.comboNote = kindle ? 'KINDLED! Fire feeds fire: +1 damage.' : '';
}

// A board creature strikes a target: an enemy creature trades blows,
// the enemy hero takes the attack straight.
export function attackWith(game, who, attackerUid, target) {
  const side = game[who];
  const foe = game[who === 'player' ? 'enemy' : 'player'];
  const foeWho = who === 'player' ? 'enemy' : 'player';
  const attacker = side.board.find((c) => c.uid === attackerUid);
  if (!attacker || !attacker.canAttack) return { ok: false, why: 'cannot attack yet' };
  if (game.phase !== 'play' || game.active !== who) return { ok: false, why: 'not your turn' };
  const me = who === 'player' ? 'You' : 'Cinder';
  const douse = attacker.element === 'water';

  attacker.canAttack = false;
  if (target.kind === 'hero') {
    foe.life -= attacker.attack;
    say(game, `${me}'s ${attacker.name} struck the hero for ${attacker.attack}.`);
  } else {
    const victim = foe.board.find((c) => c.uid === target.uid);
    if (!victim) return { ok: false, why: 'target gone' };
    const dealt = attacker.attack + (douse && victim.element === 'fire' ? TUNING.douseBonus : 0);
    victim.health -= dealt;
    attacker.health -= victim.attack;
    say(game, `${me}'s ${attacker.name} hit ${victim.name} for ${dealt}, took ${victim.attack} back.`);
    if (victim.health <= 0) {
      foe.board = foe.board.filter((c) => c.uid !== target.uid);
      say(game, `${victim.name} is destroyed.`);
    }
    if (attacker.health <= 0) {
      side.board = side.board.filter((c) => c.uid !== attackerUid);
      say(game, `${attacker.name} is destroyed.`);
    }
  }
  checkEnd(game);
  return { ok: true };
}

export function endTurn(game) {
  if (game.phase !== 'play') return;
  game.selectedHand = null;
  game.selectedAttacker = null;
  const next = game.active === 'player' ? 'enemy' : 'player';
  game.turn += 1;
  startTurn(game, next);
}

export function checkEnd(game) {
  if (game.phase !== 'play') return;
  if (game.enemy.life <= 0) { game.phase = 'won'; game.winner = 'player'; }
  else if (game.player.life <= 0) { game.phase = 'lost'; game.winner = 'enemy'; }
}

// Spells that need a target, and what they may aim at.
export function spellNeedsTarget(card) {
  return ['fireball', 'douse', 'lightning-lash', 'wild-growth', 'cyclone'].includes(card.id);
}
