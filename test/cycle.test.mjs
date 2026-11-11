// test/cycle.test.mjs — one night's growth on synthetic units (no CUAD text): the fresh-exam schedule, both gates,
// the exam, the meter and the signed receipt, the miners, the recipe lookup and the prompt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Y from '../src/cycle.mjs';
import P from '../vendor/patlib/patlib.mjs';

// a unit as extract.mjs makes it: id, words, the experts' verdict, and the law's label for its task
const U = (task, id, tokens, right, kw) => ({ id, tokens, right, label: right ? task : 'other', kw: kw === true, value: id });
// a world: n documents; each document gets a date-like task 'agreement-date' with three units, the second marked by
// 'dated' and right except in every tenth document; the first unit (the cheap baseline's) is right only where base(i)
function world(n, { base = () => false, extra = () => [] } = {}) {
  const units = {}, ids = [];
  for (let i = 0; i < n; i++) {
    const d = 'doc' + String(i).padStart(3, '0');
    ids.push(d);
    units[d] = {
      'agreement-date': [
        U('agreement-date', d + '.0', ['zfirst', 'zhead', 'recitals'], base(i)),
        U('agreement-date', d + '.1', ['dated', 'made'], i % 10 !== 9),
        U('agreement-date', d + '.2', ['signed', 'ztail'], false),
        ...extra(i, d),
      ],
    };
  }
  return { units, ids };
}
const prov = { source: 'mined', model: 'none', proposedAt: '2026-11-10T00:00:00Z', feed: 'test', trainN: 1 };

test('schedule: one fixed order, then the meter, the seed, whole batches, the spare', () => {
  const ids = Array.from({ length: 12 }, (_, i) => 'id' + i);
  const s = { meter: 2, seed: 3, batch: 2, salt: 't:' };
  const pl = Y.schedule([...ids, 'id3', null, '', 7], s);
  const want = [...ids].sort((a, b) => P.fnv('t:' + a) - P.fnv('t:' + b));
  assert.deepEqual(pl.order, want);
  assert.deepEqual(pl.meter, want.slice(0, 2));
  assert.deepEqual(pl.seed, want.slice(2, 5));
  assert.deepEqual(pl.batches, [want.slice(5, 7), want.slice(7, 9), want.slice(9, 11)]);
  assert.deepEqual(pl.spare, want.slice(11));
  assert.equal(Y.schedule(ids.slice(0, 11), s).batches.length, 3);
  assert.equal(Y.schedule(ids.slice(0, 11), s).spare.length, 0);
  // a hash tie is broken by code-point order: "1wu1i21" and "5rukbm" collide under the salt 't:'
  assert.equal(P.fnv('t:1wu1i21'), P.fnv('t:5rukbm'));
  assert.deepEqual(Y.schedule(['5rukbm', '1wu1i21'], { meter: 2, seed: 0, batch: 1, salt: 't:' }).meter, ['1wu1i21', '5rukbm']);
  assert.deepEqual(Y.schedule(['1wu1i21', '5rukbm'], { meter: 2, seed: 0, batch: 1, salt: 't:' }).meter, ['1wu1i21', '5rukbm']);
  assert.deepEqual(Y.schedule(null).order, []);
  assert.equal(Y.schedule(ids, null).meter.length, 12);
  const real = Y.schedule(Array.from({ length: 510 }, (_, i) => 'c' + i));
  assert.deepEqual([real.meter.length, real.seed.length, real.batches.length, real.spare.length], [60, 150, 15, 0]);
});

test('slicesFor: cycle n gates on batches 2n and 2n+1, trains on the seed and every batch before; none left → null', () => {
  const plan = { seed: ['s1'], batches: [['b0'], ['b1'], ['b2'], ['b3'], ['b4']] };
  assert.deepEqual(Y.slicesFor(plan, 0), { cycle: 0, train: ['s1'], held: ['b0'], final: ['b1'] });
  assert.deepEqual(Y.slicesFor(plan, 1), { cycle: 1, train: ['s1', 'b0', 'b1'], held: ['b2'], final: ['b3'] });
  assert.equal(Y.slicesFor(plan, 2), null);
  assert.equal(Y.slicesFor({ seed: [], batches: [['a'], ['b'], ['c']] }, 1), null);
  assert.equal(Y.slicesFor(plan, -1), null);
  assert.equal(Y.slicesFor(plan, 1.5), null);
  assert.equal(Y.slicesFor(null, 0), null);
  assert.deepEqual(Y.slicesFor({ batches: [['x'], ['y']] }, 0), { cycle: 0, train: [], held: ['x'], final: ['y'] });
});

test('casesFor: units are the law\'s cases as they are; foreign shapes are converted; junk skipped', () => {
  const { units, ids } = world(2);
  const c = Y.casesFor(units, ids, 'agreement-date', 'held');
  assert.equal(c.length, 6);
  assert.equal(c[1], units[ids[0]]['agreement-date'][1]);
  units.x = { t: [{ id: 'q', tokens: ['a'], right: true }, null] };
  assert.deepEqual(Y.casesFor(units, ['x'], 't', 'final'), [{ id: 'q', tokens: ['a'], label: 't', slice: 'final' }]);
  assert.deepEqual(Y.casesFor(null, ids, 't', 'held'), []);
  assert.deepEqual(Y.casesFor(units, ['missing'], 't', 'held'), []);
});

test('fieldGate: decides, right often enough, beats the baseline on the same documents; exact bars pass', () => {
  const r = { when: ['dated'], then: 'agreement-date' };
  const bar = { docs: 3, prec: 0.8, margin: 0.1 };
  const w10 = world(10);                                       // right in 9 of 10, baseline 0
  const g = Y.fieldGate(r, 'agreement-date', w10.units, w10.ids, bar);
  assert.deepEqual([g.ok, g.docs, g.right, g.base, g.rightRate, g.baseRate], [true, 10, 9, 0, 0.9, 0]);
  const w3 = world(3);
  assert.equal(Y.fieldGate(r, 'agreement-date', w3.units, w3.ids, bar).ok, true);     // exactly 3 documents
  const w2 = world(2);
  assert.match(Y.fieldGate(r, 'agreement-date', w2.units, w2.ids, bar).why, /^decides 2 documents, needs 3$/);
  // exactly 0.8 right passes; under it fails
  const w5 = world(5, { extra: () => [] });
  w5.units[w5.ids[0]]['agreement-date'][1].right = false;
  assert.equal(Y.fieldGate(r, 'agreement-date', w5.units, w5.ids, bar).ok, true);     // 4 of 5
  w5.units[w5.ids[1]]['agreement-date'][1].right = false;
  assert.match(Y.fieldGate(r, 'agreement-date', w5.units, w5.ids, bar).why, /^right in 3 of 5 documents, needs 0.8$/);
  // the margin, exactly 0.1 over 30 documents (0.1 × 30 is not 3 in floating point): passes; 0.0667 fails
  const w30 = world(30, { base: (i) => i < 24 });
  for (const d of w30.ids) w30.units[d]['agreement-date'][1].right = true;
  w30.units[w30.ids[0]]['agreement-date'][1].right = false;
  w30.units[w30.ids[1]]['agreement-date'][1].right = false;
  w30.units[w30.ids[2]]['agreement-date'][1].right = false;   // 27 right, baseline 24: margin 0.1 exactly
  assert.equal(Y.fieldGate(r, 'agreement-date', w30.units, w30.ids, bar).ok, true);
  w30.units[w30.ids[29]]['agreement-date'][0].right = true;   // baseline 25: margin 0.0667
  const f = Y.fieldGate(r, 'agreement-date', w30.units, w30.ids, bar);
  assert.match(f.why, /^beats the cheap baseline by 0\.067 on those documents, needs 0\.1$/);
  assert.equal(f.ok, false);
  // documents where the rule does not fire are not counted; junk units skipped; a default bar
  const wn = world(4);
  wn.units[wn.ids[0]]['agreement-date'] = [null, U('agreement-date', 'z', ['other'], true)];
  assert.equal(Y.fieldGate(r, 'agreement-date', wn.units, wn.ids, null).docs, 3);
  assert.equal(Y.fieldGate(r, 'agreement-date', null, wn.ids, bar).docs, 0);
  assert.equal(Y.fieldGate(r, 'agreement-date', wn.units, null, bar).docs, 0);
});

test('admit: the law\'s gate first, then the field gate on held-out and on the final exam', () => {
  const { units, ids } = world(40);
  const slices = { train: ids.slice(0, 20), held: ids.slice(20, 30), final: ids.slice(30, 40) };
  const ok = Y.admit({ when: ['dated'], then: 'agreement-date', prov }, units, slices, [], {});
  assert.equal(ok.ok, true);
  assert.equal(ok.why, 'kept');
  assert.match(ok.receipt, /^[0-9a-f]{8}$/);
  assert.deepEqual([ok.scores.heldDocs.docs, ok.scores.finalDocs.docs, ok.scores.held.cover], [10, 10, 10]);
  assert.equal(Y.admit({ when: ['bad word'], then: 'agreement-date', prov }, units, slices, []).why, 'not a rule: WHEN token [AND token] THEN label');
  assert.equal(Y.admit(null, units, slices, []).why, 'not a rule: WHEN token [AND token] THEN label');
  assert.equal(Y.admit({ when: ['dated'], then: 'nosuch', prov }, units, slices, []).why, 'no such task: nosuch');
  assert.equal(Y.admit({ when: ['dated'], then: 'agreement-date', prov }, units, null, []).why, 'no slices for this cycle');
  assert.match(Y.admit({ when: ['dated'], then: 'agreement-date' }, units, slices, []).why, /^no provenance/);
  assert.match(Y.admit({ when: ['dated'], then: 'agreement-date', prov }, units, slices, [{ when: ['dated'], then: 'agreement-date' }]).why, /^a duplicate/);
  // another task's rule in the library does not count as a duplicate
  assert.equal(Y.admit({ when: ['dated'], then: 'agreement-date', prov }, units, slices, [{ when: ['dated'], then: 'effective-date' }, null]).ok, true);
  // the law's gate passes but the cheap baseline is as good on the held-out documents
  const wb = world(40, { base: () => true, extra: (i, d) => [3, 4, 5, 6].map((k) => U('agreement-date', d + '.' + k, ['filler'], false)) });
  const b = Y.admit({ when: ['dated'], then: 'agreement-date', prov }, wb.units, slices, []);
  assert.match(b.why, /^held-out documents: beats the cheap baseline by -0\.100 on those documents/);
  // the held-out documents pass but the final exam's do not: there the cheap baseline is right too
  const wf = world(40, { base: (i) => i >= 30 });
  assert.match(Y.admit({ when: ['dated'], then: 'agreement-date', prov }, wf.units, slices, []).why, /^final-exam documents: beats the cheap baseline by/);
  // the law's own held-out bar
  const wl = world(40);
  for (const d of wl.ids) for (const u of wl.units[d]['agreement-date']) if (u.id.endsWith('.1')) { u.right = false; u.label = 'other'; }
  assert.match(Y.admit({ when: ['dated'], then: 'agreement-date', prov }, wl.units, slices, []).why, /^held-out: right 0 of 10/);
  // the context is cached per task
  const cache = {};
  Y.admit({ when: ['dated'], then: 'agreement-date', prov }, units, slices, [], cache);
  assert.deepEqual(Object.keys(cache), ['agreement-date']);
  assert.equal(cache['agreement-date'].slices.held.length, 30);
  const again = Y.contextFor(units, slices, 'agreement-date');
  assert.equal(again.task, 'agreement-date');
  assert.deepEqual([again.slices.train.length, again.slices.final.length], [60, 30]);
});

test('grow: each proposal against the growing library; drops logged with source and reason', () => {
  const { units, ids } = world(40);
  const slices = { train: ids.slice(0, 20), held: ids.slice(20, 30), final: ids.slice(30, 40) };
  const p = { when: ['dated'], then: 'agreement-date', prov };
  const g = Y.grow(units, slices, [p, { ...p }, { when: ['made'], then: 'agreement-date', prov: { ...prov, source: '7b' } }, null, 'junk'], [null, { when: ['x x'], then: 'a' }]);
  assert.equal(g.promoted.length, 1);
  assert.deepEqual(g.promoted[0].when, ['dated']);
  assert.equal(g.promoted[0].prov, prov);
  assert.equal(g.library.length, 1);
  assert.deepEqual(g.dropped.map((d) => [d.rule, d.source]), [['dated=>agreement-date', 'mined'], ['made=>agreement-date', '7b'], ['null', ''], ['junk', '']]);
  assert.match(g.dropped[0].why, /^a duplicate/);
  assert.match(g.dropped[1].why, /^a near-duplicate/);
  assert.deepEqual(Y.grow(units, slices, null, null), { promoted: [], dropped: [], library: [] });
});

test('examine and meter: answered, right, the baseline on the same cases; coverage and precision', () => {
  const { units, ids } = world(10, { base: (i) => i < 3 });
  const lib = [{ when: ['dated'], then: 'agreement-date' }];
  const e = Y.examine(lib, ['agreement-date', 'party'], units, ids);
  assert.deepEqual(e.per['agreement-date'], { cases: 10, answered: 10, right: 9, baseRight: 3, withGold: 9 });
  assert.deepEqual(e.per.party, { cases: 10, answered: 0, right: 0, baseRight: 0, withGold: 0 });
  assert.deepEqual(e.total, { cases: 20, answered: 10, right: 9, baseRight: 3, withGold: 9 });
  const m = Y.meter(lib, ['agreement-date', 'party'], units, ids);
  assert.deepEqual([m.coverage, m.precision, m.answered, m.cases], [0.5, 0.9, 10, 20]);
  const none = Y.meter([], ['agreement-date'], units, ids);
  assert.deepEqual([none.coverage, none.precision], [0, null]);
  assert.deepEqual([Y.meter(lib, [], units, ids).coverage], [0]);
  units[ids[0]]['agreement-date'] = [U('agreement-date', 'n', ['nothing'], false)];
  assert.equal(Y.examine(lib, ['agreement-date'], units, ids).per['agreement-date'].withGold, 8);
  assert.equal(Y.examine(lib, ['agreement-date'], null, ids).per['agreement-date'].cases, 10);
});

test('receipt: judged and signed by the baseline agreement; nothing answered is INSUFFICIENT', () => {
  const r = Y.receipt({ total: { answered: 30, right: 28, baseRight: 10 } });
  assert.deepEqual([r.ok, r.decision, r.beats, r.answered, r.right, r.baseRight], [true, 'PROMOTE', true, 30, 28, 10]);
  assert.match(r.receipt, /^[0-9a-f]{64}$/);
  assert.equal(Y.receipt({ total: { answered: 30, right: 28, baseRight: 10 } }).receipt, r.receipt);
  assert.equal(r.rate, 0.933333);
  assert.equal(r.baseRate, 0.333333);
  assert.equal(Y.receipt({ total: { answered: 30, right: 20, baseRight: 19 } }).decision, 'DROP');
  assert.equal(Y.receipt({ total: { answered: 19, right: 19, baseRight: 0 } }).decision, 'INSUFFICIENT');
  assert.equal(Y.receipt({ total: { answered: 20, right: 20, baseRight: 0 } }).decision, 'PROMOTE');
  const z = Y.receipt({ total: { answered: 0, right: 0, baseRight: 0 } });
  assert.deepEqual([z.ok, z.decision, z.answered], [false, 'INSUFFICIENT', 0]);
  assert.equal(Y.receipt(null).why, 'an exam with totals');
  assert.equal(Y.receipt({ total: { answered: 1.5 } }).why, 'an exam with totals');
  assert.match(Y.receipt({ total: { answered: 5, right: 9, baseRight: 0 } }).why, /^the outcome/);
  assert.notEqual(Y.receipt({ total: { answered: 30, right: 28, baseRight: 10 } }, 'other job').receipt, r.receipt);
});

test('minePairs: two words that together pick out the task, the most precise first', () => {
  const cases = [];
  const add = (n, tokens, label) => { for (let i = 0; i < n; i++) cases.push({ id: tokens.join('-') + i + label, tokens, label }); };
  add(6, ['aaa', 'bbb'], 't'); add(1, ['aaa', 'bbb'], 'other');
  add(5, ['aaa', 'ccc'], 't'); add(5, ['bbb', 'ccc'], 't');
  add(4, ['aaa', 'ddd'], 't');
  add(30, ['zzz'], 'other');
  const m = Y.minePairs(cases, 't', 3);
  assert.deepEqual(m.map((r) => P.ruleKey(r)), ['aaa+ccc=>t', 'bbb+ccc=>t', 'aaa+bbb=>t']);
  assert.ok(!Y.minePairs(cases, 't', 10).some((r) => P.ruleKey(r) === 'aaa+ddd=>t'));
  assert.deepEqual(Y.minePairs(cases, 't', 0), []);
  assert.deepEqual(Y.minePairs(cases, 't').length, 2);
  // exactly five cases is enough; four is not; a pair with no right case is not proposed
  const five = [];
  for (let i = 0; i < 5; i++) five.push({ id: 'f' + i, tokens: ['ppp', 'qqq'], label: 'u' });
  for (let i = 0; i < 5; i++) five.push({ id: 'g' + i, tokens: ['ppp'], label: 'u' }, { id: 'h' + i, tokens: ['qqq'], label: 'u' });
  assert.deepEqual(Y.minePairs(five, 'u', 5).map((r) => P.ruleKey(r)), ['ppp+qqq=>u']);
  assert.deepEqual(Y.minePairs(five.slice(1), 'u', 5), []);
  const wrong = [];
  for (let i = 0; i < 6; i++) wrong.push({ id: 'w' + i, tokens: ['rrr', 'sss'], label: 'other' }, { id: 'v' + i, tokens: ['rrr'], label: 'x' }, { id: 'y' + i, tokens: ['sss'], label: 'x' });
  assert.deepEqual(Y.minePairs(wrong, 'x', 5), []);
  // equal precision: more right first, then the key
  const tie = [];
  for (let i = 0; i < 10; i++) tie.push({ id: 'a' + i, tokens: ['kkk', 'mmm'], label: 'v' });
  for (let i = 0; i < 5; i++) tie.push({ id: 'b' + i, tokens: ['jjj', 'kkk'], label: 'v' }, { id: 'c' + i, tokens: ['jjj', 'lll'], label: 'v' }, { id: 'd' + i, tokens: ['lll'], label: 'v' }, { id: 'e' + i, tokens: ['mmm'], label: 'v' });
  assert.deepEqual(Y.minePairs(tie, 'v', 3).map((r) => P.ruleKey(r)), ['kkk+mmm=>v', 'jjj+kkk=>v', 'jjj+lll=>v']);
  assert.deepEqual(Y.minePairs([null, { tokens: 'x' }], 'v', 3), []);
});

test('recipe: words that worked for a sibling task of the same kind, most recent first, at most four, no repeats', () => {
  const rec = (task, type, when) => ({ task, type, rule: { when, then: task } });
  const records = [rec('agreement-date', 'date', ['dated']), rec('governing-law', 'place', ['laws']), rec('effective-date', 'date', ['effective']),
    rec('expiration-date', 'date', ['dated']), rec('expiration-date', 'date', ['expire']), rec('agreement-date', 'date', ['made']), null, { task: 'x', type: 'date', rule: { when: ['bad word'], then: 'x' } }, { task: 'x', type: 'date' }];
  const r = Y.recipe(records, 'agreement-date', 'date');
  assert.deepEqual(r.map((x) => [x.when[0], x.then, x.from]), [['expire', 'agreement-date', 'expiration-date'], ['dated', 'agreement-date', 'expiration-date'], ['effective', 'agreement-date', 'effective-date']]);
  const many = Array.from({ length: 6 }, (_, i) => rec('t' + i, 'date', ['w' + i + 'x']));
  assert.deepEqual(Y.recipe(many, 'new', 'date').map((x) => x.when[0]), ['w5x', 'w4x', 'w3x', 'w2x']);
  assert.deepEqual(Y.recipe(null, 'a', 'date'), []);
  assert.deepEqual(Y.recipe(records, 'governing-law', 'place'), []);
});

test('promptFor and proposalsOf: what the model is asked, and only its rules for this task', () => {
  const cases = [];
  for (let i = 0; i < 25; i++) cases.push({ id: 'p' + i, tokens: ['dated', 'w' + i], label: 'agreement-date' }, { id: 'n' + i, tokens: ['signed', 'v' + i], label: 'other' });
  cases.push({ id: 'empty', tokens: [], label: 'agreement-date' });
  const a = Y.promptFor('agreement-date', cases, 3), b = Y.promptFor('agreement-date', cases, 3), c = Y.promptFor('agreement-date', cases, 4);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /the words around a candidate date in commercial contracts/);
  assert.match(a, /IS the "agreement-date"/);
  assert.equal(a.split('\n').filter((l) => l.startsWith('dated ')).length, 20);
  assert.equal(a.split('\n').filter((l) => l.startsWith('signed ')).length, 20);
  assert.match(Y.promptFor('insurance', cases, 3), /sentences of commercial contracts/);
  assert.match(Y.promptFor('agreement-date', null, 3), /IS the/);
  const long = Array.from({ length: 30 }, (_, i) => 'k' + i + 'x');
  assert.equal(Y.promptFor('party', [{ id: 'l', tokens: long, label: 'party' }], 1).split('\n').find((l) => l.startsWith('k0x')).split(' ').length, 16);
  // a hash tie in the sample order is broken by code point: "76mmiq" and "2391dx" collide under the salt 3
  assert.equal(P.fnv('76mmiq:3'), P.fnv('2391dx:3'));
  const t1 = Y.promptFor('party', [{ id: '76mmiq', tokens: ['first'], label: 'party' }, { id: '2391dx', tokens: ['second'], label: 'party' }], 3);
  const t2 = Y.promptFor('party', [{ id: '2391dx', tokens: ['second'], label: 'party' }, { id: '76mmiq', tokens: ['first'], label: 'party' }], 3);
  assert.equal(t1, t2);
  assert.ok(t1.indexOf('\nsecond\n') < t1.indexOf('\nfirst\n'));
  assert.deepEqual(Y.proposalsOf('WHEN dated THEN agreement-date\nWHEN laws THEN governing-law\nWHEN made AND entered THEN agreement-date\nnonsense', 'agreement-date').map((r) => P.ruleKey(r)), ['dated=>agreement-date', 'entered+made=>agreement-date']);
  assert.deepEqual(Y.proposalsOf(null, 'x'), []);
});

test('mineCover: common words right at least 80% of the time on training, the most-used first', () => {
  const cases = [];
  const add = (n, tokens, label) => { for (let i = 0; i < n; i++) cases.push({ id: tokens.join('-') + i + label + cases.length, tokens, label }); };
  add(8, ['aaa'], 't'); add(2, ['aaa'], 'other');          // 8/10: exactly 0.8, kept
  add(20, ['bbb'], 't'); add(6, ['bbb'], 'other');         // 20/26: 0.77, not kept
  add(4, ['ccc'], 't'); add(1, ['ccc'], 'other');          // 4/5: exactly 0.8 and exactly five, kept
  add(4, ['ddd'], 't');                                    // 4/4: under five, not kept
  add(9, ['eee'], 't'); add(1, ['eee'], 'other');          // 9/10
  add(8, ['fff'], 't'); add(1, ['fff'], 'other');          // 8/9: same right as aaa, more precise, so before it
  add(30, ['zzz'], 'other');
  assert.deepEqual(Y.mineCover(cases, 't', 9).map((r) => r.when[0]), ['eee', 'fff', 'aaa', 'ccc']);
  assert.deepEqual(Y.mineCover(cases, 't').map((r) => r.when[0]), ['eee', 'fff', 'aaa']);
  assert.deepEqual(Y.mineCover(cases, 't', 0), []);
  assert.deepEqual(Y.mineCover(cases, 't', 1)[0], { when: ['eee'], then: 't' });
  const tie = [];
  for (const w of ['qqq', 'ppp']) for (let i = 0; i < 5; i++) tie.push({ id: w + i, tokens: [w], label: 'u' });
  assert.deepEqual(Y.mineCover(tie, 'u', 2).map((r) => r.when[0]), ['ppp', 'qqq']);
  assert.deepEqual(Y.mineCover([...tie].reverse(), 'u', 2).map((r) => r.when[0]), ['ppp', 'qqq']);
  assert.deepEqual(Y.mineCover([null, { tokens: 'x' }, { tokens: ['aaa'] }], 't', 3), []);
  assert.deepEqual(Y.mineCover(null, 't', 3), []);
});

// ── library 2 (SEAL 2): the same cycle over the finance domain, where line items have many answers per receipt ──
import F from '../src/finance.mjs';
const Q = Y.cycleFor(F.DOMAIN);
// a receipt's item-price units: tokens, right (inside a menu.price word), kw (the cheap baseline calls it a line item)
const I = (id, tokens, right, kw) => ({ id, tokens, right, label: right ? 'item-price' : 'other', kw, value: 1 });

test('library 2: a line-item pattern is judged on every amount it picks, against every amount the cheap method picks', () => {
  const units = {
    a: { 'item-price': [I('a0', ['zend', 'ztop'], true, true), I('a1', ['zend', 'ztop'], true, true), I('a2', ['ztop'], false, true)] },
    b: { 'item-price': [I('b0', ['zend', 'ztop'], true, true), I('b1', ['zend', 'ztop'], false, true)] },
    c: { 'item-price': [I('c0', ['zend', 'ztop'], true, true), I('c1', ['zlow'], false, false)] },
    d: { 'item-price': [I('d0', ['zlow'], false, false)] },
  };
  const g = Q.fieldGate({ when: ['zend', 'ztop'], then: 'item-price' }, 'item-price', units, ['a', 'b', 'c', 'd'], { docs: 3, prec: 0.8, margin: 0.1 });
  // picked 5 (4 right); the cheap method picked 6 on those three receipts (4 right): 0.8 vs 0.667
  assert.deepEqual(g, { ok: true, docs: 3, right: 4, base: 4, rightRate: 0.8, baseRate: 0.666667, picked: 5, basePicked: 6, why: '' });
  const g2 = Q.fieldGate({ when: ['zend', 'ztop'], then: 'item-price' }, 'item-price', units, ['a', 'b', 'c'], { docs: 3, prec: 0.9, margin: 0.1 });
  assert.equal(g2.why, 'right on 4 of the 5 candidates it picks, needs 0.9');
  const g3 = Q.fieldGate({ when: ['zend', 'ztop'], then: 'item-price' }, 'item-price', units, ['a', 'b', 'c'], { docs: 3, prec: 0.8, margin: 0.14 });
  assert.match(g3.why, /^beats the cheap baseline by 0\.133 on those documents, needs 0\.14$/);
  // the cheap method picks nothing on these receipts: its rate is 0, and the margin is measured from 0
  const none = { e: { 'item-price': [I('e0', ['x'], true, false), I('e1', ['x'], false, false)] } };
  assert.deepEqual(Q.fieldGate({ when: ['x'], then: 'item-price' }, 'item-price', none, ['e'], { docs: 1, prec: 0, margin: 0.6 }).ok, false);
  assert.deepEqual(Q.fieldGate({ when: ['x'], then: 'item-price' }, 'item-price', none, ['e'], { docs: 1, prec: 0, margin: 0.5 }).ok, true);
  // a field of the same library is still one pick per receipt, with no picked counts in its record
  const t = { a: { total: [{ id: 't0', tokens: ['total'], right: true, label: 'total', kw: true }, { id: 't1', tokens: ['total'], right: false, label: 'other', kw: false }] } };
  assert.deepEqual(Q.fieldGate({ when: ['total'], then: 'total' }, 'total', t, ['a'], { docs: 1, prec: 0.8, margin: 0 }), { ok: true, docs: 1, right: 1, base: 1, rightRate: 1, baseRate: 1, why: '' });
});

test('library 2: line items are right on the meter only when exactly the experts\' items; its exam signs as receipt reading', () => {
  const units = {
    a: { 'item-price': [I('a0', ['zend'], true, true), I('a1', ['zend'], true, true), I('a2', ['zlow'], false, false)] },   // exact
    b: { 'item-price': [I('b0', ['zend'], true, true), I('b1', ['zmid'], true, true)] },                                   // one missed
    c: { 'item-price': [I('c0', ['zend'], true, true), I('c1', ['zend'], false, true)] },                                   // one extra
    d: { 'item-price': [I('d0', ['zlow'], false, false)] },                                                                 // none picked
  };
  const e = Q.examine([{ when: ['zend'], then: 'item-price' }], ['item-price'], units, ['a', 'b', 'c', 'd']);
  assert.deepEqual(e.per['item-price'], { cases: 4, answered: 3, right: 1, baseRight: 2, withGold: 3 });
  const m = Q.meter([{ when: ['zend'], then: 'item-price' }], ['item-price'], units, ['a', 'b', 'c', 'd']);
  assert.deepEqual([m.coverage, m.precision], [0.75, 0.333333]);
  assert.equal(Q.admit({ when: ['zend'], then: 'party', prov: {} }, units, {}, []).why, 'no such task: party');
  assert.match(Q.promptFor('total', [{ id: 'x', tokens: ['total', 'zend'], label: 'total' }], 0), /^You write extraction rules\. Each line below is the words on one row of a receipt around one amount/);
  const many = Array.from({ length: 30 }, (_, i) => 'r' + i);
  const ex = { total: { cases: 30, answered: 30, right: 29, baseRight: 10, withGold: 30 } };
  const r = Q.receipt({ total: ex.total });
  assert.equal(r.ok, true);
  assert.notEqual(r.receipt, Y.receipt({ total: ex.total }).receipt, 'library 2 signs its own job, data and cheap method');
  assert.equal(many.length, 30);
});

// ── seal 4: the SHA-256 order for row-numbered ids ──
import { createHash } from 'node:crypto';
test('seal 4: a schedule with hash sha256 orders by the SHA-256 hex of salt + id (as Node computes it); without it, FNV-1a as sealed', () => {
  const ids = Array.from({ length: 30 }, (_, i) => 'train-' + String(i).padStart(3, '0'));
  const s = { meter: 5, seed: 5, batch: 10, salt: 'cord:', hash: 'sha256' };
  const hex = (x) => createHash('sha256').update(x, 'utf8').digest('hex');
  const want = [...ids].sort((a, b) => (hex('cord:' + a) < hex('cord:' + b) ? -1 : 1));
  const p = Y.schedule([...ids, ...ids, '', 5], s);
  assert.deepEqual(p.order, want);
  assert.notDeepEqual(p.order, ids, 'not the id order');
  assert.notDeepEqual(p.order, Y.schedule(ids, { ...s, hash: undefined }).order, 'not the FNV order');
  assert.deepEqual([p.meter, p.seed, p.batches, p.spare], [want.slice(0, 5), want.slice(5, 10), [want.slice(10, 20), want.slice(20, 30)], []]);
  assert.deepEqual(Y.schedule(['é-1', 'é-2'], { ...s, salt: 'ü:' }).order, ['é-1', 'é-2'].sort((a, b) => (hex('ü:' + a) < hex('ü:' + b) ? -1 : 1)), 'UTF-8 bytes');
  assert.deepEqual(Y.schedule(ids).order, Y.schedule(ids, Y.SCHEDULE).order, 'library 1 keeps FNV-1a');
});
