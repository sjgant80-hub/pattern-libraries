#!/usr/bin/env node
// tools/publish.mjs — copy the libraries' records from this laptop into the repository, for the live page: every night
// record and credit-step record, the state (the library and how each pattern was built), and a summary the page reads.
// It is run by hand at build time, never by the night (nothing goes outward at night). It copies; it decides nothing.
//   node tools/publish.mjs <path to CUADv1.json>
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { userInfo } from 'node:os';
import { fileURLToPath } from 'node:url';
import C from './cuad.mjs';

const HOME = userInfo().homedir;
const FROM = join(HOME, '.si-didy', 'patterns', 'libraries');
const TO = fileURLToPath(new URL('../data/doc/', import.meta.url));
const src = process.argv[2];
if (!src) { console.error('usage: publish.mjs <CUADv1.json>'); process.exit(2); }
mkdirSync(join(TO, 'nights'), { recursive: true });
const nights = readdirSync(join(FROM, 'doc', 'nights')).filter((f) => /^(cycle|teach)-\d+\.json$/.test(f));
for (const f of nights) copyFileSync(join(FROM, 'doc', 'nights', f), join(TO, 'nights', f));
copyFileSync(join(FROM, 'doc', 'state.json'), join(TO, 'state.json'));
const recs = nights.filter((f) => f.startsWith('cycle-')).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])).map((f) => JSON.parse(readFileSync(join(TO, 'nights', f), 'utf8')));
const docs = C.load(src);
const chars = docs.reduce((n, d) => n + d.text.length, 0);
let creditCalls = 0;
try { creditCalls = readFileSync(join(HOME, '.si-didy', 'oauth', 'ledger.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.kind === 'reserve').length; } catch { /* no call yet */ }
let checks = null;
try { checks = JSON.parse(readFileSync(join(FROM, 'build', 'checks.json'), 'utf8')).checks.length; } catch { /* not built yet */ }
const summary = {
  latest: 'nights/cycle-' + recs[recs.length - 1].cycle + '.json',
  series: recs.map((r) => ({ cycle: r.cycle, at: r.at, patterns: r.patterns, coverage: r.meter.after ? r.meter.after.coverage : r.meter.coverage, precision: r.meter.after ? r.meter.after.precision : r.meter.precision, answered: r.meter.after ? r.meter.after.answered : r.meter.answered, cases: r.meter.after ? r.meter.after.cases : r.meter.cases })),
  corpus: { docs: docs.length, chars, avgChars: Math.round(chars / docs.length) },
  creditCalls, checks,
};
writeFileSync(join(TO, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log('published ' + nights.length + ' record(s); latest ' + summary.latest + '; ' + creditCalls + ' credit call(s)');
