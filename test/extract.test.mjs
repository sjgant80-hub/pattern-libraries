// test/extract.test.mjs — library 1's scanners, units, baseline and answer, on a small synthetic contract (no CUAD text).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import E from '../src/extract.mjs';
import P from '../vendor/patlib/patlib.mjs';

const vals = (text, type) => E.scan(text).filter((c) => c.type === type).map((c) => c.value);

test('dates: four forms, normalised; out-of-range parts refused', () => {
  assert.deepEqual(vals('signed September 7, 1999 and Sept. 8 1999', 'date'), ['1999-09-07', '1999-09-08']);
  assert.deepEqual(vals('the 7th day of September, 1999', 'date'), ['1999-09-07']);
  assert.deepEqual(vals('on 1 March 2001 or 31 January 2000', 'date'), ['2001-03-01', '2000-01-31']);
  assert.deepEqual(vals('dated 1/15/2001 and 12/31/2001', 'date'), ['2001-01-15', '2001-12-31']);
  assert.deepEqual(vals('in March 2005', 'date'), ['2005-03']);
  assert.deepEqual(vals('years 1 January 1900 and 1 January 2099', 'date'), ['1900-01-01', '2099-01-01']);
  assert.deepEqual(vals('bad 1 January 1899, 1 January 2100, 13/01/2001, 0/01/2001, May 32, 2001, May 0, 2001, 1/32/2001, 1/0/2001', 'date'), []);
  assert.deepEqual(vals('32 May 2001', 'date'), ['2001-05']);
  assert.equal(E.scan('Dec 25, 2010')[0].value, '2010-12-25');
  assert.equal(E.scan('Jun 2, 2010')[0].value, '2010-06-02');
});

test('dates: where two overlap the longer wins; the earlier wins a tie', () => {
  const c = E.scan('as of September 7, 1999.').filter((x) => x.type === 'date');
  assert.equal(c.length, 1);
  assert.equal(c[0].raw, 'September 7, 1999');
  assert.equal(c[0].start, 6);
  assert.equal(c[0].end, 23);
});

test('numbers in words', () => {
  assert.equal(E.wordsToNumber('one hundred eighty'), 180);
  assert.equal(E.wordsToNumber('twenty-four'), 24);
  assert.equal(E.wordsToNumber('hundred'), 100);
  assert.equal(E.wordsToNumber('sixty'), 60);
  assert.equal(E.wordsToNumber('foo'), null);
  assert.equal(E.wordsToNumber(''), null);
  assert.equal(E.wordsToNumber(7), null);
});

test('money: currencies, separators, cents and multipliers', () => {
  assert.deepEqual(vals('not exceed $1,000,000 in total', 'money'), ['USD 1000000.00']);
  assert.deepEqual(vals('US$ 2.5 million', 'money'), ['USD 2500000.00']);
  assert.deepEqual(vals('£500 and EUR 10 and €3', 'money'), ['GBP 500.00', 'EUR 10.00', 'EUR 3.00']);
  assert.deepEqual(vals('USD 7 thousand, $1 billion', 'money'), ['USD 7000.00', 'USD 1000000000.00']);
  assert.deepEqual(vals('$12.05', 'money'), ['USD 12.05']);
  assert.deepEqual(vals('$0', 'money'), []);
});

test('durations: digits, words, both, units; none without a number; a cap', () => {
  assert.deepEqual(vals('give sixty (60) days notice', 'duration'), ['60 day']);
  assert.deepEqual(vals('for one year', 'duration'), ['1 year']);
  assert.deepEqual(vals('12 months', 'duration'), ['12 month']);
  assert.deepEqual(vals('two weeks and 5 business days', 'duration'), ['2 week', '5 day']);
  assert.deepEqual(vals('each year', 'duration'), []);
  assert.deepEqual(vals('9999 days', 'duration'), ['9999 day']);
  assert.deepEqual(vals('ninety ninety hundred hundred days', 'duration'), []);
  assert.deepEqual(vals('(0) days', 'duration'), []);
  assert.deepEqual(vals('one day', 'duration'), ['1 day']);
  const d = E.scan('  thirty (30) days').find((x) => x.type === 'duration');
  assert.equal(d.start, 2);
  assert.equal(d.raw, 'thirty (30) days');
});

test('places: the longest name, lower-cased', () => {
  assert.deepEqual(vals('the laws of England and Wales', 'place'), ['england and wales']);
  assert.deepEqual(vals('State of New York', 'place'), ['new york']);
});

test('company names: suffixes kept; roles, articles and sentence ends cut', () => {
  const v = vals('by and between Electric City Corp., a Delaware corporation, and Bank of America Corporation and Acme Widgets Ltd', 'org');
  assert.deepEqual(v, ['electric city corp', 'bank of america corporation', 'acme widgets ltd']);
  assert.deepEqual(vals('of the Business. The Company shall', 'org'), []);
  assert.deepEqual(vals('D. The Company appoints', 'org'), []);
  assert.deepEqual(vals('If Company fails', 'org'), []);
  assert.deepEqual(vals('Unit. Acme Ltd', 'org'), ['acme ltd']);
  assert.deepEqual(vals('Widgets. Incorporated', 'org'), []);
  assert.deepEqual(vals('Widgets. GmbH', 'org'), []);
  assert.deepEqual(vals('Distributor and Company agree', 'org'), []);
  assert.deepEqual(vals('the Company agrees', 'org'), []);
  assert.deepEqual(vals('X Co', 'org'), ['x co']);
  assert.deepEqual(vals('Acme Ltd', 'org'), ['acme ltd']);
  assert.deepEqual(vals('Kwaitt & Ruben Ltd', 'org'), ['kwaitt & ruben ltd']);
  assert.deepEqual(vals('Acme Co. Ltd', 'org'), ['acme co']);   // the shortest name ending in a suffix: still inside the annotation
  assert.deepEqual(vals('ACME HOLDINGS INC.', 'org'), ['acme holdings inc']);
  const c = E.scan('and Acme Widgets Ltd.').find((x) => x.type === 'org');
  assert.equal(c.raw, 'Acme Widgets Ltd');
  assert.equal(c.start, 4);
});

test('dedupe: overlaps within a type, the longer then the earlier; touching is not overlapping; then document order', () => {
  const c = (type, start, end) => ({ type, start, end });
  assert.deepEqual(E.dedupe([c('date', 2, 6), c('date', 0, 10)]), [c('date', 0, 10)]);
  assert.deepEqual(E.dedupe([c('date', 3, 8), c('date', 0, 5)]), [c('date', 0, 5)]);
  assert.deepEqual(E.dedupe([c('date', 0, 2), c('date', 2, 4)]), [c('date', 0, 2), c('date', 2, 4)]);
  assert.deepEqual(E.dedupe([c('date', 2, 5), c('date', 0, 2)]), [c('date', 0, 2), c('date', 2, 5)]);
  assert.deepEqual(E.dedupe([c('date', 0, 4), c('org', 0, 9), c('place', 0, 4)]).map((x) => x.type), ['date', 'place', 'org']);
  assert.deepEqual(E.dedupe([c('org', 5, 9), c('date', 0, 3), null]), [c('date', 0, 3), c('org', 5, 9)]);
  assert.deepEqual(E.dedupe(null), []);
  assert.deepEqual(vals('$5$6 and $7$88', 'money'), ['USD 5.00', 'USD 6.00', 'USD 7.00', 'USD 88.00']);
});

test('scan is total: garbage gives nothing', () => {
  assert.deepEqual(E.scan(null), []);
  assert.deepEqual(E.scan(42), []);
  assert.deepEqual(E.scan(''), []);
});

test('scan orders by start, then end, then type', () => {
  const c = E.scan('Acme Widgets Ltd of New York pays $5 on 1 May 2001');
  assert.deepEqual(c.map((x) => x.type), ['org', 'place', 'money', 'date']);
  for (let i = 1; i < c.length; i++) assert.ok(c[i - 1].start <= c[i].start);
});

test('sentences: cut at . ; : before a capital, and at blank lines; short bits dropped', () => {
  const s = E.sentences('This is the first sentence here. Second sentence follows on. ok. Fourth sentence is long enough;\n\nA new paragraph starts right here');
  assert.deepEqual(s.map((x) => x.text), ['This is the first sentence here.', 'Second sentence follows on. ok.', 'Fourth sentence is long enough;', 'A new paragraph starts right here']);
  assert.equal(s[0].start, 0);
  assert.equal(s[0].end, 32);
  assert.deepEqual(E.sentences('tiny'), []);
  assert.deepEqual(E.sentences(null), []);
  assert.equal(E.sentences('x'.repeat(19)).length, 0);
  assert.equal(E.sentences('x'.repeat(20)).length, 1);
  assert.equal(E.sentences('Exactly twenty chars. ' + 'y'.repeat(19)).length, 1);
  assert.equal(E.sentences('abcdefghij klmnopqr. Next sentence that is long enough.').length, 2);
  assert.equal(E.sentences('abcdefghij klmnopq. Next sentence that is long enough.').length, 1);
});

test('context: eight words before, four after, and where it sits', () => {
  const pre = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet ';
  const text = pre + 'X' + ' kilo lima mike november oscar';
  const u = { start: pre.length, end: pre.length + 1 };
  const t = E.contextOf(text, u, true);
  assert.deepEqual(t, ['charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'zfirst', 'zhead']);
  assert.ok(!E.contextOf(text, u, false).includes('zfirst'));
  assert.deepEqual(E.contextOf(text, { start: 'a', end: 2 }, true), []);
  assert.deepEqual(E.contextOf(text, null, true), []);
  const long = 'w '.repeat(2000);
  assert.ok(E.contextOf(long, { start: 2499, end: 2500 }, false).includes('zhead'));
  assert.ok(!E.contextOf(long, { start: 2500, end: 2501 }, false).includes('zhead'));
  assert.ok(E.contextOf(long, { start: 3601, end: 3602 }, false).includes('ztail'));
  assert.ok(!E.contextOf(long, { start: 3600, end: 3601 }, false).includes('ztail'));
  assert.ok(!E.contextOf('', { start: 0, end: 0 }, false).includes('ztail'));
});

const CONTRACT = [
  'DISTRIBUTOR AGREEMENT',
  'This Distributor Agreement is made and entered into as of the 7th day of September, 1999, by and between Electric City Corp., a Delaware corporation, and Acme Widgets Ltd.',
  'The term of this Agreement shall be one (1) year and shall automatically renew for successive one (1) year periods.',
  'Either party may stop renewal by giving sixty (60) days notice before the end of the term.',
  'This Agreement shall be governed by and construed in accordance with the laws of the State of Illinois.',
  'Distributor shall not compete with the Company anywhere in the territory during the term.',
  'Signed on September 7, 1999.',
].join('\n\n');
const at = (s) => CONTRACT.indexOf(s);
const span = (cat, s) => ({ cat, start: at(s), end: at(s) + s.length });
const DOC = { id: 'demo', text: CONTRACT, gold: [
  span('Agreement Date', '7th day of September, 1999'), span('Parties', 'Electric City Corp.'), span('Parties', 'Acme Widgets Ltd'),
  span('Governing Law', 'This Agreement shall be governed by and construed in accordance with the laws of the State of Illinois.'),
  span('Renewal Term', 'shall automatically renew for successive one (1) year periods'), span('Non-Compete', 'Distributor shall not compete with the Company'),
  { cat: 'Expiration Date', start: 5, end: 5 }, { cat: 'X', start: 'a', end: 3 }, null,
] };

test('gold: bad annotations skipped', () => {
  const g = E.goldOf(DOC);
  assert.deepEqual(Object.keys(g).sort(), ['Agreement Date', 'Governing Law', 'Non-Compete', 'Parties', 'Renewal Term']);
  assert.equal(g.Parties.length, 2);
  assert.deepEqual(E.goldOf(null), {});
  assert.deepEqual(E.goldOf({ gold: [{ cat: 1, start: 1, end: 2 }] }), {});
});

test('units: labelled from the annotations, by place and by value; ids short and unique per task', () => {
  const u = E.unitsOf(DOC);
  assert.deepEqual(Object.keys(u).sort(), [...E.TASKS].sort());
  const ad = u['agreement-date'];
  assert.deepEqual(ad.map((x) => [x.value, x.right, x.label]), [['1999-09-07', true, 'agreement-date'], ['1999-09-07', true, 'agreement-date']]);
  assert.ok(ad[0].tokens.includes('entered') && ad[0].tokens.includes('zfirst') && ad[0].tokens.includes('zhead'));
  assert.ok(!ad[1].tokens.includes('zfirst'));
  assert.deepEqual(u['effective-date'].map((x) => x.right), [false, false]);
  assert.equal(u['effective-date'][0].label, 'other');
  const party = u.party.map((x) => [x.value, x.right]);
  assert.deepEqual(party, [['electric city corp', true], ['acme widgets ltd', true]]);
  assert.deepEqual(u['governing-law'].map((x) => [x.value, x.right]), [['delaware', false], ['illinois', true]]);
  assert.ok(u['renewal-term'].some((x) => x.right) && u['notice-period'].every((x) => !x.right));
  const nc = u['non-compete'];
  assert.equal(nc.filter((x) => x.right).length, 1);
  assert.ok(nc.find((x) => x.right).raw.startsWith('Distributor shall not compete'));
  assert.ok(nc.find((x) => x.right).kw);
  const ids = u['non-compete'].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(u['non-compete'][0].id, u.exclusivity[0].id);
  assert.ok(ad[0].id.length < 20);
  assert.ok(E.isCaseFor(ad[0], 'agreement-date'));
  assert.ok(!E.isCaseFor(ad[0], 'effective-date'));
  assert.ok(E.isCaseFor(u['effective-date'][0], 'effective-date'));
  assert.ok(!E.isCaseFor({ id: 1, tokens: [], label: 'other' }, 'x'));
  assert.ok(!E.isCaseFor({ id: 'a', tokens: 'x', label: 'other' }, 'x'));
  assert.ok(!E.isCaseFor(null, 'x'));
  assert.deepEqual(E.unitsOf(null), {});
  assert.deepEqual(E.unitsOf({ id: 3, text: 'x' }), {});
  assert.deepEqual(E.unitsOf({ id: 'a', text: 3 }), {});
});

test('units: a clause sentence counts only with at least ten characters of overlap', () => {
  const text = 'Alpha bravo charlie delta echo foxtrot. Golf hotel india juliet kilo lima.';
  const s2 = text.indexOf('Golf');
  const nine = E.unitsOf({ id: 'o', text, gold: [{ cat: 'Exclusivity', start: s2 - 5, end: s2 + 9 }] });
  assert.deepEqual(nine.exclusivity.map((x) => x.right), [false, false]);
  const ten = E.unitsOf({ id: 'o', text, gold: [{ cat: 'Exclusivity', start: s2 - 5, end: s2 + 10 }] });
  assert.deepEqual(ten.exclusivity.map((x) => x.right), [false, true]);
  assert.equal(ten.exclusivity[1].label, 'exclusivity');
});

test('units: a field candidate counts with one character inside the annotation', () => {
  const text = 'Effective as of 1 May 2001 for all.';
  const d = text.indexOf('1 May 2001');
  assert.deepEqual(E.unitsOf({ id: 'e', text, gold: [{ cat: 'Effective Date', start: d + 9, end: d + 20 }] })['effective-date'].map((x) => x.right), [true]);
  assert.deepEqual(E.unitsOf({ id: 'e', text, gold: [{ cat: 'Effective Date', start: d + 10, end: d + 20 }] })['effective-date'].map((x) => x.right), [false]);
});

test('asCase: the law\'s case shape', () => {
  assert.deepEqual(E.asCase({ id: 'a', tokens: ['x'], right: true }, 't', 'held'), { id: 'a', tokens: ['x'], label: 't', slice: 'held' });
  assert.deepEqual(E.asCase({ id: 'a', tokens: ['x'], right: 'yes' }, 't', 'held'), { id: 'a', tokens: ['x'], label: 'other', slice: 'held' });
  assert.deepEqual(E.asCase(null, 't', 'train'), { id: '', tokens: [], label: 'other', slice: 'train' });
});

test('tasks, kinds and the cheap baseline', () => {
  assert.equal(E.typeOf('party'), 'org');
  assert.equal(E.typeOf('insurance'), 'sentence');
  assert.equal(E.typeOf('nope'), null);
  assert.ok(E.isClause('insurance') && !E.isClause('party'));
  const u = E.unitsOf(DOC);
  assert.equal(E.baseline('governing-law', u['governing-law']).value, 'delaware');
  assert.ok(E.baseline('non-compete', u['non-compete']).raw.startsWith('Distributor shall not compete'));
  assert.equal(E.baseline('audit-rights', u['audit-rights']), null);
  assert.equal(E.baseline('party', []), null);
  assert.equal(E.baseline('party', [null, { a: 1 }]).a, 1);
  assert.equal(E.baseline('insurance', [{ kw: 'yes' }]), null);
});

test('pick and read: the first unit a kept rule fires on, or unknown; other tasks\' rules ignored', () => {
  const u = E.unitsOf(DOC);
  const rules = [{ when: ['entered'], then: 'agreement-date', receipt: 'abc' }, { when: ['laws'], then: 'governing-law' }, { when: ['bad rule'], then: 'party' }];
  const p = E.pick(rules, 'agreement-date', u['agreement-date']);
  assert.equal(p.unit.value, '1999-09-07');
  assert.equal(P.ruleKey(p.rule), 'entered=>agreement-date');
  assert.equal(E.pick(rules, 'governing-law', u['governing-law']).unit.value, 'illinois');
  assert.equal(E.pick(rules, 'party', u.party), null);
  assert.equal(E.pick([], 'party', u.party), null);
  assert.equal(E.pick(rules, 'governing-law', [null, ...u['governing-law']]).unit.value, 'illinois');
  assert.equal(E.pick([{ when: ['signed'], then: 'agreement-date' }], 'agreement-date', u['agreement-date']).unit.start, CONTRACT.indexOf('September 7, 1999'));
  const r = E.read(CONTRACT, rules);
  assert.equal(r.length, E.TASKS.length);
  const ad = r.find((x) => x.task === 'agreement-date');
  assert.deepEqual([ad.value, ad.rule, ad.receipt], ['1999-09-07', 'entered=>agreement-date', 'abc']);
  assert.equal(r.find((x) => x.task === 'governing-law').receipt, '');
  const un = r.find((x) => x.task === 'party');
  assert.deepEqual([un.answer, un.value, un.rule, un.start], ['unknown', null, null, null]);
  const cl = E.read(CONTRACT, [{ when: ['compete'], then: 'non-compete' }]).find((x) => x.task === 'non-compete');
  assert.ok(cl.answer.startsWith('Distributor shall not compete'));
  assert.equal(E.read(null, rules).filter((x) => x.answer !== 'unknown').length, 0);
});
