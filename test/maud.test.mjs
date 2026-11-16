// test/maud.test.mjs — library 5's kernel (SEAL 9): the pinned questions, the task ids and names, one unit per agreement per
// task on the experts' excerpt, ctrl-F for the answer's words (a name with no words never matches), the reader (library
// order, conflicts named), M5's six counts, a stranger's excerpt read, the schedule as sealed, and garbage that never throws.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import M from '../src/maud.mjs';

const QS = [
  { id: 'consideration', question: 'Type of Consideration-Answer', subquestion: '', category: 'General', labels: [{ label: '0', name: 'All Cash' }, { label: '1', name: 'All Stock' }, { label: '2', name: 'Mixed Cash/Stock' }] },
  { id: 'fiduciary--approval', question: 'Fiduciary exception', subquestion: 'Approval', category: 'Deal', labels: [{ label: '0', name: 'no: Approval' }, { label: '1', name: 'yes: Approval' }] },
  { id: 'empty', question: 'Empty', subquestion: '', labels: [{ label: '0', name: 'No' }, { label: '1', name: 'Yes' }] },
];
const K = M.maudFor(QS);
const rule = (when, then, receipt) => ({ when, then, ...(receipt ? { receipt } : {}) });
const doc = (id, rows) => ({ id, rows });

test('the pinned questions, the schedule and the bar as sealed', () => {
  assert.equal(M.QUESTIONS.length, 144);
  assert.equal(M.TASKS.length, 356);
  assert.equal(new Set(M.TASKS).size, 356);
  assert.deepEqual(M.SCHEDULE, { meter: 20, seed: 32, batch: 25, salt: 'maud:', hash: 'sha256', tail: 'merge' });
  assert.equal(M.METER_BAR, 0.8);
  assert.equal(M.RAW, 240);
  const c = M.QUESTIONS.find((q) => q.id === 'type-of-consideration-answer');
  assert.deepEqual(c.labels.map((l) => l.name), ['All Cash', 'All Stock', 'Mixed Cash/Stock', 'Mixed Cash/Stock: Election']);
  assert.equal(M.sayQuestion('type-of-consideration-answer'), 'Type of Consideration');
  assert.ok(Object.isFrozen(M.QUESTIONS) && Object.isFrozen(M.QUESTIONS[0]) && Object.isFrozen(M.QUESTIONS[0].labels) && Object.isFrozen(M.QUESTIONS[0].labels[0]));
  assert.equal(M.DOMAIN.data, 'MAUD (CC BY 4.0)');
});

test('tasks, names, owners', () => {
  assert.deepEqual(K.TASKS, ['consideration=0', 'consideration=1', 'consideration=2', 'fiduciary--approval=0', 'fiduciary--approval=1', 'empty=0', 'empty=1']);
  assert.deepEqual(K.tasksOf(QS[1]), ['fiduciary--approval=0', 'fiduciary--approval=1']);
  assert.deepEqual([K.say('consideration=1'), K.say('nope'), K.say(null)], ['All Stock', 'nope', '']);
  assert.deepEqual([K.questionOf('consideration=2'), K.questionOf('nope')], ['consideration', null]);
  assert.deepEqual([K.sayQuestion('consideration'), K.sayQuestion('fiduciary--approval'), K.sayQuestion('nope'), K.sayQuestion(null)], ['Type of Consideration', 'Fiduciary exception: Approval', 'nope', '']);
  assert.equal(K.QUESTIONS.length, 3);
  assert.equal(M.maudFor([null, 3, { id: '' , labels: [{}] }, { id: 'x', labels: [] }, { id: 'y' }]).TASKS.length, 0, 'junk questions dropped');
  assert.equal(M.maudFor(null).TASKS.length, 0);
  assert.equal(M.maudFor([{ id: 'z', labels: [{ name: 'a b' }] }]).TASKS[0], 'z=', 'a label with no id is the empty label');
  assert.equal(M.maudFor([{ id: 'z', labels: [{ label: '1' }] }]).say('z=1'), '', 'a label with no name has an empty one');
  const D = K.DOMAIN;
  assert.deepEqual([D.typeOf('consideration=0'), D.typeOf('nope')], ['deal point', null]);
  assert.deepEqual(D.TASKS, K.TASKS);
  assert.equal(D.many('consideration=0'), false);
  assert.equal(D.baseline, K.baseline);
  assert.equal(D.pick, K.pick);
  assert.equal(typeof D.asCase, 'function');
  assert.equal(typeof D.isCaseFor, 'function');
  assert.deepEqual([D.job, D.currentTool], ['merger agreement deal points', 'ctrl-F for the answer\'s own words']);
  assert.match(D.what(), /^the excerpt of a merger agreement/);
  assert.ok(Object.isFrozen(K) && Object.isFrozen(D) && Object.isFrozen(K.TASKS) && Object.isFrozen(K.QUESTIONS));
});

test('units: one per task per question answered; right for the experts\' label; kw on every word of a name with words', () => {
  const u = K.units(doc('a1', [{ q: 'consideration', text: 'Each share is converted into the right to receive cash, all cash, no stock.', label: '0' }, { q: 'empty', text: 'yes no', label: '1' }, { q: 'unknown', text: 'x', label: '0' }, null, { q: 'consideration' }]));
  assert.deepEqual(Object.keys(u), ['consideration=0', 'consideration=1', 'consideration=2', 'empty=0', 'empty=1']);
  assert.deepEqual(Object.keys(u).filter((t) => u[t][0].right), ['consideration=0', 'empty=1']);
  assert.deepEqual(Object.keys(u).filter((t) => u[t][0].kw), ['consideration=0', 'consideration=1', 'empty=1'], '"all cash" and "all stock" by their words ("all" is a stop word); "mixed" is absent; "Yes" is a word, "No" has none');
  const y = K.units(doc('l1', [{ q: 'fiduciary--approval', text: 'subject to board approval', label: '1' }])), n = K.units(doc('l2', [{ q: 'fiduciary--approval', text: 'subject to the board', label: '0' }]));
  assert.deepEqual([y['fiduciary--approval=1'][0].kw, y['fiduciary--approval=0'][0].kw], [true, false], 'seal 9 note: yes: X when the words of X are held');
  assert.deepEqual([n['fiduciary--approval=1'][0].kw, n['fiduciary--approval=0'][0].kw], [false, true], 'no: X when they are not');
  const two = M.maudFor([{ id: 'w', labels: [{ label: '0', name: 'no: board approval' }, { label: '1', name: 'yes: board approval' }] }]);
  const half = two.units(doc('h', [{ q: 'w', text: 'approval only', label: '0' }]));
  assert.deepEqual([half['w=0'][0].kw, half['w=1'][0].kw], [true, false], 'not ALL the words of X held is no');
  const nameless = M.maudFor([{ id: 'v', labels: [{ label: '0', name: 'no: the' }] }]).units(doc('v', [{ q: 'v', text: 'anything', label: '0' }]));
  assert.equal(nameless['v=0'][0].kw, false, 'an X with no words never matches, yes or no');
  assert.equal(M.maudFor([{ id: 'p', labels: [{ label: '0', name: 'nope: approval' }] }]).units(doc('p', [{ q: 'p', text: 'approval', label: '0' }]))['p=0'][0].kw, false, 'only yes: and no: are prefixes');
  assert.equal(u['consideration=0'][0].label, 'consideration=0');
  assert.equal(u['consideration=1'][0].label, 'other');
  assert.equal(u['consideration=0'][0].doc, 'a1');
  assert.deepEqual(u['consideration=0'][0].tokens.slice(0, 4), ['share', 'converted', 'right', 'receive']);
  assert.equal(u['consideration=0'][0].id, u['consideration=1'][0].id, 'one excerpt, one unit id across its tasks');
  assert.notEqual(u['consideration=0'][0].id, u['empty=0'][0].id);
  assert.notEqual(K.units(doc('a2', [{ q: 'consideration', text: 'x', label: '0' }]))['consideration=0'][0].id, u['consideration=0'][0].id);
  assert.match(u['consideration=0'][0].id, /\.q$/);
  assert.equal(K.units(doc('a3', [{ q: 'consideration', text: 'z'.repeat(300) + '   end', label: '0' }]))['consideration=0'][0].raw.length, 240);
  assert.equal(K.units(doc('a3', [{ q: 'consideration', text: '  a   b  ', label: '0' }]))['consideration=0'][0].raw, 'a b');
  const many = K.units(doc('a4', [{ q: 'consideration', text: Array.from({ length: 80 }, (_, i) => 'word' + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26))).join(' ') + ' mixed cash stock', label: '2' }]));
  assert.equal(many['consideration=2'][0].kw, true, 'all the excerpt\'s words are read, not a window');
  assert.ok(many['consideration=2'][0].tokens.length > 80);
  for (const bad of [null, 7, 'x', [], {}, { id: 1, rows: [] }]) assert.deepEqual(K.units(bad), {});
  assert.deepEqual(K.units({ id: 'a', rows: 'x' }), {});
});

test('baseline and pick', () => {
  const u = K.units(doc('a1', [{ q: 'consideration', text: 'all cash merger consideration', label: '0' }]));
  assert.equal(K.baseline('consideration=0', u['consideration=0']), u['consideration=0'][0]);
  assert.equal(K.baseline('consideration=1', u['consideration=1']), null);
  assert.equal(K.baseline('x', null), null);
  const rules = [rule(['merger'], 'consideration=1'), rule(['merger'], 'consideration=0', 's'), rule(['bogus', 'bogus'], 'consideration=0')];
  const p = K.pick(rules, 'consideration=0', u['consideration=0']);
  assert.equal(p.rule, rules[1]);
  assert.equal(p.unit, u['consideration=0'][0]);
  assert.equal(K.pick(rules, 'consideration=0', [null, ...u['consideration=0']]).rule, rules[1]);
  assert.equal(K.pick(rules, 'consideration=2', u['consideration=2']), null);
  assert.equal(K.pick(null, 'consideration=0', u['consideration=0']), null);
  assert.equal(K.pick(rules, 'consideration=0', null), null);
});

test('the reader: first kept pattern of the question in library order; conflicts named; other questions\' patterns ignored; ctrl-F', () => {
  const u = K.units(doc('a1', [{ q: 'consideration', text: 'all cash merger election stock', label: '2' }, { q: 'fiduciary--approval', text: 'board approval required', label: '1' }]));
  const rules = [rule(['board'], 'fiduciary--approval=1'), rule(['merger'], 'consideration=1'), rule(['election'], 'consideration=2'), rule(['stock'], 'consideration=1'), rule(['x'], 'nowhere')];
  const a = K.answer(rules, u, 'consideration');
  assert.deepEqual([a.task, a.rule, a.also, a.right], ['consideration=1', rules[1], ['consideration=2'], false]);
  assert.equal(K.answer([rules[2]], u, 'consideration').right, true);
  assert.deepEqual(K.answer([rules[2]], u, 'consideration').also, []);
  assert.equal(K.answer(rules, u, 'fiduciary--approval').task, 'fiduciary--approval=1');
  assert.equal(K.answer([rules[0]], u, 'consideration'), null, 'a pattern for another question never answers this one');
  assert.equal(K.answer(rules, u, 'nope'), null);
  assert.equal(K.answer(rules, null, 'consideration'), null);
  assert.equal(K.answer(null, u, 'consideration'), null);
  assert.equal(K.answer([{ when: 'merger', then: 'consideration=1' }, rules[2]], u, 'consideration').rule, rules[2], 'invalid rules skipped');
  assert.deepEqual(K.cheapAnswer(u, 'consideration'), { task: 'consideration=0', right: false }, 'the first label whose words are there');
  assert.deepEqual(K.cheapAnswer(K.units(doc('b', [{ q: 'consideration', text: 'all stock', label: '1' }])), 'consideration'), { task: 'consideration=1', right: true });
  assert.equal(K.cheapAnswer(K.units(doc('b', [{ q: 'consideration', text: 'nothing', label: '1' }])), 'consideration'), null);
  assert.equal(K.cheapAnswer(u, 'nope'), null);
  assert.equal(K.cheapAnswer(null, 'consideration'), null);
});

test('readOn: M5\'s six counts over every question each agreement answers', () => {
  const units = {
    a: K.units(doc('a', [{ q: 'consideration', text: 'all cash', label: '0' }, { q: 'fiduciary--approval', text: 'board approval', label: '1' }])),
    b: K.units(doc('b', [{ q: 'consideration', text: 'all stock election', label: '2' }])),
  };
  const rules = [rule(['cash'], 'consideration=0'), rule(['election'], 'consideration=2'), rule(['stock'], 'consideration=1'), rule(['board'], 'fiduciary--approval=0')];
  assert.deepEqual(K.readOn(rules, units, ['a', 'b', 'missing']), { asked: 3, answered: 3, right: 2, conflicts: 1, baseAnswered: 3, baseRight: 2 }, 'ctrl-F: a cash right, a approval yes right, b stock wrong');
  assert.deepEqual(K.readOn(rules, null, ['a']), { asked: 0, answered: 0, right: 0, conflicts: 0, baseAnswered: 0, baseRight: 0 });
  assert.equal(K.readOn(rules, units, null).asked, 0);
});

test('read: a stranger\'s excerpt for one question', () => {
  const rules = [rule(['cash'], 'consideration=0', 'sig'), rule(['election'], 'consideration=2')];
  assert.deepEqual(K.read('payable in cash', 'consideration', rules), { answer: 'consideration=0', rule: 'cash=>consideration=0', receipt: 'sig', also: [], cheap: 'consideration=0' });
  assert.deepEqual(K.read('all cash or an election', 'consideration', rules).also, ['consideration=2']);
  assert.equal(K.read('an election', 'consideration', rules).receipt, '');
  assert.equal(K.read('all cash', 'consideration', []).cheap, 'consideration=0');
  for (const bad of [null, 7, {}]) assert.equal(K.read(bad, 'consideration', rules).answer, 'unknown');
  assert.equal(K.read('cash', 'nope', rules).answer, 'unknown');
  assert.equal(K.read('cash', null, rules).cheap, 'unknown');
});

