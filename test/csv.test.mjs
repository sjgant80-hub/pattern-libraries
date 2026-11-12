// test/csv.test.mjs — src/csv.mjs: the CSV rows the loader and the catalogue page both read, and Banking77's queries
// numbered as the loader numbers them. Run: node --test test/csv.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import V, { csv, banking77 } from '../src/csv.mjs';
import L from '../tools/polyai.mjs';

test('csv: commas, doubled quotes and line breaks inside quotes; CR dropped; a last row with no newline', () => {
  assert.deepEqual(csv('a,b\n"x, y","say ""hi""\nthere"\r\nlast,row'), [['a', 'b'], ['x, y', 'say "hi"\nthere'], ['last', 'row']]);
  assert.deepEqual(csv('a,b\n'), [['a', 'b']]);
  assert.deepEqual(csv('a,\n'), [['a', '']]);
  assert.deepEqual(csv(',\n'), [['', '']]);
  assert.deepEqual(csv('x'), [['x']]);
  assert.deepEqual(csv(''), []);
  assert.deepEqual(csv('"a""'), [['a"']], 'an unclosed quote runs to the end');
  assert.deepEqual(csv(null), []);
  assert.equal(L.csv, csv, 'the loader reads with this same function');
  assert.equal(V.csv, csv);
});

test('banking77: two-field rows after each header, numbered per split', () => {
  const train = 'text,category\nmy card,card_arrival\n"pin, blocked",pin_blocked\nbad row\n';
  const test = 'text,category\nrefund?,request_refund\n';
  assert.deepEqual(banking77(train, test), [
    { id: 'b77-train-00000', text: 'my card', intent: 'card_arrival' },
    { id: 'b77-train-00001', text: 'pin, blocked', intent: 'pin_blocked' },
    { id: 'b77-test-00000', text: 'refund?', intent: 'request_refund' },
  ]);
  assert.deepEqual(banking77('h\na,b,c\n', null), [], 'three fields is not a row; no test file, no test rows');
  assert.equal(banking77(train, test)[1].id, 'b77-train-00001', 'a skipped row still uses up its number');
  assert.deepEqual(banking77('text,category\nx,y\nbad\nz,w\n', '').map((r) => r.id), ['b77-train-00000', 'b77-train-00002']);
  assert.equal(V.banking77, banking77);
});
