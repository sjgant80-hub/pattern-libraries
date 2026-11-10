// pattern-libraries · src/night.mjs — ONE LIBRARY'S NIGHT, decided here and nowhere else. Sealed first: CLAIMS.md
// (SEAL 1, 1c6108e; P1-P5, X1-X3, B1, N1; SEAL 2, e28a504: library 2, F1-F3, R2-R3, N3). It makes no call of its own:
// the local model is handed in as ask(task, prompt), so the same function replays a recorded night byte for byte (X3,
// F3) with the recorded replies. nightOf(L) gives one library's night; library 1 (DOC) is bound as this module's own
// exports, and FINANCE is library 2.
//
//   1 SLICES    tonight's fresh held-out and final-exam batches (cycle n); none left → said plainly, nothing promoted
//   2 EXAM      the library as carried in, on tonight's final exam it never saw, signed by the baseline agreement (X1, F1)
//   3 FREE      zero-cost proposers first: the build-pattern recipe (words that worked for a sibling task), then the
//               miners (one word, two words); every proposal through the law's gate and the field gate (P1)
//   4 LOCAL 7B  only for tasks the free tiers kept nothing for tonight, at most max7b, rotated by the cycle (P2)
//   5 ASKS      the tasks still open after the 7B tried and nothing passed: the credit tier's only candidates, with the
//               wall's own evidence; the credit step is a separate process (P5)
//   6 METER     coverage and precision on the METER, never used to propose or gate (P4, X2, F2), signed the same way;
//               for a library with a check (finance), the check over its own answers on the meter (R2, R3)
//   7 RECORDS   how each kept pattern was built, for the build-pattern library (B1, P3)
import P from '../vendor/patlib/patlib.mjs';
import E from './extract.mjs';
import F from './finance.mjs';
import Y from './cycle.mjs';
import B from './build.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const str = (x) => (typeof x === 'string' ? x : '');

// free = which set of free proposers a night runs: 1 on library 1's night 0; 2 adds the coverage-first miner. A record
// written with set 2 or later says so, and its replay runs that set; a record without it was set 1.
// max7b: the two libraries share N1's six local-7B calls a night, three each (SEAL 2's disclosed change).
export const NIGHT = Object.freeze({ max7b: 3, clockMinutes: 25, numPredict: 160, library: 'doc', feed: 'cuad-v1', prompt: 'prompt-v1', free: 2 });
export const FIN_NIGHT = Object.freeze({ max7b: 3, clockMinutes: 25, numPredict: 160, library: 'finance', feed: 'cord-v2', prompt: 'prompt-v1', free: 2 });

/** the libraries: what each night needs to know about its library */
export const DOC = Object.freeze({ NIGHT, D: E, Y, name: 'document extraction', batches: 15 });
export const FINANCE = Object.freeze({ NIGHT: FIN_NIGHT, D: F, Y: Object.freeze({ ...Y, ...Y.cycleFor(F.DOMAIN) }), name: 'receipt reading', batches: 15, check: true });

const countBy = (list, key) => { const o = {}; for (const x of list) { const k = key(x); o[k] = (o[k] || 0) + 1; } return o; };

/** nightOf(L) → { freeProposals, night, line } for the library L */
export function nightOf(L) {
  const NT = L.NIGHT, D = L.D, C = L.Y;
  const prov = (source, model, at, trainN, recipe) => ({ source, model, proposedAt: at, feed: NT.feed, trainN, recipe });

  /** freeProposals(units, slices, records, at) → the recipe lookup, then the miners, for every task */
  function freeProposals(units, slices, records, at, set = NT.free) {
    const out = [];
    for (const task of D.TASKS) {
      const train = C.casesFor(units, slices.train, task, 'train');
      for (const r of C.recipe(records, task, D.typeOf(task))) out.push({ when: r.when, then: task, prov: prov('recipe', 'none', at, train.length, 'recipe from ' + r.from) });
      for (const r of P.mine(train, task, 3)) out.push({ ...r, prov: prov('mined', 'none', at, train.length, 'mine-1') });
      for (const r of C.minePairs(train, task, 2)) out.push({ ...r, prov: prov('mined', 'none', at, train.length, 'mine-2') });
      if (set === 2) for (const r of C.mineCover(train, task, 3)) out.push({ ...r, prov: prov('mined', 'none', at, train.length, 'mine-cover') });
    }
    return out;
  }

  /** night({ units, plan, cycle, library, records, at, ask, model, max7b, parts }) → { ok, record, state } */
  async function night(input) {
    const I = isObj(input) ? input : {};
    const at = str(I.at), cycle = Number.isInteger(I.cycle) ? Math.max(0, I.cycle) : 0;
    const units = isObj(I.units) ? I.units : {}, plan = isObj(I.plan) ? I.plan : {};
    const carried = arr(I.library).filter((r) => isObj(r) && P.validRule(r));
    const records = arr(I.records).filter(isObj);
    const max7b = Number.isInteger(I.max7b) && I.max7b >= 0 ? I.max7b : NT.max7b;
    const model = str(I.model) || null;
    const meterIds = arr(plan.meter);
    const free = I.free === 1 ? 1 : NT.free;
    const base = { kind: 'library-night', v: 1, library: NT.library, feed: NT.feed, cycle, at, model, ...(free === 1 ? {} : { free }) };
    // a library with a check measures it on the meter, with only the parts the rule's own test (R0) kept
    const check = (lib) => (L.check ? { parts: arr(I.parts), ...F.checkOn(lib, units, meterIds, arr(I.parts)) } : null);

    const slices = Y.slicesFor(plan, cycle);
    if (!slices) {
      const m = C.meter(carried, D.TASKS, units, meterIds);
      const c = check(carried);
      return { ok: false, code: 'exhausted', why: 'no fresh exam left: every batch has been an exam once; the library needs fresh data before it may promote again',
        record: { ...base, exhausted: true, promoted: [], dropped: [], meter: c ? { ...m, check: c } : m, patterns: carried.length }, state: { cycle, library: carried, records } };
    }

    // 2 · the library as carried in, on a final exam none of its patterns ever saw (X1)
    const examIn = C.examine(carried, D.TASKS, units, slices.final);
    const x1 = C.receipt(examIn, L.name + ', night ' + cycle);

    // 3 · the free tiers
    const freeProps = freeProposals(units, slices, records, at, free);
    const g1 = C.grow(units, slices, freeProps, carried);
    const keptFree = countBy(g1.promoted, (r) => r.then);

    // 4 · the local 7B, only where the free tiers kept nothing
    const tasks7b = typeof I.ask === 'function' ? B.order7b(D.TASKS, keptFree, cycle, max7b) : [];
    const replies = [], props7b = [];
    for (const task of tasks7b) {
      const train = C.casesFor(units, slices.train, task, 'train');
      const prompt = C.promptFor(task, train, cycle);
      let rep;
      try { rep = await I.ask(task, prompt); } catch (e) { rep = { ok: false, code: 'error', why: String((e && e.message) || e).slice(0, 200) }; }
      if (!isObj(rep)) rep = { ok: false, code: 'error', why: 'the model gave no reply object' };
      const text = rep.ok === true ? str(rep.text) : '';
      const mine = rep.ok === true ? C.proposalsOf(text, task) : [];
      for (const r of mine) props7b.push({ ...r, prov: prov('7b', model || 'unknown', at, train.length, NT.prompt + ' salt ' + cycle) });
      replies.push({ task, ok: rep.ok === true, code: rep.ok === true ? 'ok' : str(rep.code) || 'error', why: rep.ok === true ? '' : str(rep.why).slice(0, 200), text: text.slice(0, 2000), proposed: mine.length });
    }
    const g2 = C.grow(units, slices, props7b, g1.library);
    const tried7b = countBy(props7b, (r) => r.then), passed7b = countBy(g2.promoted, (r) => r.then);
    const dropped7b = {};
    for (const d of g2.dropped) { const t = d.rule.split('=>')[1]; (dropped7b[t] = dropped7b[t] || []).push(d.rule + ': ' + d.why); }

    // 5 · the credit tier's only candidates: open after the free tiers AND the 7B
    const ev = { keptFree, tried7b, passed7b, model, dropped7b };
    // (the counts are whole numbers from countBy: absent means none)
    const asks = tasks7b.filter((t) => !keptFree[t] && tried7b[t] && !passed7b[t])
      .map((task) => ({ task, evidence: B.evidenceOf(task, ev), prompt: C.promptFor(task, C.casesFor(units, slices.train, task, 'train'), cycle) }));

    // 6 · the METER, never used to propose or gate
    const lib = g2.library;
    const m = C.meter(lib, D.TASKS, units, meterIds);
    const mIn = C.meter(carried, D.TASKS, units, meterIds);
    const mReceipt = C.receipt(C.examine(lib, D.TASKS, units, meterIds), L.name + ', the meter after night ' + cycle);
    const c = check(lib);

    // 7 · how each kept pattern was built
    const cost = {};
    for (const r of replies) { cost[r.task] = cost[r.task] || {}; cost[r.task]['7b'] = { calls: 1, cents: 0 }; }
    const promoted = [...g1.promoted, ...g2.promoted];
    const built = B.recordsOf(promoted, { library: NT.library, cycle, at, typeOf: D.typeOf, cost });

    const record = {
      ...base,
      slices: { train: slices.train.length, held: slices.held, final: slices.final },
      carried: carried.length, exam: { total: examIn.total, receipt: x1 },
      proposed: { free: freeProps.length, '7b': props7b.length }, replies,
      proposals: [...freeProps, ...props7b].map((p) => ({ when: p.when, then: p.then, prov: p.prov })),
      promoted: promoted.map((r) => ({ rule: P.ruleKey(r), source: r.prov.source, recipe: r.prov.recipe, receipt: r.receipt, held: r.scores.held, final: r.scores.final, heldDocs: r.scores.heldDocs, finalDocs: r.scores.finalDocs })),
      dropped: [...g1.dropped, ...g2.dropped],
      keptFree, tried7b, passed7b, asks: asks.map((a) => ({ task: a.task, evidence: a.evidence })),
      meter: { before: { coverage: mIn.coverage, precision: mIn.precision, answered: mIn.answered, cases: mIn.cases }, after: { coverage: m.coverage, precision: m.precision, answered: m.answered, right: m.right, cases: m.cases, withGold: m.withGold }, per: m.per, receipt: mReceipt, ...(c ? { check: c } : {}) },
      patterns: lib.length, built: built.length,
    };
    return { ok: true, record, asks, state: { cycle: cycle + 1, library: lib, records: [...records, ...built] } };
  }

  /** line(record) → the morning line for one library's night */
  function line(rec) {
    if (!isObj(rec)) return L.name + ' library: no night recorded';
    const pct = (x) => (typeof x === 'number' ? (x * 100).toFixed(1) + '%' : 'n/a');
    if (rec.exhausted) return L.name + ' library: no fresh exam left (all ' + L.batches + ' batches spent), so nothing was promoted; it needs fresh data · ' + rec.patterns + ' patterns · coverage ' + pct(rec.meter && rec.meter.coverage);
    const why = {};
    for (const d of arr(rec.dropped)) { const k = str(d.why).split(':')[0]; why[k] = (why[k] || 0) + 1; }
    const top = Object.entries(why).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => n + ' ' + k).join(', ');
    const m = rec.meter || {}, x = rec.exam && rec.exam.receipt, k = m.check;
    return L.name + ' library, night ' + rec.cycle + ': ' + rec.patterns + ' patterns (' + arr(rec.promoted).length + ' kept tonight, ' + arr(rec.dropped).length + ' dropped: ' + (top || 'none') + ')'
      + ' · coverage on the meter ' + pct(m.before && m.before.coverage) + ' → ' + pct(m.after && m.after.coverage) + ', right ' + pct(m.after && m.after.precision) + ' when it answers'
      + (isObj(k) ? ' · the check: ' + k.reconciled + ' reconciled, ' + k.flagged + ' flagged, ' + k.unchecked + ' unchecked' : '')
      + ' · final exam: ' + (x && x.ok ? x.decision + ' (' + x.right + '/' + x.answered + ' vs the cheap baseline ' + x.baseRight + ')' : 'nothing carried in to examine')
      + ' · 7B ' + arr(rec.replies).length + ' calls · credit tier candidates: ' + (arr(rec.asks).map((a) => a.task).join(', ') || 'none');
  }

  return { freeProposals, night, line };
}

/** replayAsk(record) → an ask that answers from a recorded night, so night() re-derives it (X3) */
export function replayAsk(record) {
  const by = new Map(arr(isObj(record) ? record.replies : null).filter(isObj).map((r) => [r.task, r]));
  return async (task) => {
    const r = by.get(task);
    if (!r) return { ok: false, code: 'unrecorded', why: 'the recorded night did not ask about ' + task };
    return r.ok ? { ok: true, text: r.text } : { ok: false, code: r.code, why: r.why };
  };
}

// library 1, bound: the names every caller already uses
export const { freeProposals, night, line } = nightOf(DOC);

export default { NIGHT, FIN_NIGHT, DOC, FINANCE, nightOf, freeProposals, night, replayAsk, line };
