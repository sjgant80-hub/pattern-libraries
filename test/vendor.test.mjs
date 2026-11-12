// test/vendor.test.mjs — the reused law is the law, byte for byte: each vendored file pinned by hash, and (where the
// source repositories are on this machine) equal to the committed source it was copied from.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const PINS = {
  'vendor/patlib/patlib.mjs': '7acc284155b47b83859ea70cb6b5d8b77e2077351dc14ab8aa59292a227e2b19', // amendment 1 (seal 6): the three-word shape
  'vendor/mint/src/baseline.mjs': 'a4b4504cd4d53d4fc46c58e268a0b367485560de6376b6dfc0f3c81ee4f515eb',
  'vendor/mint/src/experiment.mjs': 'e75a63da05b4aa36fffa6b4af9354190ee8bad052c82675556b2aaf936301496',
  'vendor/mint/src/journal.mjs': '6077dbc8b605143334f6ad028ab9bdbca9d5a75120310d4c7861a3807dfe4992',
  'vendor/mint/vendor/fall-kit/light/sha256.mjs': 'cf60afffd36df071b277da214ed61a7b3f4923e443bfadb06656bb7da4756bc1',
  'vendor/spendwall/src/wall.mjs': 'ba1734d58761d049203569ccfdb9feff411632e2093ec8dc26de13201086fd27',
  'vendor/spendwall/vendor/wallet/wallet.mjs': '9a01dcb6134cdf724e1717b757fca7843544137e0c6051510a1d15682c6166f6',
  'data/prices.json': 'e76d6b4798e17555fce6d362172195be543878f68f472703b43bde9a11fca3b6',
};
const bytes = (p) => readFileSync(new URL('../' + p, import.meta.url));
const sha = (b) => createHash('sha256').update(b).digest('hex');

test('every vendored file is the pinned bytes', () => {
  for (const [p, h] of Object.entries(PINS)) assert.equal(sha(bytes(p)), h, p);
});

const SOURCES = [
  ['C:/Users/sjgan/ai-first-company', '2e69755', [['src/baseline.mjs', 'vendor/mint/src/baseline.mjs'], ['src/experiment.mjs', 'vendor/mint/src/experiment.mjs'], ['src/journal.mjs', 'vendor/mint/src/journal.mjs'], ['vendor/fall-kit/light/sha256.mjs', 'vendor/mint/vendor/fall-kit/light/sha256.mjs']]],
  ['C:/Users/sjgan/kar-spendwall', '5d02254', [['src/wall.mjs', 'vendor/spendwall/src/wall.mjs'], ['vendor/wallet/wallet.mjs', 'vendor/spendwall/vendor/wallet/wallet.mjs'], ['data/prices.json', 'data/prices.json']]],
];
for (const [repo, commit, files] of SOURCES) {
  test('equal to ' + repo.split('/').pop() + ' at ' + commit, { skip: !existsSync(repo + '/.git') && 'the source repository is not on this machine (CI)' }, () => {
    for (const [from, to] of files) assert.equal(sha(execFileSync('git', ['-C', repo, 'show', commit + ':' + from])), sha(bytes(to)), from);
  });
}
test('equal to si-didy\'s patlib.mjs (the law the night runs)', { skip: !existsSync('C:/Users/sjgan/si-didy/patlib.mjs') && 'si-didy is not on this machine (CI)' }, () => {
  assert.equal(sha(readFileSync('C:/Users/sjgan/si-didy/patlib.mjs')), PINS['vendor/patlib/patlib.mjs']);
});
