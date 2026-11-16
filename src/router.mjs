// pattern-libraries · src/router.mjs — a routing library over any fixed list of intents, with an optional out-of-scope
// flag (SEAL 8). It is library 3's router (src/triage.mjs, left unchanged so its records cannot move) made general: one
// unit per route per message, the keyword router as the cheap method, the first kept route pattern in library order as
// the answer with every conflict named. Pure and total: no clock, no disk, no network, no model; garbage never throws.
//
//   routerFor(spec)  spec = { intents, key, oos?, oosTask?, oosSay?, job, data, what } → the library's kernel:
//     units(doc)              doc = { id, text, intent } → { [task]: [unit] }; a route's unit is right when the experts'
//                             intent is that route; the out-of-scope unit is right when the intent is spec.oos
//     baseline / pick         the cheap method's unit, and the unit a kept rule fires on
//     route(rules, units)     the router; keywordRoute(units) the cheap method's route
//     routeOn(rules, units, ids)  the whole measure on some messages (L5's ten counts)
//     read(text, rules)       a stranger's message: route, conflicts, keyword route, out-of-scope raised or not
import P from '../vendor/patlib/patlib.mjs';
import C from './catalogue.mjs';
import { asCase, isCaseFor } from './extract.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => (typeof x === 'string' ? x : '');
const arr = (x) => (Array.isArray(x) ? x : []);

export const idOf = (name) => str(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const WINDOW = Object.freeze({ tokens: 40, raw: 240 });

/** routerFor(spec) → the kernel of one routing library */
export function routerFor(spec) {
  const S = isObj(spec) ? spec : {};
  const INTENTS = Object.freeze(arr(S.intents).filter((x) => typeof x === 'string' && idOf(x)));
  const ROUTES = Object.freeze([...new Set(INTENTS.map(idOf))]);
  const NAMEWORDS = Object.freeze(Object.fromEntries(ROUTES.map((r, i) => [r, Object.freeze(P.tokensOf(INTENTS[i]))])));
  const OOS = typeof S.oos === 'string' && S.oos ? str(S.oosTask) || 'out-of-scope' : null;
  const TASKS = Object.freeze(OOS ? [...ROUTES, OOS] : [...ROUTES]);
  const key = str(S.key);
  // how many of a message's words the patterns read (seal 10 lets a library read longer texts); 40 unless set
  const TOKENS = Number.isInteger(S.tokens) && S.tokens > 0 ? S.tokens : WINDOW.tokens;

  const say = (task) => {
    if (OOS && task === OOS) return str(S.oosSay) || 'Out of scope';
    const i = ROUTES.indexOf(task);
    if (i < 0) return str(task);
    const s = INTENTS[i].replace(/[_?]+/g, ' ').trim().toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  /** units(doc) → { [task]: [unit] } */
  function units(doc) {
    const out = {};
    if (!isObj(doc) || typeof doc.id !== 'string' || typeof doc.text !== 'string') return out;
    const text = doc.text, all = P.tokensOf(text), tokens = all.slice(0, TOKENS);
    const raw = text.replace(/\s+/g, ' ').trim().slice(0, WINDOW.raw), id = P.fnv(key + doc.id).toString(36);
    const gold = str(doc.intent);
    // seal 10: a message may carry several experts' labels (doc.intents); a route is right when it is any of them
    const more = new Set(arr(doc.intents).filter((x) => typeof x === 'string' && x !== S.oos).map(idOf));
    let anyKw = false;
    for (const r of ROUTES) {
      const right = (idOf(gold) === r && gold !== S.oos) || more.has(r), kw = NAMEWORDS[r].length > 0 && NAMEWORDS[r].every((w) => all.includes(w)); // a name with no words never matches (seal 8 note)
      if (kw) anyKw = true;
      out[r] = [{ id: id + '.q', doc: doc.id, raw, tokens, kw, right, label: right ? r : 'other' }];
    }
    if (OOS) {
      const right = gold === S.oos;
      out[OOS] = [{ id: id + '.q', doc: doc.id, raw, tokens, kw: !anyKw, right, label: right ? OOS : 'other' }];
    }
    return out;
  }

  const baseline = (task, us) => arr(us).find((u) => isObj(u) && u.kw === true) || null;

  /** pick(rules, task, units, cat) → { unit, rule } or null (a catalogue, when usable, asks only the patterns it finds) */
  function pick(rules, task, us, cat) {
    if (C.usable(cat, rules)) {
      for (const u of arr(us)) {
        if (!isObj(u)) continue;
        const i = C.firing(cat, u.tokens).find((k) => rules[k].then === task);
        if (i !== undefined) return { unit: u, rule: rules[i] };
      }
      return null;
    }
    const mine = arr(rules).filter((r) => P.validRule(r) && r.then === task);
    for (const u of arr(us)) {
      if (!isObj(u)) continue;
      const r = mine.find((x) => P.fires(x, u));
      if (r) return { unit: u, rule: r };
    }
    return null;
  }

  const unitOf = (us, task) => (isObj(us) ? arr(us[task]).find(isObj) || null : null);

  /** route(rules, units, cat) → { route, rule, also, right } for the first kept route pattern that fires, or null */
  function route(rules, us, cat) {
    const fired = [];
    const ask = C.usable(cat, rules) ? C.asked(cat, C.unitTokens(us)).map((i) => rules[i]) : arr(rules);
    for (const r of ask) {
      if (!P.validRule(r) || !ROUTES.includes(r.then)) continue;
      const u = unitOf(us, r.then);
      if (u && P.fires(r, u)) fired.push(r);
    }
    if (!fired.length) return null;
    const also = [...new Set(fired.map((r) => r.then))].filter((t) => t !== fired[0].then);
    return { route: fired[0].then, rule: fired[0], also, right: unitOf(us, fired[0].then).right === true };
  }

  /** keywordRoute(units) → the first route, in the intents' order, whose name tokens the message holds */
  function keywordRoute(us) {
    for (const r of ROUTES) { const u = unitOf(us, r); if (u && u.kw === true) return { route: r, right: u.right === true }; }
    return null;
  }

  /** routeOn(rules, units, ids) → L5's counts: the router and the keyword router, and the out-of-scope flag and its
   *  cheap baseline (the keyword router routes the message nowhere) */
  function routeOn(rules, unitsById, ids) {
    const t = { queries: 0, routed: 0, right: 0, conflicts: 0, baseRouted: 0, baseRight: 0 };
    if (OOS) Object.assign(t, { oosRaised: 0, oosRight: 0, baseOosRaised: 0, baseOosRight: 0 });
    const cat = C.catalogue(rules);
    for (const id of arr(ids)) {
      const u = isObj(unitsById) ? unitsById[id] : null;
      t.queries++;
      const a = route(rules, u, cat), k = keywordRoute(u);
      if (a) { t.routed++; if (a.right) t.right++; if (a.also.length) t.conflicts++; }
      if (k) { t.baseRouted++; if (k.right) t.baseRight++; }
      if (OOS) {
        const o = unitOf(u, OOS);
        if (o && pick(rules, OOS, [o], cat)) { t.oosRaised++; if (o.right) t.oosRight++; }
        if (o && o.kw === true) { t.baseOosRaised++; if (o.right) t.baseOosRight++; }
      }
    }
    return t;
  }

  /** read(text, rules) → a stranger's message: the route (or unknown) and its conflicts, the keyword router's route,
   *  and whether out-of-scope was raised (and by which pattern) */
  function read(text, rules) {
    const us = units({ id: 'yours', text: str(text), intent: '' });
    const a = route(rules, us), k = keywordRoute(us);
    const o = OOS ? pick(rules, OOS, unitOf(us, OOS) ? [unitOf(us, OOS)] : []) : null;
    return {
      route: a ? a.route : 'unknown', rule: a ? P.ruleKey(a.rule) : null, receipt: a ? str(a.rule.receipt) : null, also: a ? a.also : [],
      keyword: k ? k.route : 'unknown', outOfScope: o ? { rule: P.ruleKey(o.rule), receipt: str(o.rule.receipt) } : null,
    };
  }

  const DOMAIN = Object.freeze({
    many: () => false, baseline, pick, asCase, isCaseFor, TASKS,
    typeOf: (t) => (ROUTES.includes(t) ? 'route' : OOS && t === OOS ? 'flag' : null),
    job: str(S.job) || 'routing', data: str(S.data), currentTool: 'the keyword router: every word of the route\'s own name' + (OOS ? '; out of scope: the keyword router routes it nowhere' : ''),
    what: () => str(S.what) || 'the words of one customer message',
  });

  return Object.freeze({ INTENTS, ROUTES, NAMEWORDS, OOS, TASKS, WINDOW, say, units, baseline, pick, route, keywordRoute, routeOn, read, DOMAIN });
}

export default { idOf, WINDOW, routerFor };
