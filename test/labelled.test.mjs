// test/labelled.test.mjs — libraries 6 to 9 (SEAL 10): the label lists, windows, keys, schedules and bars as sealed, one
// router per library, and GoEmotions' several labels read as several right routes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import LB from '../src/labelled.mjs';
import Y from '../src/cycle.mjs';

test('the four libraries as sealed', () => {
  assert.deepEqual(Object.keys(LB.LIBRARIES), ['ethics', 'emotions', 'maths', 'subjects']);
  assert.deepEqual(Object.values(LB.LIBRARIES).map((L) => L.n), [6, 7, 8, 9]);
  assert.deepEqual(Object.values(LB.LIBRARIES).map((L) => L.intents.length), [2, 28, 7, 57]);
  assert.deepEqual(Object.values(LB.LIBRARIES).map((L) => L.tokens), [80, 40, 80, 60]);
  assert.deepEqual(Object.values(LB.LIBRARIES).map((L) => L.key), ['eth:', 'goe:', 'math:', 'mmlu:']);
  assert.deepEqual(Object.values(LB.LIBRARIES).map((L) => L.batches), [8, 7, 5, 4]);
  assert.deepEqual(LB.LIBRARIES.ethics.schedule, { meter: 1000, seed: 4759, batch: 2000, salt: 'ethics:', hash: 'sha256', tail: 'merge' });
  assert.deepEqual(LB.LIBRARIES.emotions.schedule, { meter: 2000, seed: 10263, batch: 6000, salt: 'goemotions:', hash: 'sha256', tail: 'merge' });
  assert.deepEqual(LB.LIBRARIES.maths.schedule, { meter: 1000, seed: 3500, batch: 1600, salt: 'math:', hash: 'sha256', tail: 'merge' });
  assert.deepEqual(LB.LIBRARIES.subjects.schedule, { meter: 1000, seed: 2842, batch: 3000, salt: 'mmlu:', hash: 'sha256', tail: 'merge' });
  assert.equal(LB.METER_BAR, 0.8);
  assert.equal(LB.MMLU_MANIFEST, 'd59a00a733445df0080f4bf01e8f679dc6e1821c24048ea7c6f6e205abaa9328');
  assert.deepEqual(LB.LIBRARIES.ethics.intents, ['wrong', 'not_wrong']);
  assert.deepEqual([LB.LIBRARIES.emotions.intents[0], LB.LIBRARIES.emotions.intents[27]], ['admiration', 'neutral']);
  assert.deepEqual(LB.LIBRARIES.maths.intents, ['Algebra', 'Counting & Probability', 'Geometry', 'Intermediate Algebra', 'Number Theory', 'Prealgebra', 'Precalculus']);
  assert.deepEqual([LB.LIBRARIES.subjects.intents[0], LB.LIBRARIES.subjects.intents[45], LB.LIBRARIES.subjects.intents[56]], ['abstract_algebra', 'philosophy', 'world_religions']);
  assert.match(LB.LIBRARIES.ethics.name, /^ethics/);
  assert.equal(LB.LIBRARIES.subjects.data, 'MMLU (MIT)');
  assert.ok(Object.isFrozen(LB.LIBRARIES) && Object.isFrozen(LB.LIBRARIES.ethics) && Object.isFrozen(LB.LIBRARIES.ethics.intents) && Object.isFrozen(LB.LIBRARIES.ethics.schedule) && Object.isFrozen(LB.KERNELS));
  // the sealed sizes spend every text: 21,759 / 54,263 / 12,500 / 15,842
  for (const [id, n] of [['ethics', 21759], ['emotions', 54263], ['maths', 12500], ['subjects', 15842]]) {
    const p = Y.schedule(Array.from({ length: n }, (_, i) => id + i), LB.LIBRARIES[id].schedule);
    assert.deepEqual([p.batches.length, p.spare.length], [LB.LIBRARIES[id].batches, 0], id);
  }
});

test('one router per library, reading its own window and labels', () => {
  const K = LB.KERNELS;
  assert.deepEqual(Object.keys(K), ['ethics', 'emotions', 'maths', 'subjects']);
  assert.deepEqual(K.ethics.ROUTES, ['wrong', 'not-wrong']);
  assert.equal(K.ethics.OOS, null);
  assert.deepEqual(K.maths.ROUTES[1], 'counting-probability');
  assert.equal(K.subjects.ROUTES.length, 57);
  const words = Array.from({ length: 90 }, (_, i) => 'word' + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26))).join(' ');
  assert.deepEqual(['ethics', 'emotions', 'maths', 'subjects'].map((id) => K[id].units({ id: 'x', text: words, intent: '' })[K[id].ROUTES[0]][0].tokens.length), [80, 40, 80, 60]);
  const u = K.emotions.units({ id: 'g', text: 'thank you so much, love it', intent: '', intents: ['gratitude', 'love'] });
  assert.deepEqual(K.emotions.ROUTES.filter((r) => u[r][0].right), ['gratitude', 'love']);
  assert.equal(K.ethics.units({ id: 'e', text: 'I stole it', intent: 'wrong' }).wrong[0].right, true);
  assert.equal(K.maths.units({ id: 'm', text: 'x', intent: 'Number Theory' })['number-theory'][0].right, true);
  assert.equal(K.subjects.units({ id: 's', text: 'x', intent: 'college_physics' })['college-physics'][0].right, true);
  assert.equal(K.ethics.DOMAIN.job, LB.LIBRARIES.ethics.name);
  assert.equal(K.emotions.DOMAIN.data, 'GoEmotions (Apache-2.0)');
  assert.equal(K.maths.DOMAIN.what(), 'one competition maths problem');
});
