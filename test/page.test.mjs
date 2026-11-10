// test/page.test.mjs — the page held to the estate's rules and to CLAIMS.md: SEAL 1 unchanged, the sections a stranger
// needs, no measured number typed into the page (they come from the records), the kernels imported rather than copied,
// the credits, no price, no private words, and every file the page loads present.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
const html = read('index.html'), app = read('app.mjs');
// the words a reader sees: no style, no script, no tags (so an SVG coordinate like x="810" is not a typed number)
const visible = html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');

test('SEAL 1 is the claims as sealed, unchanged', () => {
  assert.equal(createHash('sha256').update(readFileSync(new URL('CLAIMS.md', ROOT))).digest('hex'), '8c955e53f77aa59a6c6a60ccd8843869b163af72a12abc421787fea2c0022c14');
});

test('the page explains itself: what, start here, how, blueprint, adoption, the brochure, the white paper', () => {
  for (const id of ['what', 'try', 'start', 'night', 'how', 'exam', 'builds', 'wall', 'blueprint', 'libraries', 'business', 'paper']) assert.match(html, new RegExp('id="' + id + '"'), id);
  for (const h of ['Start here', 'How it works', 'Blueprint', 'For your business', 'White paper', 'Risks, answered straight', 'The case for the board', 'Security, data protection and audit', 'Deployment and roll-out', 'Ownership, support and exit', 'What it does for each role']) assert.ok(html.includes(h), h);
  assert.ok((html.match(/<svg /g) || []).length >= 2, 'diagrams on the page');
});

test('no measured number is typed into the page: they are read from the records', () => {
  const summary = JSON.parse(read('data/doc/summary.json')), night = JSON.parse(read('data/doc/' + summary.latest));
  const wit = JSON.parse(read('data/witness.json'));
  const forms = new Set();
  for (const s of summary.series) for (const x of [s.coverage, s.precision]) if (typeof x === 'number' && x > 0) forms.add((x * 100).toFixed(1) + '%');
  for (const n of [night.dropped.length, summary.corpus.chars, summary.corpus.avgChars, night.proposed.free]) if (n > 20) forms.add(String(n)), forms.add(n.toLocaleString('en-GB'));
  for (const k of wit.kernels) forms.add(k.killed + '/' + k.total);
  for (const f of forms) assert.equal(visible.includes(f), false, 'the page has "' + f + '" typed in; it must come from the records');
  assert.match(app, /json\('data\/doc\/summary\.json'\)/);
  assert.match(app, /json\('data\/doc\/state\.json'\)/);
  assert.match(app, /json\('data\/witness\.json'\)/);
});

test('the page runs the kernels the night runs, not copies of them', () => {
  for (const m of ['./src/extract.mjs', './src/cycle.mjs', './src/build.mjs', './src/value.mjs', './src/oauth.mjs', './vendor/patlib/patlib.mjs']) assert.ok(app.includes("from '" + m + "'"), m);
  assert.match(app, /E\.read\(doc\.value, library\)/);
  assert.match(app, /V\.review\(/);
  assert.equal(/function gate\(|function fires\(/.test(app), false, 'no re-implemented gate in the page');
  assert.match(app, /nothing is sent/i);
  assert.equal(/fetch\((?!p,)/.test(app), false, 'the page fetches only its own files');
});

test('credits, no price, no private words', () => {
  for (const s of ['The Atticus Project', 'CC BY 4.0', 'Powered by the Konomi architecture, created by Thomas Frumkin.', 'AI Native Solutions', 'MIT']) assert.ok(visible.includes(s), s);
  assert.equal(/[$£€]\s?\d/.test(visible), false, 'no price typed into the page');
  assert.equal(/pricing|per seat|\/month|subscribe now/i.test(visible), false, 'no pricing on a product');
  for (const w of ['si-didy', 'sididy', 'konomify', 'κ', 'φ', 'wisp']) assert.equal(html.toLowerCase().includes(w), false, w);
});

test('every file the page loads is in the repository', () => {
  for (const p of ['app.mjs', 'src/extract.mjs', 'src/cycle.mjs', 'src/build.mjs', 'src/value.mjs', 'src/oauth.mjs', 'data/doc/summary.json', 'data/doc/state.json', 'data/libraries.json', 'data/witness.json', 'data/prices.json', 'CLAIMS.md'])
    assert.ok(existsSync(new URL(p, ROOT)), p);
  const summary = JSON.parse(read('data/doc/summary.json'));
  assert.ok(existsSync(new URL('data/doc/' + summary.latest, ROOT)));
  // the offline copy keeps exactly the page's own files, all of which exist, and only same-origin ones
  const sw = read('sw.js');
  const files = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  for (const f of files.filter((x) => x !== './')) assert.ok(existsSync(new URL(f, ROOT)), 'sw.js keeps a missing file: ' + f);
  assert.match(sw, /origin !== location\.origin\) return/);
  assert.match(app, /serviceWorker\.register\('sw\.js'\)/);
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  const libs = JSON.parse(read('data/libraries.json')).libraries;
  assert.deepEqual(libs.map((l) => l.id), ['doc', 'build', 'finance', 'triage', 'sales', 'angle', 'compression']);
  for (const l of libs) assert.ok(['landed', 'running', 'not landed'].includes(l.status) && (l.status === 'landed' || l.why), l.id);
  // the seal's own definition: nothing is called landed while a claim of it is still pending
  assert.equal(libs.find((l) => l.id === 'doc').status === 'landed', false, 'X1 and P4 are not decided yet');
});
