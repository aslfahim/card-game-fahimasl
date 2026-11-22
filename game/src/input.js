// Ember Pact — input.js
// One job: turn clicks and keys into moves. The flow is deliberately
// small, so a player never wonders what a click will do:
//   hand card click  -> select it; a creature plays at once, a spell
//                       arms and waits for a target click
//   own creature     -> ready it as the attacker (click again to stand down)
//   enemy / hero     -> the target of the armed spell or the attacker
//   E / End turn     -> hand the turn to Cinder
//   1-9              -> pick up the matching hand card
//   Esc              -> put down whatever is picked up
//   N                -> a fresh duel, from anywhere
//   M                -> mute the sound
// Clicks on the wrong thing are ignored, never punished.

import { spellNeedsTarget } from './state.js';

export function createInput(getGame, hooks) {
  const input = {
    armedSpell: null, // uid of a spell waiting for its target
    muted: false,
  };

  function clearSelection() {
    const game = getGame();
    game.selectedHand = null;
    game.selectedAttacker = null;
    input.armedSpell = null;
  }

  function onHandCard(uid) {
    const game = getGame();
    if (game.phase !== 'play' || game.active !== 'player') return;
    const card = game.player.hand.find((c) => c.uid === uid);
    if (!card) return;
    if (game.player.mana < card.cost) {
      hooks.onDenied('Not enough mana.');
      return;
    }
    game.selectedAttacker = null;
    if (card.kind === 'creature') {
      game.selectedHand = null;
      hooks.onPlayCard(uid, null);
      return;
    }
    if (spellNeedsTarget(card)) {
      game.selectedHand = uid;
      input.armedSpell = uid;
      hooks.onArmed(card);
    } else {
      game.selectedHand = null;
      hooks.onPlayCard(uid, null);
    }
  }

  function onAttacker(uid) {
    const game = getGame();
    if (game.phase !== 'play' || game.active !== 'player') return;
    const creature = game.player.board.find((c) => c.uid === uid);
    if (!creature || !creature.canAttack) return;
    input.armedSpell = null;
    game.selectedHand = null;
    game.selectedAttacker = game.selectedAttacker === uid ? null : uid;
    hooks.onRender();
  }

  function onTarget(target) {
    const game = getGame();
    if (game.phase !== 'play' || game.active !== 'player') return;
    if (input.armedSpell) {
      const uid = input.armedSpell;
      clearSelection();
      hooks.onPlayCard(uid, target);
      return;
    }
    if (game.selectedAttacker) {
      const uid = game.selectedAttacker;
      clearSelection();
      hooks.onAttack(uid, target);
    }
  }

  function onHeroClick(who) {
    onTarget({ kind: 'hero', who });
  }

  function onKey(event) {
    const game = getGame();
    if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      hooks.onStart();
      return;
    }
    if (event.key === 'n' || event.key === 'N') { hooks.onNewGame(); return; }
    if (event.key === 'm' || event.key === 'M') { hooks.onMute(); return; }
    if (game.phase !== 'play' || game.active !== 'player') return;
    if (event.key === 'Escape') { clearSelection(); hooks.onRender(); return; }
    if (event.key === 'e' || event.key === 'E') { hooks.onEndTurn(); return; }
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= 9) {
      const card = game.player.hand[digit - 1];
      if (card) onHandCard(card.uid);
    }
  }

  document.addEventListener('keydown', onKey);

  return {
    input,
    clearSelection,
    handlers: { onHandCard, onAttacker, onTarget, onHeroClick },
  };
}
