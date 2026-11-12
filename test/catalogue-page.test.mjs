// test/catalogue-page.test.mjs — the catalogue page (SEAL 5): it explains itself, every contents link lands, it can
// connect only to itself and to GitHub's file server, the worker's pins are the sealed ones, the measured record
// holds what the page reads, and the credits are there. Run: node --test test/catalogue-page.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PINS } from '../catalogue/worker.mjs';

const ROOT = new URL('../', import.meta.url);
const html = readFileSync(new URL('catalogue/index.html', ROOT), 'utf8');
const app = readFileSync(new URL('catalogue/app.mjs', ROOT), 'utf8');
const worker = readFileSync(new URL('catalogue/worker.mjs', ROOT), 'utf8');
const claims = readFileSync(new URL('CLAIMS.md', ROOT), 'utf8');
const prose = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');

test('the page explains itself: every section, and every contents link lands', () => {
  for (const id of ['what', 'try', 'start', 'how', 'address', 'layers', 'measured', 'rerun', 'blueprint', 'business', 'cost', 'security', 'risks', 'paper', 'words', 'faq']) assert.match(html, new RegExp('id="' + id + '"'), id);
  for (const m of html.matchAll(/href="#([\w-]+)"/g)) assert.match(html, new RegExp('id="' + m[1] + '"'), m[1]);
  for (const m of app.matchAll(/\$\('([\w-]+)'\)/g)) assert.match(html, new RegExp('id="' + m[1] + '"'), 'app.mjs needs #' + m[1]);
});

test('the page can connect only to itself and to GitHub\'s file server, and loads only its own scripts', () => {
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp, /connect-src 'self' https:\/\/raw\.githubusercontent\.com;/);
  assert.match(csp, /script-src 'self';/);
  assert.match(csp, /worker-src 'self';/);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]), ['app.mjs']);
  for (const src of [app, worker]) for (const m of src.matchAll(/^import [^;]* from '([^']+)';$/gm)) assert.match(m[1], /^\.\.?\//, m[1]);
  assert.ok([...worker.matchAll(/^import [^;]* from '([^']+)';$/gm)].length >= 4, 'the worker\'s imports were read');
  assert.deepEqual([...worker.matchAll(/fetch\(([^)]+)\)/g)].length, 1);
  assert.match(worker, /fetch\('https:\/\/raw\.githubusercontent\.com\/PolyAI-LDN\/task-specific-datasets\/' \+ PINS\.commit/);
});

test('the worker refuses any file but the sealed ones', () => {
  assert.equal(PINS.commit, '57ec275d8078af65b7731c2a98be812d844a6d6b');
  for (const f of ['banking_data/train.csv', 'banking_data/test.csv']) {
    assert.match(PINS[f], /^[0-9a-f]{64}$/);
    assert.ok(claims.includes('`' + f + '` ' + PINS[f]), f + ' is pinned in SEAL 5');
  }
  assert.match(worker, /if \(sha !== PINS\[path\]\) throw/);
});

test('the measured record holds what the page reads, and the figures on the page come from it', () => {
  const M = JSON.parse(readFileSync(new URL('data/catalogue/measured.json', ROOT), 'utf8'));
  assert.deepEqual(Object.keys(M.claims), ['K1', 'K2', 'K3', 'K4']);
  for (const v of Object.values(M.claims)) assert.ok(v === 'HELD' || v === 'FAILED');
  assert.ok(M.sizes.length >= 4 && M.real.n > 0 && M.data.test > 0);
  for (const r of M.sizes) for (const k of ['n', 'asked', 'askedShareOfN', 'differences', 'answerDifferences', 'msPerMessage', 'conflicts', 'conflictsLinked', 'firstShadowed']) assert.ok(k in r, k);
  assert.ok(M.machine.cpu && M.machine.runs >= 1);
  assert.match(app, /M\.sizes\.map\(/, 'the table is rendered from the record');
  assert.doesNotMatch(prose, /\b\d{1,3},\d{3}\b|\b22\b/, 'no typed figure in the prose: the page reads them from the record');
});

test('the credits: Gary W. Floyd in full, the data, the Konomi credit; no prices', () => {
  assert.match(html, /Gary W\. Floyd, Lumiea Systems Research Division — ThunderStruck Service LLC, "NEXUS — Distributed Synthetic Intelligence," 2026/);
  assert.match(html, /Banking77, Casanueva, Temčinas, Gerz, Henderson and Vulić, 2020, by PolyAI, CC BY 4\.0/);
  assert.match(html, /Powered by the Konomi architecture, created by Thomas Frumkin\./);
  assert.match(html, /built by Kar/);
  assert.doesNotMatch(prose, /(?:£|\$|€)\s?\d|\bpricing\b/i);
  assert.doesNotMatch(html, /karma-didy|κ|φ|konomif|sididy|\bwisp\b/i);
});
