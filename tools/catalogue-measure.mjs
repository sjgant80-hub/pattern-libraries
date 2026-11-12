// tools/catalogue-measure.mjs — SEAL 5's measurement: K1 (exact), K2 (patterns asked per message, and wall time),
// K3 (addresses), K4 (shadows) and K5 (fired together), on Banking77 at the pinned commit. Grows libraries from the
// training messages only; the test messages are the jobs. Writes data/catalogue/measured.json (counts and timings only:
// no message text, so this repository still commits no query).
//   node tools/polyai_fetch.mjs polyai && node tools/catalogue-measure.mjs polyai [--runs 5] [--check]
// --check: re-measure and fail unless every count (not the timings) equals the committed file.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpus, platform, arch } from 'node:os';
import { performance } from 'node:perf_hooks';
import P from '../vendor/patlib/patlib.mjs';
import C from '../src/catalogue.mjs';
import T from '../src/triage.mjs';
import Y from '../src/cycle.mjs';
import L from './polyai.mjs';

const OUT = new URL('../data/catalogue/measured.json', import.meta.url);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** time(fn, runs) → the median wall time of fn over runs, in milliseconds */
function time(fn, runs) {
  const t = [];
  for (let k = 0; k < runs; k++) { const t0 = performance.now(); fn(); t.push(performance.now() - t0); }
  return C.stats(t).median;
}

export function measure(dir, runs = 5) {
  const { routes } = L.load(dir);
  const train = routes.filter((d) => d.id.startsWith('b77-train-')), test = routes.filter((d) => d.id.startsWith('b77-test-'));
  const toks = (d) => P.tokensOf(d.text).slice(0, T.WINDOW.tokens);
  const trainLists = train.map(toks), testLists = test.map(toks);
  const counts = C.wordCounts(trainLists);
  const opts = { counts, lib: C.LIBRARY_CODES.route, labels: T.ROUTES };
  const real = JSON.parse(readFileSync(new URL('../data/route/state.json', import.meta.url), 'utf8')).library;

  // the real library: K1 on every test message (positions, the law's answer, the router whole) and on the meter
  const rcat = C.catalogue(real, opts);
  const realRow = { name: 'the real routing library', n: real.length, differences: 0, routerDifferences: 0, meterDifferences: 0 };
  test.forEach((d, i) => {
    const t = testLists[i];
    if (!same(C.firing(rcat, t), C.linear(real, t))) realRow.differences++;
    if (JSON.stringify(C.answer(rcat, { tokens: t })) !== JSON.stringify(P.answer(real, { tokens: t }))) realRow.differences++;
    const u = T.routeUnits(d);
    if (JSON.stringify(T.route(real, u, rcat)) !== JSON.stringify(T.route(real, u))) realRow.routerDifferences++;
  });
  const meter = Y.schedule(routes.map((d) => d.id), T.ROUTE_SCHEDULE).meter;
  const byId = new Map(routes.map((d) => [d.id, d]));
  for (const id of meter) { const u = T.routeUnits(byId.get(id)); if (JSON.stringify(T.route(real, u, rcat)) !== JSON.stringify(T.route(real, u))) realRow.meterDifferences++; }
  realRow.meter = meter.length;
  realRow.shadowed = C.shadows(rcat).map((s, i) => (s === -1 ? null : { pattern: rcat.address[i], by: rcat.address[s] })).filter(Boolean);
  realRow.addresses = rcat.address;

  // grown libraries
  const grown = C.grow(train.map((d, i) => ({ tokens: trainLists[i], label: T.idOf(d.intent) })), opts.lib, opts.labels);
  const full = C.catalogue(grown, opts);
  const sizes = [...new Set([real.length, 100, 1000, 10000, grown.length])].filter((n) => n <= grown.length).sort((a, b) => a - b);
  const rows = sizes.map((n) => {
    const rules = grown.slice(0, n);
    let cat; const buildMs = time(() => { cat = C.catalogue(rules, opts); }, runs);
    const row = { n, valid: cat.fileWord.filter((w) => w !== null).length, buildMs, differences: 0, answerDifferences: 0, firstShadowed: 0, conflicts: 0, conflictsLinked: 0 };
    const askedN = [];
    const sh = C.shadows(cat);
    testLists.forEach((t) => {
      const f = C.firing(cat, t);
      askedN.push(C.asked(cat, t).length);
      if (!same(f, C.linear(rules, t))) row.differences++;
      if (JSON.stringify(C.answer(cat, { tokens: t })) !== JSON.stringify(P.answer(rules, { tokens: t }))) row.answerDifferences++;
      if (f.length && sh[f[0]] !== -1) row.firstShadowed++;
    });
    row.asked = C.stats(askedN);
    row.askedShareOfN = row.asked.median / n;
    row.addressesUnique = new Set(cat.address).size === n;
    row.addressesStable = same(cat.address, full.address.slice(0, n));
    row.shadowed = sh.filter((s) => s !== -1).length;
    const edges = C.together(cat, trainLists);
    for (const t of testLists) { const p = C.conflictPair(cat, t); if (p) { row.conflicts++; if (edges.has(p[0] + '-' + p[1])) row.conflictsLinked++; } }
    row.msPerMessage = {
      linear: time(() => { for (const t of testLists) C.linear(rules, t); }, runs) / testLists.length,
      catalogue: time(() => { for (const t of testLists) C.firing(cat, t); }, runs) / testLists.length,
    };
    console.error('N ' + n + ': asked median ' + row.asked.median + ' (' + (100 * row.askedShareOfN).toFixed(3) + '% of N), differences ' + row.differences + ', ' + row.msPerMessage.linear.toFixed(4) + ' ms linear vs ' + row.msPerMessage.catalogue.toFixed(4) + ' ms catalogue');
    return row;
  });
  const largest = rows[rows.length - 1];
  return {
    kind: 'pattern-libraries.catalogue', seal: 'SEAL 5 (20ea3b4)',
    data: { source: L.SOURCE.name + ', ' + L.SOURCE.by + ', ' + L.SOURCE.licence, commit: L.SOURCE.commit, manifest: L.SOURCE.manifest, train: train.length, test: test.length },
    machine: { cpu: (cpus()[0] || {}).model || 'unknown', cores: cpus().length, platform: platform() + ' ' + arch(), node: process.version, runs },
    real: realRow, candidates: grown.length, sizes: rows,
    claims: {
      K1: rows.every((r) => r.differences === 0 && r.answerDifferences === 0) && realRow.differences === 0 && realRow.routerDifferences === 0 && realRow.meterDifferences === 0 ? 'HELD' : 'FAILED',
      K2: largest.asked.median <= 0.01 * largest.n ? 'HELD' : 'FAILED',
      K3: rows.every((r) => r.addressesUnique && r.addressesStable) && new Set(realRow.addresses).size === real.length ? 'HELD' : 'FAILED',
      K4: rows.every((r) => r.firstShadowed === 0) ? 'HELD' : 'FAILED',
    },
  };
}

// the counts a re-measure must reproduce exactly (timings vary by machine and are not compared)
export function countsOf(m) {
  const strip = (r) => { const { buildMs, msPerMessage, ...rest } = r; return rest; };
  return JSON.stringify({ real: m.real, candidates: m.candidates, sizes: m.sizes.map(strip), claims: m.claims, data: m.data });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith('--'));
  const ri = args.indexOf('--runs'); const runs = ri === -1 ? 5 : Number(args[ri + 1]);
  if (!dir) { console.error('usage: catalogue-measure.mjs <polyai dir> [--runs 5] [--check]'); process.exit(2); }
  const m = { at: new Date().toISOString(), ...measure(dir, runs) };
  if (args.includes('--check')) {
    const committed = JSON.parse(readFileSync(OUT, 'utf8'));
    if (countsOf(committed) !== countsOf(m)) { console.error('::error::the catalogue measurement does not re-derive: counts differ from data/catalogue/measured.json'); process.exit(1); }
    console.log('catalogue: every count re-derived (K1 ' + m.claims.K1 + ', K2 ' + m.claims.K2 + ', K3 ' + m.claims.K3 + ', K4 ' + m.claims.K4 + ')');
  } else {
    mkdirSync(new URL('../data/catalogue/', import.meta.url), { recursive: true });
    writeFileSync(OUT, JSON.stringify(m, null, 1) + '\n');
    console.log(JSON.stringify(m.claims));
  }
}
