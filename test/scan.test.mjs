// test/scan.test.mjs — P5 and W3 by reading the source: the night file talks only to the local model, the credit step
// is a separate process through the one wire, the kernels hold no clock, disk, network or process, and no tracked file
// holds a key or a token. The night runners live in si-didy; their mirror here must equal them whenever si-didy is present.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { count } from '../tools/scan.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const imports = (src) => [...src.matchAll(/^import\s.*?from\s+'([^']+)'/gm)].map((m) => m[1]);
const SIDIDY = 'C:/Users/sjgan/si-didy/';

test('P5: the libraries\' night contacts only the local model, and makes no subscription call', () => {
  const n = read('night/patlibs-night.mjs');
  assert.deepEqual(imports(n).sort(), ['./local-wire.mjs', 'node:crypto', 'node:fs', 'node:os', 'node:path', 'node:url']);
  for (const bad of ['child_process', 'node:http', 'node:https', 'node:net', 'fetch(', 'oauth-ask', 'spawn', 'claude.exe', '@anthropic-ai', 'ANTHROPIC', 'git ', "'push'"]) assert.ok(!n.includes(bad), 'the night file holds ' + bad);
  assert.match(n, /pickModel, generate, unload } from '\.\/local-wire\.mjs'/);
});

test('P5: the credit step is a separate process through the one wire', () => {
  const t = read('night/patlibs-teach.mjs');
  assert.deepEqual(imports(t).sort(), ['node:child_process', 'node:fs', 'node:os', 'node:path', 'node:url']);
  assert.equal(t.match(/spawnSync\(/g).length, 1);
  assert.match(t, /spawnSync\(process\.execPath, \[join\(REPO, 'tools', 'oauth-ask\.mjs'\)\]/);
  for (const bad of ['fetch(', 'node:http', 'node:https', 'local-wire', 'git ', "'push'"]) assert.ok(!t.includes(bad), 'the credit step holds ' + bad);
  assert.match(t, /if \(!on \|\| DRY\)/);
});

test('the wire runs one CLI, with the environment cleaned and the ceiling as its budget', () => {
  const w = read('tools/oauth-ask.mjs');
  assert.equal(w.match(/spawnSync\(/g).length, 1);
  assert.match(w, /env: O\.env\(process\.env, p\.cfg\.maxTokens, karToken\(\)\)/);
  assert.match(w, /W\.plan\(entries,/);
  assert.match(w, /W\.settle\(res,/);
  for (const bad of ['fetch(', 'node:http', 'console.log(process.env']) assert.ok(!w.includes(bad));
});

test('the kernels are pure: no clock, no disk, no network, no process', () => {
  for (const f of readdirSync(new URL('../src/', import.meta.url))) {
    const s = read('src/' + f);
    assert.ok(imports(s).every((m) => m.startsWith('../') || m.startsWith('./')), f + ' imports only the repo');
    for (const bad of ['Date.now(', 'new Date()', 'fetch(', 'process.', 'require(']) assert.ok(!s.includes(bad), f + ' holds ' + bad);
  }
});

test('the night runners here equal the ones the night runs (when si-didy is on this machine)', { skip: !existsSync(SIDIDY + 'patlibs-night.mjs') && 'si-didy is not on this machine (CI)' }, () => {
  for (const f of ['patlibs-night.mjs', 'patlibs-teach.mjs']) assert.equal(read('night/' + f), readFileSync(SIDIDY + f, 'utf8'), f + ' differs from si-didy');
  assert.match(readFileSync(SIDIDY + 'local-wire.mjs', 'utf8'), /127\.0\.0\.1:11434/);
  const bridge = readFileSync(SIDIDY + 'dream-bridge.ps1', 'utf8');
  const order = ['node patlib-night.mjs', 'node patlib-teach.mjs', 'node patlibs-night.mjs', 'node patlibs-teach.mjs'].map((x) => bridge.indexOf(x));
  assert.ok(order.every((i) => i >= 0) && order.every((i, k) => k === 0 || i > order[k - 1]), 'dream-bridge runs the libraries after the pattern night and its teacher');
});

test('W3: no tracked file holds a key- or token-shaped string; the scan sees one when there is one', () => {
  assert.equal(count('x sk-ant-' + 'a'.repeat(20) + ' y'), 1);
  // built from pieces, so this file is never itself shaped like a token
  const q = String.fromCharCode(34);
  assert.equal(count(q + 'access' + 'Token' + q + ': ' + q + 'b'.repeat(20) + q), 1);
  assert.equal(count('CLAUDE_CODE_OAUTH_' + 'TOKEN=' + 'c'.repeat(20)), 1);
  assert.equal(count('sk-ant-short'), 0);
  assert.equal(count(null), 0);
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }).split('\0').filter(Boolean);
  assert.ok(files.length > 10);
  for (const f of files) assert.equal(count(readFileSync(new URL('../' + f, import.meta.url), 'latin1')), 0, f);
});
