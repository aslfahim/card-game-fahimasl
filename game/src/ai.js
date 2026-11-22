// Ember Pact — ai.js
// One job: play Cinder, the Ash Herald. The AI reads the table and
// counters what it sees, in this order every turn:
//   1. Remove the player's most dangerous creature when a spell can kill it.
//   2. Heal when its own hero is low and a Mend is in hand.
//   3. Grow its board, playing the strongest affordable creature first.
//   4. Spend spare mana on a face Fireball when the player is nearly dead.
//   5. Attack: trade up against a creature that would hurt next turn,
//      otherwise go for the player's hero — the pact is won by life, not
//      by board. Water answers Fire: it prefers hitting Fire creatures.
// The pauses between moves (aiThinkMs) let the player watch it think.

import { TUNING } from './config.js';
import { attackWith, endTurn, playCard } from './state.js';

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function boardThreat(creature) {
  return creature.attack * 2 + creature.health;
}

function pickRemovalTarget(game, card) {
  // The player's creature worth killing: the biggest threat a spell can finish.
  const targets = game.player.board
    .filter((c) => c.health <= (card.damage || 0))
    .sort((a, b) => boardThreat(b) - boardThreat(a));
  return targets[0] || null;
}

function playOneCard(game) {
  const side = game.enemy;
  const hand = side.hand;

  // 1. Removal first — a spell that finishes a real threat.
  for (const card of hand) {
    if (card.id === 'lightning-lash' || card.id === 'douse') {
      const victim = pickRemovalTarget(game, card);
      if (victim && side.mana >= card.cost) {
        return playCard(game, 'enemy', card.uid, { kind: 'creature', who: 'player', uid: victim.uid });
      }
    }
    if (card.id === 'quake' && game.player.board.length >= 2 && side.mana >= card.cost) {
      return playCard(game, 'enemy', card.uid, null);
    }
    if (card.id === 'cyclone' && game.player.board.length > 0 && side.mana >= card.cost) {
      const big = game.player.board.slice().sort((a, b) => boardThreat(b) - boardThreat(a))[0];
      return playCard(game, 'enemy', card.uid, { kind: 'creature', who: 'player', uid: big.uid });
    }
  }

  // 2. Heal when hurt.
  const mend = hand.find((c) => c.id === 'mend');
  if (mend && side.life <= 18 && side.mana >= mend.cost) {
    return playCard(game, 'enemy', mend.uid, null);
  }

  // 3. Creatures: strongest affordable first, but keep a Fire chain going
  //    when the last card played this turn was Fire (Kindle +1 attack).
  const creatures = hand
    .filter((c) => c.kind === 'creature' && side.mana >= c.cost)
    .sort((a, b) => (b.attack + b.health) - (a.attack + a.health));
  const chained = creatures.find((c) => c.element === 'fire' && side.lastElement === 'fire');
  const pick = chained || creatures[0];
  if (pick) return playCard(game, 'enemy', pick.uid, null);

  // 4. Spare-mana face damage when the player is nearly beaten.
  const ball = hand.find((c) => c.id === 'fireball');
  if (ball && side.mana >= ball.cost && game.player.life <= 12) {
    return playCard(game, 'enemy', ball.uid, { kind: 'hero', who: 'player' });
  }

  // 5. Draw when the hand is running dry.
  const surge = hand.find((c) => c.id === 'ember-surge');
  if (surge && side.mana >= surge.cost && hand.length <= 2) {
    return playCard(game, 'enemy', surge.uid, null);
  }

  const growth = hand.find((c) => c.id === 'wild-growth');
  if (growth && side.mana >= growth.cost && side.board.length > 0) {
    const big = side.board.slice().sort((a, b) => boardThreat(b) - boardThreat(a))[0];
    return playCard(game, 'enemy', growth.uid, { kind: 'creature', who: 'enemy', uid: big.uid });
  }

  return { ok: false, why: 'nothing worth playing' };
}

function attackOnce(game) {
  const ready = game.enemy.board.filter((c) => c.canAttack);
  if (ready.length === 0) return false;
  // Water douses Fire: hit a Fire creature when the trade is clean.
  for (const attacker of ready) {
    const firePrey = game.player.board
      .filter((c) => c.element === 'fire' && c.health <= attacker.attack + (attacker.element === 'water' ? TUNING.douseBonus : 0))
      .sort((a, b) => boardThreat(b) - boardThreat(a))[0];
    if (firePrey && attacker.attack >= 3) {
      attackWith(game, 'enemy', attacker.uid, { kind: 'creature', who: 'player', uid: firePrey.uid });
      return true;
    }
  }
  // Otherwise trade up: kill a player creature that would hit hard next turn.
  for (const attacker of ready) {
    const prey = game.player.board
      .filter((c) => c.health <= attacker.attack && c.attack >= 3 && attacker.health > c.attack)
      .sort((a, b) => b.attack - a.attack)[0];
    if (prey) {
      attackWith(game, 'enemy', attacker.uid, { kind: 'creature', who: 'player', uid: prey.uid });
      return true;
    }
  }
  // Otherwise go face — the pact is won by life.
  const striker = ready.slice().sort((a, b) => b.attack - a.attack)[0];
  attackWith(game, 'enemy', striker.uid, { kind: 'hero', who: 'player' });
  return true;
}

// Run one full AI turn, pausing so the player can follow each move.
// Calls onDone when the turn is over (or the game has ended).
export async function takeAiTurn(game, onStep, onDone) {
  await wait(TUNING.aiThinkMs);
  let guard = 0;
  while (game.phase === 'play' && game.active === 'enemy' && guard < 12) {
    guard += 1;
    const played = playOneCard(game);
    if (played.ok) {
      onStep();
      await wait(TUNING.aiThinkMs);
    } else {
      break;
    }
  }
  let strikes = 0;
  while (game.phase === 'play' && game.active === 'enemy' && strikes < 8) {
    strikes += 1;
    if (!attackOnce(game)) break;
    onStep();
    await wait(TUNING.aiThinkMs);
  }
  if (game.phase === 'play' && game.active === 'enemy') {
    endTurn(game);
    onStep();
  }
  onDone();
}
