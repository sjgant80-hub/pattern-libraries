// pattern-libraries · src/build.mjs — THE BUILD-PATTERN LIBRARY (Simon's §1.5, alongside library 1 from day one).
// Sealed first: CLAIMS.md (SEAL 1, 1c6108e; B1, B2, P2, P3). Pure and total: no clock, no disk, no network, no model.
//
//   recordsOf(promoted, ctx)   how each kept pattern was built: library, task, kind, tier, recipe, cost, cycle (B1)
//   order7b(tasks, kept, cycle, max)  which tasks get the local 7B tonight: only those the free tiers kept nothing for,
//                              rotated night by night so every task gets its turn (P2: never pay where a cheap tier did)
//   evidenceOf(task, night)    the credit wall's own evidence shape: tier 1 asked and kept nothing, tier 2 tried and
//                              nothing passed (kar-spendwall's escalate decides, unchanged)
//   spend(records, calls)      credit spent, per library, per ISO week, and per kept pattern (P3)
//   checksOf(markdown)         Kar's own build checks, from the build retrospectives: every "CHECK:" lesson with the
//                              build and date it came from, near-duplicates merged (B2)
//   lookup(checks, query, k)   the checks that share the most words with a question, best first
import P from '../vendor/patlib/patlib.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const str = (x) => (typeof x === 'string' ? x : '');
const nat = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
export const TIERS = Object.freeze(['recipe', 'mined', '7b', 'oauth']);
export const MERGE = 0.6;

/** recordsOf(promoted, ctx) → one how-it-was-built record per kept pattern. ctx = { library, cycle, at, typeOf, cost }
 *  where cost[task][tier] = { calls, cents } spent on that task tonight; it is shared by the patterns that tier kept. */
export function recordsOf(promoted, ctx) {
  const c = isObj(ctx) ? ctx : {};
  const typeOf = typeof c.typeOf === 'function' ? c.typeOf : () => null;
  const list = arr(promoted).filter((r) => isObj(r) && P.validRule(r) && isObj(r.prov));
  const shares = new Map();
  for (const r of list) { const k = r.then + '|' + str(r.prov.source); shares.set(k, (shares.get(k) || 0) + 1); }
  return list.map((r) => {
    const tier = TIERS.includes(r.prov.source) ? r.prov.source : 'mined';
    const spent = isObj(c.cost) && isObj(c.cost[r.then]) && isObj(c.cost[r.then][tier]) ? c.cost[r.then][tier] : { calls: 0, cents: 0 };
    const n = shares.get(r.then + '|' + str(r.prov.source)) || 1;
    return {
      library: str(c.library), task: r.then, type: typeOf(r.then), tier, recipe: str(r.prov.recipe) || tier,
      cost: { calls: nat(spent.calls) / n, cents: nat(spent.cents) / n }, cycle: Number.isInteger(c.cycle) ? c.cycle : null, at: str(c.at),
      rule: { when: r.when.slice(), then: r.then }, receipt: str(r.receipt),
    };
  });
}

/** order7b(tasks, kept, cycle, max) → the tasks the 7B is asked about tonight, at most max: only tasks the free tiers
 *  kept nothing for, in a fixed order that rotates by the cycle */
export function order7b(tasks, kept, cycle, max) {
  const k = isObj(kept) ? kept : {};
  const need = arr(tasks).filter((t) => typeof t === 'string' && !(nat(k[t]) > 0));
  if (!need.length) return [];
  const start = ((Number.isInteger(cycle) && cycle > 0 ? cycle : 0) * nat(max)) % need.length;
  return need.slice(start).concat(need.slice(0, start)).slice(0, nat(max));
}

/** evidenceOf(task, night) → the wall's evidence: night = { keptFree: {task: n}, tried7b: {task: n}, passed7b: {task: n}, model, dropped7b: {task: [why]} } */
export function evidenceOf(task, night) {
  const n = isObj(night) ? night : {};
  const g = (o) => (isObj(o) ? nat(o[task]) : 0);
  return {
    tier1: { asked: true, answered: g(n.keptFree) > 0, what: 'the recipe lookup and the miners for ' + str(task) },
    tier2: { tried: g(n.tried7b), passed: g(n.passed7b), model: str(n.model) || null, dropped: isObj(n.dropped7b) ? arr(n.dropped7b[task]).filter((d) => typeof d === 'string').slice(0, 5) : [] },
  };
}

/** isoWeek(iso) → '2026-W46' for a time, or null */
export function isoWeek(iso) {
  const t = Date.parse(str(iso));
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7;
  const th = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const y = th.getUTCFullYear();
  const first = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((th - first) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}

/** spend(records, calls) → per library and ISO week: cents spent on the credit tier, patterns kept, and cents per kept
 *  pattern. calls = [{ library, at, cents }] (every credit call, kept or not). */
export function spend(records, calls) {
  const out = {};
  const slot = (lib, wk) => { out[lib] = out[lib] || {}; return (out[lib][wk] = out[lib][wk] || { cents: 0, calls: 0, kept: 0, keptCredit: 0 }); };
  for (const c of arr(calls)) { if (!isObj(c)) continue; const wk = isoWeek(c.at); if (!wk) continue; const s = slot(str(c.library) || '?', wk); s.cents += nat(c.cents); s.calls++; }
  for (const r of arr(records)) { if (!isObj(r)) continue; const wk = isoWeek(r.at); if (!wk) continue; const s = slot(str(r.library) || '?', wk); s.kept++; if (r.tier === 'oauth') s.keptCredit++; }
  for (const lib of Object.keys(out)) for (const wk of Object.keys(out[lib])) { const s = out[lib][wk]; s.perKept = s.kept ? Math.round((s.cents / s.kept) * 100) / 100 : null; }
  return out;
}

/** dropping(series) → P3's verdict over a library's weeks that used the credit tier: 'pending' until two such weeks
 *  exist, then 'held' when the latest week's cents per kept pattern is below the first's, else 'failed' */
export function dropping(weeks) {
  const w = isObj(weeks) ? Object.keys(weeks).sort().map((k) => weeks[k]).filter((s) => isObj(s) && nat(s.calls) > 0) : [];
  if (w.length < 2) return { verdict: 'pending', why: w.length + ' week(s) used the credit tier; two are needed' };
  const a = w[0], b = w[w.length - 1];
  const pa = a.kept ? a.cents / a.kept : Infinity, pb = b.kept ? b.cents / b.kept : Infinity;
  return pb < pa ? { verdict: 'held', why: 'per kept pattern ' + fmt(pa) + ' then ' + fmt(pb) } : { verdict: 'failed', why: 'per kept pattern ' + fmt(pa) + ' then ' + fmt(pb) };
}
const fmt = (c) => (Number.isFinite(c) ? '$' + (c / 100).toFixed(2) : 'nothing kept');

/** checksOf(markdown) → Kar's build checks: each "CHECK:" sentence, with the build heading and date above it */
export function checksOf(md) {
  const out = [];
  let build = '', date = '';
  for (const line of str(md).split(/\r?\n/)) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) { build = h[1].trim().slice(0, 160); const d = /(20\d\d-\d\d-\d\d)/.exec(h[1]); date = d ? d[1] : ''; continue; }
    const sub = /^\s*-\s+\*\*(20\d\d-\d\d-\d\d)\s+([^*]+)\*\*/.exec(line);
    if (sub) { date = sub[1]; build = sub[2].replace(/[.\s]+$/, '').slice(0, 160); }
    const parts = line.split(/CHECK:/);
    for (let i = 1; i < parts.length; i++) {
      const text = parts[i].split(/\s\(\w\)\s|\s\(\d\)\s/)[0].replace(/[|`*]/g, '').trim().slice(0, 400);
      if (text.length >= 20) out.push({ text, build, date });
    }
  }
  // near-duplicates merged: the later lesson keeps the earlier one's provenance as well
  const kept = [];
  for (const c of out) {
    const tok = P.tokensOf(c.text);
    const twin = kept.find((k) => P.jaccard(k.tokens, tok) >= MERGE);
    if (twin) { twin.seen.push({ build: c.build, date: c.date }); continue; }
    kept.push({ id: 'chk-' + P.receiptOf({ t: c.text }), text: c.text, build: c.build, date: c.date, tokens: tok, seen: [] });
  }
  return kept;
}

/** lookup(checks, query, k) → the checks sharing the most words with the question; ties to the more recent */
export function lookup(checks, query, k = 5) {
  const q = new Set(P.tokensOf(query));
  if (!q.size) return [];
  return arr(checks).filter((c) => isObj(c) && Array.isArray(c.tokens))
    .map((c) => ({ c, s: c.tokens.filter((t) => q.has(t)).length }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || str(b.c.date).localeCompare(str(a.c.date)) || str(a.c.id).localeCompare(str(b.c.id)))
    .slice(0, Math.max(0, k)).map((x) => ({ id: x.c.id, text: x.c.text, build: x.c.build, date: x.c.date, score: x.s }));
}

export default { TIERS, MERGE, recordsOf, order7b, evidenceOf, isoWeek, spend, dropping, checksOf, lookup };
