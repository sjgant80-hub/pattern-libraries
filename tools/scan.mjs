#!/usr/bin/env node
// pattern-libraries · tools/scan.mjs — W3 in CI: no tracked file holds a string shaped like an Anthropic key or a Claude
// subscription token. The live page is served from these same tracked files, so this covers it too. Exits 1 on any hit,
// naming the file, never the string. `count` is exported for the tests.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const SHAPES = [/sk-ant-[A-Za-z0-9_-]{16,}/g, /"accessToken"\s*:\s*"[^"]{16,}"/g, /CLAUDE_CODE_OAUTH_TOKEN\s*=\s*[A-Za-z0-9_-]{16,}/g];
export const count = (text) => SHAPES.reduce((n, re) => n + ((typeof text === 'string' ? text : '').match(re) || []).length, 0);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  let hits = 0;
  for (const f of files) { const n = count(readFileSync(f, 'latin1')); if (n) { console.error('::error::' + f + ' holds ' + n + ' key- or token-shaped string(s)'); hits += n; } }
  console.log(hits ? 'KEY-SHAPED STRINGS FOUND: ' + hits : 'no key- or token-shaped string in ' + files.length + ' tracked files');
  process.exit(hits ? 1 : 0);
}
