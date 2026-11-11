// test/finance.test.mjs — library 2's kernel (SEAL 2): the amount scanner and its values, the rows, the words and
// places around each amount, the experts' words (value words only), the cheap baseline, the answer, the three-part check
// and its tolerances, the rule's own test (R0), the check on the meter (R2, R3), and garbage that never throws.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import F from '../src/finance.mjs';
import C from '../tools/cord.mjs';

// a receipt from rows of [word, category, isKey]: the loader's own layout (words by spaces, rows by newlines)
function doc(id, rows) {
  let text = '';
  const gold = [];
  rows.forEach((r, i) => {
    if (i) text += '\n';
    r.forEach(([w, cat, key], j) => { if (j) text += ' '; if (cat) gold.push({ cat, key: key === true, start: text.length, end: text.length + w.length }); text += w; });
  });
  return { id, text, gold };
}
const R1 = doc('r1', [
  [['Nasi', 'menu.nm'], ['Goreng', 'menu.nm'], ['1', 'menu.cnt'], ['25,000', 'menu.unitprice'], ['25,000', 'menu.price']],
  [['Teh', 'menu.nm'], ['Manis', 'menu.nm'], ['2', 'menu.cnt'], ['10,000', 'menu.price']],
  [['SUBTOTAL', 'sub_total.subtotal_price', true], ['35,000', 'sub_total.subtotal_price']],
  [['TAX', 'sub_total.tax_price', true], ['10.00', 'sub_total.tax_price', true], ['3,500', 'sub_total.tax_price']],
  [['TOTAL', 'total.total_price', true], ['38,500', 'total.total_price']],
  [['CASH', 'total.cashprice', true], ['50,000', 'total.cashprice']],
  [['CHANGE', 'total.changeprice', true], ['11,500', 'total.changeprice']],
]);
const vals = (list) => list.map((u) => u.raw);
const rights = (list) => list.filter((u) => u.right).map((u) => u.raw);
const A = (value, dec = false) => ({ value, dec });

test('values: thousands groups, two decimals, a lone zero; nothing without a digit', () => {
  assert.deepEqual(F.valueOf('45,000'), { value: 4500000, dec: false });
  assert.deepEqual(F.valueOf('1,346,000'), { value: 134600000, dec: false });
  assert.deepEqual(F.valueOf('45.000,00'), { value: 4500000, dec: true });
  assert.deepEqual(F.valueOf('1.234,56'), { value: 123456, dec: true });
  assert.deepEqual(F.valueOf('12.50'), { value: 1250, dec: true });
  assert.deepEqual(F.valueOf('0'), { value: 0, dec: false });
  assert.deepEqual(F.valueOf('750'), { value: 75000, dec: false });
  for (const bad of ['.', '', ',,', null, 7]) assert.equal(F.valueOf(bad), null, String(bad));
});

test('the scanner: amounts, their places, signs and decimals; rates, dates, times and counts are not amounts', () => {
  const s = F.scan('Rp 45.000 -5,000 (2,500) 12.50 0 750 1,346,000.00');
  assert.deepEqual(s.map((a) => [a.raw, a.value, a.neg, a.dec]), [['Rp 45.000', 4500000, false, false], ['-5,000', 500000, true, false], ['(2,500', 250000, true, false], ['12.50', 1250, false, true], ['0', 0, false, false], ['750', 75000, false, false], ['1,346,000.00', 134600000, false, true]]);
  assert.deepEqual([s[0].start, s[0].end, s[1].start, s[1].end], [0, 9, 10, 16]);
  for (const no of ['10%', '100%', '08/11/2018', '12:30', '2x', '16OZ', '1,2345', 'a750', '7.5', '75']) assert.deepEqual(F.scan(no), [], no);
  assert.deepEqual(F.scan('Rp\n2,000').map((a) => a.raw), ['2,000'], 'an amount never crosses a line');
  assert.deepEqual(F.scan(''), []);
  assert.deepEqual(F.scan(null), []);
});

test('rows: one per printed line, with where each starts and ends', () => {
  assert.deepEqual(F.rowsOf('ab\ncde\n'), [{ start: 0, end: 2, text: 'ab' }, { start: 3, end: 6, text: 'cde' }, { start: 7, end: 7, text: '' }]);
  assert.deepEqual(F.rowsOf(null), [{ start: 0, end: 0, text: '' }]);
});

test('each amount: the words on its row before and after it, no all-digit words, and where it sits', () => {
  const a = F.amountsOf(R1.text);
  assert.deepEqual(a.map((x) => [x.raw, x.row, x.tokens]), [
    ['25,000', 0, ['nasi', 'goreng', 'zfirst', 'ztop']],
    ['25,000', 0, ['nasi', 'goreng', 'zend', 'ztop']],
    ['10,000', 1, ['teh', 'manis', 'zend', 'zalone', 'ztop']],
    ['35,000', 2, ['subtotal', 'zend', 'zalone', 'ztop']],
    ['10.00', 3, ['tax', 'zmid']],
    ['3,500', 3, ['tax', 'zend', 'zmid']],
    ['38,500', 4, ['total', 'zend', 'zalone', 'zmid']],
    ['50,000', 5, ['cash', 'zmax', 'zend', 'zalone', 'zlow']],
    ['11,500', 6, ['change', 'zlast', 'zend', 'zalone', 'zlow']],
  ]);
  // the thirds, at their edges: 3 rows are top, middle, low; 6 rows split two by two
  assert.deepEqual(F.amountsOf('a 100\nb 200\nc 300').map((x) => x.tokens.filter((t) => /^z(top|mid|low)$/.test(t))[0]), ['ztop', 'zmid', 'zlow']);
  assert.deepEqual(F.amountsOf('100\n200\n300\n400\n500\n600').map((x) => x.tokens.find((t) => /^z(top|mid|low)$/.test(t))), ['ztop', 'ztop', 'zmid', 'zmid', 'zlow', 'zlow']);
  // the words after it (at most three), a negative, a tie for the largest
  const b = F.amountsOf('pay -500 now please thank kindly\nx 500');
  assert.deepEqual(b.map((x) => x.tokens), [['pay', 'now', 'please', 'thank', 'zfirst', 'zmax', 'zend', 'zalone', 'zneg', 'ztop'], ['zlast', 'zmax', 'zend', 'zalone', 'zmid']]);
  // at most six words before it, the nearest ones
  assert.deepEqual(F.amountsOf('one two three four five six seven eight 900')[0].tokens.slice(0, 6), ['three', 'four', 'five', 'six', 'seven', 'eight']);
  assert.deepEqual(F.amountsOf(''), []);
});

test("the experts' words: value words only; broken entries are left out", () => {
  const g = F.goldOf({ gold: [
    { cat: 'x', key: false, start: 0, end: 3 }, { cat: 'x', key: false, start: 5, end: 9 }, { cat: 'x', key: true, start: 10, end: 12 },
    null, { cat: 7, start: 0, end: 2 }, { cat: 'y', start: 0.5, end: 2 }, { cat: 'y', start: 0, end: '2' }, { cat: 'y', start: 4, end: 4 }, { cat: 'y', start: 4, end: 3 },
    { cat: 'z', start: 1, end: 2 },
  ] });
  assert.deepEqual(g, { x: [{ start: 0, end: 3 }, { start: 5, end: 9 }], z: [{ start: 1, end: 2 }] });
  assert.deepEqual(F.goldOf(null), {});
  assert.deepEqual(F.goldOf({ gold: 'no' }), {});
});

test('units: right by value for a field, by place for line items; the rate beside the tax is a key word, not the tax', () => {
  const u = F.unitsOf(R1);
  assert.deepEqual(rights(u.total), ['38,500']);
  assert.deepEqual(rights(u.subtotal), ['35,000']);
  assert.deepEqual(rights(u.tax), ['3,500']);
  assert.deepEqual(rights(u.cash), ['50,000']);
  assert.deepEqual(rights(u.change), ['11,500']);
  assert.deepEqual([rights(u.service), rights(u.discount)], [[], []]);
  assert.deepEqual(u['item-price'].map((x) => x.right), [false, true, true, false, false, false, false, false, false]);
  // the labels the law reads, and short stable ids per receipt
  assert.deepEqual(u.total.map((x) => x.label), ['other', 'other', 'other', 'other', 'other', 'other', 'total', 'other', 'other']);
  assert.ok(u.total.every((x, i) => x.id.endsWith('.m.' + i) && x.doc === 'r1'));
  assert.equal(u.total[0].id, u.tax[0].id);
  assert.notEqual(F.unitsOf({ ...R1, id: 'r2' }).total[0].id, u.total[0].id);
  // value equality: an amount equal to the experts' total is a right total wherever it is printed
  const r = F.unitsOf(doc('v', [[['TOTAL', 'total.total_price', true], ['20,000', 'total.total_price']], [['CASH', 'total.cashprice', true], ['20,000', 'total.cashprice']]]));
  assert.deepEqual(r.total.map((x) => x.right), [true, true]);
  for (const bad of [null, {}, { id: 1, text: 'x' }, { id: 'a', text: 5 }, []]) assert.deepEqual(F.unitsOf(bad), {});
});

test('inside means overlapping: an amount that only touches an expert word is not in it', () => {
  const t = 'TOTAL 5,000 CASH';
  const at = (start, end) => F.unitsOf({ id: 'a', text: t, gold: [{ cat: 'total.total_price', start, end }] }).total[0].right;
  assert.equal(at(0, 6), false, 'ends where the amount starts');
  assert.equal(at(11, 16), false, 'starts where the amount ends');
  assert.equal(at(0, 7), true);
  assert.equal(at(10, 16), true);
  assert.equal(at(8, 8), false, 'an empty span is no span');
});

test('the cheap baseline: ctrl-F for a field (at or after the word\'s row), everything above the first "total" for line items', () => {
  const u = F.unitsOf(R1);
  const kw = (task) => u[task].filter((x) => x.kw).map((x) => x.raw);
  assert.deepEqual([kw('total'), kw('subtotal'), kw('tax'), kw('cash'), kw('change'), kw('service'), kw('discount')], [['35,000'], ['35,000'], ['10.00'], ['50,000'], ['11,500'], [], []]);
  assert.deepEqual(kw('item-price'), ['25,000', '25,000', '10,000']);
  assert.equal(F.baseline('total', u.total).raw, '35,000');
  assert.equal(F.baseline('service', u.service), null);
  assert.deepEqual(vals(F.baseline('item-price', u['item-price'])), ['25,000', '25,000', '10,000']);
  // the word on the very first row; a word on a row with no amount looks further down
  const top = F.unitsOf({ id: 't', text: 'TOTAL 5,000\nCASH\n9,000\n8,000', gold: [] });
  assert.deepEqual([top.total.map((x) => x.kw), top.cash.map((x) => x.kw), top['item-price'].map((x) => x.kw)], [[true, false, false], [false, true, false], [false, false, false]]);
  // no 'total' anywhere: every amount is a line item to the cheap method
  const none = F.unitsOf({ id: 'n', text: 'tea 5,000\ncake 7,000', gold: [] });
  assert.deepEqual([none['item-price'].map((x) => x.kw), none.total.map((x) => x.kw)], [[true, true], [false, false]]);
  assert.deepEqual([F.baseline('total', null), F.baseline('item-price', [null, { kw: true }])], [null, [{ kw: true }]]);
});

test('the answer: a field is the first amount a kept rule fires on; line items are every one; invalid or other rules never fire', () => {
  const u = F.unitsOf(R1);
  const rules = [{ when: ['total'], then: 'total' }, { when: ['zend', 'ztop'], then: 'item-price' }, { when: 'tax', then: 'tax' }, { when: ['cash'], then: 'change' }];
  assert.equal(F.pick(rules, 'total', u.total).unit.raw, '38,500');
  assert.equal(F.pick(rules, 'total', u.total).rule, rules[0]);
  const items = F.pick(rules, 'item-price', u['item-price']);
  assert.deepEqual(vals(items.units), ['25,000', '10,000', '35,000']);
  assert.equal(items.rules.length, 3);
  assert.equal(F.pick(rules, 'tax', u.tax), null, 'an invalid rule never fires');
  assert.equal(F.pick(rules, 'subtotal', u.subtotal), null);
  assert.equal(F.pick([{ when: ['nothing'], then: 'item-price' }], 'item-price', u['item-price']), null);
  assert.equal(F.pick(null, 'total', [null, 5]), null);
  assert.equal(F.pick([{ when: ['zfirst'], then: 'total' }], 'total', [null, u.total[0]]).unit, u.total[0]);
});

test('the check: three parts, each only when its terms are there; the tolerances at their edges', () => {
  const full = { items: [A(2500000), A(1000000)], subtotal: A(3500000), tax: A(350000), service: null, discount: null, total: A(3850000), cash: A(5000000), change: A(1150000) };
  const c = F.reconcile(full);
  assert.equal(c.verdict, 'reconciled');
  assert.deepEqual(c.parts, { A: { left: 3500000, right: 3500000, holds: true }, B: { left: 3850000, right: 3850000, holds: true }, C: { left: 3850000, right: 3850000, holds: true } });
  // service added and discount taken off
  assert.deepEqual(F.reconcile({ subtotal: A(10000), service: A(500), discount: A(2000), total: A(8500) }).parts, { B: { left: 8500, right: 8500, holds: true } });
  // whole units: 100 off holds, 100.01 off does not; with cents, 0.05 holds and 0.06 does not
  assert.equal(F.reconcile({ subtotal: A(1000000), total: A(1010000) }).verdict, 'reconciled');
  assert.equal(F.reconcile({ subtotal: A(1000000), total: A(1010001) }).verdict, 'flagged');
  assert.equal(F.reconcile({ subtotal: A(1000, true), total: A(1005) }).verdict, 'reconciled');
  assert.equal(F.reconcile({ subtotal: A(1000, true), total: A(1006) }).verdict, 'flagged');
  assert.equal(F.reconcile({ subtotal: A(1000), total: A(1006, true) }).verdict, 'flagged', 'any term with cents makes the part exact to 0.05');
  assert.equal(F.reconcile({ subtotal: A(1000), total: A(1006), tax: null }).verdict, 'reconciled', 'an unanswered term counts zero and has no cents');
  // one part fails: flagged, even when another holds
  assert.equal(F.reconcile({ ...full, change: A(0) }).verdict, 'flagged');
  // what is missing does not run
  assert.deepEqual(F.reconcile({ items: [A(5)] }), { verdict: 'unchecked', parts: {} });
  assert.deepEqual(Object.keys(F.reconcile({ items: [], subtotal: A(5), total: A(5) }).parts), ['B'], 'no items, no part A');
  assert.deepEqual(Object.keys(F.reconcile({ items: [A(5)], subtotal: A(5) }).parts), ['A']);
  assert.deepEqual(Object.keys(F.reconcile({ cash: A(9), change: A(4), total: A(5) }).parts), ['C']);
  assert.deepEqual(Object.keys(F.reconcile({ cash: A(9), total: A(5) }).parts), []);
  assert.deepEqual(Object.keys(F.reconcile({ change: A(9), total: A(5) }).parts), []);
  assert.deepEqual(Object.keys(F.reconcile({ cash: A(9), change: A(4) }).parts), []);
  assert.deepEqual(Object.keys(F.reconcile({ subtotal: A(5) }).parts), []);
  assert.deepEqual(Object.keys(F.reconcile({ total: A(5) }).parts), []);
  // only the parts allowed run (a part R0 dropped neither reconciles nor flags)
  assert.deepEqual(Object.keys(F.reconcile(full, ['B', 'C']).parts), ['B', 'C']);
  assert.equal(F.reconcile({ ...full, items: [A(1)] }, ['B', 'C']).verdict, 'reconciled');
  assert.equal(F.reconcile(full, []).verdict, 'unchecked');
  // not an amount: an object without a whole value, an array that carries one, a string
  assert.equal(F.reconcile({ subtotal: {}, total: A(1) }).verdict, 'unchecked');
  assert.equal(F.reconcile({ subtotal: Object.assign([], { value: 1 }), total: A(1) }).verdict, 'unchecked');
  assert.equal(F.reconcile({ subtotal: A(1.5), total: A(1.5) }).verdict, 'unchecked');
  assert.equal(F.reconcile({ items: [null, A(5), 'x'], subtotal: A(5) }).parts.A.left, 5);
  for (const bad of [null, 'x', [], 5]) assert.deepEqual(F.reconcile(bad), { verdict: 'unchecked', parts: {} });
});

test('answers and the experts: what the library said, whether each was right, and what the experts said', () => {
  const u = F.unitsOf(R1);
  const rules = [{ when: ['total'], then: 'total' }, { when: ['subtotal'], then: 'subtotal' }, { when: ['zend', 'ztop'], then: 'item-price' }, { when: ['cash'], then: 'change' }];
  const { a, right } = F.answers(rules, u);
  assert.deepEqual(a, { total: A(3850000), subtotal: A(3500000), tax: null, service: null, discount: null, cash: null, change: A(5000000), items: [A(2500000), A(1000000), A(3500000)] });
  assert.deepEqual(right, { total: true, subtotal: true, tax: null, service: null, discount: null, cash: null, change: false, items: false });
  // line items are right only when exactly the experts' items: all of them, nothing else
  assert.equal(F.answers([{ when: ['zend', 'nasi'], then: 'item-price' }, { when: ['manis'], then: 'item-price' }], u).right.items, true);
  assert.equal(F.answers([{ when: ['manis'], then: 'item-price' }], u).right.items, false, 'one of two is not the line items');
  assert.deepEqual(F.answers([], null).right, { total: null, subtotal: null, tax: null, service: null, discount: null, cash: null, change: null, items: null });
  const e = F.experts(u);
  assert.deepEqual(e, { total: A(3850000), subtotal: A(3500000), tax: A(350000), service: null, discount: null, cash: A(5000000), change: A(1150000), items: [A(2500000), A(1000000)] });
  assert.equal(F.reconcile(e).verdict, 'reconciled');
  assert.deepEqual(F.experts(null), { total: null, subtotal: null, tax: null, service: null, discount: null, cash: null, change: null, items: null });
  assert.deepEqual(F.experts({ total: [null, { right: true, value: 7, dec: true }] }).total, A(7, true));
});

test('read: a pasted receipt, every task answered or unknown, then the check; it never guesses', () => {
  const rules = [{ when: ['total'], then: 'total', receipt: 'aa' }, { when: ['subtotal'], then: 'subtotal', receipt: 'bb' }, { when: ['zend', 'ztop'], then: 'item-price', receipt: 'cc' }, { when: ['zfirst'], then: 'item-price', receipt: 'dd' }];
  const r = F.read(R1.text, rules);
  assert.deepEqual(r.rows.map((x) => x.task), F.TASKS);
  const by = Object.fromEntries(r.rows.map((x) => [x.task, x]));
  assert.deepEqual([by.total.answer, by.total.values, by.total.rule, by.total.receipt], ['38,500', [3850000], 'total=>total', 'aa']);
  assert.deepEqual([by['item-price'].answer, by['item-price'].values, by['item-price'].rule, by['item-price'].receipt], ['25,000 · 25,000 · 10,000 · 35,000', [2500000, 2500000, 1000000, 3500000], 'zfirst=>item-price | zend+ztop=>item-price', 'dd cc']);
  assert.deepEqual(by.tax, { task: 'tax', answer: 'unknown', values: [], rule: null, receipt: null });
  assert.equal(r.check.verdict, 'flagged', 'the items it picked (with the subtotal among them) do not add up');
  assert.deepEqual(F.read(R1.text, rules, ['B']).check, { verdict: 'flagged', parts: { B: { left: 3500000, right: 3850000, holds: false } } }, 'no tax answered: it counts zero, and the totals do not meet');
  assert.equal(F.read(R1.text, rules, []).check.verdict, 'unchecked');
  assert.equal(F.read(null, null).check.verdict, 'unchecked');
});

test('R0: the rule run on the experts\' own values; a part is kept only at 80% or more of the receipts it ran on', () => {
  const bad = doc('b', [[['5,000', 'menu.price']], [['SUB', 'sub_total.subtotal_price', true], ['6,000', 'sub_total.subtotal_price']], [['TOTAL', 'total.total_price', true], ['6,000', 'total.total_price']]]);
  const units = { r1: F.unitsOf(R1), b: F.unitsOf(bad) };
  assert.deepEqual(F.ruleTest(units, ['r1', 'b', 'missing']), { A: { ran: 2, held: 1 }, B: { ran: 2, held: 2 }, C: { ran: 1, held: 1 } });
  assert.deepEqual(F.ruleTest(null, ['x']), { A: { ran: 0, held: 0 }, B: { ran: 0, held: 0 }, C: { ran: 0, held: 0 } });
  assert.deepEqual(F.partsOf({ A: { ran: 10, held: 8 }, B: { ran: 10, held: 7 }, C: { ran: 5, held: 5 } }), ['A', 'C']);
  assert.deepEqual(F.partsOf({ A: { ran: 0, held: 0 }, B: { ran: 2.5, held: 2 }, C: { ran: 4, held: 'x' } }), []);
  assert.deepEqual(F.partsOf({ B: { ran: 1, held: 1 } }), ['B']);
  assert.deepEqual([F.partsOf(null), F.partsOf({ A: 5 }), F.partsOf([])], [[], [], []]);
});

test('R2 and R3 on the meter: reconciled receipts, and whether the check caught the wrong ones', () => {
  const u = { r1: F.unitsOf(R1) };
  const good = [{ when: ['total'], then: 'total' }, { when: ['subtotal'], then: 'subtotal' }];
  assert.deepEqual(F.checkOn(good, u, ['r1']), { receipts: 1, reconciled: 0, flagged: 1, unchecked: 0, reconciledRight: 0, wrongRan: 0, wrongFlagged: 0 }, 'right answers, but the tax is missing: flagged');
  const withTax = [...good, { when: ['tax', 'zend'], then: 'tax' }];
  assert.deepEqual(F.checkOn(withTax, u, ['r1']), { receipts: 1, reconciled: 1, flagged: 0, unchecked: 0, reconciledRight: 1, wrongRan: 0, wrongFlagged: 0 });
  const wrongTax = [...good, { when: ['tax'], then: 'tax' }];   // picks 10.00, the rate
  assert.deepEqual(F.checkOn(wrongTax, u, ['r1']), { receipts: 1, reconciled: 0, flagged: 1, unchecked: 0, reconciledRight: 0, wrongRan: 1, wrongFlagged: 1 });
  // a wrong amount the check did not use counts against nothing; a wrong one it used, reconciled anyway, is not right
  const wrongCash = [...withTax, { when: ['change'], then: 'cash' }];
  assert.deepEqual(F.checkOn(wrongCash, u, ['r1'], ['B']), { receipts: 1, reconciled: 1, flagged: 0, unchecked: 0, reconciledRight: 1, wrongRan: 0, wrongFlagged: 0 });
  const fake = doc('f', [[['SUB', 'sub_total.subtotal_price', true], ['9,000', 'sub_total.subtotal_price']], [['TOTAL', 'total.total_price', true], ['5,000', 'total.total_price']], [['grand', 'total.total_price', true], ['9,000']]]);
  const fu = { f: F.unitsOf(fake) };
  assert.deepEqual(F.checkOn([{ when: ['sub'], then: 'subtotal' }, { when: ['grand'], then: 'total' }], fu, ['f']), { receipts: 1, reconciled: 1, flagged: 0, unchecked: 0, reconciledRight: 0, wrongRan: 1, wrongFlagged: 0 });
  assert.deepEqual(F.checkOn([], u, ['r1', 'none']), { receipts: 2, reconciled: 0, flagged: 0, unchecked: 2, reconciledRight: 0, wrongRan: 0, wrongFlagged: 0 });
  assert.deepEqual(F.checkOn(good, null, ['x']).unchecked, 1);
  // the verdicts at their edges: 10 reconciled decide R2, 95% holds it; 5 wrong decide R3, half holds it
  assert.deepEqual(F.verdicts({ reconciled: 9, reconciledRight: 9, wrongRan: 4, wrongFlagged: 4 }), { R2: 'undecided', R3: 'undecided' });
  assert.deepEqual(F.verdicts({ reconciled: 10, reconciledRight: 10, wrongRan: 5, wrongFlagged: 3 }), { R2: 'held', R3: 'held' });
  assert.deepEqual(F.verdicts({ reconciled: 20, reconciledRight: 19, wrongRan: 6, wrongFlagged: 3 }), { R2: 'held', R3: 'held' });
  assert.deepEqual(F.verdicts({ reconciled: 20, reconciledRight: 18, wrongRan: 6, wrongFlagged: 2 }), { R2: 'failed', R3: 'failed' });
  assert.deepEqual(F.verdicts(null), { R2: 'undecided', R3: 'undecided' });
  assert.deepEqual(F.verdicts({ reconciled: 'x', wrongRan: 7.5 }), { R2: 'undecided', R3: 'undecided' });
});

test('the library\'s place in the cycle: its tasks, its kind, its schedule and bars as sealed', () => {
  assert.deepEqual(F.TASKS, ['total', 'subtotal', 'tax', 'service', 'discount', 'cash', 'change', 'item-price']);
  assert.deepEqual([F.typeOf('tax'), F.typeOf('item-price'), F.typeOf('party')], ['money', 'money', null]);
  assert.deepEqual([F.many('item-price'), F.many('total'), F.many('x'), F.isClause('total')], [true, false, false, false]);
  assert.deepEqual(F.SCHEDULE, { meter: 100, seed: 300, batch: 40, salt: 'cord:', hash: 'sha256' });
  assert.deepEqual([F.METER_BAR, F.R_BARS.r0, F.R_BARS.r2.min, F.R_BARS.r2.share, F.R_BARS.r3.min, F.R_BARS.r3.share], [0.9, 0.8, 10, 0.95, 5, 0.5]);
  assert.deepEqual(F.TOLERANCE, { whole: 10000, cents: 5 });
  assert.deepEqual(F.DOMAIN.TASKS, F.TASKS);
  assert.match(F.DOMAIN.what('total'), /^the words on one row of a receipt around one amount/);
  assert.deepEqual([F.DOMAIN.job, F.DOMAIN.data], ['receipt reading', 'CORD v2 (CC BY 4.0)']);
  assert.deepEqual(F.FIELDS.map((f) => f.word), ['total', 'sub', 'tax', 'serv', 'disc', 'cash', 'change']);
  assert.deepEqual([F.money(0), F.money(4500000), F.money(1250), F.money(-500), F.money(134600005), F.money(1.5), F.money('7')], ['0', '45,000', '12.50', '-5', '1,346,000.05', '', '']);
});

test('the loader: rows by row_id top to bottom, words left to right, the experts\' categories and key words kept', () => {
  const q = (x, y) => ({ x1: x, x2: x + 10, x3: x + 10, x4: x, y1: y, y2: y, y3: y + 10, y4: y + 10 });
  const gt = { valid_line: [
    { category: 'total.total_price', words: [{ text: '9,000', row_id: 2, is_key: 0, quad: q(50, 100) }, { text: 'TOTAL', row_id: 2, is_key: 1, quad: q(5, 101) }] },
    { category: 'menu.price', words: [{ text: '9,000', row_id: 1, is_key: 0, quad: q(60, 20) }] },
    { category: 'menu.nm', words: [{ text: 'Kopi', row_id: 1, is_key: 0, quad: q(5, 22) }] },
  ] };
  const r = C.receiptOf(JSON.stringify({ split: 'test', row: 7, ground_truth: JSON.stringify(gt) }));
  assert.equal(r.id, 'test-007');
  assert.equal(r.text, 'Kopi 9,000\nTOTAL 9,000');
  assert.deepEqual(r.gold, [{ cat: 'menu.nm', key: false, start: 0, end: 4 }, { cat: 'menu.price', key: false, start: 5, end: 10 }, { cat: 'total.total_price', key: true, start: 11, end: 16 }, { cat: 'total.total_price', key: false, start: 17, end: 22 }]);
  assert.equal(F.reconcile(F.experts(F.unitsOf(r))).verdict, 'unchecked');
  assert.equal(C.SOURCE.sha256, '272432829e501edde76ee9457a04c146e4e6e5d7fb40c0c395fc71a93f82c613');
});

test('garbage in never throws', () => {
  const junk = [null, undefined, 0, -1, NaN, '', '\n\n\n', 'Rp', '((((', '0'.repeat(5000), '9,'.repeat(3000), {}, [], [null], { id: 'x', text: '1,000\n2,000', gold: [null, 5, { cat: 'menu.price', start: 0, end: 5 }] }, { a: { b: 1 } }];
  for (const j of junk) {
    F.scan(j); F.rowsOf(j); F.amountsOf(j); F.goldOf(j); F.unitsOf(j); F.baseline('item-price', j); F.baseline('total', j); F.pick(j, 'total', j); F.pick([{ when: ['zfirst'], then: 'item-price' }], 'item-price', j);
    F.reconcile(j); F.reconcile(j, j); F.answers(j, j); F.experts(j); F.read(j, j); F.ruleTest(j, j); F.partsOf(j); F.checkOn(j, j, j); F.verdicts(j); F.money(j); F.valueOf(j);
  }
  assert.ok(true);
});
