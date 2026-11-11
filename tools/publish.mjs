#!/usr/bin/env node
// tools/publish.mjs — copy the libraries' records from this laptop into the repository, for the live page: every night
// record and credit-step record, the state (the library and how each pattern was built), and a summary the page reads.
// It is run by hand at build time, never by the night (nothing goes outward at night). It copies; it decides nothing.
//   node tools/publish.mjs <path to CUADv1.json> [--cord <path to cord-v2-ground-truth.jsonl>] [--polyai <dir>]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { userInfo } from 'node:os';
import { fileURLToPath } from 'node:url';
import C from './cuad.mjs';
import C2 from './cord.mjs';
import PA from './polyai.mjs';

const HOME = userInfo().homedir;
const FROM = join(HOME, '.si-didy', 'patterns', 'libraries');
const DATA = fileURLToPath(new URL('../data/', import.meta.url));
const args = process.argv.slice(2);
const src = args[0] && !args[0].startsWith('--') ? args[0] : null;
const ci = args.indexOf('--cord'), cord = ci >= 0 ? args[ci + 1] : null;
const pi = args.indexOf('--polyai'), poly = pi >= 0 ? args[pi + 1] : null;
if (!src) { console.error('usage: publish.mjs <CUADv1.json> [--cord <cord-v2-ground-truth.jsonl>] [--polyai <dir>]'); process.exit(2); }

let creditCalls = 0;
try { creditCalls = readFileSync(join(HOME, '.si-didy', 'oauth', 'ledger.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.kind === 'reserve').length; } catch { /* no call yet */ }

const byCycle = (a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]);
/** copy one library's records, and its void/ nights (seal 4) when it has them; return its live night records in order */
function copy(id) {
  const to = join(DATA, id);
  mkdirSync(join(to, 'nights'), { recursive: true });
  const nights = readdirSync(join(FROM, id, 'nights')).filter((f) => /^(cycle|teach)-\d+\.json$/.test(f));
  for (const f of nights) copyFileSync(join(FROM, id, 'nights', f), join(to, 'nights', f));
  copyFileSync(join(FROM, id, 'state.json'), join(to, 'state.json'));
  if (existsSync(join(FROM, id, 'void'))) {
    mkdirSync(join(to, 'void'), { recursive: true });
    for (const f of readdirSync(join(FROM, id, 'void')).filter((x) => /^cycle-\d+\.json$/.test(x))) copyFileSync(join(FROM, id, 'void', f), join(to, 'void', f));
  }
  return nights.filter((f) => f.startsWith('cycle-')).sort(byCycle).map((f) => JSON.parse(readFileSync(join(to, 'nights', f), 'utf8')));
}
/** the void nights of a library, as the summary lists them */
const voids = (id) => (existsSync(join(DATA, id, 'void')) ? readdirSync(join(DATA, id, 'void')).filter((f) => /^cycle-\d+\.json$/.test(f)).sort(byCycle)
  .map((f) => { const r = JSON.parse(readFileSync(join(DATA, id, 'void', f), 'utf8')); return { file: 'void/' + f, ...point(r), check: r.meter.check || null }; }) : []);
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
  const fsum = { latest: 'nights/cycle-' + last.cycle + '.json', series: frecs.map((r) => ({ ...point(r), check: r.meter.check || null })), corpus: corpus(C2.load(cord)), r0: last.r0, parts: last.meter.check ? last.meter.check.parts : [], creditCalls, void: voids('finance') };
  writeFileSync(join(DATA, 'finance', 'summary.json'), JSON.stringify(fsum, null, 1) + '\n');
  console.log('finance: published ' + frecs.length + ' night(s); latest ' + fsum.latest + '; ' + fsum.void.length + ' void');
}

// library 3, triage and routing: two night libraries
if (poly) {
  const q = PA.load(poly);
  for (const [id, docs] of [['route', q.routes], ['triage', q.triage]]) {
    const recs3 = copy(id), last = recs3[recs3.length - 1];
    const sum = { latest: 'nights/cycle-' + last.cycle + '.json', series: recs3.map((r) => ({ ...point(r), check: r.meter.check || null })), corpus: corpus(docs), void: voids(id) };
    writeFileSync(join(DATA, id, 'summary.json'), JSON.stringify(sum, null, 1) + '\n');
    console.log(id + ': published ' + recs3.length + ' night(s); latest ' + sum.latest + '; ' + sum.void.length + ' void');
  }
}
if (!existsSync(join(DATA, 'doc', 'summary.json'))) process.exit(1);
