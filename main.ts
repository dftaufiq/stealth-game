// main.ts — Lanternkeep's entrypoint (Node 22, standard library only).
// The grader runs `node main.ts` twice and both runs must write the same
// bytes. It copies game/ and screenshots/ from beside this file into the
// output directory and writes /output/dossier.json with the vendored
// make.fun library, which the scorer re-runs to check byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the game locally with `node serve.ts`, then open
// http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Only create directories; never delete the output tree (the grader's
// /output is a bind mount, and removing it fails there).
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps from the kit's gate: only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; game/ over 993 entries or 48 MiB, or a
// path over 1000 bytes — game/ counts beside /output's own 1000-entry cap,
// its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
