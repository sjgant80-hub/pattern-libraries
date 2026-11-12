// catalogue/app.mjs — the catalogue page: routes a message through the catalogue and the linear scan side by side,
// traces a real run, shows the real library's addresses and layers, and the measured figures (SEAL 5). Every number is
// read from the committed records or computed here by the same kernels the tests and the gates check.
import P from '../vendor/patlib/patlib.mjs';
import C from '../src/catalogue.mjs';
import T from '../src/triage.mjs';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const json = (p) => fetch(p, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const n = (x) => Number(x).toLocaleString('en-GB');
const of = (k, one, many) => n(k) + ' ' + (Number(k) === 1 ? one : many);
const pct = (x, d = 2) => (100 * x).toFixed(d) + '%';
const chip = (ok, yes = 'HELD', no = 'FAILED') => '<span class="chip ' + (ok ? 'held' : 'failed') + '">' + (ok ? yes : no) + '</span>';
const EXAMPLE = 'My new card still hasn\'t arrived and I need to know the exchange rates for my trip';
const words = (text) => P.tokensOf(text).slice(0, T.WINDOW.tokens);

const [state, M, W] = await Promise.all([json('../data/route/state.json'), json('../data/catalogue/measured.json'), json('../data/witness.json')]);
const REAL = state && Array.isArray(state.library) ? state.library : [];
const LIBS = { real: { name: 'the real routing library', rules: REAL, cat: C.catalogue(REAL, { lib: C.LIBRARY_CODES.route, labels: T.ROUTES }) } };

// ── try it ──
function routeIt() {
  const L = LIBS[$('lib').value] || LIBS.real;
  const text = $('msg').value;
  const t = words(text);
  const units = T.routeUnits({ id: 'yours', text, intent: '' });
  // one message is below the browser's clock resolution, so each way is timed over many repeats
  const reps = Math.max(5, Math.min(200, Math.floor(2e6 / Math.max(1, L.rules.length))));
  const viaCat = T.route(L.rules, units, L.cat), viaAll = T.route(L.rules, units);
  let t0 = performance.now(); for (let k = 0; k < reps; k++) T.route(L.rules, units, L.cat); const msCat = (performance.now() - t0) / reps;
  t0 = performance.now(); for (let k = 0; k < reps; k++) T.route(L.rules, units); const msAll = (performance.now() - t0) / reps;
  const asked = C.asked(L.cat, t), fired = C.firing(L.cat, t);
  const slots = [...new Set(t)].filter((w) => L.cat.filed[w]).map((w) => '<code>' + esc(w) + '</code> (' + L.cat.filed[w].length + ')');
  const same = JSON.stringify(viaCat) === JSON.stringify(viaAll);
  const firedRows = fired.slice(0, 12).map((i) => '<tr><td><code>' + esc(L.cat.address[i] || '') + '</code></td><td>' + esc(L.rules[i].when.join(' + ')) + '</td><td>' + esc(T.say(L.rules[i].then)) + '</td></tr>').join('');
  $('out').innerHTML = '<div class="card">'
    + '<p><b>Words read:</b> ' + (t.length ? t.map((w) => '<code>' + esc(w) + '</code>').join(' ') : '<span class="muted">none (words of three letters or more, common words left out)</span>') + '</p>'
    + '<p><b>Filing slots found:</b> ' + (slots.length ? slots.join(' ') : '<span class="muted">none</span>') + ' <span class="small muted">(patterns filed in each)</span></p>'
    + '<p><b>Asked:</b> ' + n(asked.length) + ' of ' + n(L.rules.length) + ' patterns. <b>Fired:</b> ' + n(fired.length) + '.</p>'
    + (firedRows ? '<div class="tbl"><table><thead><tr><th>Address</th><th>Words</th><th>Team</th></tr></thead><tbody>' + firedRows + '</tbody></table></div>' + (fired.length > 12 ? '<p class="small muted">and ' + n(fired.length - 12) + ' more</p>' : '') : '')
    + '<div class="grid2"><div><h3>Through the catalogue</h3><p>' + (viaCat ? 'Routed to <b>' + esc(T.say(viaCat.route)) + '</b> by <code>' + esc(P.ruleKey(viaCat.rule)) + '</code>' + (viaCat.also.length ? '; also fired: ' + viaCat.also.map((x) => esc(T.say(x))).join(', ') + ' (a conflict)' : '') : '<b>unknown</b>: no pattern fires, so it would go on to the model') + '</p><p class="small muted">' + msCat.toFixed(4) + ' ms a message in this tab (' + reps + ' runs)</p></div>'
    + '<div><h3>The old way (every pattern asked)</h3><p>' + (viaAll ? 'Routed to <b>' + esc(T.say(viaAll.route)) + '</b>' + (viaAll.also.length ? ', with ' + viaAll.also.length + ' conflicting' : '') : '<b>unknown</b>') + '</p><p class="small muted">' + n(L.rules.length) + ' patterns asked · ' + msAll.toFixed(4) + ' ms a message in this tab (' + reps + ' runs)</p></div></div>'
    + '<p>' + chip(same, 'SAME ANSWER', 'DIFFERENT') + ' the router\'s whole result (team, pattern, conflicts) compared.</p></div>';
}
$('go').addEventListener('click', routeIt);
$('ex').addEventListener('click', () => { $('msg').value = EXAMPLE; routeIt(); });
$('lib').addEventListener('change', () => { const L = LIBS[$('lib').value]; $('libnote').textContent = L ? L.name + ': ' + n(L.rules.length) + ' patterns.' : ''; routeIt(); });
$('libnote').textContent = 'The real routing library: ' + n(REAL.length) + ' patterns, kept by the nightly loop. Re-run it here (below) to add the grown libraries to this list.';

// ── the trace ──
(() => {
  const L = LIBS.real; const t = words(EXAMPLE);
  const asked = C.asked(L.cat, t), fired = C.firing(L.cat, t);
  const r = T.route(L.rules, T.routeUnits({ id: 'ex', text: EXAMPLE, intent: '' }), L.cat);
  $('trace').innerHTML = [
    '<b>Words:</b> ' + t.map((w) => '<code>' + esc(w) + '</code>').join(' ') + ' (' + t.length + ').',
    '<b>Look up:</b> ' + n(Object.keys(L.cat.filed).length) + ' filing slots hold the library\'s ' + n(REAL.length) + ' patterns; ' + (() => { const k = [...new Set(t)].filter((w) => L.cat.filed[w]).length; return n(k) + ' of the message\'s words ' + (k === 1 ? 'has' : 'have') + ' one.'; })(),
    '<b>Ask:</b> ' + of(asked.length, 'pattern', 'patterns') + ' asked, with the law\'s <code>fires()</code>; ' + n(fired.length) + ' fired: ' + (fired.map((i) => '<code>' + esc(L.cat.address[i]) + '</code>').join(', ') || 'none') + '.',
    '<b>Order:</b> positions ' + (fired.join(', ') || 'none') + ' in library order.',
    '<b>Answer:</b> ' + (r ? esc(T.say(r.route)) + (r.also.length ? '; conflict with ' + r.also.map((x) => esc(T.say(x))).join(', ') : '; no conflict') : 'unknown') + '. The old way, asking all ' + n(REAL.length) + ': ' + (JSON.stringify(r) === JSON.stringify(T.route(L.rules, T.routeUnits({ id: 'ex', text: EXAMPLE, intent: '' }))) ? 'the same.' : 'DIFFERENT.'),
  ].map((x) => '<li>' + x + '</li>').join('');
})();

// ── the address table and the layers, from the real library ──
(() => {
  const L = LIBS.real; const sh = C.shadows(L.cat);
  $('addr').querySelector('tbody').innerHTML = REAL.map((r, i) => '<tr><td><code>' + esc(L.cat.address[i] || '(invalid)') + '</code></td><td>' + esc(P.validRule(r) ? r.when.join(' + ') : '') + '</td><td>' + esc(T.say(r.then)) + '</td><td><code>' + esc(L.cat.fileWord[i] || '') + '</code></td><td>' + (sh[i] === -1 ? '<span class="muted">none</span>' : '<code>' + esc(L.cat.address[sh[i]]) + '</code>') + '</td></tr>').join('');
  const cls = C.classes(L.cat), prov = C.provenance(L.cat);
  const shadowed = sh.filter((s) => s !== -1).length;
  $('layercards').innerHTML = [
    ['Words', n(Object.keys(L.cat.filed).length) + ' filing slots for ' + n(REAL.length) + ' patterns'],
    ['Class', n(Object.keys(cls).length) + ' of the 77 teams have a pattern'],
    ['Shadow', shadowed ? n(shadowed) + ' shadowed' : 'none shadowed: every pattern can answer'],
    ['Fired together', M && M.sizes && M.sizes[0] ? 'built from the training messages: see Measured' : 'built from the training messages'],
    ['Provenance', n(Object.keys(prov).length) + ' night-and-recipe groups'],
  ].map(([h, t]) => '<div class="card"><b>' + h + '</b><p class="small">' + t + '</p></div>').join('');
})();

// ── measured ──
if (M && Array.isArray(M.sizes)) {
  const K = M.claims || {};
  $('chips').innerHTML = ['K1 exact', 'K2 sub-linear', 'K3 addresses', 'K4 shadows'].map((s, i) => { const v = K['K' + (i + 1)]; return chip(v === 'HELD', s + ': held', s + ': ' + String(v).toLowerCase()); }).join(' ');
  $('claimchips').innerHTML = $('chips').innerHTML;
  $('mtable').querySelector('tbody').innerHTML = M.sizes.map((r) => '<tr><td class="n">' + n(r.n) + '</td><td class="n">' + r.asked.median + ' · ' + r.asked.p95 + ' · ' + r.asked.max + '</td><td class="n">' + pct(r.askedShareOfN) + '</td><td class="n">' + (r.differences + r.answerDifferences) + ' of ' + n(M.data.test) + '</td><td class="n">' + r.msPerMessage.linear.toFixed(4) + '</td><td class="n">' + r.msPerMessage.catalogue.toFixed(4) + '</td></tr>').join('');
  const L = M.sizes[M.sizes.length - 1];
  $('mnote').textContent = 'Times: the median of ' + M.machine.runs + ' runs over all ' + n(M.data.test) + ' test messages, one core, ' + M.machine.cpu + ', ' + M.machine.platform + ', Node ' + M.machine.node + '. At ' + n(L.n) + ' patterns the catalogue routes a message ' + (L.msPerMessage.linear / L.msPerMessage.catalogue).toFixed(0) + ' times faster than asking every pattern. Measured ' + String(M.at || '').slice(0, 10) + '.';
  const R = M.real;
  $('realsay').innerHTML = 'The real routing library (' + n(R.n) + ' patterns): ' + (R.differences === 0 ? 'no' : n(R.differences)) + ' differences on the ' + n(M.data.test) + ' test messages in the patterns that fire and the law\'s answer, ' + (R.routerDifferences === 0 ? 'none' : n(R.routerDifferences)) + ' in the router\'s whole result, and ' + (R.meterDifferences === 0 ? 'none' : n(R.meterDifferences)) + ' on the nightly loop\'s ' + n(R.meter) + ' measuring messages. ' + (R.shadowed.length ? n(R.shadowed.length) + ' of its patterns are shadowed: ' + R.shadowed.map((s) => '<code>' + esc(s.pattern) + '</code> by <code>' + esc(s.by) + '</code>').join(', ') + '.' : 'None of its patterns is shadowed.');
  $('k5say').innerHTML = M.sizes.map((r) => n(r.n) + ' patterns: ' + n(r.conflictsLinked) + ' of ' + n(r.conflicts) + ' conflicts (' + (r.conflicts ? pct(r.conflictsLinked / r.conflicts, 1) : 'n/a') + ') were already linked from the training messages').join('; ') + '. Measured, with no target (K5).';
  // chart: patterns asked (median) against library size, both on log scales; the old way asks them all
  const W0 = 640, H0 = 260, x0 = 60, y0 = 220, w = 550, h = 190;
  const lx = (v) => x0 + w * Math.log10(v) / Math.log10(L.n * 1.2), ly = (v) => y0 - h * Math.log10(Math.max(v, 1)) / Math.log10(L.n * 1.2);
  const pts = (f) => M.sizes.map((r) => lx(r.n).toFixed(1) + ',' + ly(f(r)).toFixed(1)).join(' ');
  const ticks = [1, 10, 100, 1000, 10000, 100000].filter((v) => v <= L.n * 1.2);
  $('chart').innerHTML = $('chart').innerHTML + '<line class="ax" x1="' + x0 + '" y1="' + y0 + '" x2="' + (x0 + w) + '" y2="' + y0 + '"/><line class="ax" x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + (y0 - h) + '"/>'
    + ticks.map((v) => '<text x="' + lx(v).toFixed(1) + '" y="' + (y0 + 16) + '" text-anchor="middle" font-size="11">' + n(v) + '</text><text x="' + (x0 - 6) + '" y="' + (ly(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11">' + n(v) + '</text>').join('')
    + '<polyline class="lin" points="' + pts((r) => r.n) + '"/><polyline class="ln" points="' + pts((r) => r.asked.median) + '"/>'
    + '<text x="' + (x0 + 8) + '" y="' + (y0 - h + 4) + '" font-size="12">patterns asked per message</text><text x="' + (x0 + w) + '" y="' + (y0 + 34) + '" text-anchor="end" font-size="12">patterns in the library</text>'
    + '<text x="' + lx(L.n).toFixed(1) + '" y="' + (ly(L.n) - 8).toFixed(1) + '" text-anchor="end" font-size="12" style="fill:var(--bad)">the old way: all of them</text><text x="' + lx(L.n).toFixed(1) + '" y="' + (ly(L.asked.median) - 8).toFixed(1) + '" text-anchor="end" font-size="12" style="fill:var(--accent)">the catalogue: the median message</text>';
  $('ver').textContent = 'Seal 5 (20ea3b4) · figures measured ' + String(M.at || '').slice(0, 10) + ' on ' + n(M.data.train) + ' training and ' + n(M.data.test) + ' test messages, Banking77 at ' + String(M.data.commit).slice(0, 7);
}

// ── blueprint ──
(() => {
  const g = Object.fromEntries(((W && W.kernels) || []).map((k) => [k.file, k]));
  const parts = [
    ['src/catalogue.mjs', 'The catalogue: addresses, filing, asking, the five layers, the grown libraries. Pure; the law decides every match.'],
    ['src/triage.mjs', 'The router: route() and pick() read through a catalogue when given one built for the library; routeOn() builds one for the nightly check.'],
    ['src/extract.mjs', 'The contract reader\'s pick(), the same way.'],
    ['src/cycle.mjs', 'The night\'s measuring step builds one catalogue per meter and reads every task through it.'],
    ['src/csv.mjs', 'Banking77\'s CSV files read into messages, the same way in Node and in this tab.'],
    ['tools/catalogue-measure.mjs', 'K1 to K5 on the pinned data; CI re-runs it and refuses a count that does not re-derive.'],
    ['catalogue/', 'This page and its worker, which re-runs the measurement in your browser.'],
  ];
  $('bptable').querySelector('tbody').innerHTML = parts.map(([f, w]) => { const k = g[f]; return '<tr><td><code>' + f + '</code></td><td>' + w + '</td><td class="n">' + (k ? k.killed + '/' + k.total + (k.clean ? ' clean' : ' NOT clean') : 'tests') + '</td></tr>'; }).join('');
})();

// ── cost case: server time saved at the largest measured library ──
function cost() {
  if (!M || !M.sizes) return;
  const L = M.sizes[M.sizes.length - 1];
  const msgs = Number($('c-msgs').value), core = Number($('c-core').value);
  if (!(msgs >= 0) || !(core >= 0)) { $('cost-out').textContent = 'Check the inputs: both must be numbers, 0 or more.'; return; }
  const hours = (ms) => msgs * ms / 3600000;
  const a = hours(L.msPerMessage.linear), b = hours(L.msPerMessage.catalogue);
  $('cost-out').innerHTML = '<p>At ' + n(L.n) + ' patterns and ' + n(msgs) + ' messages a day: asking every pattern takes <b>' + a.toFixed(2) + ' core-hours a day</b>; the catalogue <b>' + b.toFixed(3) + '</b>. Saved: <b>' + (a - b).toFixed(2) + ' core-hours a day</b>, ' + ((a - b) * core).toFixed(2) + ' a day and ' + ((a - b) * core * 365).toFixed(2) + ' a year at your core-hour cost.</p>';
}
for (const id of ['c-msgs', 'c-core']) $(id).addEventListener('input', cost);
cost();

// ── re-run it here ──
$('rerunbtn').addEventListener('click', () => {
  $('rerunbtn').disabled = true; $('prog').hidden = false; $('rerunout').innerHTML = '';
  const w = new Worker('worker.mjs', { type: 'module' });
  w.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'progress') { $('rerunstate').textContent = d.step + '…'; $('prog').value = d.pct; return; }
    $('rerunbtn').disabled = false; $('prog').hidden = true; w.terminate();
    if (d.type === 'error') { $('rerunstate').textContent = ''; $('rerunout').innerHTML = '<p>' + chip(false, '', 'COULD NOT RUN') + ' ' + esc(d.message) + '</p>'; return; }
    $('rerunstate').textContent = 'Done: ' + n(d.train) + ' training and ' + n(d.test) + ' test messages, ' + n(d.candidates) + ' patterns grown, ' + d.runs + ' timing runs.';
    const byN = new Map(((M && M.sizes) || []).map((r) => [r.n, r]));
    $('rerunout').innerHTML = '<div class="tbl"><table><thead><tr><th class="n">Patterns</th><th class="n">Differences</th><th class="n">Asked (median · 95th · largest)</th><th>Same counts as the committed record</th><th class="n">ms old way</th><th class="n">ms catalogue</th></tr></thead><tbody>'
      + d.rows.map((r) => { const c = byN.get(r.n); const ok = c && c.asked.median === r.asked.median && c.asked.p95 === r.asked.p95 && c.asked.max === r.asked.max && c.differences === r.differences && c.conflicts === r.conflicts && c.conflictsLinked === r.conflictsLinked && c.firstShadowed === r.firstShadowed && r.addressesStable === true;
        return '<tr><td class="n">' + n(r.n) + '</td><td class="n">' + r.differences + '</td><td class="n">' + r.asked.median + ' · ' + r.asked.p95 + ' · ' + r.asked.max + '</td><td>' + chip(ok, 'same', 'different') + '</td><td class="n">' + r.msPerMessage.linear.toFixed(4) + '</td><td class="n">' + r.msPerMessage.catalogue.toFixed(4) + '</td></tr>'; }).join('')
      + '</tbody></table></div><p class="small muted">Counts (differences, patterns asked, conflicts, shadows) do not depend on the machine and are compared with the committed record, on every test message. Times are this tab\'s, the median of ' + d.runs + ' runs on every tenth test message (' + n(d.rows[0] ? d.rows[0].timedOn : 0) + '), both ways on the same messages.</p>';
    const opts = { counts: d.counts, lib: C.LIBRARY_CODES.route, labels: T.ROUTES };
    for (const r of d.rows) {
      const key = 'grown-' + r.n; if (LIBS[key]) continue;
      const rules = d.grown.slice(0, r.n);
      LIBS[key] = { name: 'a grown library of ' + n(r.n) + ' patterns', rules, cat: C.catalogue(rules, opts) };
      const o = document.createElement('option'); o.value = key; o.textContent = 'grown: ' + n(r.n) + ' patterns'; $('lib').appendChild(o);
    }
  };
  w.postMessage({ runs: 3, realSize: REAL.length });
});

routeIt();
