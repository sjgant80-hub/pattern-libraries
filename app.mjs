// pattern-libraries · app.mjs — the live page. Every number on it is read from the committed records or computed by the
// same kernels the night runs (src/*.mjs); none is typed into the page. The reader runs in the browser: nothing is sent.
import E from './src/extract.mjs';
import Y from './src/cycle.mjs';
import B from './src/build.mjs';
import V from './src/value.mjs';
import O from './src/oauth.mjs';
import F from './src/finance.mjs';
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

// a made-up receipt in the style of the ones library 2 learns from (one printed line per row); it adds up
const RSAMPLE = `Nasi Goreng Spesial 1 x 35,000 35,000
Es Teh Manis 2 x 8,000 16,000
Kopi Susu 1 x 22,000 22,000
SUBTOTAL 73,000
PB1 10% 7,300
SERVICE 5% 3,650
TOTAL 83,950
TUNAI 100,000
KEMBALI 16,050`;
const FSAY = Object.fromEntries([...F.FIELDS, ...F.LINES].map((t) => [t.id, t.say]));
const fsay = (task) => FSAY[task] || task;
const fexplain = (rule) => String(rule || '').split(' | ').map((one) => { const { words, task } = ruleWords(one); return 'near the word' + (words.length > 1 ? 's ' : ' ') + words.map((x) => '<code>' + esc(x) + '</code>').join(' and ') + (F.many(task) ? ', the amount is a line item' : ', the amount is the ' + esc(fsay(task).toLowerCase())); }).join('; ');
// the check in words, part by part, from the kernel's own result
const PART = { A: ['the line items add up to', 'the subtotal'], B: ['subtotal + tax + service − discount is', 'the total'], C: ['cash − change is', 'the total'] };
const checkWords = (c) => (c.verdict === 'unchecked' ? 'too few amounts answered to check anything' : Object.entries(c.parts).map(([k, p]) => PART[k][0] + ' ' + F.money(p.left) + (p.holds ? ', and ' : ', but ') + PART[k][1] + ' is ' + F.money(p.right)).join('; '));
// a reason the night runner cut at its length limit ends mid-sentence: show where it was cut, never mend the record
const cutWords = (s) => (/[.!?)]$/.test(s) ? s : /[;,]?\s+\S*$/.test(s) ? s.replace(/[;,]?\s+\S*$/, '') + ' … (the record cuts it here).' : s + '.');
const checkChip = (c) => '<span class="chip ' + (c.verdict === 'reconciled' ? 'good' : c.verdict === 'flagged' ? 'bad' : 'wait') + '">' + esc(c.verdict.toUpperCase()) + '</span>';

async function main() {
  const [summary, state, libs, wit, prices] = await Promise.all([json('data/doc/summary.json'), json('data/doc/state.json'), json('data/libraries.json'), json('data/witness.json'), json('data/prices.json')]);
  const night = summary && summary.latest ? await json('data/doc/' + summary.latest) : null;
  const library = state && Array.isArray(state.library) ? state.library : [];
  const records = state && Array.isArray(state.records) ? state.records : [];
  const series = summary && Array.isArray(summary.series) ? summary.series : [];
  const last = series[series.length - 1] || null;
  const kernels = wit && Array.isArray(wit.kernels) ? wit.kernels : [];
  const clean = kernels.filter((k) => k.killed === k.total && k.ignored === 0);
  // library 2, receipts: its own records
  const [fsum, fstate] = await Promise.all([json('data/finance/summary.json'), json('data/finance/state.json')]);
  const fnight = fsum && fsum.latest ? await json('data/finance/' + fsum.latest) : null;
  const flib = fstate && Array.isArray(fstate.library) ? fstate.library : [];
  const frecords = fstate && Array.isArray(fstate.records) ? fstate.records : [];
  const fseries = fsum && Array.isArray(fsum.series) ? fsum.series : [];
  const flast = fseries[fseries.length - 1] || null;
  const fparts = fsum && Array.isArray(fsum.parts) ? fsum.parts : [];

  // the chips at the top
  $('chips').innerHTML = !night ? '<span class="chip wait">no night recorded yet</span>'
    : '<span class="chip">night ' + esc(night.cycle) + ' · ' + esc(String(night.at).slice(0, 10)) + '</span>'
      + '<span class="chip">' + esc(library.length) + ' proven patterns</span>'
      + '<span class="chip">coverage ' + esc(pct(last && last.coverage)) + ' of questions</span>'
      + '<span class="chip">right ' + esc(pct(last && last.precision)) + ' when it answers</span>'
      + (flast ? '<span class="chip">receipts: ' + esc(flib.length) + ' proven pattern' + (flib.length === 1 ? '' : 's') + ', coverage ' + esc(pct(flast.coverage)) + '</span>' : '')
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

  // try it on a receipt: the library's answers, the cheap method's (ctrl-F) beside them, and the check run on both
  const rdoc = $('rdoc');
  rdoc.value = RSAMPLE;
  const readReceipt = () => {
    const r = F.read(rdoc.value, flib, fparts);
    const units = F.unitsOf({ id: 'yours', text: rdoc.value, gold: [] });
    const cheap = {}, said = {};
    for (const f of F.FIELDS) { const u = F.baseline(f.id, units[f.id]); cheap[f.id] = u ? { value: u.value, dec: u.dec } : null; said[f.id] = u ? u.raw.trim() : ''; }
    const items = F.baseline('item-price', units['item-price']);
    cheap.items = items.length ? items.map((u) => ({ value: u.value, dec: u.dec })) : null;
    said['item-price'] = items.map((u) => u.raw.trim()).join(' · ');
    $('ranswers').querySelector('tbody').innerHTML = r.rows.map((x) => '<tr><td>' + esc(fsay(x.task)) + '</td><td>' + (x.answer === 'unknown' ? '<span class="unknown">unknown — no proven pattern fired</span>' : esc(x.answer)) + '</td><td>' + (said[x.task] ? esc(said[x.task]) : '<span class="muted">nothing found</span>') + '</td><td>' + (x.rule ? fexplain(x.rule) + ' <span class="muted mono">' + esc(x.receipt) + '</span>' : '') + '</td></tr>').join('');
    const cc = F.reconcile(cheap, fparts);
    const n = r.rows.filter((x) => x.answer !== 'unknown').length;
    $('rcheck').innerHTML = '<p><strong>The check on the library\'s answers:</strong> ' + checkChip(r.check) + ' ' + esc(checkWords(r.check)) + '.</p>'
      + '<p><strong>The same check on ctrl-F\'s answers:</strong> ' + checkChip(cc) + ' ' + esc(checkWords(cc)) + '.</p>'
      + '<p class="muted">' + esc(n + ' of ' + r.rows.length + ' questions answered by a proven pattern, read in your browser with ' + flib.length + ' pattern' + (flib.length === 1 ? '' : 's') + '. ') + (flib.length ? '' : 'The library has no proven pattern yet, so every answer is unknown and there is nothing of its own to check; the second line shows the check working on the cheap method\'s answers. ') + 'The check uses the parts that passed its own test on the experts\' receipts: ' + esc(fparts.map((k) => k + ' (' + { A: 'items = subtotal', B: 'the totals', C: 'cash less change' }[k] + ')').join(', ') || 'none yet') + '.</p>';
  };
  $('rread').addEventListener('click', readReceipt);
  $('rsample').addEventListener('click', () => { rdoc.value = RSAMPLE; readReceipt(); });
  readReceipt();

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
      + 'The paid tier ' + ((r.asks || []).length ? 'could have been asked about ' + esc(r.asks.map((a) => say(a.task)).join(', ')) + ' (the free tiers and the local model both failed there), but it is off until the keeper switches it on.' : 'had nothing to take: no question was left that both cheaper tiers had tried and failed.') + '</p>';
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

  // library 2, receipts: the night, the rule's own test, the check on the meter, the climb, the claims
  const dropTable = (list, el) => {
    const why = {};
    for (const d of list || []) { const k = String(d.why).replace(/-?\d[\d.]*/g, '#').replace(/ of [a-z0-9+=>-]+$/, ''); why[k] = (why[k] || 0) + 1; }
    const ranked = Object.entries(why).sort((a, b) => b[1] - a[1]);
    $(el).innerHTML = ranked.length ? '<div class="table-wrap"><table><thead><tr><th>Reason (numbers removed)</th><th>Proposals</th></tr></thead><tbody>' + ranked.map(([k, n]) => '<tr><td>' + esc(k) + '</td><td>' + n + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">nothing dropped</p>';
    return ranked;
  };
  if (fnight) {
    const r = fnight, kept = r.promoted || [];
    const keptBy = (s) => kept.filter((p) => p.source === s).length;
    $('fin-flow').innerHTML = '<svg viewBox="0 0 900 170" role="img" aria-label="Library 2, last night in numbers">'
      + box(10, 'Free proposers', (r.proposed ? r.proposed.free : 0) + ' proposed', keptBy('mined') + keptBy('recipe') + ' kept', true)
      + box(240, 'Local 7B', (r.replies || []).length + ' calls', (r.proposed ? r.proposed['7b'] : 0) + ' rules, ' + keptBy('7b') + ' kept', false)
      + box(470, 'Paid tier', 'candidates: ' + (r.asks || []).length, 'calls tonight: 0', false)
      + box(700, 'The library', (r.patterns ?? flib.length) + ' patterns', 'coverage ' + pct(r.meter && r.meter.after && r.meter.after.coverage), true)
      + '<path class="line" d="M200 85 H240 M430 85 H470 M660 85 H700"/></svg>'
      + '<p>Night ' + esc(r.cycle) + ' (' + esc(String(r.at).slice(0, 10)) + '): ' + esc((r.proposed ? r.proposed.free + r.proposed['7b'] : 0) + ' patterns proposed, ' + kept.length + ' kept, ' + (r.dropped || []).length + ' dropped, every drop with its reason. ') + (r.model ? 'The local model was qwen2.5:7b on this laptop. ' : r.why7b ? esc(cutWords(r.why7b.charAt(0).toUpperCase() + r.why7b.slice(1))) + ' ' : '')
      + (kept.length ? '' : 'Nothing was kept on this night; every reason is in the table below, and nothing is relaxed to let a pattern in. ')
      + ((r.dropped || []).some((d) => /beats the cheap baseline by 0\.000/.test(d.why)) ? 'Some proposals did only as well as ctrl-F on the unseen receipts ("beats the cheap baseline by 0.000"): a pattern that merely restates the cheap method is not kept. ' : '')
      + ((r.dropped || []).some((d) => /covers \d+, needs/.test(d.why)) ? 'Some met too few amounts in that night\'s unseen batch to be trusted yet ("covers …, needs 5"): not wrong, not yet seen enough.' : '') + '</p>';
    $('fin-kept').querySelector('tbody').innerHTML = kept.map((p) => '<tr><td>' + fexplain(p.rule) + '</td><td>' + esc(p.source === '7b' ? 'local 7B' : p.source === 'recipe' ? 'recipe' : p.source === 'oauth' ? 'paid tier' : 'free miner') + '</td><td>' + esc(p.held.right + ' / ' + p.held.cover) + '</td><td>' + esc(p.final.right + ' / ' + p.final.cover) + '</td><td>'
      + esc('held-out ' + p.heldDocs.right + '/' + (p.heldDocs.picked ?? p.heldDocs.docs) + ' vs ' + p.heldDocs.base + ' · final ' + p.finalDocs.right + '/' + (p.finalDocs.picked ?? p.finalDocs.docs) + ' vs ' + p.finalDocs.base) + '</td><td class="mono">' + esc(p.receipt) + '</td></tr>').join('') || '<tr><td colspan="6" class="muted">nothing kept on this night</td></tr>';
    dropTable(r.dropped, 'fin-drops');
  }
  const r0 = fsum && fsum.r0 ? fsum.r0 : null, keptParts = F.partsOf(r0);
  const R0SAY = { A: 'the line items add up to the subtotal', B: 'subtotal + tax + service − discount = total', C: 'cash − change = total' };
  $('fin-r0').querySelector('tbody').innerHTML = r0 ? F.PARTS.map((k) => '<tr><td><strong>' + k + '</strong></td><td>' + esc(R0SAY[k]) + '</td><td>' + esc(r0[k].held + ' of ' + r0[k].ran + ' receipts (' + pct(r0[k].ran ? r0[k].held / r0[k].ran : null) + ')') + '</td><td>' + chip(keptParts.includes(k), 'HELD: KEPT IN THE CHECK', 'FAILED: DROPPED') + '</td></tr>').join('') : '<tr><td colspan="4" class="muted">no record yet</td></tr>';
  // what R0 means for a buyer: on receipts whose amounts are all right, how often each part still fails (a flag means look)
  $('fin-r0-say').innerHTML = r0 ? '<strong>What this means for you.</strong> ' + esc('Even on receipts whose amounts are all right, part A still fails on ' + pct(r0.A.ran ? 1 - r0.A.held / r0.A.ran : null) + ' of them, part B on ' + pct(r0.B.ran ? 1 - r0.B.held / r0.B.ran : null) + ' and part C on ' + pct(r0.C.ran ? 1 - r0.C.held / r0.C.ran : null) + '. So a flag means "look at this one", not "this one is wrong". Whether a receipt that adds up is also right is claim R2, measured on the library\'s own answers and undecided until enough of them are answered.') : '';
  const fk = flast && flast.check ? flast.check : null, fv = F.verdicts(fk);
  $('fin-check').innerHTML = fk ? '<p>' + esc('Of the ' + fk.receipts + ' measuring receipts, the check reconciled ' + fk.reconciled + ', flagged ' + fk.flagged + ' and left ' + fk.unchecked + ' unchecked (too few amounts answered). Of the reconciled, ' + fk.reconciledRight + ' had every amount it used right; of the ' + fk.wrongRan + ' receipts where it ran on a wrong amount, it flagged ' + fk.wrongFlagged + '.') + '</p><p class="muted">' + esc('R2 needs at least ' + F.R_BARS.r2.min + ' reconciled receipts to be decided, R3 at least ' + F.R_BARS.r3.min + ' receipts with a wrong amount; until then they are undecided, never passed.') + '</p>' : '<p class="muted">No night recorded yet.</p>';
  $('fin-climb').innerHTML = fseries.length ? '<div class="table-wrap"><table><thead><tr><th>Night</th><th>Date</th><th>Patterns</th><th>Coverage</th><th>Right when it answers</th><th>Check: reconciled / flagged / unchecked</th></tr></thead><tbody>'
    + fseries.map((s) => '<tr><td>' + esc(s.cycle) + '</td><td>' + esc(String(s.at).slice(0, 10)) + '</td><td>' + esc(s.patterns) + '</td><td>' + esc(pct(s.coverage)) + '</td><td>' + esc(pct(s.precision)) + '</td><td>' + esc(s.check ? s.check.reconciled + ' / ' + s.check.flagged + ' / ' + s.check.unchecked : '') + '</td></tr>').join('') + '</tbody></table></div>'
    + (fseries.length < 2 ? '<p class="muted">One night so far. The climb is decided on the nights that follow.</p>' : '') : '<p class="muted">No night recorded yet.</p>';
  {
    const kept = fnight ? fnight.promoted || [] : [];
    const p1 = fnight ? kept.every((p) => p.heldDocs && p.heldDocs.ok && p.finalDocs && p.finalDocs.ok) && fnight.dropped.length >= 1 && fnight.dropped.every((x) => typeof x.why === 'string' && x.why) : null;
    const x = fnight && fnight.exam && fnight.exam.receipt;
    const f1 = !x || !x.ok ? null : x.decision === 'PROMOTE' ? true : x.decision === 'INSUFFICIENT' ? null : false;
    const f2 = flast && typeof flast.precision === 'number' ? flast.precision >= F.METER_BAR : null;
    const b1 = fnight ? frecords.filter((rc) => rc.cycle === fnight.cycle).length === kept.length : null;
    const r0ok = r0 ? keptParts.length === F.PARTS.length : null;
    const vchip = (v) => chip(v === 'held' ? true : v === 'failed' ? false : null, 'HELD', 'FAILED', 'UNDECIDED');
    const rows = [
      ['P1', 'Only patterns that beat the cheap method on fresh unseen receipts are kept; every drop is logged with its reason.', chip(p1, 'HELD', 'FAILED') + (fnight ? ' ' + esc(kept.length + ' kept, ' + fnight.dropped.length + ' dropped with reasons') : '')],
      ['P4', 'Coverage climbs night over night.', chip(null, '', '', 'PENDING') + ' ' + esc(fseries.length + ' night(s) measured; decided on the nights after the first')],
      ['F1', 'Each night\'s library beats ctrl-F on that night\'s fresh final exam (signed).', chip(f1, 'HELD', 'FAILED', x && x.answered === 0 ? 'NOTHING TO EXAMINE YET' : 'INSUFFICIENT') + (x ? ' ' + esc(x.why) : '')],
      ['F2', 'Where it answers on the measuring receipts, it is right at least ' + (F.METER_BAR * 100) + '% of the time.', chip(f2, 'HELD', 'FAILED', 'NOTHING ANSWERED YET') + (flast && typeof flast.precision === 'number' ? ' ' + esc(pct(flast.precision)) : '')],
      ['F3', 'Every night re-derives byte for byte from the public receipts.', '<span class="chip">re-derived in CI</span>'],
      ['F4', 'The source carries its licence and credit.', chip(true, 'HELD', 'FAILED') + ' CORD v2, NAVER CLOVA, CC BY 4.0'],
      ['R0', 'Each part of the check holds on at least 80% of the experts\' own receipts it can run on; a part that does not is dropped.', chip(r0ok, 'HELD', 'FAILED') + (r0 ? ' ' + esc(F.PARTS.map((k) => k + ' ' + r0[k].held + '/' + r0[k].ran).join(', ')) : '')],
      ['R1', 'The check is plain arithmetic: it never changes an answer and never calls a model.', '<span class="chip">tests and source scan in CI</span>'],
      ['R2', 'A receipt the check reconciles has every amount it used right, at least 95% of the time.', vchip(fv.R2) + (fk ? ' ' + esc(fk.reconciledRight + ' of ' + fk.reconciled + ' reconciled') : '')],
      ['R3', 'A receipt with a wrong amount the check used is flagged at least half the time.', vchip(fv.R3) + (fk ? ' ' + esc(fk.wrongFlagged + ' of ' + fk.wrongRan + ' flagged') : '')],
      ['B1', 'Every kept pattern has its how-it-was-built record the same night.', chip(b1, 'HELD', 'FAILED')],
      ['N3', 'It runs in the same night as library 1, after it, within the same six local-model calls (three each) and the same 25-minute clock.', '<span class="chip">wired; first scheduled night 2026-11-11, 03:00</span>'],
    ];
    $('fin-claims').querySelector('tbody').innerHTML = rows.map((r) => '<tr><td><strong>' + r[0] + '</strong></td><td>' + esc(r[1]) + '</td><td>' + r[2] + '</td></tr>').join('');
  }

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
  $('wall-card').innerHTML = '<p><span class="chip wait">OFF until the keeper switches it on</span></p><p>Defaults, until the keeper sets their own: at most <strong>' + usd(d.dayCents) + '</strong> API-equivalent a UTC day, at most <strong>' + d.perNight + '</strong> calls a night, a stop that latches at <strong>' + usd(d.stopCents) + '</strong> in total, the model <code>' + esc(d.model) + '</code> at effort ' + esc(d.effort) + ', at most ' + d.maxTokens.toLocaleString('en-GB') + ' output tokens. Credit calls made so far: <strong>' + esc(summary ? summary.creditCalls : 0) + '</strong>.</p>';

  // the blueprint table
  const k = (n) => kernels.find((x) => x.name === n);
  const proof = (n) => { const x = k(n); return x ? esc('witness ' + x.killed + '/' + x.total + (x.killed === x.total ? ', clean' : '')) : 'not gated'; };
  $('organs').innerHTML = [
    ['src/extract.mjs', 'the scanners (dates, money, durations, jurisdictions, company names, sentences), the words around each candidate, the cheap method, and the answer', proof('extract')],
    ['src/finance.mjs', 'library 2: the amount scanner, the words and places around each amount, the experts\' value words, ctrl-F, the answer, the three-part check, the check\'s own test on the experts\' receipts', proof('finance')],
    ['src/cycle.mjs', 'the fixed order and the fresh exam per night, the field gate (one pick per document, or every pick for line items), the meter, the signed exam, the two-word miner, the recipe lookup, the prompt; one cycle per library', proof('cycle')],
    ['src/night.mjs', 'one night, cheapest tier first, and its replay from the record', proof('night')],
    ['src/build.mjs', 'how each pattern was built; whose turn the 7B is; the wall\'s evidence; spend per kept pattern; Kar\'s build checks and their lookup', proof('build')],
    ['src/oauth.mjs + tools/oauth-ask.mjs', 'the paid tier\'s defaults, the command line it runs, the cleaned environment, how its reply is read; the one wire', proof('oauth')],
    ['src/value.mjs', 'what it is worth to a buyer, from the CUAD paper\'s figures and the measured coverage', proof('value')],
    ['vendor/patlib', 'the pattern law, reused byte for byte: the gate every pattern passes', 'pinned by hash'],
    ['vendor/mint', 'the baseline agreement that signs each night\'s exam, reused byte for byte', 'pinned by hash'],
    ['vendor/spendwall', 'the spend wall\'s law (ceiling, cap, stop, latch, settle), reused byte for byte', 'pinned by hash'],
  ].map((r) => '<tr><td class="mono">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + r[2] + '</td></tr>').join('');

  // the libraries
  const live = { doc: last ? 'From the records: ' + library.length + ' proven patterns after night ' + last.cycle + '; coverage ' + pct(last.coverage) + ' on the measuring contracts.' : '',
    finance: flast ? 'From the records: ' + flib.length + ' proven pattern' + (flib.length === 1 ? '' : 's') + ' after night ' + flast.cycle + '; coverage ' + pct(flast.coverage) + ' on the measuring receipts.' : '' };
  $('libs').innerHTML = (libs && Array.isArray(libs.libraries) ? libs.libraries : []).map((l) => '<div class="card"><p><strong>' + esc(l.name) + '</strong> <span class="chip ' + (l.status === 'landed' ? 'good' : 'wait') + '">' + esc(l.status.toUpperCase()) + '</span></p><p>' + esc(l.what) + '</p>' + (l.data ? '<p class="muted">Data: ' + esc(l.data) + '</p>' : '') + (live[l.id] ? '<p class="muted">' + esc(live[l.id]) + '</p>' : '') + (l.why ? '<p class="muted">' + esc(l.why) + '</p>' : '') + '</div>').join('');

  // what it answers today, from the library itself, so the brochure never claims more than the patterns do
  const answers = [...new Set(library.map((r) => r.then))];
  $('today').innerHTML = '<strong>Today</strong> it answers ' + (answers.length ? answers.map((t) => esc(say(t).toLowerCase())).join(', ') : 'nothing yet') + ', from ' + esc(library.length) + ' proven pattern' + (library.length === 1 ? '' : 's') + '. The other ' + esc(E.TASKS.length - answers.length) + ' questions it is built for are being learned night by night; until a pattern for one passes both exams, that question comes back <em>unknown</em> and goes to your reviewers or your model, exactly as today. On the measuring contracts, ' + esc(pct(last ? last.coverage : 0)) + ' of all questions are answered and the rest come back unknown. The roles below describe what each question gives you once it is answered.';

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
  // library 2 in the brochure: what it answers today, from the library itself; the keying time on the buyer's figures
  const fanswers = [...new Set(flib.map((r) => r.then))];
  $('fin-today').innerHTML = '<strong>Today</strong> ' + (fanswers.length ? 'it answers ' + fanswers.map((t) => esc(fsay(t).toLowerCase())).join(', ') + ', from ' + esc(flib.length) + ' proven pattern' + (flib.length === 1 ? '' : 's') : 'it answers nothing yet: no pattern has passed both exams') + '. ' + (flast ? 'On the measuring receipts it answers ' + esc(pct(flast.coverage)) + ' of the questions' + (fseries.length ? ', over ' + esc(fseries.length) + ' night' + (fseries.length === 1 ? '' : 's') + ' so far' : '') + '. ' : '') + 'Every question it cannot prove comes back <em>unknown</em> and is keyed as today. The roles below describe what each answer gives you once it is answered.';
  const finputs = [['receipts', 'Receipts a month', 500, 'an example: put in yours'], ['minutes', 'Minutes to key one receipt\'s amounts', 2, 'an example: put in yours'], ['rate', 'Cost of an hour of that work', 25, 'an example: put in yours']];
  $('fin-calc-in').innerHTML = finputs.map(([id, label, v, src]) => '<label class="inp" for="fin-' + id + '">' + esc(label) + '<input id="fin-' + id + '" type="number" min="0" step="any" value="' + v + '"><span class="muted">' + esc(src) + '</span></label>').join('');
  const fmeasured = { coverage: flast ? flast.coverage : 0, precision: flast ? flast.precision : null };
  const fcalc = () => {
    const i = Object.fromEntries(finputs.map(([id]) => [id, Number($('fin-' + id).value)]));
    const r = V.keying(i, fmeasured);
    $('fin-calc-out').textContent = r.ok ? r.hours.toLocaleString('en-GB') + ' hours of keying a month given back, worth ' + r.cost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' in your currency' : 'Check the inputs';
    $('fin-calc-why').textContent = r.ok ? (fmeasured.coverage ? '' : 'Today this is zero, and the page says so: no pattern has passed both exams yet, so nothing is answered and nothing is saved. The figure moves as soon as one does. ') + 'It answers ' + pct(fmeasured.coverage) + ' of the questions on the measuring receipts' + (fmeasured.precision === null ? ' (none yet, so there is no precision to apply)' : ' and is right ' + pct(fmeasured.precision) + ' of the time when it does') + ': it stands in for ' + pct(r.share) + ' of the keying. This grows as the coverage grows.' : r.why;
  };
  for (const [id] of finputs) $('fin-' + id).addEventListener('input', fcalc);
  fcalc();
  const fchars = fsum && fsum.corpus ? fsum.corpus.avgChars : null;
  const fopus = V.modelCost(prices, 'claude-opus-5-5', fchars, 300), fsonnet = V.modelCost(prices, 'claude-sonnet-5-5', fchars, 300);
  $('fin-vs').innerHTML = '<p><strong>Against a frontier model.</strong> An average receipt in the public set is short (' + (fchars ? esc(fchars.toLocaleString('en-GB')) : '?') + ' characters of text). Reading one once with a short structured answer costs about <strong>' + (fopus === null ? '?' : '$' + fopus.toFixed(4)) + '</strong> on Claude Opus 5.5 or <strong>' + (fsonnet === null ? '?' : '$' + fsonnet.toFixed(4)) + '</strong> on Claude Sonnet 5.5 at the published API prices (read ' + esc(prices ? prices.read : '?') + '), before any check. A proven pattern costs nothing per receipt, shows the rule it used, and its answers are added up against each other before anyone relies on them. The larger cost is the person keying: see the figures above.</p>';
  $('board').innerHTML = '<p><strong>The ask:</strong> a first pass on every contract, on your own hardware, with every answer traceable to a rule and an exam score. <strong>The evidence:</strong> ' + esc(library.length) + ' patterns, each kept only after beating a cheap method on contracts it had never seen; coverage ' + esc(pct(measured.coverage)) + ' today, measured on contracts kept apart, over ' + esc(series.length) + ' night' + (series.length === 1 ? '' : 's') + ' so far, and published night by night: the record over time is on this page as it builds up. <strong>The risk:</strong> it answers part of each contract, and says so; the rest goes where it goes today. <strong>The exit:</strong> plain files and MIT code you keep.</p>';

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
