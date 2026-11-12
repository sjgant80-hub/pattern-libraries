// test/page.test.mjs — the page held to the estate's rules and to CLAIMS.md: SEAL 1 unchanged, the sections a stranger
// needs, no measured number typed into the page (they come from the records), the kernels imported rather than copied,
// the credits, no price, no private words, and every file the page loads present.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('../', import.meta.url);
// the whole of CLAIMS.md as sealed: seals 1 to 5
const SEALED_WHOLE = '122daaf19c23425f5e96655f86245b3b09ea28afadef8e6d65c4317eb2ae9b3a';
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
const html = read('index.html'), app = read('app.mjs');
// the words a reader sees: no style, no script, no tags (so an SVG coordinate like x="810" is not a typed number)
const visible = html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');

test('SEAL 1 is the claims as sealed, unchanged; SEAL 2 and SEAL 3 follow it, unchanged', () => {
  const buf = readFileSync(new URL('CLAIMS.md', ROOT)), sha = (b) => createHash('sha256').update(b).digest('hex');
  // seal 1 is the file's first 10,552 bytes, exactly as committed in 1c6108e; seal 2 (e28a504) was appended after it,
  // making the first 20,871 bytes; seal 3 (d6a9001) was appended after that
  assert.equal(sha(buf.subarray(0, 10552)), '8c955e53f77aa59a6c6a60ccd8843869b163af72a12abc421787fea2c0022c14');
  assert.equal(sha(buf.subarray(0, 20871)), '1d40d88cbcab33f1ef8c20dd4f681af13132d6d1bc32139bbcc98db8838566ae');
  // seal 4 (3f9b024) was appended after the first 27,114 bytes
  assert.equal(sha(buf.subarray(0, 27114)), 'af2054c2c386b3aed6ca51825e925dd8ad3ee202106cd0a2eedfdc1bb31dbe67');
  // seal 5 (20ea3b4) was appended after the first 30,768 bytes
  assert.equal(sha(buf.subarray(0, 30768)), 'e9ae2f594d04bcdf92dbbff9f04991a96c83bb630e2f1367b11b1ce517cfc651');
  assert.match(buf.subarray(30768, 30900).toString('utf8'), /^\n---\n\n# SEAL 5 · the catalogue/);
  assert.equal(sha(buf), SEALED_WHOLE);
  assert.match(buf.subarray(10552, 10700).toString('utf8'), /^\n---\n\n# SEAL 2 · library 2, FINANCE/);
  assert.match(buf.subarray(20871, 21000).toString('utf8'), /^\n---\n\n# SEAL 3 · library 3, TRIAGE AND ROUTING/);
  assert.match(buf.subarray(27114, 27250).toString('utf8'), /^\n---\n\n# SEAL 4 · the exam order for row-numbered ids/);
});

test('the page explains itself: what, start here, how, blueprint, adoption, the brochure, the white paper', () => {
  for (const id of ['what', 'try', 'receipt', 'message', 'start', 'night', 'finance', 'library3', 'how', 'exam', 'builds', 'wall', 'blueprint', 'libraries', 'business', 'fin-biz', 'tri-biz', 'paper']) assert.match(html, new RegExp('id="' + id + '"'), id);
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
  // library 2's numbers too: they come from its records, never typed in
  const fsum = JSON.parse(read('data/finance/summary.json')), fnight = JSON.parse(read('data/finance/' + fsum.latest));
  for (const s of fsum.series) for (const x of [s.coverage, s.precision]) if (typeof x === 'number' && x > 0) forms.add((x * 100).toFixed(1) + '%');
  for (const n of [fnight.dropped.length, fsum.corpus.chars, fsum.corpus.avgChars, fnight.proposed.free, ...Object.values(fsum.r0).flatMap((p) => [p.ran, p.held])]) if (n > 20) forms.add(String(n)), forms.add(n.toLocaleString('en-GB'));
  // library 3's numbers, from its two parts' records
  for (const id of ['route', 'triage']) {
    const sum = JSON.parse(read('data/' + id + '/summary.json')), n3 = JSON.parse(read('data/' + id + '/' + sum.latest));
    const k = sum.series[sum.series.length - 1].check || {};
    for (const n of [n3.dropped.length, sum.corpus.chars, sum.corpus.avgChars, n3.proposed.free, k.routed, k.right, k.baseRouted, k.baseRight]) if (n > 20) forms.add(String(n)), forms.add(n.toLocaleString('en-GB'));
  }
  for (const f of forms) assert.equal(visible.includes(f), false, 'the page has "' + f + '" typed in; it must come from the records');
  assert.match(app, /json\('data\/doc\/summary\.json'\)/);
  assert.match(app, /json\('data\/doc\/state\.json'\)/);
  assert.match(app, /json\('data\/witness\.json'\)/);
  assert.match(app, /json\('data\/finance\/summary\.json'\)/);
  assert.match(app, /json\('data\/finance\/state\.json'\)/);
  assert.match(app, /json\('data\/route\/summary\.json'\)/);
  assert.match(app, /json\('data\/triage\/state\.json'\)/);
});

test('the page runs the kernels the night runs, not copies of them', () => {
  for (const m of ['./src/extract.mjs', './src/cycle.mjs', './src/build.mjs', './src/value.mjs', './src/oauth.mjs', './src/finance.mjs', './src/triage.mjs', './vendor/patlib/patlib.mjs']) assert.ok(app.includes("from '" + m + "'"), m);
  assert.match(app, /E\.read\(doc\.value, library\)/);
  assert.match(app, /V\.review\(/);
  assert.match(app, /F\.read\(rdoc\.value, flib, fparts\)/);
  assert.match(app, /F\.reconcile\(cheap, fparts\)/);
  assert.match(app, /V\.keying\(/);
  assert.match(app, /T\.read\(mdoc\.value, rlib, tlib\)/);
  assert.equal(/function gate\(|function fires\(/.test(app), false, 'no re-implemented gate in the page');
  assert.match(app, /nothing is sent/i);
  assert.equal(/fetch\((?!p,)/.test(app), false, 'the page fetches only its own files');
});

test('credits, no price, no private words', () => {
  for (const s of ['The Atticus Project', 'CORD v2', 'NAVER CLOVA', 'Banking77', 'NLU++', 'PolyAI', 'CC BY 4.0', 'Powered by the Konomi architecture, created by Thomas Frumkin.', 'AI Native Solutions', 'MIT']) assert.ok(visible.includes(s), s);
  assert.equal(/[$£€]\s?\d/.test(visible), false, 'no price typed into the page');
  assert.equal(/pricing|per seat|\/month|subscribe now/i.test(visible), false, 'no pricing on a product');
  for (const w of ['si-didy', 'sididy', 'konomify', 'κ', 'φ', 'wisp']) assert.equal(html.toLowerCase().includes(w), false, w);
});

test('every file the page loads is in the repository', () => {
  for (const p of ['app.mjs', 'src/extract.mjs', 'src/cycle.mjs', 'src/build.mjs', 'src/value.mjs', 'src/oauth.mjs', 'data/doc/summary.json', 'data/doc/state.json', 'data/libraries.json', 'data/witness.json', 'data/prices.json', 'CLAIMS.md', 'src/finance.mjs', 'data/finance/summary.json', 'data/finance/state.json', 'src/triage.mjs', 'data/route/summary.json', 'data/route/state.json', 'data/triage/summary.json', 'data/triage/state.json'])
    assert.ok(existsSync(new URL(p, ROOT)), p);
  const summary = JSON.parse(read('data/doc/summary.json'));
  assert.ok(existsSync(new URL('data/doc/' + summary.latest, ROOT)));
  assert.ok(existsSync(new URL('data/finance/' + JSON.parse(read('data/finance/summary.json')).latest, ROOT)));
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
  assert.equal(libs.find((l) => l.id === 'finance').status, 'running', 'F1, F2, P4, R2 and R3 are not decided yet (seal 2)');
  assert.equal(libs.find((l) => l.id === 'triage').status, 'running', 'T1 and P4 are not decided yet (seal 3)');
  // seal 4: every void night a summary lists is in the repository
  for (const id of ['finance', 'route', 'triage']) for (const v of JSON.parse(read('data/' + id + '/summary.json')).void) assert.ok(existsSync(new URL('data/' + id + '/' + v.file, ROOT)), id + ' ' + v.file);
});
