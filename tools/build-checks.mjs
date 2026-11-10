#!/usr/bin/env node
// tools/build-checks.mjs — B2: Kar's own build checks (every "CHECK:" lesson in the build retrospectives, with the build
// and date it came from, near-duplicates merged) into a local file, and a plain lookup over them. Local only: the
// retrospectives cite private work, so this file never goes into the repository.
//   node tools/build-checks.mjs            refresh ~/.si-didy/patterns/libraries/build/checks.json
//   node tools/build-checks.mjs --ask "..." the five checks that share the most words with the question
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { userInfo } from 'node:os';
import B from '../src/build.mjs';

const HOME = userInfo().homedir;
const MD = join(HOME, '.claude', 'projects', 'C--Users-sjgan--claude', 'memory', 'build-retrospectives.md');
const OUT = join(HOME, '.si-didy', 'patterns', 'libraries', 'build');
const ai = process.argv.indexOf('--ask');
if (ai >= 0) {
  const checks = JSON.parse(readFileSync(join(OUT, 'checks.json'), 'utf8')).checks;
  for (const c of B.lookup(checks, process.argv[ai + 1] || '', 5)) console.log('· ' + c.text + '  (' + c.build + (c.date ? ', ' + c.date : '') + ')');
} else {
  const checks = B.checksOf(readFileSync(MD, 'utf8'));
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'checks.json'), JSON.stringify({ at: new Date().toISOString(), from: 'build-retrospectives.md', checks }, null, 1));
  console.log('build checks: ' + checks.length + ' kept (near-duplicates merged) in ' + join(OUT, 'checks.json'));
}
