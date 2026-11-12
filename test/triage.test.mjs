// test/triage.test.mjs — library 3's kernel (SEAL 3): the task ids, the routes' own name words, the units and their
// verdicts, the keyword router and ctrl-F, the answer per task, the router (library order, conflicts named), the six
// counts of T5, a stranger's message read, the schedules and bars as sealed, and garbage that never throws.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import T from '../src/triage.mjs';
import L from '../tools/polyai.mjs';

const Q = (id, text, intent) => T.routeUnits({ id, text, intent });
const R = (when, then, receipt) => ({ when, then, ...(receipt ? { receipt } : {}) });

test('task ids, names as a person reads them, and the keyword router\'s words', () => {
  assert.equal(T.ROUTES.length, 77);
  assert.equal(new Set(T.ROUTES).size, 77);
  assert.deepEqual([T.idOf('Refund_not_showing_up'), T.idOf('reverted_card_payment?'), T.idOf('__a__b__'), T.idOf(null), T.idOf(7)], ['refund-not-showing-up', 'reverted-card-payment', 'a-b', '', '']);
  assert.deepEqual([T.ROUTES[0], T.ROUTES[44], T.ROUTES[52]], ['card-arrival', 'refund-not-showing-up', 'reverted-card-payment']);
  assert.deepEqual([T.NAMEWORDS['card-arrival'], T.NAMEWORDS['card-not-working'], T.NAMEWORDS['top-up-limits'], T.NAMEWORDS['apple-pay-or-google-pay']], [['card', 'arrival'], ['card', 'working'], ['top', 'limits'], ['apple', 'pay', 'google']]);
  assert.ok(T.ROUTES.every((r) => T.NAMEWORDS[r].length > 0), 'every route has words of its own name');
  assert.deepEqual([T.say('card-arrival'), T.say('reverted-card-payment'), T.say('refund-not-showing-up'), T.say('handoff'), T.say('lost-stolen'), T.say('nope'), T.say(null)], ['Card arrival', 'Reverted card payment', 'Refund not showing up', 'Wants a human', 'Something lost or stolen', 'nope', '']);
});

test('routing units: one per route, right only for the experts\' intent, kw only when every name word is there', () => {
  const u = Q('q1', 'My card has not arrived, what is the arrival time for my card?', 'card_arrival');
  assert.equal(Object.keys(u).length, 77);
  assert.deepEqual(T.ROUTES.filter((r) => u[r][0].right), ['card-arrival']);
  assert.deepEqual(u['card-arrival'][0].label, 'card-arrival');
  assert.deepEqual(u['card-linking'][0].label, 'other');
  assert.deepEqual(T.ROUTES.filter((r) => u[r][0].kw), ['card-arrival']);
  assert.deepEqual(u['card-arrival'][0].tokens, ['card', 'arrived', 'arrival', 'time'], 'the law\'s tokens: three letters or more, no stop words, each once');
  assert.equal(u['card-arrival'][0].doc, 'q1');
  assert.ok(T.ROUTES.every((r) => u[r][0].id === u['card-arrival'][0].id && u[r][0].tokens === u['card-arrival'][0].tokens));
  assert.notEqual(Q('q2', 'x', 'card_arrival')['card-arrival'][0].id, u['card-arrival'][0].id);
  // the irregular names route too; the patterns read the first 40 words, the keyword router reads them all
  assert.equal(Q('q3', 'refund', 'Refund_not_showing_up')['refund-not-showing-up'][0].right, true);
  const long = Q('q4', Array.from({ length: 45 }, (_, i) => 'word' + i).join(' ') + ' card arrival', 'x');
  assert.deepEqual([long['card-arrival'][0].tokens.length, long['card-arrival'][0].kw, T.ROUTES.some((r) => long[r][0].right)], [40, true, false]);
  assert.equal(Q('q5', 'a'.repeat(300), 'x')['card-arrival'][0].raw.length, 240);
  for (const bad of [null, {}, { id: 5, text: 'x' }, { id: 'a', text: 7 }, [], 'x']) assert.deepEqual(T.routeUnits(bad), {});
});

test('triage units: right from the experts\' modules; ctrl-F for human, for lost or stol', () => {
  const t = T.triageUnits({ id: 't1', text: 'My wallet was STOLEN, can I talk to a human?', intents: ['handoff', 'lost_stolen', 'other'] });
  assert.deepEqual([t.handoff[0].right, t['lost-stolen'][0].right, t.handoff[0].kw, t['lost-stolen'][0].kw], [true, true, true, true]);
  assert.deepEqual([t.handoff[0].label, t['lost-stolen'][0].label], ['handoff', 'lost-stolen']);
  const n = T.triageUnits({ id: 't2', text: 'I lost track of time', intents: 'handoff' });
  assert.deepEqual([n.handoff[0].right, n['lost-stolen'][0].right, n.handoff[0].kw, n['lost-stolen'][0].kw, n.handoff[0].label], [false, false, false, true, 'other']);
  for (const bad of [null, { id: 'a' }, { text: 'x' }, { id: 1, text: 'x' }]) assert.deepEqual(T.triageUnits(bad), {});
});

test('the cheap method and the answer per task: a kept rule for that task, valid, that fires', () => {
  const u = Q('q1', 'when will my card be delivered, tracking please', 'card_arrival');
  assert.equal(T.baseline('card-arrival', u['card-arrival']), null);
  const k = Q('k', 'card arrival', 'card_arrival');
  assert.equal(T.baseline('card-arrival', k['card-arrival']), k['card-arrival'][0]);
  assert.equal(T.baseline('x', [null, { kw: false }]), null);
  const rules = [R(['tracking'], 'card-linking'), R('tracking', 'card-arrival'), R(['tracking'], 'card-arrival'), R(['nothing'], 'card-arrival')];
  assert.equal(T.pick(rules, 'card-arrival', u['card-arrival']).rule, rules[2]);
  assert.equal(T.pick(rules, 'card-arrival', [null, ...u['card-arrival']]).unit, u['card-arrival'][0]);
  assert.equal(T.pick([rules[3]], 'card-arrival', u['card-arrival']), null);
  assert.equal(T.pick(null, 'card-arrival', null), null);
});

test('the router: the first kept route pattern in library order; every other route that fired is named; flags are not routes', () => {
  const u = Q('q', 'please track my card, I want to link it too', 'card_linking');
  const rules = [R(['link'], 'card-linking', 'r1'), R(['track'], 'card-arrival', 'r2'), R(['track'], 'card-arrival', 'r3'), R(['nothing'], 'exchange-rate'), R(['track'], 'handoff'), R('track', 'card-delivery-estimate')];
  const a = T.route(rules, u);
  assert.deepEqual([a.route, a.rule, a.also, a.right], ['card-linking', rules[0], ['card-arrival'], true]);
  const b = T.route([rules[1], rules[0]], u);
  assert.deepEqual([b.route, b.also, b.right], ['card-arrival', ['card-linking'], false]);
  assert.deepEqual(T.route([rules[0]], u).also, []);
  assert.equal(T.route([rules[3], rules[4], rules[5]], u), null, 'no route pattern fired; a flag rule and an invalid rule never route');
  assert.equal(T.route(rules, null), null);
  assert.equal(T.route(rules, Object.assign([], { 'card-linking': u['card-linking'] })), null, 'units must be an object');
  assert.equal(T.route(rules, { 'card-linking': [null, 5] }), null);
  // the keyword router: the first route, in categories.json's order, whose name words the query holds
  const k = Q('k', 'my card payment shows the wrong exchange rate', 'card_payment_wrong_exchange_rate');
  assert.deepEqual(T.keywordRoute(k), { route: 'exchange-rate', right: false });
  assert.deepEqual(T.keywordRoute(Q('k2', 'card payment wrong exchange rate', 'exchange_rate')), { route: 'exchange-rate', right: true });
  assert.equal(T.keywordRoute(Q('k3', 'hello there', 'card_arrival')), null);
  assert.equal(T.keywordRoute(null), null);
});

test('T5: routed, right, conflicts, and the keyword router\'s routed and right, on the same queries', () => {
  const units = {
    a: Q('a', 'track my card arrival', 'card_arrival'),
    b: Q('b', 'track and link my card', 'card_linking'),
    c: Q('c', 'what is the exchange rate', 'exchange_rate'),
    d: Q('d', 'hello', 'card_arrival'),
  };
  const rules = [R(['track'], 'card-arrival'), R(['link'], 'card-linking')];
  assert.deepEqual(T.routeOn(rules, units, ['a', 'b', 'c', 'd', 'missing']), { queries: 5, routed: 2, right: 1, conflicts: 1, baseRouted: 2, baseRight: 2 });
  assert.deepEqual(T.routeOn([], null, ['x']), { queries: 1, routed: 0, right: 0, conflicts: 0, baseRouted: 0, baseRight: 0 });
});

test('read: a stranger\'s message, its route or unknown, the conflicts, the keyword router, and every flag raised', () => {
  const routes = [R(['track'], 'card-arrival', 'aa'), R(['link'], 'card-linking', 'bb')];
  const flags = [R(['talk'], 'handoff', 'cc'), R(['stolen'], 'lost-stolen', 'dd'), R(['talk'], 'card-arrival')];
  const r = T.read('I want to track and link my card; let me talk to someone', routes, flags);
  assert.deepEqual(r, { route: 'card-arrival', rule: 'track=>card-arrival', receipt: 'aa', also: ['card-linking'], keyword: 'unknown', flags: [{ flag: 'handoff', rule: 'talk=>handoff', receipt: 'cc' }], cheapFlags: [] });
  const s = T.read('my phone was stolen, a human please', [], flags);
  assert.deepEqual([s.route, s.rule, s.receipt, s.also, s.flags.map((f) => f.flag), s.cheapFlags], ['unknown', null, null, [], ['lost-stolen'], ['handoff', 'lost-stolen']]);
  assert.equal(T.read('card arrival', [], []).keyword, 'card-arrival');
  assert.equal(T.read(null, null, null).route, 'unknown');
});

test('the two parts as sealed: schedules, bar, domains', () => {
  assert.deepEqual(T.ROUTE_SCHEDULE, { meter: 1000, seed: 3000, batch: 1000, salt: 'banking77:', hash: 'sha256' });
  assert.deepEqual(T.TRIAGE_SCHEDULE, { meter: 500, seed: 580, batch: 500, salt: 'nlupp:', hash: 'sha256' });
  assert.equal(T.METER_BAR, 0.8);
  assert.deepEqual(T.FLAG_IDS, ['handoff', 'lost-stolen']);
  assert.deepEqual([T.FLAGS[0].words, T.FLAGS[1].words, T.FLAGS[1].nlu], [['human'], ['lost', 'stol'], 'lost_stolen']);
  assert.deepEqual([T.ROUTE_DOMAIN.TASKS, T.TRIAGE_DOMAIN.TASKS], [T.ROUTES, T.FLAG_IDS]);
  assert.deepEqual([T.ROUTE_DOMAIN.typeOf('card-arrival'), T.ROUTE_DOMAIN.typeOf('handoff'), T.TRIAGE_DOMAIN.typeOf('handoff'), T.TRIAGE_DOMAIN.typeOf('card-arrival')], ['route', null, 'flag', null]);
  assert.deepEqual([T.ROUTE_DOMAIN.many('card-arrival'), T.ROUTE_DOMAIN.job, T.TRIAGE_DOMAIN.job, T.ROUTE_DOMAIN.data, T.TRIAGE_DOMAIN.data], [false, 'routing', 'triage', 'Banking77 (CC BY 4.0)', 'NLU++ (CC BY 4.0)']);
  assert.match(T.ROUTE_DOMAIN.what('x'), /customer message to an online bank/);
  assert.match(T.TRIAGE_DOMAIN.what('x'), /to a bank or a hotel/);
  assert.match(T.ROUTE_DOMAIN.currentTool, /keyword router/);
  assert.match(T.TRIAGE_DOMAIN.currentTool, /^ctrl-F/);
});

test('the loader: its pins, and CSV fields with commas, quotes and line breaks', () => {
  assert.deepEqual(L.csv('text,category\n"a, b",x\n"say ""hi""\nthere",y\r\nplain,z'), [['text', 'category'], ['a, b', 'x'], ['say "hi"\nthere', 'y'], ['plain', 'z']]);
  assert.deepEqual([L.SOURCE.commit, L.SOURCE.manifest, L.FILES.length], ['57ec275d8078af65b7731c2a98be812d844a6d6b', 'd014c397bfa65560859b7856a4f855fbd738f6e49c71640b7219e3ab5f9549e5', 45]);
});

test('garbage in never throws', () => {
  const junk = [null, undefined, 0, NaN, '', 'x'.repeat(5000), {}, [], [null], { id: 'x', text: 'card arrival', intent: null, intents: [null] }, { a: [5] }];
  for (const j of junk) {
    T.idOf(j); T.say(j); T.routeUnits(j); T.triageUnits(j); T.baseline(j, j); T.pick(j, j, j); T.route(j, j); T.keywordRoute(j); T.routeOn(j, j, j); T.read(j, j, j);
  }
  assert.ok(true);
});

test('SEAL 5: route, pick and routeOn through a catalogue give the same answers; a catalogue of another library is ignored', async () => {
  const C = (await import('../src/catalogue.mjs')).default;
  const lib = [R(['card', 'arrive'], 'card-arrival', 'r1'), R(['card'], 'activate-my-card', 'r2'), R(['pin'], 'pin-blocked', 'r3'), { when: ['no'], then: 'x' }, R(['card'], 'not-a-route')];
  const cat = C.catalogue(lib);
  const ids = ['a', 'b', 'c', 'd'];
  const U = { a: Q('a', 'my card did not arrive', 'card_arrival'), b: Q('b', 'pin blocked card', 'pin_blocked'), c: Q('c', 'hello there', 'card_arrival'), d: Q('d', 'pin please', 'pin_blocked') };
  for (const id of ids) assert.deepEqual(T.route(lib, U[id], cat), T.route(lib, U[id]), id);
  assert.deepEqual(T.route(lib, U.a, cat), { route: 'card-arrival', rule: lib[0], also: ['activate-my-card'], right: true });
  assert.equal(T.route(lib, U.c, cat), null);
  assert.deepEqual(T.pick(lib, 'pin-blocked', U.b['pin-blocked'], cat), { unit: U.b['pin-blocked'][0], rule: lib[2] });
  assert.deepEqual(T.pick(lib, 'activate-my-card', U.a['activate-my-card'], cat), { unit: U.a['activate-my-card'][0], rule: lib[1] });
  assert.equal(T.pick(lib, 'pin-blocked', U.a['pin-blocked'], cat), null, 'pin is not in this message');
  assert.equal(T.pick(lib, 'card-arrival', [null, 7], cat), null);
  assert.deepEqual(T.routeOn(lib, U, ids), { queries: 4, routed: 3, right: 2, conflicts: 2, baseRouted: 1, baseRight: 1 });
  const other = [R(['pin'], 'card-arrival')];
  assert.equal(T.route(other, U.b, cat).rule, other[0], 'a catalogue built for another library is not used');
  assert.equal(T.pick(other, 'card-arrival', U.b['card-arrival'], cat).rule, other[0]);
});
