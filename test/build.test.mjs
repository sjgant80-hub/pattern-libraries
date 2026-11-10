// test/build.test.mjs — the build-pattern library: how-it-was-built records, the 7B's turn, the wall's evidence, spend
// per kept pattern, and Kar's own build checks with their lookup.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import B from '../src/build.mjs';

const kept = (when, then, source, recipe) => ({ when, then, receipt: 'r' + when.join(''), prov: { source, recipe } });

test('recordsOf: one record per kept pattern; a tier\'s cost shared by the patterns it kept', () => {
  const promoted = [kept(['dated'], 'agreement-date', 'mined', 'mine-1'), kept(['made'], 'agreement-date', '7b', 'prompt-v1 salt 0'),
    kept(['entered'], 'agreement-date', '7b'), kept(['laws'], 'governing-law', 'oauth', 'x'), kept(['odd'], 'party', 'mystery'), null, { when: ['x'], then: 'y' }, { when: ['bad word'], then: 'y', prov: {} }];
  const cost = { 'agreement-date': { '7b': { calls: 2, cents: 0 } }, 'governing-law': { oauth: { calls: 1, cents: 9 } } };
  const r = B.recordsOf(promoted, { library: 'doc', cycle: 3, at: 'T', typeOf: (t) => (t === 'governing-law' ? 'place' : 'date'), cost });
  assert.equal(r.length, 5);
  assert.deepEqual(r[0], { library: 'doc', task: 'agreement-date', type: 'date', tier: 'mined', recipe: 'mine-1', cost: { calls: 0, cents: 0 }, cycle: 3, at: 'T', rule: { when: ['dated'], then: 'agreement-date' }, receipt: 'rdated' });
  assert.deepEqual([r[1].cost, r[2].cost, r[2].recipe], [{ calls: 1, cents: 0 }, { calls: 1, cents: 0 }, '7b']);
  assert.deepEqual([r[3].tier, r[3].type, r[3].cost], ['oauth', 'place', { calls: 1, cents: 9 }]);
  assert.deepEqual([r[4].tier, r[4].cost], ['mined', { calls: 0, cents: 0 }]);
  const bare = B.recordsOf([kept(['dated'], 'a', 'mined')], null);
  assert.deepEqual([bare[0].library, bare[0].type, bare[0].cycle, bare[0].at, bare[0].receipt], ['', null, null, '', 'rdated']);
  assert.equal(B.recordsOf([{ ...kept(['dated'], 'a', 'mined'), receipt: 5 }], { cycle: 1.5 })[0].cycle, null);
  assert.deepEqual(B.recordsOf([kept(['dated'], 'a', '7b')], { cost: { a: { '7b': { calls: -1, cents: 2.5 } } } })[0].cost, { calls: 0, cents: 0 });
  assert.deepEqual(B.recordsOf(null, null), []);
});

test('order7b: only tasks the free tiers kept nothing for, rotated by the cycle, at most max', () => {
  const tasks = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(B.order7b(tasks, { b: 1 }, 0, 2), ['a', 'c']);
  assert.deepEqual(B.order7b(tasks, { b: 1 }, 1, 2), ['d', 'e']);
  assert.deepEqual(B.order7b(tasks, { b: 1 }, 2, 2), ['a', 'c']);
  assert.deepEqual(B.order7b(tasks, { b: 1 }, 1, 3), ['e', 'a', 'c']);
  assert.deepEqual(B.order7b(tasks, { b: 0 }, 0, 9), tasks);
  assert.deepEqual(B.order7b(tasks, { a: 1, b: 1, c: 1, d: 1, e: 1 }, 0, 6), []);
  assert.deepEqual(B.order7b(tasks, null, -3, 2), ['a', 'b']);
  assert.deepEqual(B.order7b(tasks, {}, 1.5, 2), ['a', 'b']);
  assert.deepEqual(B.order7b(tasks, {}, 1, 0), []);
  assert.deepEqual(B.order7b([1, 'x'], {}, 0, 1), ['x']);
  assert.deepEqual(B.order7b(null, {}, 0, 1), []);
});

test('evidenceOf: the wall\'s own evidence shape', () => {
  const night = { keptFree: { a: 0, b: 2 }, tried7b: { a: 3 }, passed7b: { a: 0 }, model: 'qwen2.5:7b', dropped7b: { a: ['r1', 'r2', 3, 'r4', 'r5', 'r6', 'r7'] } };
  assert.deepEqual(B.evidenceOf('a', night), {
    tier1: { asked: true, answered: false, what: 'the recipe lookup and the miners for a' },
    tier2: { tried: 3, passed: 0, model: 'qwen2.5:7b', dropped: ['r1', 'r2', 'r4', 'r5', 'r6'] },
  });
  assert.equal(B.evidenceOf('b', night).tier1.answered, true);
  assert.deepEqual(B.evidenceOf('c', null), { tier1: { asked: true, answered: false, what: 'the recipe lookup and the miners for c' }, tier2: { tried: 0, passed: 0, model: null, dropped: [] } });
  assert.deepEqual(B.evidenceOf('c', { ...night, dropped7b: { c: 'x' } }).tier2.dropped, []);
});

test('isoWeek: the ISO week of a time', () => {
  assert.equal(B.isoWeek('2026-11-10T03:00:00Z'), '2026-W46');
  assert.equal(B.isoWeek('2026-11-09T00:00:00Z'), '2026-W46');
  assert.equal(B.isoWeek('2026-11-08T23:59:59Z'), '2026-W45');
  assert.equal(B.isoWeek('2021-01-03T12:00:00Z'), '2020-W53');
  assert.equal(B.isoWeek('2026-01-01T12:00:00Z'), '2026-W01');
  assert.equal(B.isoWeek('2026-12-31T12:00:00Z'), '2026-W53');
  assert.equal(B.isoWeek('2024-12-30T12:00:00Z'), '2025-W01');
  assert.equal(B.isoWeek('nope'), null);
  assert.equal(B.isoWeek(5), null);
});

test('spend and dropping: cents per kept pattern, per library, per week; P3 decided only over two credit weeks', () => {
  const calls = [{ library: 'doc', at: '2026-11-10T03:00:00Z', cents: 30 }, { library: 'doc', at: '2026-11-11T03:00:00Z', cents: 10 }, { library: 'doc', at: '2026-11-17T03:00:00Z', cents: 10 },
    { at: '2026-11-10T03:00:00Z', cents: 1.5 }, { library: 'doc', at: 'bad', cents: 9 }, null];
  const records = [{ library: 'doc', at: '2026-11-10T03:00:00Z', tier: 'oauth' }, { library: 'doc', at: '2026-11-10T03:00:00Z', tier: 'mined' },
    { library: 'doc', at: '2026-11-17T03:00:00Z', tier: 'mined' }, { library: 'doc', at: '2026-11-17T03:00:00Z', tier: 'mined' }, { library: 'fin', at: '2026-11-17T03:00:00Z', tier: 'mined' }, { at: 'x' }, null];
  const s = B.spend(records, calls);
  assert.deepEqual(s.doc['2026-W46'], { cents: 40, calls: 2, kept: 2, keptCredit: 1, perKept: 20 });
  assert.deepEqual(s.doc['2026-W47'], { cents: 10, calls: 1, kept: 2, keptCredit: 0, perKept: 5 });
  assert.deepEqual(s['?']['2026-W46'], { cents: 0, calls: 1, kept: 0, keptCredit: 0, perKept: null });
  assert.deepEqual(s.fin['2026-W47'], { cents: 0, calls: 0, kept: 1, keptCredit: 0, perKept: 0 });
  assert.deepEqual(B.spend(null, null), {});
  assert.equal(B.spend([], [{ library: 'x', at: '2026-11-10T00:00:00Z', cents: 1 }, { library: 'x', at: '2026-11-10T00:00:00Z', cents: 2 }]).x['2026-W46'].perKept, null);
  assert.equal(B.spend([{ library: 'x', at: '2026-11-10T00:00:00Z' }, { library: 'x', at: '2026-11-10T00:00:00Z' }, { library: 'x', at: '2026-11-10T00:00:00Z' }], [{ library: 'x', at: '2026-11-10T00:00:00Z', cents: 1 }]).x['2026-W46'].perKept, 0.33);
  assert.deepEqual(B.dropping(s.doc), { verdict: 'held', why: 'per kept pattern $0.20 then $0.05' });
  assert.deepEqual(B.dropping({ a: { calls: 1, cents: 5, kept: 1 }, b: { calls: 1, cents: 5, kept: 1 } }), { verdict: 'failed', why: 'per kept pattern $0.05 then $0.05' });
  assert.deepEqual(B.dropping({ a: { calls: 1, cents: 5, kept: 0 }, b: { calls: 1, cents: 5, kept: 1 } }), { verdict: 'held', why: 'per kept pattern nothing kept then $0.05' });
  assert.deepEqual(B.dropping({ a: { calls: 1, cents: 5, kept: 1 }, b: { calls: 1, cents: 5, kept: 0 } }), { verdict: 'failed', why: 'per kept pattern $0.05 then nothing kept' });
  assert.equal(B.dropping({ a: { calls: 1, cents: 5, kept: 1 } }).verdict, 'pending');
  assert.equal(B.dropping({ a: { calls: 1, cents: 5, kept: 1 }, b: { calls: 0, cents: 0, kept: 9 } }).why, '1 week(s) used the credit tier; two are needed');
  assert.equal(B.dropping(null).verdict, 'pending');
  assert.equal(B.dropping({ z: { calls: 1, cents: 1, kept: 1 }, a: { calls: 1, cents: 9, kept: 1 } }).verdict, 'held');
});

const MD = [
  '## first build 2026-10-14 — what it caught',
  '| a | b | CHECK: always run the witness on Windows after reaping orphan processes |',
  'nothing here',
  '- **2026-11-09 the 15× curve.** Caught on the rebuilds:',
  '  - (a) a token count needs no model. CHECK: read the model file tables before timing a prompt (b) next CHECK: cut verification texts only from sealed files',
  '## second build 2026-11-10',
  '- CHECK: always run the witness on Windows after reaping orphan processes first',
  '- CHECK: short',
].join('\n');

test('checksOf: every CHECK lesson with its build and date; near-duplicates merged into the first', () => {
  const c = B.checksOf(MD);
  assert.deepEqual(c.map((x) => [x.text, x.build, x.date]), [
    ['always run the witness on Windows after reaping orphan processes', 'first build 2026-10-14 — what it caught', '2026-10-14'],
    ['read the model file tables before timing a prompt', 'the 15× curve', '2026-11-09'],
    ['cut verification texts only from sealed files', 'the 15× curve', '2026-11-09'],
  ]);
  assert.deepEqual(c[0].seen, [{ build: 'second build 2026-11-10', date: '2026-11-10' }]);
  assert.match(c[0].id, /^chk-[0-9a-f]{8}$/);
  assert.ok(c[0].tokens.includes('witness'));
  assert.deepEqual(B.checksOf('## no date here\n- CHECK: a lesson long enough to keep it'), [{ id: B.checksOf('## x\n- CHECK: a lesson long enough to keep it')[0].id, text: 'a lesson long enough to keep it', build: 'no date here', date: '', tokens: ['lesson', 'long', 'enough', 'keep'], seen: [] }]);
  assert.equal(B.checksOf('- CHECK: ' + 'x'.repeat(19)).length, 0);
  assert.equal(B.checksOf('- CHECK: ' + 'x'.repeat(20)).length, 1);
  assert.equal(B.checksOf('- CHECK: ' + 'word '.repeat(200))[0].text.length, 400);
  assert.deepEqual(B.checksOf(null), []);
});

test('lookup: the checks sharing the most words, the more recent first on a tie', () => {
  const c = B.checksOf(MD);
  const l = B.lookup(c, 'how do I run the witness on windows?');
  assert.deepEqual(l.map((x) => [x.text.slice(0, 20), x.score]), [['always run the witne', 3]]);
  const two = B.lookup(c, 'model tables sealed verification');
  assert.deepEqual(two.map((x) => x.score), [2, 2]);
  assert.deepEqual(two.map((x) => x.text.slice(0, 4)), ['read', 'cut ']);   // same date: the id decides
  const dated = B.lookup([{ id: 'a', text: 'A', date: '2026-01-01', tokens: ['zebra'] }, { id: 'b', text: 'B', date: '2026-02-01', tokens: ['zebra'] }], 'zebra');
  assert.deepEqual(dated.map((x) => x.id), ['b', 'a']);
  const same = B.lookup([{ id: 'b', date: 'd', tokens: ['zebra'] }, { id: 'a', date: 'd', tokens: ['zebra'] }], 'zebra');
  assert.deepEqual(same.map((x) => x.id), ['a', 'b']);
  assert.deepEqual(B.lookup(c, 'zzz nothing'), []);
  assert.deepEqual(B.lookup(c, ''), []);
  assert.deepEqual(B.lookup(c, 'witness', 0), []);
  assert.equal(B.lookup([...c, null, { tokens: 'x' }], 'witness windows').length, 1);
  const many = Array.from({ length: 8 }, (_, i) => ({ id: 'k' + i, date: '', tokens: ['alpha'] }));
  assert.equal(B.lookup(many, 'alpha').length, 5);
});
