// pattern-libraries · src/catalogue.mjs — THE CATALOGUE: an address for every pattern, and a way to find the patterns
// that could serve a job without asking every one. Sealed first: CLAIMS.md (SEAL 5, 20ea3b4).
//
// The design, a Dewey-style address for every item and cross-reference layers between items, is Gary W. Floyd's:
// Gary W. Floyd, Lumiea Systems Research Division — ThunderStruck Service LLC, "NEXUS — Distributed Synthetic
// Intelligence," 2026. This build of it, for WHEN/THEN patterns, is Kar's.
//
// The law still decides. The catalogue only chooses which patterns to ask; every pattern it returns has been asked with
// the vendored law's own fires(), so it cannot return a pattern the linear scan would not.
//
//   wordCounts(lists)           how many token lists each word occurs in (the training messages' counts)
//   catalogue(rules, opts)      file every valid pattern under ONE of its words; give it its address
//   asked(cat, tokens)          the patterns to ask for a job, in library order
//   firing(cat, tokens)         the patterns that fire on the job, in library order (the law decides)
//   linear(rules, tokens)       the same thing the slow way: every pattern asked (the reference)
//   answer(cat, c)              the law's answer() through the catalogue
//   usable(cat, rules)          true when cat was built for exactly this library
//   unitTokens(units)           every word of a router's units (one list per unit; shared lists read once)
//   shadows(cat)                for each pattern, the earliest pattern whose words are a subset of its own, else -1
//   classes(cat) · provenance(cat)   the class and provenance layers
//   conflictPair(cat, tokens)   the first pattern that fires and the first after it with another label, or null
//   together(cat, lists)        the "fired together" layer, from training lists
//   grow(cases, lib, labels)    every one- and two-word pattern seen in training cases, the shape of a big library
//   stats(xs)                   median, 95th percentile and largest of some counts
//
// Pure and total: no clock, no disk, no network, no model; garbage in never throws.
import P from '../vendor/patlib/patlib.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const str = (x) => (typeof x === 'string' ? x : '');

/** each library's number in an address (SEAL 5) */
export const LIBRARY_CODES = Object.freeze({ estate: '000', doc: '100', finance: '200', route: '300', triage: '400' });

/** wordCounts(lists) → { word: number of lists it occurs in } (a word counted once per list) */
export function wordCounts(lists) {
  const n = Object.create(null);
  try {
    for (const l of arr(lists)) for (const w of new Set(arr(l))) if (typeof w === 'string') n[w] = (n[w] || 0) + 1;
  } catch { /* a list that cannot be read adds nothing */ }
  return n;
}

/** addressOf(rule, lib, labels) → '<lib>.<class>.<words>' or null (not a valid pattern, no library, label not listed) */
export function addressOf(rule, lib, labels) {
  try {
    if (!P.validRule(rule) || typeof lib !== 'string' || lib === '') return null;
    const k = arr(labels).indexOf(rule.then);
    if (k === -1) return null;
    return lib + '.' + String(k + 1).padStart(3, '0') + '.' + [...rule.when].sort().join('+');
  } catch { return null; }
}

const EMPTY = () => ({ rules: [], size: 0, filed: Object.create(null), fileWord: [], address: [] });

/**
 * catalogue(rules, { counts, lib, labels }) → { rules, size, filed: { word: [positions] }, fileWord, address }
 * counts: wordCounts of the library's training lists; without them, the word shared by the fewest patterns is used.
 */
export function catalogue(rules, opts) {
  try {
    const rs = arr(rules);
    const o = isObj(opts) ? opts : {};
    const shared = Object.create(null);
    for (const r of rs) if (P.validRule(r)) for (const w of r.when) shared[w] = (shared[w] || 0) + 1;
    const counts = o.counts !== null && typeof o.counts === 'object' ? o.counts : shared;
    const cnt = (w) => (typeof counts[w] === 'number' ? counts[w] : 0);
    const cat = { ...EMPTY(), rules: rs, size: rs.length };
    rs.forEach((r, i) => {
      if (!P.validRule(r)) { cat.fileWord.push(null); cat.address.push(null); return; }
      // the rarest word; on a tie, the one first in code-point order (the default sort of two distinct words)
      const w = r.when.reduce((best, x) => (cnt(x) < cnt(best) || (cnt(x) === cnt(best) && [x, best].sort()[0] === x) ? x : best));
      (cat.filed[w] || (cat.filed[w] = [])).push(i);
      cat.fileWord.push(w);
      cat.address.push(addressOf(r, o.lib, o.labels));
    });
    return cat;
  } catch { return EMPTY(); }
}

/** usable(cat, rules) → whether cat was built for exactly this library (the same array, the same length) */
export function usable(cat, rules) {
  try { return isObj(cat) && Array.isArray(rules) && cat.rules === rules && cat.size === rules.length; } catch { return false; }
}

/**
 * asked(cat, tokens) → the positions to ask, ascending. A pattern is filed under exactly one of its words, and the
 * job's words are taken once each, so no position is found twice.
 */
export function asked(cat, tokens) {
  try {
    const out = [];
    for (const w of new Set(arr(tokens))) { const l = cat.filed[w]; if (l) out.push(...l); }
    return out.sort((a, b) => a - b);
  } catch { return []; }
}

/** firing(cat, tokens) → the positions of the patterns that fire on the job, ascending (the law's fires() decides) */
export function firing(cat, tokens) {
  try {
    const c = { tokens: arr(tokens) };
    return asked(cat, tokens).filter((i) => P.fires(cat.rules[i], c));
  } catch { return []; }
}

/** linear(rules, tokens) → the same positions the slow way: every pattern asked in order */
export function linear(rules, tokens) {
  const out = [];
  try {
    const c = { tokens: arr(tokens) };
    arr(rules).forEach((r, i) => { if (P.validRule(r) && P.fires(r, c)) out.push(i); });
  } catch { /* nothing more fires */ }
  return out;
}

/** answer(cat, c) → exactly the law's answer(library, c), asking only what the catalogue finds */
export function answer(cat, c) {
  try {
    const f = firing(cat, c.tokens);
    return P.answer(f.length ? [cat.rules[f[0]]] : [], c);
  } catch { return P.answer([], null); }
}

/** unitTokens(units) → every word of a router's units, each once (units share their word lists, so each list is read once) */
export function unitTokens(units) {
  const lists = new Set();
  try { if (isObj(units)) for (const k of Object.keys(units)) for (const u of arr(units[k])) if (isObj(u)) lists.add(u.tokens); } catch { /* skip */ }
  const out = new Set();
  for (const l of lists) for (const t of arr(l)) out.add(t);
  return [...out];
}

/**
 * shadows(cat) → for each position, the earliest earlier pattern whose words are a subset of its own (it fires whenever
 * this one does, and comes first), else -1. Invalid patterns are -1.
 */
export function shadows(cat) {
  const out = [];
  try {
    const one = Object.create(null); const two = Object.create(null);
    cat.rules.forEach((r, i) => {
      if (cat.fileWord[i] === null) { out.push(-1); return; }
      const ws = [...r.when].sort(); const k = ws.join('+');
      const by = [...ws.map((w) => one[w]), two[k]].filter((x) => x !== undefined);
      out.push(by.length ? Math.min(...by) : -1);
      if (ws.length === 1) one[k] = one[k] ?? i; else two[k] = two[k] ?? i;
    });
  } catch { return []; }
  return out;
}

/** classes(cat) → { '<lib>.<class>': [positions] } for every addressed pattern */
export function classes(cat) {
  const out = Object.create(null);
  try { cat.address.forEach((a, i) => { if (typeof a === 'string') { const k = a.split('.').slice(0, 2).join('.'); (out[k] || (out[k] = [])).push(i); } }); } catch { /* none */ }
  return out;
}

/** provenance(cat) → { 'source|recipe|day': [positions] }: patterns kept on the same day by the same recipe */
export function provenance(cat) {
  const out = Object.create(null);
  try {
    cat.rules.forEach((r, i) => {
      if (cat.fileWord[i] === null) return;
      const p = isObj(r.prov) ? r.prov : {};
      const k = str(p.source) + '|' + str(p.recipe) + '|' + str(p.proposedAt).slice(0, 10);
      (out[k] || (out[k] = [])).push(i);
    });
  } catch { /* none */ }
  return out;
}

/** conflictPair(cat, tokens) → [first firing, first firing after it with another label] or null */
export function conflictPair(cat, tokens) {
  try {
    const f = firing(cat, tokens);
    if (f.length === 0) return null;
    const lead = cat.rules[f[0]].then;
    const other = f.find((i) => cat.rules[i].then !== lead);
    return other === undefined ? null : [f[0], other];
  } catch { return null; }
}

/** together(cat, lists) → the "fired together" layer: every conflict pair seen on the training lists, as 'a-b' keys */
export function together(cat, lists) {
  const out = new Set();
  for (const l of arr(lists)) { const p = conflictPair(cat, l); if (p) out.add(p[0] + '-' + p[1]); }
  return out;
}

/**
 * grow(cases, lib, labels) → every one-word and two-word pattern seen in the training cases ({ tokens, label }), each
 * answering the label it most often goes with (ties: the label's place in labels), ordered by how many cases it occurs
 * in (most first; ties by its address). Patterns whose label is not listed are left out.
 */
export function grow(cases, lib, labels) {
  try { return growing(cases, lib, labels); } catch { return []; }
}
function growing(cases, lib, labels) {
  const L = arr(labels);
  const seen = new Map();
  const note = (k, label) => {
    let e = seen.get(k);
    if (!e) { e = { n: 0, by: new Map() }; seen.set(k, e); }
    e.n++; e.by.set(label, (e.by.get(label) ?? 0) + 1);
  };
  for (const c of arr(cases)) {
    if (!isObj(c) || !L.includes(c.label)) continue;
    const ws = [...new Set(arr(c.tokens).filter((t) => typeof t === 'string'))].sort();
    for (let i = 0; i < ws.length; i++) {
      note(ws[i], c.label);
      for (let j = i + 1; j < ws.length; j++) note(ws[i] + '+' + ws[j], c.label);
    }
  }
  const out = [];
  for (const [k, e] of seen) {
    const then = [...e.by].sort((a, b) => b[1] - a[1] || L.indexOf(a[0]) - L.indexOf(b[0]))[0][0];
    const rule = { when: k.split('+'), then };
    const address = addressOf(rule, lib, L);
    if (address !== null) out.push({ rule, n: e.n, address });
  }
  // most seen first, then by address: one sortable key each (counts are far below 1e9; addresses are unique)
  const byKey = new Map(out.map((x) => [String(1e9 - x.n).padStart(10, '0') + ' ' + x.address, x.rule]));
  return [...byKey.keys()].sort().map((k) => byKey.get(k));
}

/** stats(xs) → { median, p95, max, mean } of a list of numbers (0s for an empty list) */
export function stats(xs) {
  const v = arr(xs).filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return { median: 0, p95: 0, max: 0, mean: 0 };
  const at = (q) => v[Math.floor(q * v.length)];
  return { median: at(0.5), p95: at(0.95), max: v[v.length - 1], mean: v.reduce((s, x) => s + x, 0) / v.length };
}

export default { LIBRARY_CODES, wordCounts, addressOf, catalogue, usable, asked, firing, linear, answer, unitTokens, shadows, classes, provenance, conflictPair, together, grow, stats };
