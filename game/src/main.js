// Ember Pact — main.js
// One job: boot the duel and keep the table in step with the rules.
// It owns no rules of its own: state.js decides, ai.js plays Cinder,
// render.js draws, input.js listens, audio.js sounds. This file only
// wires them together and re-renders after every move.

import { createGame, attackWith, endTurn, playCard } from './state.js';
import { takeAiTurn } from './ai.js';
import { renderOverlay, renderTable } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { gameForScene } from './scenes.js';

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene) document.body.classList.add('scene-shot'); // staged shots: no entrance animations, so every card is fully visible
const audio = createAudio();
let game = scene ? gameForScene(scene) : createGame();
if (!scene) game.phase = 'title';

let aiRunning = false;
let input;
let lastPhase = game.phase;

function renderAll() {
  renderTable(game, {
    onHandCard: input.handlers.onHandCard,
    onAttacker: input.handlers.onAttacker,
    onTarget: input.handlers.onTarget,
    onEndTurn: handleEndTurn,
    onNewGame: startFreshDuel,
    onMute: toggleMute,
    muted: audio.muted,
  });
  renderOverlay(game, {
    onStart: beginDuel,
    onNewGame: startFreshDuel,
  });
  bindHeroClicks();
  if (game.phase === 'won' && lastPhase !== 'won') audio.win();
  if (game.phase === 'lost' && lastPhase !== 'lost') audio.lose();
  lastPhase = game.phase;
}

// The hero panels are re-rendered each time, so their clicks are bound
// after every render: a click on the enemy hero is a target.
function bindHeroClicks() {
  const panels = document.querySelectorAll('.hero-panel');
  panels.forEach((panel) => {
    panel.addEventListener('click', () => {
      const who = panel.classList.contains('enemy') ? 'enemy' : 'player';
      input.handlers.onHeroClick(who);
    });
  });
}

function beginDuel() {
  audio.unlock();
  audio.playCard();
  game.phase = 'play';
  renderAll();
}

function startFreshDuel() {
  audio.unlock();
  input.clearSelection();
  game = createGame();
  game.phase = 'play';
  aiRunning = false;
  renderAll();
}

function toggleMute() {
  audio.setMuted(!audio.muted);
  renderAll();
}

function handleEndTurn() {
  if (game.phase !== 'play' || game.active !== 'player' || aiRunning) return;
  input.clearSelection();
  endTurn(game);
  renderAll();
  runAiTurn();
}

function runAiTurn() {
  if (game.phase !== 'play' || game.active !== 'enemy') return;
  aiRunning = true;
  takeAiTurn(game, renderAll, () => {
    aiRunning = false;
    renderAll();
  });
}

function handlePlayCard(uid, target) {
  if (game.phase !== 'play' || game.active !== 'player') return;
  audio.unlock();
  const before = game.player.life;
  const result = playCard(game, 'player', uid, target);
  if (!result.ok) {
    audio.denied();
    return;
  }
  if (game.player.life > before) audio.heal();
  else audio.playCard();
  renderAll();
}

function handleAttack(attackerUid, target) {
  if (game.phase !== 'play' || game.active !== 'player') return;
  const result = attackWith(game, 'player', attackerUid, target);
  if (result.ok) audio.attack();
  else audio.denied();
  renderAll();
}

input = createInput(() => game, {
  onPlayCard: handlePlayCard,
  onAttack: handleAttack,
  onEndTurn: handleEndTurn,
  onNewGame: startFreshDuel,
  onStart: beginDuel,
  onMute: toggleMute,
  onRender: renderAll,
  onDenied: () => audio.denied(),
  onArmed: () => {},
});

document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
renderAll();
