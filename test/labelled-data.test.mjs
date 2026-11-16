// test/labelled-data.test.mjs — libraries 6 to 9's loaders on the pinned files (SEAL 10), when they are on this machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import TL from '../tools/labelled.mjs';
import LB from '../src/labelled.mjs';

const S = join(homedir(), '.si-didy', 'patterns', 'sources');
const cases = [['ethics', 'ethics', 'ethics/commonsense/cm_train.csv', 21759], ['emotions', 'goemotions', 'train.tsv', 54263], ['maths', 'math', 'math.jsonl', 12500], ['subjects', 'mmlu', 'data/test/philosophy_test.csv', 15842]];
for (const [id, dir, probe, n] of cases) {
  test(id + ': every pinned file, every text, labels the kernel knows', { skip: !existsSync(join(S, dir, probe)) }, () => {
    const docs = TL.LOAD[id](join(S, dir));
    assert.equal(docs.length, n);
    assert.equal(new Set(docs.map((d) => d.id)).size, n);
    const known = new Set(LB.LIBRARIES[id].intents);
    assert.ok(docs.every((d) => (d.intent && known.has(d.intent)) || (Array.isArray(d.intents) && d.intents.length && d.intents.every((x) => known.has(x)))));
    assert.deepEqual(Object.keys(TL.units(id, docs.slice(0, 2))), docs.slice(0, 2).map((d) => d.id));
    assert.throws(() => TL.LOAD[id](join(S, dir, 'nope')));
  });
}
test('the MMLU manifest is the one pinned', { skip: !existsSync(join(S, 'mmlu', 'data', 'test')) }, () => {
  assert.deepEqual(TL.mmluManifest(join(S, 'mmlu')), { manifest: LB.MMLU_MANIFEST, files: 171 });
});
