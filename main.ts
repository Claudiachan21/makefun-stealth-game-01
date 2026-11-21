// The Quiet Gallery — a top-down stealth game for make.fun (Node 22, stdlib only).
// The game is plain static files under game/ (index.html plus its ES modules,
// no library, no network request). The screenshots ship as base64 text
// (screenshots/*.jpg.b64) so the repository stays text-only — push-files
// refuses binary files — and are decoded back to JPEG here. This program
// hands the entry in: it copies game/ from beside this file to /output,
// decodes the screenshots to /output/screenshots/, and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library (vendor/makefun-game.ts, unchanged from the kit).
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// Decode the screenshots: each *.jpg.b64 in screenshots/ becomes a real JPEG.
const shotsOut = join(out, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
for (const name of readdirSync(join(here, 'screenshots')).sort()) {
  if (!name.endsWith('.jpg.b64')) continue;
  const bytes = Buffer.from(readFileSync(join(here, 'screenshots', name), 'utf8').replace(/\s+/g, ''), 'base64');
  writeFileSync(join(shotsOut, name.slice(0, -4)), bytes);
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files in all).
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
