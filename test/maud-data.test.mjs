// test/maud-data.test.mjs — library 5's loader on the pinned MAUD files (SEAL 9), when they are on this machine. Kept apart
// from test/maud.test.mjs so the kernel's mutation gate does not re-read 120 MB for every mutant.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import M from '../src/maud.mjs';
import ML from '../tools/maud.mjs';

const SRC = join(homedir(), '.si-didy', 'patterns', 'sources', 'maud', 'x');
test('the loader: the pinned files, 152 agreements, the main rows only, the kernel\'s questions (when the data is on this machine)', { skip: !existsSync(join(SRC, 'data', 'MAUD_train.csv')) }, () => {
  const docs = ML.load(SRC);
  assert.equal(docs.length, 152);
  assert.equal(docs.reduce((n, d) => n + d.rows.length, 0), 20623);
  assert.deepEqual(docs.map((d) => d.id), [...docs.map((d) => d.id)].sort());
  assert.ok(docs.every((d) => d.rows.every((r) => M.QUESTIONS.some((q) => q.id === r.q))));
  assert.equal(ML.qidOf('Type of Consideration-Answer', '<NONE>'), 'type-of-consideration-answer');
  assert.equal(ML.qidOf('A Q', 'Sub Q'), 'a-q--sub-q');
  assert.equal(ML.qidOf('A Q', ''), 'a-q');
  assert.equal(ML.SOURCE.commit, '4640316078dcd370debb877f350c39a28b181ffe');
  assert.deepEqual(Object.keys(ML.units(docs.slice(0, 2))), docs.slice(0, 2).map((d) => d.id));
  assert.throws(() => ML.load(join(SRC, 'nope')));
});
