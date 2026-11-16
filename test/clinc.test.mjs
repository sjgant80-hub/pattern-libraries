// test/clinc.test.mjs — library 4's kernel (SEAL 8): the 150 intents in their ten domains as pinned, the task ids, the
// out-of-scope task, the schedule as sealed, the domain of a route, and a message read through the general router.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import L from '../src/clinc.mjs';
import CL from '../tools/clinc.mjs';

test('the intents and domains as pinned, the tasks, the schedule and the bar as sealed', () => {
  assert.deepEqual(Object.keys(L.DOMAINS), ['banking', 'credit_cards', 'kitchen_and_dining', 'home', 'auto_and_commute', 'travel', 'utility', 'work', 'small_talk', 'meta']);
  assert.ok(Object.values(L.DOMAINS).every((d) => d.length === 15), 'fifteen intents in each domain');
  assert.equal(L.INTENTS.length, 150);
  assert.equal(L.ROUTES.length, 150);
  assert.equal(new Set(L.ROUTES).size, 150);
  assert.deepEqual([L.INTENTS[0], L.INTENTS[149], L.ROUTES[0], L.ROUTES[149]], ['freeze_account', 'maybe', 'freeze-account', 'maybe']);
  assert.equal(L.OOS, 'out-of-scope');
  assert.equal(L.TASKS.length, 151);
  assert.equal(L.TASKS[150], 'out-of-scope');
  assert.deepEqual(L.SCHEDULE, { meter: 1500, seed: 4200, batch: 2000, salt: 'clinc150:', hash: 'sha256', tail: 'merge' });
  assert.equal(L.METER_BAR, 0.8);
  assert.deepEqual(L.ROUTES.filter((r) => L.NAMEWORDS[r].length === 0), ['w2', 'no'], 'the two names with no words (seal 8 note)');
  assert.equal(L.say('out-of-scope'), 'Out of scope: none of the 150 teams');
  assert.equal(L.say('pto-request'), 'Pto request');
  assert.deepEqual(L.DOMAIN.TASKS, L.TASKS);
  assert.equal(L.DOMAIN.data, 'CLINC150 (CC BY 3.0)');
  assert.equal(L.DOMAIN.job, 'routing across ten domains');
  assert.match(L.DOMAIN.what(), /^the words of one request to a general assistant/);
  assert.ok(Object.isFrozen(L.DOMAINS) && Object.isFrozen(L.DOMAINS.banking) && Object.isFrozen(L.INTENTS) && Object.isFrozen(L.SCHEDULE));
});

test('domainOf, and a message read', () => {
  assert.deepEqual([L.domainOf('freeze-account'), L.domainOf('pto-request'), L.domainOf('change-speed'), L.domainOf('out-of-scope'), L.domainOf('nope'), L.domainOf(null)], ['banking', 'work', 'meta', null, null, null]);
  const u = L.units({ id: 'c1', text: 'please freeze my account now', intent: 'freeze_account' });
  assert.equal(Object.keys(u).length, 151);
  assert.deepEqual(L.TASKS.filter((t) => u[t][0].right), ['freeze-account']);
  assert.notEqual(u['freeze-account'][0].id, L.units({ id: 'c2', text: 'x', intent: '' })['freeze-account'][0].id);
  assert.equal(u['freeze-account'][0].id, (0, L.units)({ id: 'c1', text: 'y', intent: '' })['freeze-account'][0].id, 'the unit id is the message id, salted');
  const rules = [{ when: ['freeze'], then: 'freeze-account', receipt: 's' }];
  assert.equal(L.read('freeze it', rules).route, 'freeze-account');
  assert.equal(L.route(rules, u).right, true);
  assert.equal(L.keywordRoute(u).route, 'freeze-account');
  assert.equal(L.baseline('freeze-account', u['freeze-account']), u['freeze-account'][0]);
  assert.equal(L.pick(rules, 'freeze-account', u['freeze-account']).rule, rules[0]);
  assert.equal(L.routeOn(rules, { c1: u }, ['c1']).right, 1);
});

const SRC = join(homedir(), '.si-didy', 'patterns', 'sources', 'clinc150');
test('the loader: every pinned file, every query with its id, the kernel\'s domains (when the data is on this machine)', { skip: !existsSync(join(SRC, 'data_full.json')) }, () => {
  const docs = CL.load(SRC);
  assert.equal(docs.length, 23700);
  assert.equal(new Set(docs.map((d) => d.id)).size, 23700);
  assert.equal(docs.filter((d) => d.intent === 'oos').length, 1200);
  assert.deepEqual(new Set(docs.filter((d) => d.intent !== 'oos').map((d) => d.intent)), new Set(L.INTENTS));
  assert.ok(docs.every((d) => /^clinc-(train|val|test|oos_train|oos_val|oos_test)-\d{5}$/.test(d.id)));
  assert.equal(CL.SOURCE.commit, '828f8093932c8fe6ca7936c3d2e52903b1c523de');
  assert.equal(CL.SOURCE.licence, 'CC BY 3.0');
  const u = CL.units(docs.slice(0, 3));
  assert.deepEqual(Object.keys(u), docs.slice(0, 3).map((d) => d.id));
  assert.throws(() => CL.load(join(SRC, 'nope')));
});
