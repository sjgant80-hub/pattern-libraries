// test/value.test.mjs — the buyer's numbers: sourced defaults, the measured coverage and precision, nothing typed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import V from '../src/value.mjs';

const S = V.SOURCES;
const base = { contracts: 100, pages: S.pages.value / S.pages.contracts, minutesPerPage: S.minutesPerPage.value, rate: S.rate.value, questions: 19 };

test('the sources are the CUAD paper\'s own figures', () => {
  assert.deepEqual([S.rate.value, S.minutesPerPage.value, S.pages.value, S.pages.contracts, S.categories.value], [500, 5, 9283, 510, 41]);
  assert.match(S.rate.from, /CUAD/);
});

test('review: finding time stood in for, only for right answers, only for the questions covered', () => {
  const r = V.review(base, { coverage: 0.5, precision: 0.9 });
  const share = (19 / 41) * 0.5 * 0.9, per = (9283 / 510) * 5 * share;
  assert.deepEqual([r.ok, r.share, r.perContractMinutes, r.hours, r.cost, r.why], [true, Math.round(share * 1e6) / 1e6, Math.round(per * 100) / 100, Math.round((100 * per / 60) * 100) / 100, Math.round((100 * per / 60) * 500 * 100) / 100, '']);
  assert.equal(V.review(base, { coverage: 0, precision: null }).cost, 0);
  assert.equal(V.review({ ...base, questions: 41 }, { coverage: 1, precision: 1 }).share, 1);
  assert.equal(V.review({ ...base, contracts: 0 }, { coverage: 1, precision: 1 }).hours, 0);
  assert.equal(V.review({ ...base, contracts: 1e7, pages: 1e4, minutesPerPage: 600, rate: 1e5 }, { coverage: 1, precision: 1 }).ok, true);
});

test('review: inputs out of range are refused, never repaired', () => {
  const no = (i, m) => V.review(i, m || { coverage: 0.5, precision: 0.9 }).ok;
  for (const bad of [{ contracts: -1 }, { contracts: 1e7 + 1 }, { pages: -1 }, { pages: 1e4 + 1 }, { minutesPerPage: -1 }, { minutesPerPage: 601 }, { rate: -1 }, { rate: 1e5 + 1 },
    { questions: 42 }, { questions: -1 }, { questions: 2.5 }, { contracts: NaN }, { contracts: '5' }]) assert.equal(no({ ...base, ...bad }), false, JSON.stringify(bad));
  assert.match(V.review({ ...base, questions: 42 }, { coverage: 0.5, precision: 0.9 }).why, /at most 41/);
  assert.equal(no(base, { coverage: 1.1, precision: 0.9 }), false);
  assert.equal(no(base, { coverage: -0.1, precision: 0.9 }), false);
  assert.equal(no(base, { coverage: 0.5, precision: 1.1 }), false);
  assert.equal(no(base, { coverage: 0.5 }), false);
  assert.match(V.review(base, null).why, /measured coverage/);
  assert.equal(V.review(null, null).ok, false);
});

test('modelCost: one document sent once, at four characters a token, from the printed prices', () => {
  const prices = { models: { m: { in: 4, out: 20 } } };
  assert.equal(V.modelCost(prices, 'm', 52563, 1000), Math.round(((52563 / 4) * 4 + 1000 * 20) / 1e6 * 10000) / 10000);
  assert.equal(V.modelCost(prices, 'm', 0, 0), 0);
  assert.equal(V.modelCost(prices, 'x', 10, 10), null);
  assert.equal(V.modelCost(null, 'm', 10, 10), null);
  assert.equal(V.modelCost(prices, 'm', -1, 10), null);
  assert.equal(V.modelCost(prices, 'm', 10, -1), null);
  assert.equal(V.modelCost({ models: { m: { in: 'a', out: 1 } } }, 'm', 10, 10), null);
  assert.equal(V.modelCost({ models: { m: { in: 1, out: -1 } } }, 'm', 10, 10), null);
  assert.equal(V.modelCost({ models: { m: { in: 1e4, out: 1e4 } } }, 'm', 4, 0), 0.01);
  assert.equal(V.modelCost(prices, 'm', 1e9, 1e7), Math.round(((1e9 / 4) * 4 + 1e7 * 20) / 1e6 * 10000) / 10000);
});

test('keying (library 2): the buyer\'s own figures times the share the library answers right; nothing else counts', () => {
  assert.deepEqual(V.keying({ receipts: 1000, minutes: 3, rate: 30 }, { coverage: 0.5, precision: 0.8 }), { ok: true, share: 0.4, hours: 20, cost: 600, why: '' });
  assert.deepEqual(V.keying({ receipts: 1000, minutes: 3, rate: 30 }, { coverage: 0, precision: null }), { ok: true, share: 0, hours: 0, cost: 0, why: '' });
  assert.deepEqual(V.keying({ receipts: 0, minutes: 0, rate: 0 }, { coverage: 1, precision: 1 }), { ok: true, share: 1, hours: 0, cost: 0, why: '' });
  assert.deepEqual(V.keying({ receipts: 1e8, minutes: 600, rate: 1e5 }, { coverage: 1, precision: 1 }).ok, true);
  for (const bad of [{ receipts: -1, minutes: 3, rate: 30 }, { receipts: 10, minutes: 601, rate: 30 }, { receipts: 10, minutes: 3, rate: 1e5 + 1 }, { receipts: 1e8 + 1, minutes: 3, rate: 1 }, { receipts: 'x', minutes: 3, rate: 3 }, null])
    assert.match(V.keying(bad, { coverage: 1, precision: 1 }).why, /^every input/);
  for (const m of [{ coverage: 2, precision: 1 }, { coverage: 1, precision: 1.5 }, { coverage: -0.1, precision: 1 }, null])
    assert.match(V.keying({ receipts: 1, minutes: 1, rate: 1 }, m).why, /measured coverage/);
});
