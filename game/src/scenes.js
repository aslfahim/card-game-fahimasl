// Ember Pact — scenes.js
// One job: stage composed, deterministic states of the real game for
// screenshots. Every scene is the same game code, the same render path
// and the same cards — only the state is arranged, from a fixed seed,
// so the shot is identical on every load. ?scene=title | play | win | loss
// (no parameter plays the title screen, then the duel).

import { cardById } from './cards.js';
import { createGame } from './state.js';

function place(game, who, id, attack, health) {
  const base = cardById(id);
  const placed = { ...base, uid: `${who}-${id}-${game[who].board.length}`, attack, health, maxHealth: health, canAttack: true };
  game[who].board.push(placed);
  return placed;
}

function giveHand(game, who, ids) {
  game[who].hand = ids.map((id, i) => ({ ...cardById(id), uid: `${who}-hand-${id}-${i}` }));
}

// A mid-duel table: both heroes hurt, both boards busy, both hands full,
// mana to spend — the shot that has to read as a card game at a glance.
export function stagePlayScene() {
  const game = createGame(20261122);
  game.phase = 'play';
  game.turn = 6;
  game.player.life = 24;
  game.enemy.life = 21;
  game.player.mana = 6;
  game.player.maxMana = 6;
  game.enemy.mana = 5;
  game.enemy.maxMana = 6;
  game.player.deck.length = 18;
  game.enemy.deck.length = 20;
  game.player.board = [];
  game.enemy.board = [];
  place(game, 'player', 'ember-knight', 3, 3);
  place(game, 'player', 'mossback', 3, 4);
  place(game, 'player', 'dew-sprite', 1, 2);
  place(game, 'enemy', 'wildfire-drake', 5, 3);
  place(game, 'enemy', 'tide-crab', 1, 4);
  place(game, 'enemy', 'storm-kite', 4, 2);
  giveHand(game, 'player', ['fireball', 'flame-hound', 'wild-growth', 'raincaller', 'lightning-lash']);
  giveHand(game, 'enemy', ['ash-imp', 'dew-sprite', 'pebble-golem', 'douse']);
  game.enemy.hand.forEach((c) => { c.uid = `enemy-back-${c.id}`; });
  game.log = [
    'Cinder played Wildfire Drake — KINDLED +1!',
    'Your Ember Knight struck the hero for 3.',
    'You played Mossback.',
    'Cinder doused your Cinder Pup for 3.',
  ];
  game.comboNote = 'KINDLED! Fire feeds fire: +1 attack.';
  game.player.lastElement = 'fire';
  return game;
}

export function stageWinScene() {
  const game = stagePlayScene();
  game.phase = 'won';
  game.winner = 'player';
  game.enemy.life = 0;
  game.player.life = 14;
  return game;
}

export function stageLossScene() {
  const game = stagePlayScene();
  game.phase = 'lost';
  game.winner = 'enemy';
  game.player.life = 0;
  game.enemy.life = 9;
  return game;
}

export function stageTitleScene() {
  const game = createGame(20261122);
  game.phase = 'title';
  return game;
}

export function gameForScene(scene) {
  if (scene === 'play') return stagePlayScene();
  if (scene === 'win') return stageWinScene();
  if (scene === 'loss') return stageLossScene();
  return stageTitleScene();
}

export function describeScene(scene) {
  return { title: 'title', play: 'play', win: 'win', loss: 'loss' }[scene] || 'title';
}
