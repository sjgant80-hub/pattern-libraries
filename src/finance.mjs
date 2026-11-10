// pattern-libraries · src/finance.mjs — LIBRARY 2, FINANCE / ACCOUNTING (receipts): everything that turns a receipt's
// text into the cases Kar's pattern law (vendor/patlib) can gate, turns kept patterns back into answers, and checks the
// answers against each other with plain arithmetic. Sealed first: CLAIMS.md (SEAL 2, e28a504). Pure and total: no clock,
// no disk, no network, no model; garbage in gives an empty result, never a throw.
//
//   scan(text)            every amount a deterministic scanner can find, with its value in hundredths and its sign apart
//   rowsOf(text)          the receipt's rows (one printed line each), with where each starts and ends
//   unitsOf(doc)          a receipt as units per task (every amount), each labelled from the experts' words
//   baseline(task, units) ctrl-F: a field's first amount at or after the first row holding its word; line items = every
//                         amount above the first row holding 'total'
//   pick(rules, task, u)  a field: the first amount a kept rule fires on; line items: every amount one fires on
//   reconcile(a, parts)   the three sums (items, totals, change) over the library's own answers: reconciled, flagged,
//                         unchecked. It never changes an answer.
//   experts(units)        the experts' own values per task, for testing the rule itself (R0)
//   read(text, rules)     a stranger's receipt read by the library: every task answered or unknown, then the check
import P from '../vendor/patlib/patlib.mjs';
import { asCase, isCaseFor } from './extract.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => (typeof x === 'string' ? x : '');
const arr = (x) => (Array.isArray(x) ? x : []);

export const FIELDS = Object.freeze([
  Object.freeze({ id: 'total', cord: 'total.total_price', word: 'total', say: 'Total' }),
  Object.freeze({ id: 'subtotal', cord: 'sub_total.subtotal_price', word: 'sub', say: 'Subtotal' }),
  Object.freeze({ id: 'tax', cord: 'sub_total.tax_price', word: 'tax', say: 'Tax' }),
  Object.freeze({ id: 'service', cord: 'sub_total.service_price', word: 'serv', say: 'Service charge' }),
  Object.freeze({ id: 'discount', cord: 'sub_total.discount_price', word: 'disc', say: 'Discount' }),
  Object.freeze({ id: 'cash', cord: 'total.cashprice', word: 'cash', say: 'Cash paid' }),
  Object.freeze({ id: 'change', cord: 'total.changeprice', word: 'change', say: 'Change given' }),
]);
export const LINES = Object.freeze([Object.freeze({ id: 'item-price', cord: 'menu.price', word: 'total', say: 'Line items' })]);
export const TASKS = Object.freeze([...FIELDS.map((f) => f.id), ...LINES.map((l) => l.id)]);
export const typeOf = (task) => (TASKS.includes(task) ? 'money' : null);
export const many = (task) => LINES.some((l) => l.id === task);
export const isClause = () => false;
export const WINDOW = Object.freeze({ before: 6, after: 3 });
// a part holds when its two sides differ by at most 100 units (whole-unit receipts) or 0.05 (amounts printed with
// decimals); values are in hundredths
export const TOLERANCE = Object.freeze({ whole: 10000, cents: 5 });
export const PARTS = Object.freeze(['A', 'B', 'C']);

// ── the scanner ────────────────────────────────────────────────────────────────────────────────────────────────────
const CUR = '(?:Rp\\.?|IDR|USD|GBP|EUR|[£$€])';
const AMT = new RegExp('(?<![\\w.,/:])(' + CUR + '[ \\t]?)?(-[ \\t]?|\\()?(\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d{2})?|\\d+[.,]\\d{2}|\\d{3,7}|0)(?![\\w%/:]|[.,]\\d)', 'gi');

/** valueOf(digits) → { value (hundredths), dec } for a number as printed: a last separator before exactly two digits
 *  starts the decimals; every other separator groups thousands */
export function valueOf(s) {
  const m = /^([\d.,]*?)(?:[.,](\d\d))?$/.exec(str(s));
  if (!m || !/\d/.test(m[1])) return null;
  return { value: Number(m[1].replace(/[.,]/g, '')) * 100 + (m[2] ? Number(m[2]) : 0), dec: m[2] !== undefined };
}

/** scan(text) → every amount, in reading order: { start, end, raw, value, neg, dec } */
export function scan(text) {
  const t = str(text), out = [];
  AMT.lastIndex = 0;
  for (let m; (m = AMT.exec(t));) {
    const v = valueOf(m[3]);
    if (v) out.push({ start: m.index, end: m.index + m[0].length, raw: m[0], value: v.value, neg: m[2] !== undefined, dec: v.dec });
  }
  return out;
}

/** rowsOf(text) → [{ start, end, text }], one per printed line (empty lines kept, so a row's place is its line) */
export function rowsOf(text) {
  const t = str(text), out = [];
  let at = 0;
  for (const line of t.split('\n')) { out.push({ start: at, end: at + line.length, text: line }); at += line.length + 1; }
  return out;
}

const words = (s) => P.tokensOf(s).filter((w) => !/^\d+$/.test(w));

/** amountsOf(text) → every amount with its row, its words and where it sits (the units, before any task is known) */
export function amountsOf(text) {
  const t = str(text), rows = rowsOf(t), list = scan(t);
  const max = list.reduce((m, a) => Math.max(m, a.value), -1);
  // an amount never crosses a line (the scanner's spaces are spaces or tabs), so its row is the newlines before it
  const rowOf = list.map((a) => t.slice(0, a.start).split('\n').length - 1);
  return list.map((a, i) => {
    const r = rowOf[i], row = rows[r], mine = list.filter((b, j) => rowOf[j] === r);
    const where = [];
    if (i === 0) where.push('zfirst');
    if (i === list.length - 1) where.push('zlast');
    if (a.value === max) where.push('zmax');
    if (mine[mine.length - 1] === a) where.push('zend');
    if (mine.length === 1) where.push('zalone');
    if (a.neg) where.push('zneg');
    where.push(r * 3 < rows.length ? 'ztop' : r * 3 < rows.length * 2 ? 'zmid' : 'zlow');
    const before = words(t.slice(row.start, a.start)).slice(-WINDOW.before), after = words(t.slice(a.end, row.end)).slice(0, WINDOW.after);
    return { ...a, row: r, tokens: [...new Set([...before, ...after, ...where])] };
  });
}

/** goldOf(doc) → { [cord category]: [{ start, end }] }: the experts' value words (their key words are the label, not the value) */
export function goldOf(doc) {
  const g = {};
  for (const a of arr(isObj(doc) ? doc.gold : null)) {
    if (!isObj(a) || typeof a.cat !== 'string' || a.key === true || !Number.isInteger(a.start) || !Number.isInteger(a.end) || a.end <= a.start) continue;
    (g[a.cat] = g[a.cat] || []).push({ start: a.start, end: a.end });
  }
  return g;
}

const inside = (u, spans) => spans.some((s) => u.start < s.end && s.start < u.end);
const firstRow = (rows, word) => rows.findIndex((r) => r.text.toLowerCase().includes(word));

/** unitsOf(doc) → { [task]: [unit] }: every amount, with its words and whether the experts' words make it right for
 *  that task (a field: equal in value to an amount inside its words; line items: inside a menu.price word), and kw =
 *  whether the cheap baseline would answer with it */
export function unitsOf(doc) {
  const out = {};
  if (!isObj(doc) || typeof doc.id !== 'string' || typeof doc.text !== 'string') return out;
  const text = doc.text, gold = goldOf(doc), rows = rowsOf(text), list = amountsOf(text), key = P.fnv('rcpt:' + doc.id).toString(36);
  const unit = (u, i, task, right, kw) => ({ id: key + '.m.' + i, doc: doc.id, start: u.start, end: u.end, raw: u.raw, value: u.value, dec: u.dec, row: u.row, tokens: u.tokens, kw, right, label: right ? task : 'other' });
  for (const f of FIELDS) {
    const spans = gold[f.cord] || [], values = new Set(list.filter((u) => inside(u, spans)).map((u) => u.value));
    const from = firstRow(rows, f.word), base = from < 0 ? -1 : list.findIndex((u) => u.row >= from);
    out[f.id] = list.map((u, i) => unit(u, i, f.id, values.has(u.value), i === base));
  }
  for (const l of LINES) {
    const spans = gold[l.cord] || [], stop = firstRow(rows, l.word);
    out[l.id] = list.map((u, i) => unit(u, i, l.id, inside(u, spans), stop < 0 || u.row < stop));
  }
  return out;
}

export { asCase, isCaseFor };

/** baseline(task, units) → a field: the cheap baseline's unit or null; line items: the units it calls line items */
export function baseline(task, units) {
  const list = arr(units).filter(isObj);
  return many(task) ? list.filter((u) => u.kw === true) : list.find((u) => u.kw === true) || null;
}

/** pick(rules, task, units) → a field: { unit, rule } for the first unit a kept rule fires on; line items: { units,
 *  rules } for every unit one fires on; null when none fires */
export function pick(rules, task, units) {
  const mine = arr(rules).filter((r) => P.validRule(r) && r.then === task);
  if (!mine.length) return null;
  const hits = [];
  for (const u of arr(units)) {
    if (!isObj(u)) continue;
    const r = mine.find((x) => P.fires(x, u));
    if (!r) continue;
    if (!many(task)) return { unit: u, rule: r };
    hits.push({ u, r });
  }
  return hits.length ? { units: hits.map((h) => h.u), rules: hits.map((h) => h.r) } : null;
}

const holds = (left, right, dec) => Math.abs(left - right) <= (dec ? TOLERANCE.cents : TOLERANCE.whole);
const isAmt = (x) => isObj(x) && Number.isInteger(x.value);

/** reconcile(a, parts) → { verdict, parts }. a = { [field]: { value, dec } | null, items: [{ value, dec }] | null };
 *  parts = the parts allowed to run (a part R0 dropped is left out). A part runs only when every term it needs is there. */
export function reconcile(a, parts = PARTS) {
  const A = isObj(a) ? a : {}, use = new Set(arr(parts));
  const f = (k) => (isAmt(A[k]) ? A[k] : null);
  const items = arr(A.items).filter(isAmt);
  const out = {};
  const part = (name, ran, left, right, terms) => {
    if (!use.has(name) || !ran) return;
    const dec = terms.some((x) => x && x.dec === true);
    out[name] = { left, right, holds: holds(left, right, dec) };
  };
  const sum = items.reduce((n, x) => n + x.value, 0), v = (k) => (f(k) ? f(k).value : 0);
  part('A', items.length > 0 && f('subtotal') !== null, sum, v('subtotal'), [...items, f('subtotal')]);
  part('B', f('subtotal') !== null && f('total') !== null, v('subtotal') + v('tax') + v('service') - v('discount'), v('total'), ['subtotal', 'tax', 'service', 'discount', 'total'].map(f));
  part('C', f('cash') !== null && f('change') !== null && f('total') !== null, v('cash') - v('change'), v('total'), ['cash', 'change', 'total'].map(f));
  const ran = Object.values(out);
  return { verdict: !ran.length ? 'unchecked' : ran.every((p) => p.holds) ? 'reconciled' : 'flagged', parts: out };
}

/** answers(rules, units) → the library's answers for one receipt, in reconcile's shape, with whether each is right */
export function answers(rules, units) {
  const U = isObj(units) ? units : {}, a = {}, right = {};
  for (const f of FIELDS) {
    const p = pick(rules, f.id, U[f.id]);
    a[f.id] = p ? { value: p.unit.value, dec: p.unit.dec } : null;
    right[f.id] = p ? p.unit.right === true : null;
  }
  const p = pick(rules, 'item-price', U['item-price']);
  a.items = p ? p.units.map((u) => ({ value: u.value, dec: u.dec })) : null;
  right.items = p ? p.units.every((u) => u.right === true) && p.units.length === arr(U['item-price']).filter((u) => isObj(u) && u.right === true).length : null;
  return { a, right };
}

/** experts(units) → the experts' own values for one receipt, in reconcile's shape: a field's first right amount, the
 *  line items' right amounts; absent when the experts labelled none (R0) */
export function experts(units) {
  const U = isObj(units) ? units : {}, a = {};
  for (const f of FIELDS) { const u = arr(U[f.id]).find((x) => isObj(x) && x.right === true); a[f.id] = u ? { value: u.value, dec: u.dec } : null; }
  const items = arr(U['item-price']).filter((x) => isObj(x) && x.right === true);
  a.items = items.length ? items.map((u) => ({ value: u.value, dec: u.dec })) : null;
  return a;
}

/** read(text, rules, parts) → a receipt read by the library: every task answered or unknown, then the check */
export function read(text, rules, parts = PARTS) {
  const units = unitsOf({ id: 'yours', text: str(text), gold: [] });
  const rows = TASKS.map((task) => {
    const p = pick(rules, task, units[task]);
    if (!p) return { task, answer: 'unknown', values: [], rule: null, receipt: null };
    const us = many(task) ? p.units : [p.unit], rs = many(task) ? p.rules : [p.rule];
    return { task, answer: us.map((u) => u.raw.trim()).join(' · '), values: us.map((u) => u.value), rule: [...new Set(rs.map((r) => P.ruleKey(r)))].join(' | '), receipt: [...new Set(rs.map((r) => str(r.receipt)))].join(' ') };
  });
  return { rows, check: reconcile(answers(rules, units).a, parts) };
}

// ── the library's place in the cycle, and the rule's own tests (SEAL 2) ──────────────────────────────────────────────
export const SCHEDULE = Object.freeze({ meter: 100, seed: 300, batch: 40, salt: 'cord:' });
export const METER_BAR = 0.9;
export const R_BARS = Object.freeze({ r0: 0.8, r2: Object.freeze({ min: 10, share: 0.95 }), r3: Object.freeze({ min: 5, share: 0.5 }) });
// the amounts each part of the check uses (tax, service and discount only when answered)
export const USES = Object.freeze({ A: Object.freeze(['items', 'subtotal']), B: Object.freeze(['subtotal', 'tax', 'service', 'discount', 'total']), C: Object.freeze(['cash', 'change', 'total']) });
export const DOMAIN = Object.freeze({
  TASKS, typeOf, many, baseline, pick, asCase, isCaseFor,
  job: 'receipt reading', data: 'CORD v2 (CC BY 4.0)', currentTool: 'ctrl-F: the first amount at or after its word; every amount above the totals',
  what: () => 'the words on one row of a receipt around one amount, then where the amount sits (zfirst, zlast, zmax = the largest, zend = the last on its row, zalone = the only one on its row, zneg = printed negative, ztop, zmid, zlow = which third of the receipt)',
});

/** ruleTest(units, ids) → R0: each part of the check run on the experts' own values, receipt by receipt */
export function ruleTest(units, ids) {
  const out = Object.fromEntries(PARTS.map((k) => [k, { ran: 0, held: 0 }]));
  for (const id of arr(ids)) {
    const c = reconcile(experts(isObj(units) ? units[id] : null), PARTS);
    for (const k of Object.keys(c.parts)) { out[k].ran++; if (c.parts[k].holds) out[k].held++; }
  }
  return out;
}

/** partsOf(r0) → the parts that held on at least 80% of the receipts they ran on (in whole thousandths); a part that
 *  missed is dropped from the check */
export function partsOf(r0) {
  const bar = Math.round(R_BARS.r0 * 1000);
  return PARTS.filter((k) => isObj(r0) && isObj(r0[k]) && Number.isInteger(r0[k].ran) && r0[k].ran > 0 && r0[k].held * 1000 >= bar * r0[k].ran);
}

/** checkOn(rules, units, ids, parts) → the check over the library's own answers on some receipts (R2, R3): how many it
 *  reconciled, flagged and left unchecked; of the reconciled, how many had every amount it used right; of the receipts
 *  where a part ran and an amount it used was wrong, how many it flagged */
export function checkOn(rules, units, ids, parts = PARTS) {
  const t = { receipts: 0, reconciled: 0, flagged: 0, unchecked: 0, reconciledRight: 0, wrongRan: 0, wrongFlagged: 0 };
  for (const id of arr(ids)) {
    const { a, right } = answers(rules, isObj(units) ? units[id] : null);
    const c = reconcile(a, parts), ran = Object.keys(c.parts);
    t.receipts++; t[c.verdict]++;
    const used = [...new Set(ran.flatMap((k) => USES[k]))].filter((k) => a[k] !== null);
    const allRight = used.every((k) => right[k] === true);
    if (c.verdict === 'reconciled' && allRight) t.reconciledRight++;
    if (ran.length && !allRight) { t.wrongRan++; if (c.verdict === 'flagged') t.wrongFlagged++; }
  }
  return t;
}

/** verdicts(check) → R2 and R3 from a meter's check: 'held', 'failed', or 'undecided' while too few receipts decide it */
export function verdicts(check) {
  const t = isObj(check) ? check : {}, n = (x) => (Number.isInteger(x) ? x : 0);
  const r2 = n(t.reconciled) < R_BARS.r2.min ? 'undecided' : n(t.reconciledRight) * 100 >= Math.round(R_BARS.r2.share * 100) * n(t.reconciled) ? 'held' : 'failed';
  const r3 = n(t.wrongRan) < R_BARS.r3.min ? 'undecided' : n(t.wrongFlagged) * 100 >= Math.round(R_BARS.r3.share * 100) * n(t.wrongRan) ? 'held' : 'failed';
  return { R2: r2, R3: r3 };
}

/** money(hundredths) → the value as printed in whole units, or with two decimals when it has cents */
export function money(v) {
  if (!Number.isInteger(v)) return '';
  const whole = Math.trunc(Math.abs(v) / 100).toLocaleString('en-US'), c = Math.abs(v) % 100;
  return (v < 0 ? '-' : '') + whole + (c ? '.' + String(c).padStart(2, '0') : '');
}

export default { FIELDS, LINES, TASKS, WINDOW, TOLERANCE, PARTS, SCHEDULE, METER_BAR, R_BARS, USES, DOMAIN, typeOf, many, isClause, valueOf, scan, rowsOf, amountsOf, goldOf, unitsOf, asCase, isCaseFor, baseline, pick, reconcile, answers, experts, read, ruleTest, partsOf, checkOn, verdicts, money };
