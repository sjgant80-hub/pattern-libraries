// test/night.test.mjs — one library's night on a synthetic world: the exhausted case, the free tiers before the 7B,
// the 7B only where they kept nothing, errors recorded as errors, the credit tier's candidates, the meter, the records,
// the replay (X3) and the morning line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import N from '../src/night.mjs';
import E from '../src/extract.mjs';

const U = (task, id, tokens, right) => ({ id, tokens, right, label: right ? task : 'other', kw: false, value: id });
// agreement-date: the second unit carries 'dated' and is right (bar every tenth doc); effective-date: the right unit
// carries 'effective' only in some docs and a noise word everywhere, so the free tiers keep nothing for it
function world(n) {
  const units = {}, ids = [];
  for (let i = 0; i < n; i++) {
    const d = 'doc' + String(i).padStart(3, '0');
    ids.push(d);
    units[d] = {
      'agreement-date': [U('agreement-date', d + '.0', ['zfirst', 'recitals'], false), U('agreement-date', d + '.1', ['dated', 'made'], i % 10 !== 9), U('agreement-date', d + '.2', ['signed'], false)],
      'effective-date': [U('effective-date', d + '.e0', ['zfirst', 'noise'], false), U('effective-date', d + '.e1', ['noise', i % 2 ? 'effective' : 'start'], i % 3 === 0), U('effective-date', d + '.e2', ['noise'], false)],
    };
  }
  return { units, ids };
}
const W = world(100);
const plan = { meter: W.ids.slice(0, 20), seed: W.ids.slice(20, 50), batches: [W.ids.slice(50, 60), W.ids.slice(60, 70), W.ids.slice(70, 80), W.ids.slice(80, 90)] };
const AT = '2026-11-10T04:00:00Z';

test('no fresh exam left: said plainly, nothing promoted, the library carried as it was', async () => {
  const lib = [{ when: ['dated'], then: 'agreement-date' }, { when: ['bad word'], then: 'x' }, null];
  const r = await N.night({ units: W.units, plan, cycle: 2, library: lib, records: [{ a: 1 }], at: AT });
  assert.deepEqual([r.ok, r.code, r.record.exhausted, r.record.library, r.record.patterns, r.state.cycle, r.state.library.length, r.state.records.length], [false, 'exhausted', true, 'doc', 1, 2, 1, 1]);
  assert.match(r.why, /^no fresh exam left/);
  assert.deepEqual(r.record.promoted, []);
  assert.deepEqual([r.record.meter.answered, r.record.meter.right], [20, 18]);
  assert.match(N.line(r.record), /^document extraction library: no fresh exam left \(all 15 batches spent\), so nothing was promoted; it needs fresh data · 1 patterns · coverage /);
});

test('a night: the free tiers first; the 7B only where they kept nothing; errors kept as errors', async () => {
  const asked = [];
  const ask = async (task, prompt) => {
    asked.push(task);
    assert.match(prompt, new RegExp('IS the "' + task + '"'));
    if (task === 'effective-date') return { ok: true, text: 'WHEN effective THEN effective-date\nWHEN dated THEN agreement-date\n' + 'x'.repeat(2500) };
    if (task === 'expiration-date') throw new Error('HTTP 500 ' + 'y'.repeat(300));
    if (task === 'governing-law') return 'not an object';
    if (task === 'party') return { ok: false, code: 'clock', why: 'past the clock' };
    return { ok: false };
  };
  const r = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, ask, model: 'qwen2.5:7b', max7b: 5 });
  assert.equal(r.ok, true);
  const rec = r.record;
  assert.deepEqual([rec.kind, rec.v, rec.library, rec.feed, rec.cycle, rec.at, rec.model, rec.carried], ['library-night', 1, 'doc', 'cuad-v1', 0, AT, 'qwen2.5:7b', 0]);
  assert.equal(rec.keptFree['agreement-date'], 1);
  assert.ok(!asked.includes('agreement-date'));
  assert.deepEqual(asked, E.TASKS.filter((t) => t !== 'agreement-date').slice(0, 5));
  const rep = Object.fromEntries(rec.replies.map((x) => [x.task, x]));
  assert.deepEqual([rep['effective-date'].ok, rep['effective-date'].code, rep['effective-date'].proposed, rep['effective-date'].text.length], [true, 'ok', 1, 2000]);
  assert.deepEqual([rep['expiration-date'].code, rep['expiration-date'].why.length], ['error', 200]);
  assert.match(rep['expiration-date'].why, /^HTTP 500/);
  assert.deepEqual([rep['governing-law'].code, rep['governing-law'].why], ['error', 'the model gave no reply object']);
  assert.deepEqual([rep.party.code, rep.party.why, rep.party.text], ['clock', 'past the clock', '']);
  assert.deepEqual([rep['renewal-term'].code, rep['renewal-term'].why], ['error', '']);
  const p7 = rec.proposals.filter((p) => p.prov.source === '7b');
  assert.deepEqual(p7.map((p) => [p.then, p.prov.model, p.prov.recipe, p.prov.feed]), [['effective-date', 'qwen2.5:7b', 'prompt-v1 salt 0', 'cuad-v1']]);
  assert.equal(rec.proposed['7b'], 1);
  assert.equal(rec.proposed.free, rec.proposals.length - 1);
  // the 7B's rule for effective-date fails the gate, so it is the credit tier's one candidate, with the wall's evidence
  assert.deepEqual(rec.asks.map((a) => a.task), ['effective-date']);
  assert.deepEqual(rec.asks[0].evidence.tier2, { tried: 1, passed: 0, model: 'qwen2.5:7b', dropped: [rec.dropped.find((d) => d.source === '7b').rule + ': ' + rec.dropped.find((d) => d.source === '7b').why] });
  assert.equal(rec.asks[0].evidence.tier1.answered, false);
  assert.match(r.asks[0].prompt, /IS the "effective-date"/);
  assert.equal(rec.tried7b['effective-date'], 1);
  assert.equal(rec.passed7b['effective-date'], undefined);
  // the meter, the exam and the records
  assert.deepEqual([rec.meter.before.coverage, rec.meter.before.answered], [0, 0]);
  assert.ok(rec.meter.after.coverage > 0);
  assert.equal(rec.meter.after.answered, 20);
  assert.equal(rec.meter.receipt.decision, 'PROMOTE');
  assert.equal(rec.exam.receipt.decision, 'INSUFFICIENT');
  assert.equal(rec.exam.total.answered, 0);
  assert.deepEqual(rec.slices, { train: 30, held: plan.batches[0], final: plan.batches[1] });
  assert.equal(rec.promoted.length, rec.patterns);
  assert.equal(rec.built, rec.patterns);
  assert.deepEqual(rec.promoted.map((p) => p.rule), r.state.library.map((x) => x.when.slice().sort().join('+') + '=>' + x.then));
  assert.ok(rec.promoted.every((p) => p.source === 'mined' && typeof p.receipt === 'string' && p.heldDocs.ok && p.finalDocs.ok));
  assert.deepEqual([r.state.cycle, r.state.records.length], [1, rec.patterns]);
  assert.deepEqual(r.state.records.map((x) => x.cycle), Array(rec.patterns).fill(0));
  assert.ok(r.state.records.every((x) => x.library === 'doc' && x.type === 'date'));
  // the line
  const l = N.line(rec);
  assert.ok(l.startsWith('document extraction library, night 0: ' + rec.patterns + ' patterns (' + rec.patterns + ' kept tonight, ' + rec.dropped.length + ' dropped: '));
  assert.match(l, / · coverage on the meter 0\.0% → \d+\.\d%, right \d+\.\d% when it answers · /);
  assert.match(l, /final exam: nothing carried in to examine · 7B 5 calls · credit tier candidates: effective-date$/);
});

test('the next night: recipes from the build-pattern library come first; the carried library is examined', async () => {
  const one = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, model: 'm' });
  assert.deepEqual([one.record.replies.length, one.record.asks.length, one.record.model], [0, 0, 'm']);
  const two = await N.night({ units: W.units, plan, cycle: 1, library: one.state.library, records: one.state.records, at: '2026-11-11T04:00:00Z' });
  assert.equal(two.record.carried, one.state.library.length);
  const rec = two.record.proposals.filter((p) => p.prov.source === 'recipe');
  assert.ok(rec.length > 0);
  assert.ok(rec.every((p) => p.then !== 'agreement-date' && /^recipe from agreement-date$/.test(p.prov.recipe) && p.prov.model === 'none'));
  assert.equal(two.record.exam.total.answered, 10);
  assert.equal(two.record.exam.receipt.decision, 'INSUFFICIENT');
  assert.match(N.line(two.record), /final exam: INSUFFICIENT \(9\/10 vs the cheap baseline 0\)/);
  assert.equal(two.record.model, null);
  assert.deepEqual(two.record.slices.final, plan.batches[3]);
});

test('defaults: cycle, max7b, model, inputs that are not what they should be', async () => {
  let n = 0;
  const ask = async () => { n++; return { ok: false, code: 'x', why: '' }; };
  await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, ask, max7b: 0 });
  assert.equal(n, 0);
  await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, ask, max7b: -1 });
  assert.equal(n, N.NIGHT.max7b);
  const r = await N.night({ units: W.units, plan, cycle: 'x', at: 5, ask: 'no', model: 7 });
  assert.deepEqual([r.record.cycle, r.record.at, r.record.model, r.record.replies.length], [0, '', null, 0]);
  const neg = await N.night({ units: W.units, plan, cycle: -4 });
  assert.equal(neg.record.cycle, 0);
  const junk = await N.night(null);
  assert.deepEqual([junk.ok, junk.code], [false, 'exhausted']);
  const k = await N.night({ units: W.units, plan, cycle: 0, records: [null, 3, { task: 'x' }] });
  assert.equal(k.state.records[0].task, 'x');
});

test('replay: the recorded replies re-derive the night byte for byte (X3)', async () => {
  const ask = async (task) => (task === 'effective-date' ? { ok: true, text: 'WHEN effective THEN effective-date' } : { ok: false, code: 'error', why: 'HTTP 500' });
  const a = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, ask, model: 'qwen2.5:7b' });
  const b = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, ask: N.replayAsk(a.record), model: 'qwen2.5:7b' });
  assert.equal(JSON.stringify(b.record), JSON.stringify(a.record));
  const un = N.replayAsk({ replies: [] });
  assert.deepEqual(await un('party'), { ok: false, code: 'unrecorded', why: 'the recorded night did not ask about party' });
  assert.deepEqual(await N.replayAsk(null)('x'), { ok: false, code: 'unrecorded', why: 'the recorded night did not ask about x' });
  assert.deepEqual(await N.replayAsk({ replies: [{ task: 'a', ok: true, text: 't' }, null] })('a'), { ok: true, text: 't' });
  assert.deepEqual(await N.replayAsk({ replies: [{ task: 'a', ok: false, code: 'c', why: 'w', text: '' }] })('a'), { ok: false, code: 'c', why: 'w' });
});

test('freeProposals: the recipe lookup, then one-word and two-word miners, every one with provenance', () => {
  const slices = { train: plan.seed, held: plan.batches[0], final: plan.batches[1] };
  const rec = [{ task: 'agreement-date', type: 'date', rule: { when: ['dated'], then: 'agreement-date' } }];
  const f = N.freeProposals(W.units, slices, rec, AT);
  const eff = f.filter((p) => p.then === 'effective-date');
  assert.deepEqual(eff[0], { when: ['dated'], then: 'effective-date', prov: { source: 'recipe', model: 'none', proposedAt: AT, feed: 'cuad-v1', trainN: 90, recipe: 'recipe from agreement-date' } });
  assert.deepEqual(eff.map((p) => p.prov.recipe).filter((r) => r !== 'mine-cover'), ['recipe from agreement-date', 'mine-1', 'mine-1', 'mine-1', 'mine-2', 'mine-2']);
  // set 1 (night 0) has no coverage-first miner; set 2 (the default) adds it after the others
  const one = N.freeProposals(W.units, slices, rec, AT, 1);
  assert.ok(!one.some((p) => p.prov.recipe === 'mine-cover'));
  const two = N.freeProposals(W.units, slices, rec, AT);
  assert.ok(two.some((p) => p.prov.recipe === 'mine-cover'));
  assert.equal(two.filter((p) => p.prov.recipe !== 'mine-cover').length, one.length);
  const ag = two.filter((p) => p.then === 'agreement-date');
  assert.equal(ag.at(-1).prov.recipe, 'mine-cover');
  assert.equal(N.freeProposals(W.units, slices, rec, AT, 3).some((p) => p.prov.recipe === 'mine-cover'), false);
  assert.ok(f.filter((p) => p.then === 'agreement-date').every((p) => p.prov.source === 'mined'));
  assert.ok(f.every((p) => E.TASKS.includes(p.then)));
});

test('line: robust to a record without its parts', () => {
  assert.equal(N.line(null), 'document extraction library: no night recorded');
  const l = N.line({ cycle: 3, patterns: 2, promoted: [], dropped: [{ why: 'held-out: covers 1' }, { why: 'held-out: covers 2' }, { why: 'a duplicate of x' }, { why: 'final exam: x' }, { why: 'not a rule' }] });
  assert.equal(l, 'document extraction library, night 3: 2 patterns (0 kept tonight, 5 dropped: 2 held-out, 1 a duplicate of x, 1 final exam) · coverage on the meter n/a → n/a, right n/a when it answers · final exam: nothing carried in to examine · 7B 0 calls · credit tier candidates: none');
  assert.match(N.line({ cycle: 1, patterns: 0, meter: { before: { coverage: 0.5 }, after: { coverage: 0.123456, precision: 1 } }, exam: { receipt: { ok: true, decision: 'DROP', right: 1, answered: 2, baseRight: 1 } } }), /0 dropped: none\) · coverage on the meter 50\.0% → 12\.3%, right 100\.0% when it answers · final exam: DROP \(1\/2 vs the cheap baseline 1\)/);
  assert.match(N.line({ exhausted: true, patterns: 4, meter: { coverage: 0.25 } }), /4 patterns · coverage 25\.0%$/);
  assert.match(N.line({ exhausted: true, patterns: 4 }), /coverage n\/a$/);
});

test('the proposer set is written in the record from set 2 on, and a set-1 record replays as set 1', async () => {
  const two = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT });
  assert.equal(two.record.free, 2);
  assert.ok(two.record.proposals.some((p) => p.prov.recipe === 'mine-cover'));
  const one = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, free: 1 });
  assert.equal('free' in one.record, false);
  assert.ok(!one.record.proposals.some((p) => p.prov.recipe === 'mine-cover'));
  const other = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT, free: 7 });
  assert.equal(other.record.free, 2);
  assert.equal(N.NIGHT.free, 2);
});

// ── library 2 (SEAL 2): the same night for receipts, with the check measured on the meter (R2, R3) ──
import F from '../src/finance.mjs';
test('library 2: the finance night runs the same steps, records its own library and feed, and measures the check on the meter', async () => {
  const FN = N.nightOf(N.FINANCE);
  const rcpt = (i) => {
    const t = 'Kopi 20,000\nSUBTOTAL 20,000\nTOTAL ' + (i % 7 ? '20,000' : '22,000') + '\nTUNAI 50,000\nKEMBALI 30,000';   // ctrl-F for 'cash' and 'change' finds nothing here
    const at = (w) => t.indexOf(w), g = (cat, w) => ({ cat, start: at(w), end: at(w) + w.length });
    return F.unitsOf({ id: 'r' + i, text: t, gold: [g('menu.price', '20,000'), { cat: 'sub_total.subtotal_price', start: t.indexOf('20,000', 12), end: t.indexOf('20,000', 12) + 6 }, { cat: 'total.total_price', start: t.indexOf('TOTAL ', 15) + 6, end: t.indexOf('TOTAL ', 15) + 12 }, g('total.cashprice', '50,000'), g('total.changeprice', '30,000')] });
  };
  const units = {}, ids = [];
  for (let i = 0; i < 60; i++) { ids.push('r' + i); units['r' + i] = rcpt(i); }
  const plan = { meter: ids.slice(0, 10), seed: ids.slice(10, 30), batches: [ids.slice(30, 40), ids.slice(40, 50)] };
  const r = await FN.night({ units, plan, cycle: 0, library: [], records: [], at: AT, parts: ['B', 'C'] });
  assert.equal(r.ok, true);
  assert.deepEqual([r.record.library, r.record.feed, r.record.free], ['finance', 'cord-v2', 2]);
  assert.ok(r.record.patterns > 0, 'the free miners find the receipt words');
  const c = r.record.meter.check;
  assert.deepEqual(c.parts, ['B', 'C']);
  assert.equal(c.receipts, 10);
  assert.equal(c.reconciled + c.flagged + c.unchecked, 10);
  assert.ok(r.state.records.every((x) => x.library === 'finance' && x.type === 'money'));
  assert.match(FN.line(r.record), /^receipt reading library, night 0: \d+ patterns .* · the check: \d+ reconciled, \d+ flagged, \d+ unchecked · final exam: /);
  assert.equal(r.record.exam.receipt.decision, 'INSUFFICIENT');
  // spent: no fresh exam left, said plainly, and the check still measured on the meter
  const x = await FN.night({ units, plan, cycle: 1, library: r.state.library, records: [], at: AT, parts: [] });
  assert.deepEqual([x.ok, x.code, x.record.exhausted, x.record.meter.check.parts, x.record.meter.check.unchecked], [false, 'exhausted', true, [], 10]);
  assert.match(FN.line(x.record), /^receipt reading library: no fresh exam left \(all 15 batches spent\)/);
  // library 1 records no check at all, so its committed nights replay unchanged
  const d = await N.night({ units: W.units, plan: { meter: W.ids.slice(0, 20), seed: W.ids.slice(20, 50), batches: [W.ids.slice(50, 60), W.ids.slice(60, 70)] }, cycle: 0, library: [], records: [], at: AT });
  assert.equal('check' in d.record.meter, false);
  assert.match(N.line(d.record), /^document extraction library, night 0: /);
  assert.equal(N.line(null), 'document extraction library: no night recorded');
  assert.equal(FN.line(null), 'receipt reading library: no night recorded');
  assert.deepEqual([N.NIGHT.max7b, N.FIN_NIGHT.max7b, N.NIGHT.max7b + N.FIN_NIGHT.max7b], [3, 3, 6], 'N1: six local-7B calls a night for the two libraries together');
});

// ── library 3 (SEAL 3): routing and triage, each its own night, the free tiers only ──
import TR from '../src/triage.mjs';
test('library 3: routing and triage nights run the free tiers only, record their library, and routing measures the router whole', async () => {
  const say = ['please track my card', 'link my card please', 'what exchange rate today'], gold = ['card_arrival', 'card_linking', 'exchange_rate'];
  const units = {}, ids = [];
  for (let i = 0; i < 90; i++) { const id = 'q' + i; ids.push(id); units[id] = TR.routeUnits({ id, text: say[i % 3] + ' ' + (i % 2 ? 'now' : 'soon'), intent: gold[i % 3] }); }
  const plan = { meter: ids.slice(0, 30), seed: ids.slice(30, 60), batches: [ids.slice(60, 75), ids.slice(75, 90)] };
  const RN = N.nightOf(N.ROUTE);
  let asked = 0;
  const r = await RN.night({ units, plan, cycle: 0, library: [], records: [], at: AT, ask: async () => { asked++; return { ok: true, text: '' }; } });
  assert.equal(asked, 0, 'no model call: N4');
  assert.deepEqual([r.ok, r.record.library, r.record.feed, r.record.replies.length], [true, 'route', 'banking77', 0]);
  assert.ok(r.record.patterns > 0);
  const k = r.record.meter.check;
  assert.deepEqual(Object.keys(k), ['queries', 'routed', 'right', 'conflicts', 'baseRouted', 'baseRight']);
  assert.equal(k.queries, 30);
  assert.ok(r.state.records.every((x) => x.library === 'route' && x.type === 'route'));
  assert.match(RN.line(r.record), /^routing library, night 0: \d+ patterns .* · the router: \d+ of 30 routed, \d+ right, \d+ with a conflict \(the keyword router: \d+ routed, \d+ right\) · final exam: /);
  const TN = N.nightOf(N.TRIAGE);
  const tu = {}, tids = [];
  for (let i = 0; i < 60; i++) { const id = 't' + i; tids.push(id); tu[id] = TR.triageUnits({ id, text: i % 4 ? 'what time is checkout' : 'let me talk to a person', intents: i % 4 ? [] : ['handoff'] }); }
  const t = await TN.night({ units: tu, plan: { meter: tids.slice(0, 20), seed: tids.slice(20, 40), batches: [tids.slice(40, 50), tids.slice(50, 60)] }, cycle: 0, library: [], records: [], at: AT });
  assert.deepEqual([t.ok, t.record.library, t.record.feed, 'check' in t.record.meter], [true, 'triage', 'nlupp', false]);
  assert.match(TN.line(t.record), /^triage library, night 0: /);
  assert.deepEqual([N.ROUTE_NIGHT.max7b, N.TRIAGE_NIGHT.max7b, N.ROUTE.batches, N.TRIAGE.batches], [0, 0, 9, 4]);
});

test('seal 11: nearMisses reads only rules dropped for held-out cover short by 1 or 2, once each, for known tasks', () => {
  const prior = { dropped: [
    { rule: 'dated+made=>agreement-date', why: 'held-out: covers 4, needs 5' },
    { rule: 'made=>agreement-date', why: 'held-out: covers 3, needs 5' },
    { rule: 'signed=>agreement-date', why: 'held-out: covers 2, needs 5' },
    { rule: 'recitals=>agreement-date', why: 'held-out: covers 5, needs 5' },
    { rule: 'dated+made=>agreement-date', why: 'held-out: covers 4, needs 5' },
    { rule: 'noise=>nowhere', why: 'held-out: covers 4, needs 5' },
    { rule: 'noise=>effective-date', why: 'held-out: right 0 of 6, needs 0.8' },
    { rule: 'start=>effective-date', why: 'held-out: covers 4, needs 5 on those documents' },
    { rule: '=>effective-date', why: 'held-out: covers 4, needs 5' },
    { rule: 'nowhere', why: 'held-out: covers 4, needs 5' },
    null, 7,
  ] };
  assert.deepEqual(N.nearMisses(prior, ['agreement-date', 'effective-date']), [{ when: ['dated', 'made'], then: 'agreement-date' }, { when: ['made'], then: 'agreement-date' }]);
  assert.deepEqual(N.nearMisses({ dropped: [{ rule: 'a=>t', why: 'held-out: covers 1, needs 3' }, { rule: 'b=>t', why: 'held-out: covers 2, needs 3' }] }, ['t']), [{ when: ['a'], then: 't' }, { when: ['b'], then: 't' }], 'short by 1 or 2 of whatever the bar is');
  assert.deepEqual(N.nearMisses({ dropped: [{ rule: 'a=>t', why: 'held-out: covers 0, needs 3' }] }, ['t']), []);
  assert.deepEqual(N.nearMisses(null, ['t']), []);
  assert.deepEqual(N.nearMisses({ dropped: 'x' }, ['t']), []);
  assert.deepEqual(N.nearMisses(prior, null), []);
});

test('seal 11: a night with near-misses on proposes them after the free tiers, keeps them only through the gates, and measures the same night without them', async () => {
  const n0 = await N.night({ units: W.units, plan, cycle: 0, library: [], records: [], at: AT });
  const prior = { ...n0.record, dropped: [...n0.record.dropped, { rule: 'dated+recitals=>agreement-date', why: 'held-out: covers 4, needs 5' }] };
  const on = await N.night({ units: W.units, plan, cycle: 1, library: n0.state.library, records: n0.state.records, at: AT, nearmiss: true, prior });
  const off = await N.night({ units: W.units, plan, cycle: 1, library: n0.state.library, records: n0.state.records, at: AT, prior });
  assert.equal(on.record.nearmiss, true);
  assert.equal('nearmiss' in off.record, false, 'off unless the night input says so');
  assert.equal('nearmissMeasure' in off.record, false);
  assert.equal('nearmiss' in off.record.proposed, false);
  const m = on.record.nearmissMeasure;
  assert.equal(m.proposed, N.nearMisses(prior, N.DOC.D.TASKS).length);
  assert.ok(m.proposed >= 1);
  assert.equal(on.record.proposed.nearmiss, m.proposed);
  assert.equal(on.record.proposals.filter((p) => p.prov.source === 'nearmiss').length, m.proposed);
  assert.match(on.record.proposals.find((p) => p.prov.source === 'nearmiss').prov.recipe, /^near-miss of night 0$/);
  assert.equal(m.keptWithout, off.record.promoted.length - off.record.promoted.filter((p) => p.source === '7b').length, 'the comparison arm is the same night without them');
  assert.equal(m.keptWith - m.keptWithout, m.keptFromThem, 'near-misses come after the free tiers, so they only add');
  assert.equal(m.keptFromThem, on.record.promoted.filter((p) => p.source === 'nearmiss').length);
  assert.ok(m.newTonight >= 0 && m.newTonight <= m.proposed);
  assert.ok(m.newTonight >= 1, 'dated+recitals is not one the miners propose (never in one unit)');
  for (const k of ['precisionWith', 'precisionWithout']) assert.ok(m[k] === null || (m[k] >= 0 && m[k] <= 1), k);
  assert.equal(m.precisionWithout, off.record.meter.after.precision);
  assert.equal(m.precisionWith, on.record.meter.after.precision);
  const replay = await N.night({ units: W.units, plan, cycle: 1, library: n0.state.library, records: n0.state.records, at: AT, nearmiss: true, prior });
  assert.equal(JSON.stringify(replay.record), JSON.stringify(on.record), 'replays byte for byte from the same previous record');
  const noPrior = await N.night({ units: W.units, plan, cycle: 1, library: n0.state.library, records: n0.state.records, at: AT, nearmiss: true });
  assert.equal(noPrior.record.nearmissMeasure.proposed, 0, 'on but with no previous record: nothing to re-propose');
});

test('seal 11: nearMeasure counts both arms and only real near-miss keeps', () => {
  const free = [{ when: ['a'], then: 't' }, { when: ['b'], then: 't' }], near = [{ when: ['a'], then: 't' }, { when: ['c'], then: 't' }, { when: ['d'], then: 't' }];
  const kept = [{ when: ['a'], then: 't', prov: { source: 'mined' } }, { when: ['c'], then: 't', prov: { source: 'nearmiss' } }, { when: ['d'], then: 't', prov: { source: 'nearmiss' } }, { when: ['x'], then: 't' }, null, { when: ['y'], then: 't', prov: null }];
  assert.deepEqual(N.nearMeasure(free, near, kept, kept.slice(0, 1), 0.9, 0.8), { proposed: 3, newTonight: 2, keptFromThem: 2, keptWith: 6, keptWithout: 1, precisionWith: 0.9, precisionWithout: 0.8 });
  assert.deepEqual(N.nearMeasure(null, null, null, null, null, null), { proposed: 0, newTonight: 0, keptFromThem: 0, keptWith: 0, keptWithout: 0, precisionWith: null, precisionWithout: null });
});
