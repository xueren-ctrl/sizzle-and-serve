// Sizzle & Serve: the hand-in program.
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with make.fun's buildDossier,
// the same bytes the gate rebuilds from the hand-in. It runs on Node 22
// with the standard library only: no install, no build step, no network.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

/** The repository root: the directory this file sits in. */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));

/** Where the hand-in goes: the grader's /output, or the override. */
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`handed in: ${outputDir}`);
