#!/usr/bin/env node
// tools/rederive.mjs — X3 and F3: every committed night re-derives byte for byte from the pinned source and the recorded
// replies. Nights are replayed in order from an empty library; each night's credit step (if it ran) is replayed from
// its record too. Any difference is a failure. Library 2's nights also carry the rule's own test (R0), re-run here on
// all 1,000 receipts.
//   node tools/rederive.mjs <CUADv1.json> [--dir data/doc/nights] [--cord <cord-v2-ground-truth.jsonl>] [--fdir data/finance/nights]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import C from './cuad.mjs';
import C2 from './cord.mjs';
import Y from '../src/cycle.mjs';
import N from '../src/night.mjs';
import B from '../src/build.mjs';
import E from '../src/extract.mjs';
import F from '../src/finance.mjs';
import P from '../vendor/patlib/patlib.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const src = args.find((a, i) => !a.startsWith('--') && !['--dir', '--cord', '--fdir'].includes(args[i - 1]));
const DIR = opt('--dir') || fileURLToPath(new URL('../data/doc/nights', import.meta.url));
const CORD = opt('--cord'), FDIR = opt('--fdir') || fileURLToPath(new URL('../data/finance/nights', import.meta.url));
if (!src) { console.error('usage: rederive.mjs <CUADv1.json> [--dir <nights>] [--cord <cord-v2-ground-truth.jsonl>] [--fdir <nights>]'); process.exit(2); }
const RUNNER = ['source', 'why7b', 'dry', 'r0'];
const strip = (r) => { const o = { ...r }; for (const k of RUNNER) delete o[k]; return o; };
const nightsIn = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => /^cycle-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])) : []);

/** replay(L) → how many nights did NOT re-derive. L = { id, dir, units, plan, run (the library's night), Q (its cycle),
 *  typeOf, sourceOk(rec), extra(rec) → a problem or '', input(rec) → extra night inputs } */
async function replay(L) {
  const files = nightsIn(L.dir);
  if (!files.length) { console.error('::error::no committed nights in ' + L.dir); return 1; }
  let state = { cycle: 0, library: [], records: [] }, bad = 0;
  for (const f of files) {
    const rec = JSON.parse(readFileSync(join(L.dir, f), 'utf8'));
    if (rec.cycle !== state.cycle) { console.error('::error::' + f + ' is night ' + rec.cycle + ', but the replay is at night ' + state.cycle); return bad + 1; }
    if (!L.sourceOk(rec)) { console.error('::error::' + f + ' was not made from the pinned source'); bad++; }
    const problem = L.extra(rec);
    if (problem) { console.error('::error::' + f + ': ' + problem); bad++; }
    const r = await L.run.night({ units: L.units, plan: L.plan, cycle: rec.cycle, library: state.library, records: state.records, at: rec.at, ask: rec.model ? N.replayAsk(rec) : null, model: rec.model, free: rec.free || 1, ...L.input(rec) });   // no model that night: nothing was asked
    const same = JSON.stringify(r.record) === JSON.stringify(strip(rec));
    console.log((same ? 'same  ' : 'DIFFERENT ') + L.id + ' ' + f + ': ' + L.run.line(r.record));
    if (!same) bad++;
    if (r.ok) state = r.state;
    const tf = join(L.dir, 'teach-' + rec.cycle + '.json');
    if (existsSync(tf)) {
      const t = JSON.parse(readFileSync(tf, 'utf8'));
      const g = L.Q.grow(L.units, Y.slicesFor(L.plan, rec.cycle), t.proposals, state.library);
      const cost = {};
      for (const a of t.asked) cost[a.task] = { oauth: { calls: 1, cents: Number.isInteger(a.costCents) ? a.costCents : 0 } };
      const tsame = JSON.stringify(g.promoted.map((x) => P.ruleKey(x))) === JSON.stringify(t.promoted.map((x) => x.rule)) && JSON.stringify(g.dropped) === JSON.stringify(t.dropped);
      console.log((tsame ? 'same  ' : 'DIFFERENT ') + L.id + ' teach-' + rec.cycle + '.json: ' + g.promoted.length + ' kept, ' + g.dropped.length + ' dropped');
      if (!tsame) bad++;
      state = { ...state, library: g.library, records: [...state.records, ...B.recordsOf(g.promoted, { library: L.id, cycle: rec.cycle, at: t.at, typeOf: L.typeOf, cost })] };
    }
  }
  console.log(bad ? L.id + ': ' + bad + ' night(s) did NOT re-derive' : L.id + ': every committed night re-derived byte for byte (' + files.length + ')');
  return bad;
}

let bad = 0;
const docs = C.load(src);
bad += await replay({ id: 'doc', dir: DIR, units: C.units(docs), plan: Y.schedule(docs.map((d) => d.id)), run: N, Q: Y, typeOf: E.typeOf,
  sourceOk: (rec) => rec.source && rec.source.sha256 === C.SOURCE.sha256, extra: () => '', input: () => ({}) });

if (CORD) {
  const receipts = C2.load(CORD);   // refuses a file that is not the pinned one
  const ids = receipts.map((d) => d.id), units = C2.units(receipts);
  const r0 = F.ruleTest(units, ids), parts = F.partsOf(r0);
  console.log('finance R0, the rule on the experts\' own values: ' + F.PARTS.map((k) => k + ' held on ' + r0[k].held + ' of ' + r0[k].ran).join(', ') + ' · kept parts: ' + (parts.join(', ') || 'none'));
  bad += await replay({ id: 'finance', dir: FDIR, units, plan: Y.schedule(ids, F.SCHEDULE), run: N.nightOf(N.FINANCE), Q: N.FINANCE.Y, typeOf: F.typeOf,
    sourceOk: (rec) => rec.source && rec.source.sha256 === C2.SOURCE.sha256,
    extra: (rec) => (JSON.stringify(rec.r0) === JSON.stringify(r0) ? '' : 'its R0 is not the one re-run here'),
    input: () => ({ parts }) });
}
console.log(bad ? bad + ' night(s) did NOT re-derive' : 'every committed night re-derived byte for byte');
process.exit(bad ? 1 : 0);
