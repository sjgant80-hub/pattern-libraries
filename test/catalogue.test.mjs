// test/catalogue.test.mjs — SEAL 5: the catalogue finds exactly what the linear scan finds (K1), its addresses are
// unique and do not move as the library grows (K3), a shadowed pattern never answers first (K4), and the router and
// the extractor give the same answers through it (K6). Run: node --test test/catalogue.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import C, { LIBRARY_CODES, wordCounts, addressOf, catalogue, usable, asked, firing, linear, answer, unitTokens, shadows, classes, provenance, conflictPair, together, grow, stats } from '../src/catalogue.mjs';
import P from '../vendor/patlib/patlib.mjs';
import T from '../src/triage.mjs';
import E from '../src/extract.mjs';

const R = (when, then, extra) => ({ when, then, ...(extra || {}) });
const nullProto = (o) => Object.getPrototypeOf(o) === null;

// a small seeded generator, so the property tests are the same on every machine
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const VOCAB = ['card', 'arrive', 'late', 'pin', 'blocked', 'top', 'fee', 'cash', 'atm', 'refund', 'rate', 'phone'];
const LABELS = ['card-arrival', 'pin-blocked', 'top-up', 'refund', 'atm-support'];
function randomLibrary(r, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = r() < 0.5 ? 1 : 2;
    const ws = [];
    while (ws.length < k) { const w = VOCAB[Math.floor(r() * VOCAB.length)]; if (!ws.includes(w)) ws.push(w); }
    out.push(r() < 0.06 ? { when: ['x'], then: 'bad' } : R(ws, LABELS[Math.floor(r() * LABELS.length)]));
  }
  return out;
}
const randomTokens = (r) => VOCAB.filter(() => r() < 0.3);

test('the library numbers in an address', () => {
  assert.deepEqual(LIBRARY_CODES, { estate: '000', doc: '100', finance: '200', route: '300', triage: '400' });
  assert.ok(Object.isFrozen(LIBRARY_CODES));
  assert.equal(C.catalogue, catalogue);
});

test('wordCounts counts each word once per list, and only words', () => {
  const n = wordCounts([['a', 'b', 'a'], ['a'], ['b', 7, null], 'not a list', null]);
  assert.ok(nullProto(n));
  assert.deepEqual({ ...n }, { a: 2, b: 2 });
  assert.deepEqual({ ...wordCounts(null) }, {});
  const notList = { [Symbol.iterator]() { throw new Error('x'); } };
  assert.deepEqual({ ...wordCounts([['a'], notList]) }, { a: 1 }, 'something that is not a list adds nothing');
  const toxicList = ['b']; Object.defineProperty(toxicList, 1, { get() { throw new Error('x'); }, enumerable: true });
  assert.deepEqual({ ...wordCounts([['a'], toxicList, ['c']]) }, { a: 1 }, 'a list that throws stops the count; what was counted stays');
  assert.doesNotThrow(() => wordCounts({ length: 1 }));
});

test('addressOf: <library>.<class>.<words>, words in code-point order, class 1-based, three digits', () => {
  const labels = ['a-first', 'card-arrival', ...Array.from({ length: 98 }, (_, i) => 'x' + i), 'last-one'];
  assert.equal(addressOf(R(['card', 'arrive'], 'card-arrival'), '300', labels), '300.002.arrive+card');
  assert.equal(addressOf(R(['pin'], 'a-first'), '300', labels), '300.001.pin');
  assert.equal(addressOf(R(['pin'], 'last-one'), '300', labels), '300.101.pin');
  assert.equal(addressOf(R(['zeta', 'Zeta'.toLowerCase() + '2'], 'a-first'), '100', labels), '100.001.zeta+zeta2');
  assert.equal(addressOf(R(['pin'], 'not-listed'), '300', labels), null);
  assert.equal(addressOf(R(['pi'], 'a-first'), '300', labels), null, 'not a valid pattern');
  assert.equal(addressOf(R(['pin'], 'a-first'), '', labels), null);
  assert.equal(addressOf(R(['pin'], 'a-first'), 300, labels), null);
  assert.equal(addressOf(R(['pin'], 'a-first'), '300', null), null);
});

test('catalogue: each pattern filed under its rarest word by the counts, ties by code point; invalid patterns not filed', () => {
  const rules = [R(['card', 'arrive'], 'card-arrival'), R(['card'], 'pin-blocked'), { when: ['no'], then: 'x' }, R(['arrive', 'late'], 'card-arrival'), R(['bbb', 'aaa'], 'refund')];
  const counts = { card: 50, arrive: 5, late: 5, bbb: 3, aaa: 3 };
  const cat = catalogue(rules, { counts, lib: '300', labels: LABELS });
  assert.equal(cat.rules, rules);
  assert.equal(cat.size, 5);
  assert.deepEqual(cat.fileWord, ['arrive', 'card', null, 'arrive', 'aaa']);
  assert.ok(nullProto(cat.filed));
  assert.deepEqual({ ...cat.filed }, { arrive: [0, 3], card: [1], aaa: [4] });
  assert.deepEqual(cat.address, ['300.001.arrive+card', '300.002.card', null, '300.001.arrive+late', '300.004.aaa+bbb']);
  const fallback = catalogue(rules);
  assert.deepEqual(fallback.fileWord, ['arrive', 'card', null, 'late', 'aaa'], 'with no counts: the word shared by the fewest patterns (late 1, arrive 2)');
  assert.deepEqual(fallback.address, [null, null, null, null, null], 'no library given, so no addresses');
  const shared = catalogue([R(['card', 'arrive'], 'a'), R(['card', 'pin'], 'b'), R(['card', 'pin', 'x'].slice(0, 2), 'c'), R(['pin'], 'd')]);
  assert.deepEqual(shared.fileWord, ['arrive', 'card', 'card', 'pin'], 'shared counts: card 3, pin 3, arrive 1; the card/pin tie goes to card');
  assert.deepEqual(catalogue([R(['arrive', 'card'], 'a')], { counts: { arrive: 4, card: 4 } }).fileWord, ['arrive'], 'a tie: the first in code-point order, whichever comes first in the pattern');
  assert.deepEqual(catalogue([R(['card', 'arrive'], 'a')], { counts: { arrive: 4, card: 4 } }).fileWord, ['arrive']);
  assert.deepEqual(catalogue([R(['card', 'arrive'], 'a')], { counts: { card: 1, arrive: 9 } }).fileWord, ['card'], 'the rarer word even when it sorts later');
  assert.deepEqual(catalogue([R(['arrive', 'card'], 'a')], { counts: { card: 1, arrive: 9 } }).fileWord, ['card']);
  const odd = catalogue([R(['card', 'arrive'], 'a')], { counts: { card: 'many', arrive: 2 } });
  assert.deepEqual(odd.fileWord, ['card'], 'a count that is not a number counts as 0');
  assert.deepEqual(catalogue([R(['card', 'arrive'], 'a')], { counts: null }).fileWord, ['arrive'], 'null counts: the shared fallback');
  assert.deepEqual(catalogue([R(['card'], 'a')], 'not options').fileWord, ['card']);
  const empty = catalogue(null);
  assert.deepEqual([empty.size, empty.fileWord, empty.address, { ...empty.filed }], [0, [], [], {}]);
  const toxic = catalogue([R(['card'], 'a')], { get counts() { throw new Error('x'); } });
  assert.deepEqual([toxic.size, toxic.rules], [0, []], 'garbage in: an empty catalogue');
});

test('usable: only the library the catalogue was built for', () => {
  const rules = [R(['card'], 'a')];
  const cat = catalogue(rules);
  assert.equal(usable(cat, rules), true);
  assert.equal(usable(cat, [...rules]), false, 'a copy is another library');
  rules.push(R(['pin'], 'b'));
  assert.equal(usable(cat, rules), false, 'grown after it was built');
  assert.equal(usable(null, rules), false);
  assert.equal(usable(cat, null), false);
  assert.equal(usable([], []), false);
  const toxic = { get rules() { throw new Error('x'); }, size: 1 };
  assert.equal(usable(toxic, rules), false, 'a catalogue that cannot be read is not used');
});

test('asked: the filed patterns for the job words, ascending, each once; nothing for unknown or odd words', () => {
  const rules = [R(['pin'], 'a'), R(['card'], 'b'), R(['pin', 'zzz'], 'c'), R(['card', 'arrive'], 'd')];
  const cat = catalogue(rules, { counts: { pin: 1, card: 9, zzz: 9, arrive: 1 } });
  assert.deepEqual(cat.fileWord, ['pin', 'card', 'pin', 'arrive']);
  assert.deepEqual(asked(cat, ['card', 'pin']), [0, 1, 2]);
  assert.deepEqual(asked(cat, ['pin', 'pin', 'pin']), [0, 2]);
  assert.deepEqual(asked(cat, ['arrive', 'card']), [1, 3]);
  assert.deepEqual(asked(cat, ['nothing']), []);
  assert.deepEqual(asked(cat, ['__proto__', 'constructor', 'toString']), []);
  assert.deepEqual(asked(cat, null), []);
  assert.deepEqual(asked(null, ['pin']), []);
});

test('firing: the law decides; a pattern found by one word does not fire without its other word', () => {
  const rules = [R(['card', 'arrive'], 'a'), R(['card'], 'b'), { when: [], then: 'empty' }];
  const cat = catalogue(rules, { counts: { card: 9, arrive: 1 } });
  assert.deepEqual(asked(cat, ['arrive', 'late']), [0]);
  assert.deepEqual(firing(cat, ['arrive', 'late']), [], 'asked, but card is missing');
  assert.deepEqual(firing(cat, ['arrive', 'card']), [0, 1]);
  assert.deepEqual(firing(cat, []), []);
  assert.deepEqual(firing(null, ['card']), []);
  assert.deepEqual(linear(rules, ['arrive', 'card']), [0, 1]);
  assert.deepEqual(linear(rules, []), [], 'the law fires nothing on an empty job');
  assert.deepEqual(linear(null, ['card']), []);
  assert.deepEqual(linear([{ get when() { throw new Error('x'); } }, R(['card'], 'b')], ['card']), [], 'a toxic pattern stops the scan, nothing more fires');
});

test('answer is the law\'s answer, through the catalogue', () => {
  const rules = [R(['card', 'arrive'], 'card-arrival', { receipt: 'r1' }), R(['card'], 'pin-blocked', { receipt: 'r2' })];
  const cat = catalogue(rules);
  for (const tokens of [['card', 'arrive'], ['card'], ['arrive'], [], ['x']]) assert.deepEqual(answer(cat, { tokens }), P.answer(rules, { tokens }), tokens.join(' '));
  assert.deepEqual(answer(cat, { tokens: ['card', 'arrive'] }), { answer: 'card-arrival', rule: 'arrive+card=>card-arrival', receipt: 'r1' });
  assert.deepEqual(answer(cat, null), P.answer([], null));
  assert.deepEqual(answer(null, { tokens: ['card'] }), { answer: 'unknown', rule: null, receipt: null });
});

test('unitTokens: every word of the units once, each shared list read once', () => {
  const shared = ['card', 'arrive'];
  assert.deepEqual(unitTokens({ a: [{ tokens: shared }], b: [{ tokens: shared }, { tokens: ['pin', 'card'] }], c: 'junk', d: [null, 7] }), ['card', 'arrive', 'pin']);
  assert.deepEqual(unitTokens(null), []);
  assert.deepEqual(unitTokens([{ tokens: ['x'] }]), [], 'units are keyed by task, not a list');
  assert.deepEqual(unitTokens({ a: [{ tokens: 'card' }] }), []);
  const toxic = { get a() { throw new Error('x'); } };
  assert.deepEqual(unitTokens(toxic), []);
});

test('shadows: the earliest earlier pattern whose words are a subset of this one\'s', () => {
  const rules = [R(['card'], 'a'), R(['pin', 'card'], 'b'), R(['card'], 'c'), R(['pin', 'fee'], 'd'), R(['fee', 'pin'], 'e'), R(['pin'], 'f'), R(['fee', 'pin'], 'g'), { when: ['no'], then: 'x' }, R(['top'], 'h')];
  assert.deepEqual(shadows(catalogue(rules)), [-1, 0, 0, -1, 3, -1, 3, -1, -1]);
  const late = [R(['pin', 'fee'], 'a'), R(['fee'], 'b'), R(['pin', 'fee'], 'c')];
  assert.deepEqual(shadows(catalogue(late)), [-1, -1, 0], 'the earliest of several shadows');
  const order = [R(['fee'], 'a'), R(['pin'], 'b'), R(['pin', 'fee'], 'c'), R(['fee'], 'd')];
  assert.deepEqual(shadows(catalogue(order)), [-1, -1, 0, 0]);
  assert.deepEqual(shadows(null), []);
});

test('classes and provenance group the addressed patterns', () => {
  const rules = [R(['card'], 'pin-blocked', { prov: { source: 'mined', recipe: 'mine-1', proposedAt: '2026-11-11T11:28:12Z' } }), R(['pin'], 'card-arrival', { prov: { source: 'mined', recipe: 'mine-1', proposedAt: '2026-11-11T23:00:00Z' } }),
    R(['fee'], 'pin-blocked', { prov: { source: '7b', proposedAt: '2026-11-12T03:00:00Z' } }), R(['x1x'], 'unlisted'), { when: [1], then: 'bad' }, R(['atm'], 'top-up')];
  const cat = catalogue(rules, { lib: '300', labels: LABELS });
  assert.deepEqual({ ...classes(cat) }, { '300.002': [0, 2], '300.001': [1], '300.003': [5] });
  assert.deepEqual({ ...provenance(cat) }, { 'mined|mine-1|2026-11-11': [0, 1], '7b||2026-11-12': [2], '||': [3, 5] });
  assert.deepEqual({ ...classes(null) }, {});
  assert.deepEqual({ ...provenance(null) }, {});
});

test('conflictPair and together: the first pattern to fire and the first after it with another label', () => {
  const rules = [R(['card'], 'a'), R(['pin'], 'a'), R(['card', 'pin'], 'b'), R(['fee'], 'c')];
  const cat = catalogue(rules);
  assert.deepEqual(conflictPair(cat, ['card', 'pin']), [0, 2]);
  assert.deepEqual(conflictPair(cat, ['card', 'fee', 'pin']), [0, 2]);
  assert.deepEqual(conflictPair(cat, ['pin', 'fee']), [1, 3]);
  assert.equal(conflictPair(cat, ['card']), null, 'one label only');
  assert.equal(conflictPair(cat, ['zzz']), null, 'nothing fires');
  assert.equal(conflictPair(null, ['card']), null);
  assert.deepEqual([...together(cat, [['card', 'pin'], ['pin', 'fee'], ['card'], ['card', 'pin']])], ['0-2', '1-3']);
  assert.deepEqual([...together(cat, null)], []);
});

test('grow: every one- and two-word pattern in training, majority label, most-seen first, ties by address', () => {
  const cases = [
    { tokens: ['card', 'arrive'], label: 'card-arrival' }, { tokens: ['card', 'arrive', 'card'], label: 'card-arrival' },
    { tokens: ['card', 'pin'], label: 'pin-blocked' }, { tokens: ['pin'], label: 'pin-blocked' }, { tokens: ['pin', 7], label: 'refund' },
    { tokens: ['card'], label: 'not-listed' }, 'junk', null,
  ];
  const g = grow(cases, '300', LABELS);
  assert.deepEqual(g.map((r) => r.when.join('+') + '=>' + r.then), [
    'card=>card-arrival', 'pin=>pin-blocked', 'arrive=>card-arrival', 'arrive+card=>card-arrival', 'card+pin=>pin-blocked',
  ]);
  const tie = grow([{ tokens: ['fee'], label: 'refund' }, { tokens: ['fee'], label: 'top-up' }], '300', LABELS);
  assert.deepEqual(tie, [{ when: ['fee'], then: 'top-up' }], 'a tie goes to the label listed first');
  const most = grow([{ tokens: ['fee'], label: 'refund' }, { tokens: ['fee'], label: 'top-up' }, { tokens: ['fee'], label: 'refund' }], '300', LABELS);
  assert.deepEqual(most, [{ when: ['fee'], then: 'refund' }], 'the label seen most wins, even when another is listed first');
  assert.deepEqual(grow([{ tokens: ['fee'], label: 'refund' }], '', LABELS), [], 'no library, no address, no pattern');
  assert.deepEqual(grow(null, '300', LABELS), []);
  for (const r of g) assert.ok(P.validRule(r));
});

test('stats: median, 95th percentile, largest and mean', () => {
  assert.deepEqual(stats([5, 1, 3, 2, 4]), { median: 3, p95: 5, max: 5, mean: 3 });
  assert.deepEqual(stats([1, 2]), { median: 2, p95: 2, max: 2, mean: 1.5 });
  assert.deepEqual(stats(Array.from({ length: 100 }, (_, i) => i + 1)), { median: 51, p95: 96, max: 100, mean: 50.5 });
  assert.deepEqual(stats([7, NaN, Infinity, 'x']), { median: 7, p95: 7, max: 7, mean: 7 });
  assert.deepEqual(stats([]), { median: 0, p95: 0, max: 0, mean: 0 });
  assert.deepEqual(stats(null), { median: 0, p95: 0, max: 0, mean: 0 });
});

test('K1 property: on random libraries and jobs the catalogue finds exactly what the linear scan finds, and the law answers the same', () => {
  const r = rng(20261112);
  let checked = 0;
  for (let lib = 0; lib < 60; lib++) {
    const rules = randomLibrary(r, 1 + Math.floor(r() * 120));
    const counts = r() < 0.5 ? wordCounts(Array.from({ length: 30 }, () => randomTokens(r))) : undefined;
    const cat = catalogue(rules, { counts });
    for (let q = 0; q < 50; q++) {
      const tokens = randomTokens(r);
      assert.deepEqual(firing(cat, tokens), linear(rules, tokens));
      assert.deepEqual(answer(cat, { tokens }), P.answer(rules, { tokens }));
      checked++;
    }
  }
  assert.equal(checked, 3000);
});

test('K3: addresses are unique, and every prefix of a library gives its patterns the same addresses', () => {
  const r = rng(7);
  const g = grow(Array.from({ length: 400 }, () => ({ tokens: randomTokens(r), label: LABELS[Math.floor(r() * LABELS.length)] })), '300', LABELS);
  const full = catalogue(g, { lib: '300', labels: LABELS });
  assert.equal(new Set(full.address).size, g.length);
  for (const k of [0, 1, 7, 50, g.length - 1]) assert.deepEqual(catalogue(g.slice(0, k), { lib: '300', labels: LABELS }).address, full.address.slice(0, k));
});

test('K4: a shadowed pattern never answers first', () => {
  const r = rng(99);
  for (let lib = 0; lib < 30; lib++) {
    const rules = randomLibrary(r, 80);
    const cat = catalogue(rules);
    const sh = shadows(cat);
    for (let q = 0; q < 60; q++) { const f = firing(cat, randomTokens(r)); if (f.length) assert.equal(sh[f[0]], -1); }
  }
});

test('K6: the router, the conflicts and pick give the same answers through a catalogue, and a stale one is not used', () => {
  const r = rng(4242);
  const routes = T.ROUTES.slice(0, 6);
  for (let lib = 0; lib < 40; lib++) {
    const rules = randomLibrary(r, 50).map((x) => ({ ...x, then: x.then === 'bad' ? 'bad' : routes[Math.floor(r() * routes.length)] }));
    const cat = catalogue(rules);
    for (let q = 0; q < 40; q++) {
      const words = randomTokens(r);
      const units = T.routeUnits({ id: 'q' + q, text: words.join(' '), intent: T.INTENTS[Math.floor(r() * 6)] });
      assert.deepEqual(T.route(rules, units, cat), T.route(rules, units));
      for (const task of routes) {
        assert.deepEqual(T.pick(rules, task, units[task], cat), T.pick(rules, task, units[task]));
        assert.deepEqual(E.pick(rules, task, units[task], cat), E.pick(rules, task, units[task]));
      }
    }
    const ids = ['a', 'b', 'c'];
    const U = Object.fromEntries(ids.map((id) => [id, T.routeUnits({ id, text: randomTokens(r).join(' '), intent: T.INTENTS[0] })]));
    assert.deepEqual(T.routeOn(rules, U, ids), (() => {
      const t = { queries: 0, routed: 0, right: 0, conflicts: 0, baseRouted: 0, baseRight: 0 };
      for (const id of ids) { t.queries++; const a = T.route(rules, U[id]), k = T.keywordRoute(U[id]); if (a) { t.routed++; if (a.right) t.right++; if (a.also.length) t.conflicts++; } if (k) { t.baseRouted++; if (k.right) t.baseRight++; } }
      return t;
    })());
  }
  const rules = [R(['card'], T.ROUTES[0])];
  const cat = catalogue(rules);
  const other = [R(['pin'], T.ROUTES[1])];
  const u = T.routeUnits({ id: 'z', text: 'pin', intent: T.INTENTS[1] });
  assert.equal(T.route(other, u, cat).route, T.ROUTES[1], 'a catalogue of another library is ignored, so the answer is still right');
  assert.deepEqual(T.pick(other, T.ROUTES[1], u[T.ROUTES[1]], cat).rule, other[0]);
  assert.deepEqual(E.pick(other, T.ROUTES[1], u[T.ROUTES[1]], cat).rule, other[0]);
  assert.equal(E.pick(rules, T.ROUTES[0], [null, ...u[T.ROUTES[0]]], cat), null, 'no unit with the word: nothing');
  assert.equal(T.pick(rules, T.ROUTES[0], [null], cat), null);
});

test('total: no function throws on garbage', () => {
  const circular = {}; circular.self = circular;
  const toxic = { get when() { throw new Error('t'); }, get tokens() { throw new Error('t'); }, get rules() { throw new Error('t'); }, toString() { throw new Error('t'); } };
  const inputs = [null, undefined, NaN, '', 'x', [], {}, true, 10n, () => {}, circular, toxic, [toxic], { filed: toxic }, -1];
  for (const [name, fn] of Object.entries(C)) {
    if (typeof fn !== 'function') continue;
    for (const a of inputs) for (const b of inputs.slice(0, 6)) assert.doesNotThrow(() => fn(a, b, b), name);
  }
});
