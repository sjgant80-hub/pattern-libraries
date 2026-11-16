// pattern-libraries · src/maud.mjs — LIBRARY 5, MERGER AGREEMENT DEAL POINTS (SEAL 9): MAUD (The Atticus Project, CC BY
// 4.0). A document is one merger agreement; a question is one of MAUD's 144 deal points; a task is one question with one
// of its labels (356). One unit per agreement per task, on the excerpt the experts chose; right when the experts' label
// is that label. The cheap baseline is ctrl-F for the answer's own words (seal 9 note: for "yes: X" / "no: X", X's words). Pure and total: garbage never throws.
//
//   maudFor(questions)  the kernel for a question list (src/maud-questions.mjs is the pinned one):
//     units(doc)        doc = { id, rows: [{ q, text, label }] } → { [task]: [unit] }
//     answer(rules, units, q)  the first kept pattern among the question's tasks that fires, with every conflict named
//     cheapAnswer(units, q)    ctrl-F's answer: the first of the question's tasks whose name's words are all there
//     readOn(rules, units, ids) M5's six counts on some agreements; read(text, q, rules) a stranger's excerpt
import P from '../vendor/patlib/patlib.mjs';
import { asCase, isCaseFor } from './extract.mjs';
import QUESTIONS from './maud-questions.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => (typeof x === 'string' ? x : '');
const arr = (x) => (Array.isArray(x) ? x : []);

// seal 9: SHA-256 order of agreement names (seal 4); meter 20, seed 32, four batches of 25; seal 7's merged tail
export const SCHEDULE = Object.freeze({ meter: 20, seed: 32, batch: 25, salt: 'maud:', hash: 'sha256', tail: 'merge' });
export const METER_BAR = 0.8;
export const RAW = 240;

/** maudFor(questions) → the kernel of library 5 over a question list */
export function maudFor(questions) {
  const Q = Object.freeze(arr(questions).filter((q) => isObj(q) && typeof q.id === 'string' && q.id && arr(q.labels).length));
  const byId = new Map(Q.map((q) => [q.id, q]));
  const tasksOf = (q) => arr(q.labels).map((l) => q.id + '=' + str(l.label));
  const TASKS = Object.freeze(Q.flatMap(tasksOf));
  // ctrl-F's words: the name's words; for a list-valued "yes: X" / "no: X", X's words, held (yes) or not all held (no)
  const NAME = new Map(), WORDS = new Map(), NOT = new Set(), OWNER = new Map();
  for (const q of Q) for (const l of q.labels) {
    const t = q.id + '=' + str(l.label), name = str(l.name), m = name.match(/^(yes|no): /);
    NAME.set(t, name); WORDS.set(t, P.tokensOf(m ? name.slice(m[0].length) : name)); OWNER.set(t, q.id);
    if (m && m[1] === 'no') NOT.add(t);
  }

  const questionOf = (task) => OWNER.get(task) || null;
  const say = (task) => (NAME.has(task) ? NAME.get(task) : str(task));
  const sayQuestion = (qid) => { const q = byId.get(qid); return q ? q.question.replace(/-Answer$/, '') + (q.subquestion ? ': ' + q.subquestion : '') : str(qid); };

  /** units(doc) → { [task]: [unit] } for every question the agreement has an answer to */
  function units(doc) {
    const out = {};
    if (!isObj(doc) || typeof doc.id !== 'string') return out;
    for (const r of arr(doc.rows)) {
      if (!isObj(r) || typeof r.text !== 'string') continue;
      const q = byId.get(r.q);
      if (!q) continue;
      const tokens = P.tokensOf(r.text), raw = r.text.replace(/\s+/g, ' ').trim().slice(0, RAW), id = P.fnv('maud:' + doc.id + '|' + q.id).toString(36) + '.q';
      for (const t of tasksOf(q)) {
        const w = WORDS.get(t), right = t === q.id + '=' + str(r.label);
        const held = w.every((x) => tokens.includes(x));
        out[t] = [{ id, doc: doc.id, raw, tokens, kw: w.length > 0 && (NOT.has(t) ? !held : held), right, label: right ? t : 'other' }];
      }
    }
    return out;
  }

  const baseline = (task, us) => arr(us).find((u) => isObj(u) && u.kw === true) || null;
  /** pick(rules, task, units) → { unit, rule }: the first unit a kept rule for the task fires on, or null */
  function pick(rules, task, us) {
    const mine = arr(rules).filter((r) => P.validRule(r) && r.then === task);
    for (const u of arr(us)) {
      if (!isObj(u)) continue;
      const r = mine.find((x) => P.fires(x, u));
      if (r) return { unit: u, rule: r };
    }
    return null;
  }
  const unitOf = (us, task) => (isObj(us) ? arr(us[task]).find(isObj) || null : null);

  /** answer(rules, units, qid) → { task, rule, also, right } for the first kept pattern of the question that fires, or null */
  function answer(rules, us, qid) {
    const q = byId.get(qid);
    if (!q) return null;
    const mine = new Set(tasksOf(q)), fired = [];
    for (const r of arr(rules)) {
      if (!P.validRule(r) || !mine.has(r.then)) continue;
      const u = unitOf(us, r.then);
      if (u && P.fires(r, u)) fired.push(r);
    }
    if (!fired.length) return null;
    const also = [...new Set(fired.map((r) => r.then))].filter((t) => t !== fired[0].then);
    return { task: fired[0].then, rule: fired[0], also, right: unitOf(us, fired[0].then).right === true };
  }

  /** cheapAnswer(units, qid) → ctrl-F's answer: the first of the question's tasks, in label order, that it holds */
  function cheapAnswer(us, qid) {
    const q = byId.get(qid);
    if (!q) return null;
    for (const t of tasksOf(q)) { const u = unitOf(us, t); if (u && u.kw === true) return { task: t, right: u.right === true }; }
    return null;
  }

  /** readOn(rules, unitsById, ids) → M5's six counts over every question each agreement answers */
  function readOn(rules, unitsById, ids) {
    const t = { asked: 0, answered: 0, right: 0, conflicts: 0, baseAnswered: 0, baseRight: 0 };
    for (const id of arr(ids)) {
      const us = isObj(unitsById) ? unitsById[id] : null;
      for (const q of Q) {
        if (!unitOf(us, tasksOf(q)[0])) continue;
        t.asked++;
        const a = answer(rules, us, q.id), k = cheapAnswer(us, q.id);
        if (a) { t.answered++; if (a.right) t.right++; if (a.also.length) t.conflicts++; }
        if (k) { t.baseAnswered++; if (k.right) t.baseRight++; }
      }
    }
    return t;
  }

  /** read(text, qid, rules) → a stranger's excerpt for one question: the answer (or unknown), conflicts, ctrl-F's answer */
  function read(text, qid, rules) {
    const us = units({ id: 'yours', rows: [{ q: str(qid), text: str(text), label: '' }] });
    const a = answer(rules, us, qid), k = cheapAnswer(us, qid);
    return { answer: a ? a.task : 'unknown', rule: a ? P.ruleKey(a.rule) : null, receipt: a ? str(a.rule.receipt) : null, also: a ? a.also : [], cheap: k ? k.task : 'unknown' };
  }

  const DOMAIN = Object.freeze({
    many: () => false, baseline, pick, asCase, isCaseFor, TASKS,
    typeOf: (t) => (OWNER.has(t) ? 'deal point' : null),
    job: 'merger agreement deal points', data: 'MAUD (CC BY 4.0)', currentTool: 'ctrl-F for the answer\'s own words',
    what: () => 'the excerpt of a merger agreement that the experts chose for one deal-point question',
  });

  return Object.freeze({ QUESTIONS: Q, TASKS, questionOf, say, sayQuestion, tasksOf, units, baseline, pick, answer, cheapAnswer, readOn, read, DOMAIN });
}

const K = maudFor(QUESTIONS);
export default Object.freeze({ SCHEDULE, METER_BAR, RAW, maudFor, ...K });
