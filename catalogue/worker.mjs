// catalogue/worker.mjs — SEAL 5, K8: the measurement re-run in the visitor's browser. Downloads Banking77's two files
// from PolyAI's repository at the pinned commit, refuses them unless their SHA-256 is the pinned one, grows the same
// libraries from the training messages and compares the catalogue with the linear scan on every test message.
import P from '../vendor/patlib/patlib.mjs';
import C from '../src/catalogue.mjs';
import T from '../src/triage.mjs';
import { banking77 } from '../src/csv.mjs';

export const PINS = Object.freeze({
  commit: '57ec275d8078af65b7731c2a98be812d844a6d6b',
  'banking_data/train.csv': 'b06e26ac675513959a63135f11b94ea7786ed02da65db93a5650d8838cbc664b',
  'banking_data/test.csv': 'd12d6e3bc4c3103966ae786dc435913c0c563dfa328f5a3646d0e62cfeeb474d',
});
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const say = (type, data) => postMessage({ type, ...data });

async function file(path) {
  const r = await fetch('https://raw.githubusercontent.com/PolyAI-LDN/task-specific-datasets/' + PINS.commit + '/' + path);
  if (!r.ok) throw new Error(path + ': HTTP ' + r.status);
  const buf = await r.arrayBuffer();
  const sha = hex(await crypto.subtle.digest('SHA-256', buf));
  if (sha !== PINS[path]) throw new Error(path + ' is not the pinned file (sha256 ' + sha.slice(0, 12) + '…)');
  return new TextDecoder().decode(buf);
}

function time(fn, runs) {
  const t = [];
  for (let k = 0; k < runs; k++) { const t0 = performance.now(); fn(); t.push(performance.now() - t0); }
  return C.stats(t).median;
}

globalThis.onmessage = async (e) => {
  try {
    const runs = e.data.runs || 3;
    say('progress', { step: 'Downloading the training messages', pct: 2 });
    const trainText = await file('banking_data/train.csv');
    say('progress', { step: 'Downloading the test messages', pct: 8 });
    const testText = await file('banking_data/test.csv');
    const routes = banking77(trainText, testText);
    const train = routes.filter((d) => d.id.startsWith('b77-train-')), test = routes.filter((d) => d.id.startsWith('b77-test-'));
    const toks = (d) => P.tokensOf(d.text).slice(0, T.WINDOW.tokens);
    const trainLists = train.map(toks), testLists = test.map(toks);
    const counts = C.wordCounts(trainLists);
    const opts = { counts, lib: C.LIBRARY_CODES.route, labels: T.ROUTES };
    say('progress', { step: 'Growing the libraries from ' + train.length + ' training messages', pct: 12 });
    const grown = C.grow(train.map((d, i) => ({ tokens: trainLists[i], label: T.idOf(d.intent) })), opts.lib, opts.labels);
    const full = C.catalogue(grown, opts);
    const sizes = [...new Set([e.data.realSize, 100, 1000, 10000, grown.length])].filter((n) => n <= grown.length).sort((a, b) => a - b);
    const rows = [];
    sizes.forEach((n, k) => {
      say('progress', { step: 'Library of ' + n.toLocaleString('en-GB') + ' patterns: every test message, both ways', pct: 15 + Math.round(80 * k / sizes.length) });
      const rules = grown.slice(0, n);
      const cat = C.catalogue(rules, opts);
      const row = { n, differences: 0, firstShadowed: 0, conflicts: 0, conflictsLinked: 0 };
      const asked = [];
      const sh = C.shadows(cat);
      // the linear scan, with each pattern's validity worked out once (validRule is pure, so this is the same scan
      // as C.linear, which re-checks it every time; the timing below uses C.linear itself)
      const valid = rules.map((r, i) => (P.validRule(r) ? i : -1)).filter((i) => i !== -1);
      const scan = (t) => { const c = { tokens: t }; return valid.filter((i) => P.fires(rules[i], c)); };
      for (const t of testLists) {
        const f = C.firing(cat, t);
        asked.push(C.asked(cat, t).length);
        if (!same(f, scan(t))) row.differences++;
        if (f.length && sh[f[0]] !== -1) row.firstShadowed++;
      }
      row.asked = C.stats(asked);
      row.addressesStable = same(cat.address, full.address.slice(0, n));
      const edges = C.together(cat, trainLists);
      for (const t of testLists) { const p = C.conflictPair(cat, t); if (p) { row.conflicts++; if (edges.has(p[0] + '-' + p[1])) row.conflictsLinked++; } }
      // timed on the same fixed sample both ways (every 10th test message), so the tab stays quick
      const sample = testLists.filter((_, i) => i % 10 === 0);
      row.timedOn = sample.length;
      row.msPerMessage = { linear: time(() => { for (const t of sample) C.linear(rules, t); }, runs) / sample.length, catalogue: time(() => { for (const t of sample) C.firing(cat, t); }, runs) / sample.length };
      rows.push(row);
    });
    say('done', { rows, train: train.length, test: test.length, candidates: grown.length, runs, grown, counts });
  } catch (err) {
    say('error', { message: String(err && err.message ? err.message : err) });
  }
};
