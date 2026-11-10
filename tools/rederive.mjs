#!/usr/bin/env node
// tools/rederive.mjs — X3: every committed night re-derives byte for byte from the pinned CUAD file and the recorded
// replies. Nights are replayed in order from an empty library; each night's credit step (if it ran) is replayed from
// its record too. Any difference is a failure.
//   node tools/rederive.mjs <path to CUADv1.json> [--dir data/doc/nights]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import C from './cuad.mjs';
import Y from '../src/cycle.mjs';
import N from '../src/night.mjs';
import B from '../src/build.mjs';
import E from '../src/extract.mjs';
import P from '../vendor/patlib/patlib.mjs';

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
const di = args.indexOf('--dir');
const DIR = di >= 0 ? args[di + 1] : fileURLToPath(new URL('../data/doc/nights', import.meta.url));
if (!src) { console.error('usage: rederive.mjs <CUADv1.json> [--dir <nights>]'); process.exit(2); }
const RUNNER = ['source', 'why7b', 'dry'];
const strip = (r) => { const o = { ...r }; for (const k of RUNNER) delete o[k]; return o; };

const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => /^cycle-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])) : [];
if (!files.length) { console.error('no committed nights in ' + DIR); process.exit(1); }
const docs = C.load(src);
const plan = Y.schedule(docs.map((d) => d.id));
const units = C.units(docs);
let state = { cycle: 0, library: [], records: [] }, bad = 0;
for (const f of files) {
  const rec = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  if (rec.cycle !== state.cycle) { console.error('::error::' + f + ' is night ' + rec.cycle + ', but the replay is at night ' + state.cycle); process.exit(1); }
  if (!rec.source || rec.source.sha256 !== C.SOURCE.sha256) { console.error('::error::' + f + ' was not made from the pinned data.zip'); bad++; }
  const r = await N.night({ units, plan, cycle: rec.cycle, library: state.library, records: state.records, at: rec.at, ask: rec.model ? N.replayAsk(rec) : null, model: rec.model, free: rec.free || 1 });   // no model that night: nothing was asked
  const same = JSON.stringify(r.record) === JSON.stringify(strip(rec));
  console.log((same ? 'same  ' : 'DIFFERENT ') + f + ': ' + N.line(r.record));
  if (!same) bad++;
  if (r.ok) state = r.state;
  const tf = join(DIR, 'teach-' + rec.cycle + '.json');
  if (existsSync(tf)) {
    const t = JSON.parse(readFileSync(tf, 'utf8'));
    const g = Y.grow(units, Y.slicesFor(plan, rec.cycle), t.proposals, state.library);
    const cost = {};
    for (const a of t.asked) cost[a.task] = { oauth: { calls: 1, cents: Number.isInteger(a.costCents) ? a.costCents : 0 } };
    const tsame = JSON.stringify(g.promoted.map((x) => P.ruleKey(x))) === JSON.stringify(t.promoted.map((x) => x.rule)) && JSON.stringify(g.dropped) === JSON.stringify(t.dropped);
    console.log((tsame ? 'same  ' : 'DIFFERENT ') + 'teach-' + rec.cycle + '.json: ' + g.promoted.length + ' kept, ' + g.dropped.length + ' dropped');
    if (!tsame) bad++;
    state = { ...state, library: g.library, records: [...state.records, ...B.recordsOf(g.promoted, { library: 'doc', cycle: rec.cycle, at: t.at, typeOf: E.typeOf, cost })] };
  }
}
console.log(bad ? bad + ' night(s) did NOT re-derive' : 'every committed night re-derived byte for byte (' + files.length + ')');
process.exit(bad ? 1 : 0);
