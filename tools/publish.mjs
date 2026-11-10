#!/usr/bin/env node
// tools/publish.mjs — copy the libraries' records from this laptop into the repository, for the live page: every night
// record and credit-step record, the state (the library and how each pattern was built), and a summary the page reads.
// It is run by hand at build time, never by the night (nothing goes outward at night). It copies; it decides nothing.
//   node tools/publish.mjs <path to CUADv1.json> [--cord <path to cord-v2-ground-truth.jsonl>]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { userInfo } from 'node:os';
import { fileURLToPath } from 'node:url';
import C from './cuad.mjs';
import C2 from './cord.mjs';

const HOME = userInfo().homedir;
const FROM = join(HOME, '.si-didy', 'patterns', 'libraries');
const DATA = fileURLToPath(new URL('../data/', import.meta.url));
const args = process.argv.slice(2);
const src = args[0] && !args[0].startsWith('--') ? args[0] : null;
const ci = args.indexOf('--cord'), cord = ci >= 0 ? args[ci + 1] : null;
if (!src) { console.error('usage: publish.mjs <CUADv1.json> [--cord <cord-v2-ground-truth.jsonl>]'); process.exit(2); }

let creditCalls = 0;
try { creditCalls = readFileSync(join(HOME, '.si-didy', 'oauth', 'ledger.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.kind === 'reserve').length; } catch { /* no call yet */ }

/** copy one library's records; return its night records in order */
function copy(id) {
  const to = join(DATA, id);
  mkdirSync(join(to, 'nights'), { recursive: true });
  const nights = readdirSync(join(FROM, id, 'nights')).filter((f) => /^(cycle|teach)-\d+\.json$/.test(f));
  for (const f of nights) copyFileSync(join(FROM, id, 'nights', f), join(to, 'nights', f));
  copyFileSync(join(FROM, id, 'state.json'), join(to, 'state.json'));
  return nights.filter((f) => f.startsWith('cycle-')).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])).map((f) => JSON.parse(readFileSync(join(to, 'nights', f), 'utf8')));
}
const point = (r) => ({ cycle: r.cycle, at: r.at, patterns: r.patterns, coverage: r.meter.after ? r.meter.after.coverage : r.meter.coverage, precision: r.meter.after ? r.meter.after.precision : r.meter.precision, answered: r.meter.after ? r.meter.after.answered : r.meter.answered, cases: r.meter.after ? r.meter.after.cases : r.meter.cases });
const corpus = (list) => { const chars = list.reduce((n, d) => n + d.text.length, 0); return { docs: list.length, chars, avgChars: Math.round(chars / list.length) }; };

// library 1, document extraction
const recs = copy('doc');
let checks = null;
try { checks = JSON.parse(readFileSync(join(FROM, 'build', 'checks.json'), 'utf8')).checks.length; } catch { /* not built yet */ }
const summary = { latest: 'nights/cycle-' + recs[recs.length - 1].cycle + '.json', series: recs.map(point), corpus: corpus(C.load(src)), creditCalls, checks };
writeFileSync(join(DATA, 'doc', 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log('doc: published ' + recs.length + ' night(s); latest ' + summary.latest + '; ' + creditCalls + ' credit call(s)');

// library 2, receipt reading (finance)
if (cord) {
  const frecs = copy('finance');
  const last = frecs[frecs.length - 1];
  const fsum = { latest: 'nights/cycle-' + last.cycle + '.json', series: frecs.map((r) => ({ ...point(r), check: r.meter.check || null })), corpus: corpus(C2.load(cord)), r0: last.r0, parts: last.meter.check ? last.meter.check.parts : [], creditCalls };
  writeFileSync(join(DATA, 'finance', 'summary.json'), JSON.stringify(fsum, null, 1) + '\n');
  console.log('finance: published ' + frecs.length + ' night(s); latest ' + fsum.latest);
}
if (!existsSync(join(DATA, 'doc', 'summary.json'))) process.exit(1);
