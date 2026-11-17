// Emberkeep entry program (Node 22, stdlib only, no network).
// Copies game/ and screenshots/ into the output directory and writes the
// dossier buildDossier derives from them, so the grader sees exactly what
// buildDossier writes. Output dir: $MAKEFUN_OUTPUT_DIR, else /output.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUT = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

function copyTree(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, name.name);
    const to = join(dst, name.name);
    if (name.isDirectory()) copyTree(from, to);
    else if (name.isFile()) cpSync(from, to);
    else throw new Error(`refusing non-file entry: ${from}`);
  }
}

function countFiles(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(join(dir, e.name)) : 1;
  }
  return n;
}

function main() {
  const gameSrc = join(ROOT, 'game');
  const shotsSrc = join(ROOT, 'screenshots');
  if (!existsSync(gameSrc)) throw new Error('game/ is missing from the repository');
  if (!existsSync(shotsSrc)) throw new Error('screenshots/ is missing from the repository');
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  copyTree(gameSrc, join(OUT, 'game'));
  copyTree(shotsSrc, join(OUT, 'screenshots'));
  const dossier = buildDossier(OUT, CAPS);
  writeFileSync(join(OUT, 'dossier.json'), dossier);
  const nGame = countFiles(join(OUT, 'game'));
  const nShots = readdirSync(join(OUT, 'screenshots')).length;
  console.log(`wrote ${OUT}/dossier.json (${dossier.length} bytes): ${nGame} game files, ${nShots} screenshots`);
}

main();
