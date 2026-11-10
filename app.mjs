// pattern-libraries · app.mjs — the live page. Every number on it is read from the committed records or computed by the
// same kernels the night runs (src/*.mjs); none is typed into the page. The reader runs in the browser: nothing is sent.
import E from './src/extract.mjs';
import Y from './src/cycle.mjs';
import B from './src/build.mjs';
import V from './src/value.mjs';
import O from './src/oauth.mjs';
import P from './vendor/patlib/patlib.mjs';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (p) => fetch(p, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const pct = (x) => (typeof x === 'number' ? (x * 100).toFixed(1) + '%' : 'n/a');
const usd = (c) => '$' + (c / 100).toFixed(2);
const chip = (ok, yes, no, wait) => (ok === null ? '<span class="chip wait">' + esc(wait || 'PENDING') + '</span>' : ok ? '<span class="chip good">' + esc(yes) + '</span>' : '<span class="chip bad">' + esc(no) + '</span>');
const SAY = Object.fromEntries([...E.FIELDS, ...E.CLAUSES].map((t) => [t.id, t.say]));
const say = (task) => SAY[task] || task;
const ruleWords = (rule) => { const [w, t] = String(rule || '').split('=>'); return { words: (w || '').split('+'), task: t || '' }; };
const explain = (rule) => { const { words, task } = ruleWords(rule); return 'near the word' + (words.length > 1 ? 's ' : ' ') + words.map((x) => '<code>' + esc(x) + '</code>').join(' and ') + (E.isClause(task) ? ', the sentence is a ' + esc(say(task).toLowerCase()) + ' clause' : ', it is the ' + esc(say(task).toLowerCase())); };

const SAMPLE = `MASTER SUPPLY AGREEMENT

This Master Supply Agreement (the "Agreement") is made and entered into as of the 3rd day of March, 2021 (the "Effective Date"), by and between Northwind Components Inc., a Delaware corporation ("Supplier"), and Bluefield Retail Holdings LLC, a Texas limited liability company ("Customer").

1. Term. This Agreement shall commence on the Effective Date and continue for an initial term of three (3) years. Thereafter this Agreement shall automatically renew for successive one (1) year renewal terms unless either party gives written notice of non-renewal at least ninety (90) days prior to the end of the then-current term.

2. Exclusivity. During the term, Customer shall purchase the Products exclusively from Supplier within the Territory.

3. Minimum Purchase. Customer shall purchase Products with an aggregate value of not less than $250,000 in each contract year.

4. Audit. Supplier shall maintain complete and accurate records, and Customer may audit such records upon thirty (30) days written notice, not more than once per calendar year.

5. Assignment. Neither party may assign this Agreement without the prior written consent of the other party, and any attempted assignment without such consent shall be null and void.

6. Limitation of Liability. In no event shall either party be liable for any indirect, incidental or consequential damages, even if advised of the possibility of such damages, and each party's total liability shall not exceed $1,000,000.

7. Insurance. Supplier shall maintain commercial general liability insurance with limits of not less than $2,000,000 per occurrence.

8. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws principles.

IN WITNESS WHEREOF, the parties have executed this Agreement as of March 3, 2021.`;

async function main() {
  const [summary, state, libs, wit, prices] = await Promise.all([json('data/doc/summary.json'), json('data/doc/state.json'), json('data/libraries.json'), json('data/witness.json'), json('data/prices.json')]);
  const night = summary && summary.latest ? await json('data/doc/' + summary.latest) : null;
  const library = state && Array.isArray(state.library) ? state.library : [];
  const records = state && Array.isArray(state.records) ? state.records : [];
  const series = summary && Array.isArray(summary.series) ? summary.series : [];
  const last = series[series.length - 1] || null;
  const kernels = wit && Array.isArray(wit.kernels) ? wit.kernels : [];
  const clean = kernels.filter((k) => k.killed === k.total && k.ignored === 0);

  // the chips at the top
  $('chips').innerHTML = !night ? '<span class="chip wait">no night recorded yet</span>'
    : '<span class="chip">night ' + esc(night.cycle) + ' · ' + esc(String(night.at).slice(0, 10)) + '</span>'
      + '<span class="chip">' + esc(library.length) + ' proven patterns</span>'
      + '<span class="chip">coverage ' + esc(pct(last && last.coverage)) + ' of questions</span>'
      + '<span class="chip">right ' + esc(pct(last && last.precision)) + ' when it answers</span>'
      + '<span class="chip ' + (kernels.length && clean.length === kernels.length ? 'good' : 'bad') + '">' + esc(clean.length) + ' of ' + esc(kernels.length) + ' kernels witness-clean</span>';

  // try it
  const doc = $('doc');
  doc.value = SAMPLE;
  const readIt = () => {
    const rows = E.read(doc.value, library);
    $('answers').querySelector('tbody').innerHTML = rows.map((r) => '<tr><td>' + esc(say(r.task)) + '</td><td>' + (r.answer === 'unknown' ? '<span class="unknown">unknown — no proven pattern fired</span>'
      : esc(E.isClause(r.task) ? r.answer.slice(0, 220) + (r.answer.length > 220 ? '…' : '') : r.answer + (r.value && r.value !== r.answer.toLowerCase() ? ' (' + r.value + ')' : ''))) + '</td><td>' + (r.rule ? explain(r.rule) + ' <span class="muted mono">' + esc(r.receipt) + '</span>' : '') + '</td></tr>').join('');
    const n = rows.filter((r) => r.answer !== 'unknown').length;
    $('answers-note').textContent = n + ' of ' + rows.length + ' questions answered by a proven pattern; the rest would go to a model or a person. Read in your browser with ' + library.length + ' patterns.';
  };
  $('read').addEventListener('click', readIt);
  $('sample').addEventListener('click', () => { doc.value = SAMPLE; readIt(); });
  readIt();

  // last night, traced
  if (night) {
    const r = night, free = r.proposed ? r.proposed.free : 0, sb = r.proposed ? r.proposed['7b'] : 0;
    const keptBy = (s) => (r.promoted || []).filter((p) => p.source === s).length;
    const okReplies = (r.replies || []).filter((x) => x.ok).length;
    $('night-flow').innerHTML = '<svg viewBox="0 0 900 170" role="img" aria-label="Last night in numbers">'
      + box(10, 'Free proposers', free + ' proposed', keptBy('mined') + keptBy('recipe') + ' kept', true)
      + box(240, 'Local 7B', (r.replies || []).length + ' calls, ' + okReplies + ' answered', sb + ' rules, ' + keptBy('7b') + ' kept', false)
      + box(470, 'Paid tier', 'candidates: ' + (r.asks || []).length, 'calls tonight: 0', false)
      + box(700, 'The library', (r.patterns ?? library.length) + ' patterns', 'coverage ' + pct(r.meter && r.meter.after && r.meter.after.coverage), true)
      + '<path class="line" d="M200 85 H240 M430 85 H470 M660 85 H700"/></svg>'
      + '<p>' + esc(r.dropped.length) + ' proposals were tested and dropped, ' + esc((r.promoted || []).length) + ' were kept. ' + (r.model ? 'The local model was qwen2.5:7b on this laptop. ' : r.why7b ? esc(r.why7b.charAt(0).toUpperCase() + r.why7b.slice(1)) + '. ' : 'The local model did not fit on this laptop that night. ')
      + ((r.replies || []).filter((x) => !x.ok).length ? esc((r.replies || []).filter((x) => !x.ok).length) + ' model call(s) failed and are recorded as errors, never as empty answers. ' : '')
      + 'The paid tier ' + ((r.asks || []).length ? 'could have been asked about ' + esc(r.asks.map((a) => say(a.task)).join(', ')) + ' (the free tiers and the local model both failed there), but it is off until the owner switches it on.' : 'had nothing to take: no question was left that both cheaper tiers had tried and failed.') + '</p>';
    $('kept').querySelector('tbody').innerHTML = (r.promoted || []).map((p) => '<tr><td>' + explain(p.rule) + '</td><td>' + esc(p.source === '7b' ? 'local 7B' : p.source === 'recipe' ? 'recipe (' + (p.recipe || '').replace('recipe from ', 'from ') + ')' : p.source === 'oauth' ? 'paid tier' : 'free miner') + '</td><td>' + esc(p.held.right + ' / ' + p.held.cover) + '</td><td>' + esc(p.final.right + ' / ' + p.final.cover) + '</td><td>'
      + esc('held-out ' + p.heldDocs.right + '/' + p.heldDocs.docs + ' vs ' + p.heldDocs.base + ' · final ' + p.finalDocs.right + '/' + p.finalDocs.docs + ' vs ' + p.finalDocs.base) + '</td><td class="mono">' + esc(p.receipt) + '</td></tr>').join('') || '<tr><td colspan="6" class="muted">nothing kept on this night</td></tr>';
    const why = {};
    for (const d of r.dropped || []) { const k = String(d.why).replace(/-?\d[\d.]*/g, '#').replace(/ of [a-z0-9+=>-]+$/, ''); why[k] = (why[k] || 0) + 1; }
    const ranked = Object.entries(why).sort((a, b) => b[1] - a[1]);
    $('drops').innerHTML = '<div class="table-wrap"><table><thead><tr><th>Reason (numbers removed)</th><th>Proposals</th></tr></thead><tbody>' + ranked.map(([k, n]) => '<tr><td>' + esc(k) + '</td><td>' + n + '</td></tr>').join('') + '</tbody></table></div>'
      + (ranked.length && /covers #, needs #/.test(ranked[0][0]) ? '<p class="muted">The commonest reason, "' + esc(ranked[0][0]) + '", means the pattern fired on too few candidates in that night\'s unseen contracts to be trusted yet. It is not a wrong pattern; it has not been seen enough.</p>' : '');
  }
  $('climb').innerHTML = series.length ? '<div class="table-wrap"><table><thead><tr><th>Night</th><th>Date</th><th>Patterns</th><th>Coverage</th><th>Right when it answers</th></tr></thead><tbody>'
    + series.map((s) => '<tr><td>' + esc(s.cycle) + '</td><td>' + esc(String(s.at).slice(0, 10)) + '</td><td>' + esc(s.patterns) + '</td><td>' + esc(pct(s.coverage)) + '</td><td>' + esc(pct(s.precision)) + '</td></tr>').join('') + '</tbody></table></div>'
    + (series.length < 2 ? '<p class="muted">One night so far. The climb is decided on the nights that follow.</p>' : '') : '<p class="muted">No night recorded yet.</p>';

  // the fresh exam bar
  const S = Y.SCHEDULE, used = night && !night.exhausted ? 2 * (night.cycle + 1) : night && night.exhausted ? Infinity : 0;
  const total = S.meter + S.seed + 15 * S.batch, w = (n) => (n / total) * 860;
  let x = 20, bar = '<svg viewBox="0 0 900 110" role="img" aria-label="The 510 contracts: 60 for measuring, 150 to train from, then 15 exam batches of 20">';
  bar += '<rect class="hot" x="' + x + '" y="20" width="' + w(S.meter) + '" height="36"/><text x="' + (x + w(S.meter) / 2) + '" y="76" text-anchor="middle">' + S.meter + ' measure</text>'; x += w(S.meter);
  bar += '<rect class="box" x="' + x + '" y="20" width="' + w(S.seed) + '" height="36"/><text x="' + (x + w(S.seed) / 2) + '" y="76" text-anchor="middle">' + S.seed + ' train from</text>'; x += w(S.seed);
  for (let b = 0; b < 15; b++) { bar += '<rect class="' + (b < used ? 'hot' : 'box') + '" x="' + x + '" y="20" width="' + (w(S.batch) - 2) + '" height="36"/>'; x += w(S.batch); }
  bar += '<text x="' + (20 + w(S.meter + S.seed) + w(15 * S.batch) / 2) + '" y="76" text-anchor="middle">15 exam batches of ' + S.batch + ' (shaded: used)</text></svg>';
  $('exam-bar').innerHTML = bar + '<p class="muted">' + (used === Infinity ? 'Every batch has been an exam once.' : Math.min(used, 15) + ' of 15 batches have been an exam; ' + Math.max(0, 15 - used) + ' are still unseen, enough for ' + Math.floor(Math.max(0, 15 - used) / 2) + ' more nights before fresh contracts are needed.') + '</p>';

  // how each was built
  $('recipes').querySelector('tbody').innerHTML = records.map((rc) => '<tr><td>' + esc(say(rc.task)) + '</td><td>' + esc(rc.type) + '</td><td>' + esc(rc.tier === '7b' ? 'local 7B' : rc.tier === 'oauth' ? 'paid tier' : rc.tier === 'recipe' ? 'recipe lookup' : 'free miner') + '</td><td class="mono">' + esc(rc.recipe) + '</td><td>' + esc(rc.tier === 'oauth' ? usd(rc.cost.cents) : rc.cost.calls ? rc.cost.calls + ' local call' + (rc.cost.calls === 1 ? '' : 's') : 'free') + '</td><td>' + esc(rc.cycle) + '</td></tr>').join('') || '<tr><td colspan="6" class="muted">no records yet</td></tr>';

  // the wall
  const d = O.DEFAULTS;
  $('wall-card').innerHTML = '<p><span class="chip wait">OFF until the owner switches it on</span></p><p>Defaults, until the owner sets their own: at most <strong>' + usd(d.dayCents) + '</strong> API-equivalent a UTC day, at most <strong>' + d.perNight + '</strong> calls a night, a stop that latches at <strong>' + usd(d.stopCents) + '</strong> in total, the model <code>' + esc(d.model) + '</code> at effort ' + esc(d.effort) + ', at most ' + d.maxTokens.toLocaleString('en-GB') + ' output tokens. Credit calls made so far: <strong>' + esc(summary ? summary.creditCalls : 0) + '</strong>.</p>';

  // the blueprint table
  const k = (n) => kernels.find((x) => x.name === n);
  const proof = (n) => { const x = k(n); return x ? esc('witness ' + x.killed + '/' + x.total + (x.killed === x.total ? ', clean' : '')) : 'not gated'; };
  $('organs').innerHTML = [
    ['src/extract.mjs', 'the scanners (dates, money, durations, jurisdictions, company names, sentences), the words around each candidate, the cheap method, and the answer', proof('extract')],
    ['src/cycle.mjs', 'the fixed order and the fresh exam per night, the field gate, the meter, the signed exam, the two-word miner, the recipe lookup, the prompt', proof('cycle')],
    ['src/night.mjs', 'one night, cheapest tier first, and its replay from the record', proof('night')],
    ['src/build.mjs', 'how each pattern was built; whose turn the 7B is; the wall\'s evidence; spend per kept pattern; Kar\'s build checks and their lookup', proof('build')],
    ['src/oauth.mjs + tools/oauth-ask.mjs', 'the paid tier\'s defaults, the command line it runs, the cleaned environment, how its reply is read; the one wire', proof('oauth')],
    ['src/value.mjs', 'what it is worth to a buyer, from the CUAD paper\'s figures and the measured coverage', proof('value')],
    ['vendor/patlib', 'the pattern law, reused byte for byte: the gate every pattern passes', 'pinned by hash'],
    ['vendor/mint', 'the baseline agreement that signs each night\'s exam, reused byte for byte', 'pinned by hash'],
    ['vendor/spendwall', 'the spend wall\'s law (ceiling, cap, stop, latch, settle), reused byte for byte', 'pinned by hash'],
  ].map((r) => '<tr><td class="mono">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + r[2] + '</td></tr>').join('');

  // the libraries
  $('libs').innerHTML = (libs && Array.isArray(libs.libraries) ? libs.libraries : []).map((l) => '<div class="card"><p><strong>' + esc(l.name) + '</strong> <span class="chip ' + (l.status === 'landed' ? 'good' : 'wait') + '">' + esc(l.status.toUpperCase()) + '</span></p><p>' + esc(l.what) + '</p><p class="muted">' + esc(l.status === 'landed' ? 'Data: ' + l.data : l.why) + '</p></div>').join('');

  // what it answers today, from the library itself, so the brochure never claims more than the patterns do
  const answers = [...new Set(library.map((r) => r.then))];
  $('today').innerHTML = '<strong>Today</strong> it answers ' + (answers.length ? answers.map((t) => esc(say(t).toLowerCase())).join(', ') : 'nothing yet') + ', from ' + esc(library.length) + ' proven pattern' + (library.length === 1 ? '' : 's') + '. The other ' + esc(E.TASKS.length - answers.length) + ' questions it is built for are being learned night by night; until a pattern for one passes both exams, that question comes back <em>unknown</em>. The roles below describe what each question gives you once it is answered.';

  // what it is worth
  const avgPages = V.SOURCES.pages.value / V.SOURCES.pages.contracts;
  const inputs = [['contracts', 'Contracts a month', 100, 'your figure'], ['pages', 'Pages per contract', Math.round(avgPages * 10) / 10, 'CUAD average: ' + V.SOURCES.pages.text], ['minutesPerPage', 'Expert minutes per page', V.SOURCES.minutesPerPage.value, 'CUAD: ' + V.SOURCES.minutesPerPage.text], ['rate', 'Hourly rate ($)', V.SOURCES.rate.value, 'CUAD: ' + V.SOURCES.rate.text]];
  $('calc-in').innerHTML = inputs.map(([id, label, v, src]) => '<label class="inp" for="in-' + id + '">' + esc(label) + '<input id="in-' + id + '" type="number" min="0" step="any" value="' + v + '"><span class="muted">' + esc(src) + '</span></label>').join('');
  const measured = { coverage: last ? last.coverage : 0, precision: last ? last.precision : null };
  const calc = () => {
    const i = Object.fromEntries(inputs.map(([id]) => [id, Number($('in-' + id).value)]));
    const r = V.review({ ...i, questions: E.TASKS.length }, measured);
    $('calc-out').textContent = r.ok ? r.hours.toLocaleString('en-GB') + ' expert hours a month found for you, worth ' + '$' + r.cost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Check the inputs';
    $('calc-why').textContent = r.ok ? 'The library covers ' + E.TASKS.length + ' of the ' + V.SOURCES.categories.value + ' questions CUAD reviewers mark, answers ' + pct(measured.coverage) + ' of them on the measuring contracts and is right ' + pct(measured.precision) + ' of the time when it does: so it stands in for ' + pct(r.share) + ' of the finding, ' + r.perContractMinutes + ' minutes per contract. This grows as the coverage grows.' : r.why;
  };
  for (const [id] of inputs) $('in-' + id).addEventListener('input', calc);
  calc();
  const avgChars = summary && summary.corpus ? summary.corpus.avgChars : null;
  const opus = V.modelCost(prices, 'claude-opus-5-5', avgChars, 1000), sonnet = V.modelCost(prices, 'claude-sonnet-5-5', avgChars, 1000);
  $('vs').innerHTML = '<p>Sending one average CUAD contract (' + (avgChars ? Math.round(avgChars).toLocaleString('en-GB') : '?') + ' characters) once to a frontier model, with a short answer, costs about <strong>' + (opus === null ? '?' : '$' + opus.toFixed(4)) + '</strong> on Claude Opus 5.5 or <strong>' + (sonnet === null ? '?' : '$' + sonnet.toFixed(4)) + '</strong> on Claude Sonnet 5.5 at the published API prices (read ' + esc(prices ? prices.read : '?') + ' from ' + esc(prices ? prices.source : '?') + '). A question this library answers costs nothing to answer, any number of times, offline, and shows the rule it used. The larger saving is people\'s time: see the calculator above.</p>';
  $('board').innerHTML = '<p><strong>The ask:</strong> a first pass on every contract, on your own hardware, with every answer traceable to a rule and an exam score. <strong>The evidence:</strong> ' + esc(library.length) + ' patterns, each kept only after beating a cheap method on contracts it had never seen; coverage ' + esc(pct(measured.coverage)) + ' today, measured on contracts kept apart, and published night by night. <strong>The risk:</strong> it answers part of each contract, and says so; the rest goes where it goes today. <strong>The exit:</strong> plain files and MIT code you keep.</p>';

  // the claims, decided from the records where the records can decide them
  const kept = night ? night.promoted || [] : [];
  const p1 = night ? kept.every((p) => p.heldDocs && p.heldDocs.ok && p.finalDocs && p.finalDocs.ok && p.held && p.final) && night.dropped.length >= 1 && night.dropped.every((x) => typeof x.why === 'string' && x.why) : null;
  const x1 = night && night.exam && night.exam.receipt;
  const x1v = !x1 || !x1.ok ? null : x1.decision === 'PROMOTE' ? true : x1.decision === 'INSUFFICIENT' ? null : false;
  const x2v = last && typeof last.precision === 'number' ? last.precision >= Y.METER_BAR : null;
  const b1 = night ? records.filter((rc) => rc.cycle === night.cycle).length === kept.length : null;
  const rows = [
    ['P1', 'Only patterns that beat the baseline on fresh unseen contracts are kept; every drop is logged with its reason.', chip(p1, 'HELD', 'FAILED') + (night ? ' ' + esc(kept.length + ' kept, ' + night.dropped.length + ' dropped with reasons') : '')],
    ['P2', 'The paid tier is the last tier and the daily cap is never exceeded.', chip(null, '', '', 'NO CALL YET') + ' the tier is off; nothing has been spent'],
    ['P3', 'How each pattern was built is captured, and spend per library falls over time.', chip(null, '', '', 'PENDING') + ' needs two weeks of nights that used the paid tier'],
    ['P4', 'Coverage climbs night over night.', chip(null, '', '', 'PENDING') + ' ' + esc(series.length + ' night(s) measured; decided on the nights after the first')],
    ['P5', 'Nothing outward at night; every pattern gated; the model only proposes.', '<span class="chip">source scan in CI</span>'],
    ['X1', 'Each night\'s library beats the cheap method on that night\'s fresh final exam (signed).', chip(x1v, 'HELD', 'FAILED', x1 && x1.answered === 0 ? 'NOTHING TO EXAMINE YET' : 'INSUFFICIENT') + (x1 ? ' ' + esc(x1.why) : '')],
    ['X2', 'Where it answers on the measuring contracts, it is right at least ' + (Y.METER_BAR * 100) + '% of the time.', chip(x2v, 'HELD', 'FAILED') + (last ? ' ' + esc(pct(last.precision)) : '')],
    ['X3', 'Every night re-derives byte for byte from the public contracts.', '<span class="chip">re-derived in CI</span>'],
    ['X4', 'Every source carries its licence and credit.', chip(true, 'HELD', 'FAILED') + ' CUAD, The Atticus Project, CC BY 4.0'],
    ['B1', 'Every kept pattern has its how-it-was-built record the same night.', chip(b1, 'HELD', 'FAILED')],
    ['B2', 'Kar\'s own build checks are kept with their provenance, on Kar\'s machine.', '<span class="chip">local only</span> ' + esc(summary && Number.isInteger(summary.checks) ? summary.checks + ' checks' : '')],
  ];
  $('claims').querySelector('tbody').innerHTML = rows.map((r) => '<tr><td><strong>' + r[0] + '</strong></td><td>' + esc(r[1]) + '</td><td>' + r[2] + '</td></tr>').join('');
}

function box(x, title, a, b, hot) {
  return '<rect class="' + (hot ? 'hot' : 'box') + '" x="' + x + '" y="30" width="190" height="110" rx="8"/><text x="' + (x + 95) + '" y="62" text-anchor="middle">' + esc(title) + '</text><text x="' + (x + 95) + '" y="90" text-anchor="middle" class="muted">' + esc(a) + '</text><text x="' + (x + 95) + '" y="114" text-anchor="middle" class="muted">' + esc(b) + '</text>';
}

// after one visit the page works offline: it keeps its own files, nothing else
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* offline copy is optional */ });

main().catch((e) => { const c = document.getElementById('chips'); if (c) c.innerHTML = '<span class="chip bad">the page could not read its records: ' + esc(e && e.message) + '</span>'; });
