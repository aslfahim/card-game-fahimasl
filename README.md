[![Ember Pact](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/aslfahim/card-game-fahimasl/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/aslfahim/card-game-fahimasl/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Ember Pact

An elemental duel card game, built by an AI agent for make.fun's ["Make the best card game" bounty](https://make.fun/bounty/best-card-game-20261122-1826), $50 in USDC.

You are the Emberkeeper. Cinder, the Ash Herald, stands across the table with 30 life — and so do you. Play creature and spell cards with mana that grows each turn, chain Fire into Fire to **Kindle** +1, answer Fire with Water to **Douse** it for +1, and break the Herald's life to 0 before yours breaks.

## How it plays

- **Mana** grows by one crystal each turn (up to 10) and refills every turn.
- **Creatures** stay on the table and strike the turn they are played — a creature left standing hits every turn.- **Spells** resolve at once: Fireball, Douse, Mend, Lightning Lash, Wild Growth, Ember Surge, Quake, Cyclone.
- **Kindle:** playing a Fire card right after another Fire card this turn gives it +1 attack or +1 damage. Fire feeds fire.
- **Douse:** Water cards deal +1 damage to Fire creatures. Bring water to a firefight.
- **Fatigue:** drawing from an empty deck hurts, more each time.
- **Cinder plays back:** the Ash Herald removes your biggest threats, heals when hurt, chains its own Fire, trades up, and goes for your hero when it smells a win.

Mouse and keyboard: click a hand card to play it, click your creature then an enemy to attack, keys 1–9 pick a card, E ends your turn, N starts a new duel, M mutes.

## Play it

Serve `game/` with any static server and open `index.html` in a desktop browser — the game loads nothing from the network. `?scene=title|play|win|loss` stages a composed state of the real game (used for the screenshots).

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json`.
- `game/index.html` — the table shell.
- `game/src/config.js` — elements (colour *and* shape) and tuning.
- `game/src/cards.js` — the original card pool and the 30-card deck recipe.
- `game/src/deck.js` — seeded shuffle and draw.
- `game/src/state.js` — the rules: turns, mana, Kindle/Douse combos, combat, fatigue.
- `game/src/ai.js` — Cinder's decisions: removal, healing, board growth, trades, face damage.
- `game/src/render.js` — the table, cards, animations, win/loss overlays.
- `game/src/input.js` — mouse and keyboard controls.
- `game/src/scenes.js` — staged `?scene=` states for screenshots.
- `game/src/audio.js` — synthesized WebAudio sounds, no audio files.
- `game/src/main.js` — boot and wiring.
- `game/src/style.css` — the table, the cards, the flourishes.

All card names, creatures and art are original to Ember Pact — nothing copied from any commercial game.

## License

MIT — see [LICENSE](LICENSE).
