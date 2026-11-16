// test/router.test.mjs — the general router (SEAL 8): task ids, the keyword router's words (and a name with none),
// one unit per route plus the out-of-scope unit, the cheap baselines, the answer per task with and without a catalogue,
// the router (library order, conflicts named), L5's ten counts, a stranger's message read, and garbage that never throws.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import R from '../src/router.mjs';
import C from '../src/catalogue.mjs';

const K = R.routerFor({ intents: ['card_arrival', 'pin_change', 'no', 'Lost_card?'], key: 'k:', oos: 'oos', oosTask: 'out-of-scope', oosSay: 'Nobody here', job: 'test routing', data: 'test data', what: 'test words' });
const Plain = R.routerFor({ intents: ['card_arrival', 'pin_change'], key: 'k:' });
const rule = (when, then, receipt) => ({ when, then, ...(receipt ? { receipt } : {}) });
const U = (K2, id, text, intent) => K2.units({ id, text, intent });

test('ids, names, words, tasks', () => {
  assert.deepEqual([R.idOf('Lost_card?'), R.idOf('__a__b__'), R.idOf(null), R.idOf(7), R.idOf('W2')], ['lost-card', 'a-b', '', '', 'w2']);
  assert.deepEqual(K.ROUTES, ['card-arrival', 'pin-change', 'no', 'lost-card']);
  assert.deepEqual(K.INTENTS, ['card_arrival', 'pin_change', 'no', 'Lost_card?']);
  assert.deepEqual(K.TASKS, ['card-arrival', 'pin-change', 'no', 'lost-card', 'out-of-scope']);
  assert.equal(K.OOS, 'out-of-scope');
  assert.deepEqual([K.NAMEWORDS['card-arrival'], K.NAMEWORDS['pin-change'], K.NAMEWORDS.no, K.NAMEWORDS['lost-card']], [['card', 'arrival'], ['pin', 'change'], [], ['lost', 'card']]);
  assert.deepEqual([K.say('card-arrival'), K.say('lost-card'), K.say('out-of-scope'), K.say('nope'), K.say(null)], ['Card arrival', 'Lost card', 'Nobody here', 'nope', '']);
  assert.equal(R.routerFor({ intents: ['a_b'], oos: 'oos' }).say('out-of-scope'), 'Out of scope');
  assert.equal(R.routerFor({ intents: ['a_b'], oos: 'oos' }).OOS, 'out-of-scope');
  assert.equal(Plain.OOS, null);
  assert.equal(R.routerFor({ intents: ['a_b'], oos: '' }).OOS, null, 'an empty oos label: no flag');
  assert.equal(R.routerFor({ intents: ['a_b'], oos: 5 }).OOS, null, 'a non-string oos label: no flag');
  assert.deepEqual(Plain.TASKS, ['card-arrival', 'pin-change']);
  assert.equal(R.WINDOW.tokens, 40);
  assert.equal(R.WINDOW.raw, 240);
  assert.deepEqual(R.routerFor({ intents: ['a_b', 'A-B', '', null, '???', 3] }).ROUTES, ['a-b'], 'duplicates, empty and junk names dropped');
  assert.deepEqual(R.routerFor(null).ROUTES, []);
  assert.deepEqual(R.routerFor({ intents: 'x' }).ROUTES, []);
});

test('units: one per route and one out-of-scope; right only for the experts\' intent; kw only on every word of a name that has words', () => {
  const u = U(K, 'q1', 'My card has not arrived, what is the arrival time for my card?', 'card_arrival');
  assert.deepEqual(Object.keys(u), K.TASKS);
  assert.deepEqual(K.TASKS.filter((t) => u[t][0].right), ['card-arrival']);
  assert.deepEqual(K.TASKS.filter((t) => u[t][0].kw), ['card-arrival'], 'the empty name "no" never matches, so out-of-scope\'s cheap baseline is off');
  assert.equal(u['card-arrival'][0].label, 'card-arrival');
  assert.equal(u['pin-change'][0].label, 'other');
  assert.equal(u['out-of-scope'][0].label, 'other');
  assert.deepEqual(u['card-arrival'][0].tokens, ['card', 'arrived', 'arrival', 'time']);
  assert.equal(u['card-arrival'][0].doc, 'q1');
  assert.equal(u['card-arrival'][0].id, u['out-of-scope'][0].id);
  assert.match(u['card-arrival'][0].id, /\.q$/);
  assert.notEqual(U(Plain, 'q1', 'x', '')['card-arrival'][0].id, R.routerFor({ intents: ['card_arrival'], key: 'other:' }).units({ id: 'q1', text: 'x' })['card-arrival'][0].id, 'the key salts the unit id');
  assert.equal(u['card-arrival'][0].raw, 'My card has not arrived, what is the arrival time for my card?');
  const o = U(K, 'q2', 'how much has the   dow changed today', 'oos');
  assert.deepEqual(K.TASKS.filter((t) => o[t][0].right), ['out-of-scope']);
  assert.equal(o['out-of-scope'][0].label, 'out-of-scope');
  assert.equal(o['out-of-scope'][0].kw, true, 'no route\'s words: the cheap baseline calls it out of scope');
  assert.equal(o['out-of-scope'][0].raw, 'how much has the dow changed today');
  assert.equal(U(K, 'q3', 'lost card', 'Lost_card?')['lost-card'][0].right, true, 'the intent is matched by its id');
  assert.equal(U(K, 'q4', 'x', 'oos')['no'][0].right, false);
  const kOos = R.routerFor({ intents: ['oos', 'a_b'], oos: 'oos' });
  assert.equal(kOos.units({ id: 'z', text: 'x', intent: 'oos' }).oos[0].right, false, 'an intent named like the oos label is never right for an oos query');
  const long = U(K, 'q5', Array.from({ length: 60 }, (_, i) => 'word' + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26))).join(' ') + ' card arrival', 'x');
  assert.equal(long['card-arrival'][0].tokens.length, 40, 'patterns read the first 40 tokens');
  assert.equal(long['card-arrival'][0].kw, true, 'the keyword router reads them all');
  assert.equal(U(K, 'q6', 'y'.repeat(300), 'x')['card-arrival'][0].raw.length, 240);
  assert.equal(U(K, 'q7', 'pin and change', '')['out-of-scope'][0].kw, false);
  assert.deepEqual(Object.keys(U(Plain, 'q', 'x', '')), ['card-arrival', 'pin-change'], 'no oos unit without spec.oos');
  for (const bad of [null, 7, 'x', [], {}, { id: 1, text: 'a' }, { id: 'a', text: 2 }, { id: 'a' }]) assert.deepEqual(K.units(bad), {});
  assert.deepEqual(Object.keys(K.units({ id: 'a', text: 'card arrival' })).length, 5, 'a missing intent is no intent');
});

test('seal 10: several experts\' labels (any one is right), and a longer reading window when a library sets one', () => {
  const m = K.units({ id: 'm1', text: 'card arrival and pin change', intent: '', intents: ['card_arrival', 'pin_change', 7, 'oos'] });
  assert.deepEqual(K.TASKS.filter((t) => m[t][0].right), ['card-arrival', 'pin-change'], 'every listed label is right; junk and the oos label are not routes');
  assert.equal(m['out-of-scope'][0].right, false, 'intents never make a message out of scope');
  const both = K.units({ id: 'm2', text: 'x', intent: 'card_arrival', intents: ['pin_change'] });
  assert.deepEqual(K.TASKS.filter((t) => both[t][0].right), ['card-arrival', 'pin-change'], 'intent and intents together');
  assert.deepEqual(K.TASKS.filter((t) => K.units({ id: 'm3', text: 'x', intent: 'no', intents: 'pin_change' })[t][0].right), ['no'], 'intents that is not a list is ignored');
  const kO = R.routerFor({ intents: ['oos', 'a_b'], oos: 'oos' });
  assert.equal(kO.units({ id: 'o', text: 'x', intent: '', intents: ['oos'] }).oos[0].right, false, 'the oos label inside intents is never a route\'s right answer');
  const words = Array.from({ length: 70 }, (_, i) => 'word' + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26))).join(' ');
  const L60 = R.routerFor({ intents: ['a_b'], tokens: 60 });
  assert.equal(L60.units({ id: 'w', text: words })['a-b'][0].tokens.length, 60);
  assert.equal(R.routerFor({ intents: ['a_b'], tokens: 0 }).units({ id: 'w', text: words })['a-b'][0].tokens.length, 40, 'a window that is not a positive whole number is the default');
  assert.equal(R.routerFor({ intents: ['a_b'], tokens: 2.5 }).units({ id: 'w', text: words })['a-b'][0].tokens.length, 40);
  assert.equal(R.routerFor({ intents: ['a_b'], tokens: -3 }).units({ id: 'w', text: words })['a-b'][0].tokens.length, 40);
  assert.equal(R.routerFor({ intents: ['a_b'], tokens: 1 }).units({ id: 'w', text: words })['a-b'][0].tokens.length, 1);
});

test('baseline and pick: the cheap unit; the first unit a kept rule for the task fires on, with and without a catalogue', () => {
  const u = U(K, 'q1', 'card arrival late', 'card_arrival');
  assert.equal(K.baseline('card-arrival', u['card-arrival']), u['card-arrival'][0]);
  assert.equal(K.baseline('pin-change', u['pin-change']), null);
  assert.equal(K.baseline('x', null), null);
  assert.equal(K.baseline('x', [null, 3, { kw: 1 }]), null);
  const rules = [rule(['pin'], 'pin-change'), rule(['late'], 'card-arrival', 'r1'), rule(['late'], 'pin-change'), rule(['bogus', 'bogus'], 'card-arrival')];
  const p = K.pick(rules, 'card-arrival', u['card-arrival']);
  assert.equal(p.unit, u['card-arrival'][0]);
  assert.equal(p.rule, rules[1]);
  assert.equal(K.pick(rules, 'card-arrival', [null, ...u['card-arrival']]).rule, rules[1], 'junk units skipped');
  assert.equal(K.pick(rules, 'lost-card', u['lost-card']), null);
  assert.equal(K.pick(null, 'card-arrival', u['card-arrival']), null);
  assert.equal(K.pick(rules, 'card-arrival', null), null);
  const cat = C.catalogue(rules);
  assert.deepEqual(K.pick(rules, 'card-arrival', u['card-arrival'], cat), p, 'through a catalogue: the same answer');
  assert.equal(K.pick(rules, 'card-arrival', [null, ...u['card-arrival']], cat).rule, rules[1]);
  assert.equal(K.pick(rules, 'lost-card', u['lost-card'], cat), null);
  assert.equal(K.pick(rules, 'pin-change', u['pin-change'], cat).rule, rules[2], 'the catalogue finds the rule for this task, not the first that fires');
  assert.equal(K.pick(rules, 'pin-change', u['pin-change']).rule, rules[2]);
  assert.equal(K.pick([rule(['late'], 'card-arrival')], 'card-arrival', u['card-arrival'], cat).rule.then, 'card-arrival', 'a catalogue for other rules is not used');
});

test('the router: first kept route pattern in library order; conflicts named; the flag is not a route; the keyword router', () => {
  const u = U(K, 'q1', 'card arrival pin late', 'card_arrival');
  const rules = [rule(['late'], 'out-of-scope'), rule(['pin'], 'pin-change'), rule(['late'], 'card-arrival'), rule(['pin', 'late'], 'pin-change'), rule(['x'], 'nowhere')];
  const a = K.route(rules, u);
  assert.equal(a.route, 'pin-change');
  assert.equal(a.rule, rules[1]);
  assert.deepEqual(a.also, ['card-arrival'], 'each other route once');
  assert.equal(a.right, false);
  assert.equal(K.route([rules[2]], u).right, true);
  assert.deepEqual(K.route([rules[2]], u).also, []);
  assert.deepEqual(K.route(rules, u, C.catalogue(rules)), a, 'through a catalogue: the same answer and conflicts');
  assert.equal(K.route([rules[0]], u), null, 'out-of-scope never routes');
  assert.equal(K.route([rule(['nothing'], 'pin-change')], u), null);
  assert.equal(K.route(rules, null), null);
  assert.equal(K.route(null, u), null);
  assert.equal(K.route([{ when: 'pin', then: 'pin-change' }, rules[1]], u).rule, rules[1], 'invalid rules skipped');
  assert.deepEqual(K.keywordRoute(u), { route: 'card-arrival', right: true });
  assert.deepEqual(K.keywordRoute(U(K, 'q', 'change my pin', 'card_arrival')), { route: 'pin-change', right: false });
  assert.deepEqual(K.keywordRoute(U(K, 'q', 'lost card arrival', 'Lost_card?')), { route: 'card-arrival', right: false }, 'the first route in the intents\' order');
  assert.equal(K.keywordRoute(U(K, 'q', 'nothing', '')), null);
  assert.equal(K.keywordRoute(null), null);
});

test('routeOn: L5\'s ten counts, and a library with no oos flag has six', () => {
  const docs = [['a', 'card arrival late', 'card_arrival'], ['b', 'pin late', 'pin_change'], ['c', 'the dow today', 'oos'], ['d', 'weather today', 'oos'], ['e', 'change pin today', 'card_arrival']];
  const units = Object.fromEntries(docs.map(([id, t, i]) => [id, U(K, id, t, i)]));
  const rules = [rule(['late'], 'card-arrival'), rule(['pin'], 'pin-change'), rule(['today'], 'out-of-scope')];
  const t = K.routeOn(rules, units, ['a', 'b', 'c', 'd', 'e', 'missing']);
  assert.deepEqual(t, { queries: 6, routed: 3, right: 1, conflicts: 1, baseRouted: 2, baseRight: 1, oosRaised: 3, oosRight: 2, baseOosRaised: 3, baseOosRight: 2 }, "b (pin late) holds no route's whole name, so the cheap baseline calls it out of scope, wrongly");
  assert.deepEqual(Plain.routeOn([rule(['late'], 'card-arrival')], { a: U(Plain, 'a', 'card arrival late', 'card_arrival') }, ['a']), { queries: 1, routed: 1, right: 1, conflicts: 0, baseRouted: 1, baseRight: 1 });
  assert.deepEqual(K.routeOn(rules, null, ['a']), { queries: 1, routed: 0, right: 0, conflicts: 0, baseRouted: 0, baseRight: 0, oosRaised: 0, oosRight: 0, baseOosRaised: 0, baseOosRight: 0 });
  assert.equal(K.routeOn(rules, units, null).queries, 0);
});

test('read: a stranger\'s message', () => {
  const rules = [rule(['late'], 'card-arrival', 'sig-1'), rule(['dow'], 'out-of-scope', 'sig-2'), rule(['pin'], 'pin-change')];
  assert.deepEqual(K.read('my card is late', rules), { route: 'card-arrival', rule: 'late=>card-arrival', receipt: 'sig-1', also: [], keyword: 'unknown', outOfScope: null });
  assert.deepEqual(K.read('the dow today', rules), { route: 'unknown', rule: null, receipt: null, also: [], keyword: 'unknown', outOfScope: { rule: 'dow=>out-of-scope', receipt: 'sig-2' } });
  assert.deepEqual(K.read('pin late', rules).also, ['pin-change']);
  assert.equal(K.read('change pin', rules).receipt, '', 'a rule without a receipt says so with an empty one');
  assert.equal(K.read('change pin', rules).keyword, 'pin-change');
  assert.deepEqual(Plain.read('dow late', [rule(['dow'], 'out-of-scope')]), { route: 'unknown', rule: null, receipt: null, also: [], keyword: 'unknown', outOfScope: null });
  for (const bad of [null, 7, {}, '']) assert.equal(K.read(bad, rules).route, 'unknown');
  assert.equal(K.read('late', null).route, 'unknown');
});

test('the domain the night reads', () => {
  const D = K.DOMAIN;
  assert.deepEqual(D.TASKS, K.TASKS);
  assert.deepEqual([D.typeOf('card-arrival'), D.typeOf('out-of-scope'), D.typeOf('nope')], ['route', 'flag', null]);
  assert.equal(Plain.DOMAIN.typeOf('out-of-scope'), null);
  assert.equal(D.many('card-arrival'), false);
  assert.equal(D.baseline, K.baseline);
  assert.equal(D.pick, K.pick);
  assert.equal(typeof D.asCase, 'function');
  assert.equal(typeof D.isCaseFor, 'function');
  assert.deepEqual([D.job, D.data, D.what()], ['test routing', 'test data', 'test words']);
  assert.match(D.currentTool, /keyword router.*; out of scope: the keyword router routes it nowhere$/);
  assert.equal(Plain.DOMAIN.currentTool, 'the keyword router: every word of the route\'s own name');
  assert.deepEqual([Plain.DOMAIN.job, Plain.DOMAIN.data, Plain.DOMAIN.what()], ['routing', '', 'the words of one customer message']);
  assert.ok(Object.isFrozen(K) && Object.isFrozen(D) && Object.isFrozen(K.ROUTES) && Object.isFrozen(K.NAMEWORDS) && Object.isFrozen(K.NAMEWORDS['card-arrival']) && Object.isFrozen(K.TASKS));
});
