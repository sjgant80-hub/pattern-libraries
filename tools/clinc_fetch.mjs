#!/usr/bin/env node
// tools/clinc_fetch.mjs — fetch CLINC150's three files (github.com/clinc/oos-eval, CC BY 3.0) at the pinned commit into
// <dir> (flat), and fail unless each file's sha256 is the pinned one (SEAL 8).   node tools/clinc_fetch.mjs <dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import C from './clinc.mjs';

const dir = process.argv[2];
if (!dir) { console.error('usage: clinc_fetch.mjs <dir>'); process.exit(2); }
mkdirSync(dir, { recursive: true });
let bad = 0;
for (const [f, want] of Object.entries(C.SOURCE.files)) {
  const r = await fetch('https://raw.githubusercontent.com/clinc/oos-eval/' + C.SOURCE.commit + '/' + f);
  if (!r.ok) { console.error('::error::' + f + ': HTTP ' + r.status); process.exit(1); }
  const b = Buffer.from(await r.arrayBuffer()), got = createHash('sha256').update(b).digest('hex');
  writeFileSync(join(dir, f.split('/').pop()), b);
  console.log(f + ' ' + b.length + ' bytes sha256 ' + got + (got === want ? '' : '  NOT THE PINNED FILE'));
  if (got !== want) bad++;
}
if (bad) { console.error('::error::' + bad + ' file(s) are not the pinned ones'); process.exit(1); }
