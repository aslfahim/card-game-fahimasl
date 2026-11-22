// Ember Pact — hand-in program (Node 22, standard library only).
//
// What this program does, in three steps:
//   1. Work out where the entry lives (this file's folder) and where the
//      hand-in goes: /output inside the grader, or $MAKEFUN_OUTPUT_DIR
//      anywhere else, so the same file runs locally for a check.
//   2. Copy the playable game (game/) and its screenshots (screenshots/)
//      into that output folder, exactly as they sit in the repository.
//   3. Ask the vendored make.fun library to summarise the whole hand-in
//      as dossier.json, the document the judge reads. The summary is
//      rebuilt from the same files by the gate, so the two must agree.
//
// The game itself is plain static files: game/index.html plus its ES
// modules under game/src, no library, no network request at all.
// To play it locally: serve game/ (any static server) and open it in a
// desktop browser. To check this program: MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Folder holding this file — the repository root for this entry.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader hands us /output; local runs use the environment override.
const handInDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function copyEntry() {
  mkdirSync(handInDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(handInDir, 'game'), { recursive: true });
  const shots = join(repoRoot, 'screenshots');
  if (existsSync(shots)) {
    cpSync(shots, join(handInDir, 'screenshots'), { recursive: true });
  }
}

// Caps the scorer enforces: keep the dossier text under 160 KiB, at most
// four screenshots of at most 256 KiB each, and the game under 993 files
// and 48 MiB in total. buildDossier throws if any cap is breached.
function writeSummary() {
  const summary = buildDossier(handInDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(handInDir, 'dossier.json'), summary);
}

copyEntry();
writeSummary();
