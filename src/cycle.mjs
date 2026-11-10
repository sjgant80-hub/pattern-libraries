// pattern-libraries · src/cycle.mjs — ONE NIGHT'S GROWTH, for any library whose cases are units in documents. Sealed
// first: CLAIMS.md (SEAL 1, 1c6108e). Pure and total: no clock, no disk, no network, no model.
//
//   schedule(ids)          the fixed order and the fixed slices: the METER (never proposes, never gates), the seed
//                          training set, and the batches; cycle n's held-out and final exam are batches 2n and 2n+1
//   slicesFor(plan, n)     cycle n's train / held / final documents, or null when no fresh exam is left
//   casesFor(units, ids, task, slice)  the law's cases for one task over some documents
//   fieldGate(rule, task, units, ids, bar)  the second gate: on the documents where the rule fires, its first firing
//                          unit must be right often enough AND beat the cheap baseline on those same documents
//   admit(p, ctx)          the law's own gate (vendor/patlib, unchanged) on the cycle's fresh slices, then the field gate
//                          on the held-out batch and on the final exam
//   grow(ctx, proposals, library)  every proposal admitted or dropped, in turn, against the growing library
//   examine(library, task list, units, ids)  per task: what the library answered, how often right, and the baseline on
//                          the same documents
//   meter(...)             coverage and precision on the METER (P4, X2)
//   receipt(exam)          the night's exam judged and signed by mint-a-department's baseline agreement (X1)
//   minePairs(cases, task, k)  a second deterministic proposer: two words that, together, pick out the task
//   recipe(records, task, type)  the build-pattern lookup: words that worked for another task of the same kind (P3)
import P from '../vendor/patlib/patlib.mjs';
import { agreement, outcome } from '../vendor/mint/src/baseline.mjs';
import E from './extract.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const str = (x) => (typeof x === 'string' ? x : '');
const round6 = (x) => Math.round(x * 1e6) / 1e6;
// a tie in the hash is broken by code-point order (never the locale's), between two different ids
const first = (a, b) => ([a, b].sort()[0] === a ? -1 : 1);

export const SCHEDULE = Object.freeze({ meter: 60, seed: 150, batch: 20, salt: 'cuad:' });
export const FIELD_GATE = Object.freeze({
  held: Object.freeze({ docs: 3, prec: 0.8, margin: 0.1 }),
  final: Object.freeze({ docs: 3, prec: 0.8, margin: 0.1 }),
});
export const EXAM = Object.freeze({ minImprovement: 0.1, zCrit: 1.96, alpha: 0.05, minSample: 20 });
export const METER_BAR = 0.75;

/** schedule(ids, s) → the fixed order (FNV-1a of salt + id, then the id) and its slices */
export function schedule(ids, s = SCHEDULE) {
  const S = isObj(s) ? s : SCHEDULE;
  const order = [...new Set(arr(ids).filter((x) => typeof x === 'string' && x))]
    .sort((a, b) => P.fnv(S.salt + a) - P.fnv(S.salt + b) || first(a, b));
  const meter = order.slice(0, S.meter), seed = order.slice(S.meter, S.meter + S.seed), rest = order.slice(S.meter + S.seed);
  const batches = [];
  for (let i = 0; i + S.batch <= rest.length; i += S.batch) batches.push(rest.slice(i, i + S.batch));
  return { order, meter, seed, batches, spare: rest.slice(batches.length * S.batch) };
}

/** slicesFor(plan, n) → { cycle, train, held, final } for cycle n, or null when its two batches do not exist */
export function slicesFor(plan, n) {
  if (!isObj(plan) || !Number.isInteger(n) || n < 0) return null;
  const b = arr(plan.batches);
  if (2 * n + 1 >= b.length) return null;
  return { cycle: n, train: [...arr(plan.seed), ...b.slice(0, 2 * n).flat()], held: arr(b[2 * n]), final: arr(b[2 * n + 1]) };
}

/** casesFor(units, ids, task, slice) → the law's cases (label = the task when right, 'other' when not) */
export function casesFor(units, ids, task, slice) {
  const out = [];
  if (!isObj(units)) return out;
  for (const id of arr(ids)) {
    const u = isObj(units[id]) ? arr(units[id][task]) : [];
    for (const x of u) if (isObj(x)) out.push(E.isCaseFor(x, task) ? x : E.asCase(x, task, slice));
  }
  return out;
}

/** docRight(task, units) → is this unit right? (a unit carries its own verdict from the experts' annotation) */
const ok = (u) => isObj(u) && u.right === true;

/** fieldGate(rule, task, units, ids, bar) → { ok, docs, rightRate, baseRate, why } */
export function fieldGate(rule, task, units, ids, bar) {
  const B = isObj(bar) ? bar : FIELD_GATE.held;
  let docs = 0, right = 0, base = 0;
  for (const id of arr(ids)) {
    const u = isObj(units) && isObj(units[id]) ? arr(units[id][task]) : [];
    const hit = u.find((x) => isObj(x) && P.fires(rule, x));
    if (!hit) continue;
    docs++;
    if (ok(hit)) right++;
    if (ok(E.baseline(task, u))) base++;
  }
  const rightRate = docs ? right / docs : 0, baseRate = docs ? base / docs : 0;
  const res = { docs, right, base, rightRate: round6(rightRate), baseRate: round6(baseRate) };
  // the bars in whole thousandths, so a rate exactly on the sealed bar passes (0.1 × 30 is not 3 in floating point)
  const prec = Math.round(B.prec * 1000), margin = Math.round(B.margin * 1000);
  if (docs < B.docs) return { ok: false, ...res, why: 'decides ' + docs + ' documents, needs ' + B.docs };
  if (right * 1000 < prec * docs) return { ok: false, ...res, why: 'right in ' + right + ' of ' + docs + ' documents, needs ' + B.prec };
  if ((right - base) * 1000 < margin * docs) return { ok: false, ...res, why: 'beats the cheap baseline by ' + (rightRate - baseRate).toFixed(3) + ' on those documents, needs ' + B.margin };
  return { ok: true, ...res, why: '' };
}

/** context for one cycle: the units of every document, and the cycle's slices */
export function contextFor(units, slices, task) {
  return {
    task,
    slices: { train: casesFor(units, slices.train, task, 'train'), held: casesFor(units, slices.held, task, 'held'), final: casesFor(units, slices.final, task, 'final') },
  };
}

/** admit(p, units, slices, library, cache) → { ok, why, receipt?, scores? }: the law's gate first, then the field gate */
export function admit(p, units, slices, library, cache) {
  if (!P.validRule(p)) return { ok: false, why: 'not a rule: WHEN token [AND token] THEN label' };
  if (!E.TASKS.includes(p.then)) return { ok: false, why: 'no such task: ' + str(p.then) };
  if (!isObj(slices)) return { ok: false, why: 'no slices for this cycle' };
  const c = isObj(cache) ? cache : {};
  const ctx = c[p.then] || (c[p.then] = contextFor(units, slices, p.then));
  const lib = arr(library).filter((r) => isObj(r) && r.then === p.then);
  const g = P.gate(p, ctx.slices, lib);
  if (!g.ok) return { ok: false, why: g.why };
  const h = fieldGate(p, p.then, units, slices.held, FIELD_GATE.held);
  if (!h.ok) return { ok: false, why: 'held-out documents: ' + h.why };
  const f = fieldGate(p, p.then, units, slices.final, FIELD_GATE.final);
  if (!f.ok) return { ok: false, why: 'final-exam documents: ' + f.why };
  return { ok: true, why: 'kept', receipt: g.receipt, scores: { ...g.scores, heldDocs: h, finalDocs: f } };
}

/** grow(units, slices, proposals, library) → { promoted, dropped, library }: each proposal in turn, against the growing library */
export function grow(units, slices, proposals, library) {
  const lib = arr(library).filter((r) => isObj(r) && P.validRule(r)).slice();
  const promoted = [], dropped = [], cache = {};
  for (const p of arr(proposals)) {
    const a = admit(p, units, slices, lib, cache);
    if (a.ok) { const r = { when: p.when.slice(), then: p.then, prov: p.prov, receipt: a.receipt, scores: a.scores }; lib.push(r); promoted.push(r); }
    else dropped.push({ rule: isObj(p) ? P.ruleKey(p) : String(p), source: isObj(p) && isObj(p.prov) ? str(p.prov.source) : '', why: a.why });
  }
  return { promoted, dropped, library: lib };
}

/** examine(library, tasks, units, ids) → per task and in total: cases, answered, right, and the cheap baseline's right on the answered ones */
export function examine(library, tasks, units, ids) {
  const per = {};
  const tot = { cases: 0, answered: 0, right: 0, baseRight: 0, withGold: 0 };
  for (const task of arr(tasks)) {
    const t = { cases: 0, answered: 0, right: 0, baseRight: 0, withGold: 0 };
    for (const id of arr(ids)) {
      const u = isObj(units) && isObj(units[id]) ? arr(units[id][task]) : [];
      t.cases++;
      if (u.some(ok)) t.withGold++;
      const p = E.pick(library, task, u);
      if (!p) continue;
      t.answered++;
      if (ok(p.unit)) t.right++;
      if (ok(E.baseline(task, u))) t.baseRight++;
    }
    per[task] = t;
    for (const k of Object.keys(tot)) tot[k] += t[k];
  }
  return { per, total: tot };
}

/** meter(library, tasks, units, meterIds) → coverage (answered / cases) and precision (right / answered) */
export function meter(library, tasks, units, meterIds) {
  const e = examine(library, tasks, units, meterIds);
  const t = e.total;
  return { ...t, coverage: t.cases ? round6(t.answered / t.cases) : 0, precision: t.answered ? round6(t.right / t.answered) : null, per: e.per };
}

/** receipt(exam, job) → the night's final exam, judged and signed by the baseline agreement: the library's answers
 *  against the cheap baseline's on the same cases (X1). Too few answered cases is INSUFFICIENT, never a pass. */
export function receipt(exam, job) {
  const t = isObj(exam) && isObj(exam.total) ? exam.total : null;
  if (!t || !Number.isInteger(t.answered)) return { ok: false, why: 'an exam with totals' };
  const n = t.answered;
  if (n === 0) return { ok: false, answered: 0, decision: 'INSUFFICIENT', why: 'the library answered none of these cases, so there is nothing to judge' };
  const baseRate = t.baseRight / n;
  const a = agreement({ job: str(job) || 'document extraction', data: 'CUAD v1 (CC BY 4.0)', currentTool: 'the first candidate of its type / ctrl-F', client: 'kar-night', supplier: 'AI-Native Solutions', metric: 'right when answered', kind: 'rate', baseline: Math.round(baseRate * 1000) / 1000, direction: 'higher' },
    { minImprovement: EXAM.minImprovement, minSample: EXAM.minSample, zCrit: EXAM.zCrit, alpha: EXAM.alpha, price: null });
  if (!a.ok) return { ok: false, why: 'the agreement: ' + a.why };
  const o = outcome(a.agreement, { testId: a.agreement.test.id, control: { n, hits: t.baseRight }, variant: { n, hits: t.right } });
  if (!o.ok) return { ok: false, why: 'the outcome: ' + o.why, answered: n };
  return { ok: true, answered: n, right: t.right, baseRight: t.baseRight, rate: n ? round6(t.right / n) : 0, baseRate: round6(baseRate), decision: o.decision, beats: o.beatsBaseline, receipt: o.receipt, why: o.why };
}

/** minePairs(cases, task, k) → two-word proposals: pairs of the eight most precise single words, kept if they cover ≥ 5 */
export function minePairs(cases, task, k = 2) {
  const singles = P.mine(cases, task, 8).map((r) => r.when[0]);
  const out = [];
  singles.forEach((a, i) => singles.slice(i + 1).forEach((b) => {
    const w = [a, b].sort();
    let n = 0, right = 0;
    for (const c of arr(cases)) if (isObj(c) && arr(c.tokens).includes(w[0]) && c.tokens.includes(w[1])) { n++; if (c.label === task) right++; }
    if (n >= 5 && right > 0) out.push({ when: w, then: task, n, right });
  }));
  return out.sort((a, b) => b.right / b.n - a.right / a.n || b.right - a.right || P.ruleKey(a).localeCompare(P.ruleKey(b)))
    .slice(0, Math.max(0, k)).map((r) => ({ when: r.when, then: r.then }));
}

/** recipe(records, task, type) → the build-pattern lookup: the words of patterns kept for OTHER tasks of the same kind,
 *  tried on this task first, at no cost (P3). Most recently kept first; at most 4. */
export function recipe(records, task, type) {
  const seen = new Set(), out = [];
  for (const r of arr(records).slice().reverse()) {
    if (!isObj(r) || r.type !== type || r.task === task || !isObj(r.rule) || !P.validRule(r.rule)) continue;
    const p = { when: r.rule.when.slice(), then: task };
    const key = P.ruleKey(p);
    if (seen.has(key)) continue;
    seen.add(key); out.push({ ...p, from: r.task });
    if (out.length >= 4) break;
  }
  return out;
}

/** promptFor(task, cases, salt) → what the local 7B (and, last, the subscription) is asked: 20 right and 20 wrong
 *  contexts in a salted order, so each night the model sees a different sample */
export function promptFor(task, cases, salt) {
  const order = (a, b) => P.fnv(a.id + ':' + salt) - P.fnv(b.id + ':' + salt) || first(a.id, b.id);
  const yes = arr(cases).filter((c) => c.label === task && c.tokens.length).sort(order).slice(0, 20);
  const no = arr(cases).filter((c) => c.label !== task && c.tokens.length).sort(order).slice(0, 20);
  const line = (c) => c.tokens.slice(0, 16).join(' ');
  const what = E.isClause(task) ? 'sentences of commercial contracts' : 'the words around a candidate ' + E.typeOf(task) + ' in commercial contracts';
  return `You write extraction rules. Each line below is ${what}.\n\nLines where the candidate IS the "${task}":\n${yes.map(line).join('\n')}\n\nLines where it is NOT:\n${no.map(line).join('\n')}\n\nWrite up to 5 rules that pick out "${task}" and not the others. One rule per line, exactly in one of these two forms and nothing else:\nWHEN word THEN ${task}\nWHEN word AND word THEN ${task}\nUse only words that appear in the "${task}" lines above.`;
}

/** proposalsOf(text, task) → the model's rules for this task only (the law's own parser, then the task check) */
export function proposalsOf(text, task) {
  return P.parseProposals(text, [task]).filter((r) => r.then === task);
}

export default { SCHEDULE, FIELD_GATE, EXAM, METER_BAR, schedule, slicesFor, casesFor, fieldGate, contextFor, admit, grow, examine, meter, receipt, minePairs, recipe, promptFor, proposalsOf };
