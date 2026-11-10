#!/usr/bin/env node
// tools/walk-7b.mjs — the buyer walk's FIRST PASS on the local 7B (the frontier read comes after it). Five buyer
// personas read the live page cold: its words (tags removed) AND the figures the page fills in from the records (a
// static read cannot see those, the lesson of 2026-11-09). Each lists confusions, dead ends, unanswered objections and
// unbacked claims. It talks only to the local model on 127.0.0.1 and writes data/walk-7b.md. Run by hand at build time.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
// --finance walks library 2 (receipts): its sections, its records' figures, its buyers; writes data/walk-7b-finance.md
const FIN = process.argv.includes('--finance');
// the sections a buyer decides on: the whole page does not fit the loaded model's 4,096-token window
const page = read('index.html');
const section = (id) => { const i = page.indexOf('id="' + id + '"'); if (i < 0) return ''; const s = page.lastIndexOf('<', i); const e = page.indexOf(id === 'what' ? '</header>' : '</section>', i); return page.slice(s, e); };
const html = (FIN ? ['receipt', 'fin-biz'] : ['what', 'start', 'wall', 'business', 'paper']).map(section).join('\n').replace(/<svg[\s\S]*?<\/svg>/g, ' [diagram] ')
  .replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
const summary = JSON.parse(read('data/doc/summary.json')), state = JSON.parse(read('data/doc/state.json')), night = JSON.parse(read('data/doc/' + summary.latest));
const last = summary.series[summary.series.length - 1];
// library 2's figures, from its records and from the kernel run on the page's own sample receipt
async function financeFigures() {
  const F = (await import(new URL('src/finance.mjs', ROOT).href)).default;
  const fs = JSON.parse(read('data/finance/summary.json')), fst = JSON.parse(read('data/finance/state.json')), fn = JSON.parse(read('data/finance/' + fs.latest));
  const fl = fs.series[fs.series.length - 1], k = fl.check;
  const sample = /const RSAMPLE = `([\s\S]*?)`;/.exec(read('app.mjs'))[1];
  const units = F.unitsOf({ id: 'sample', text: sample, gold: [] }), cheap = {};
  for (const f of F.FIELDS) { const u = F.baseline(f.id, units[f.id]); cheap[f.id] = u ? { value: u.value, dec: u.dec } : null; }
  const it = F.baseline('item-price', units['item-price']); cheap.items = it.length ? it.map((u) => ({ value: u.value, dec: u.dec })) : null;
  const mine = F.read(sample, fst.library, fs.parts), cc = F.reconcile(cheap, fs.parts);
  const say = (c) => c.verdict + (Object.keys(c.parts).length ? ' (' + Object.entries(c.parts).map(([p, x]) => p + ': ' + F.money(x.left) + (x.holds ? ' = ' : ' vs ') + F.money(x.right)).join('; ') + ')' : '');
  return [
    'Library 2 (receipts), night ' + fn.cycle + ' (' + fn.at.slice(0, 10) + '): ' + fn.patterns + ' proven patterns; ' + fn.promoted.length + ' kept, ' + fn.dropped.length + ' dropped, every drop with its reason.',
    'The local 7B on that night: ' + (fn.why7b || 'used') + '. The paid tier: off; 0 calls.',
    'Coverage on the ' + F.SCHEDULE.meter + ' measuring receipts: ' + (fl.coverage * 100).toFixed(1) + '% of questions answered' + (typeof fl.precision === 'number' ? '; right ' + (fl.precision * 100).toFixed(1) + '% when it answers' : '; nothing answered, so no precision yet') + '.',
    'The check on those receipts: ' + k.reconciled + ' reconciled, ' + k.flagged + ' flagged, ' + k.unchecked + ' unchecked.',
    'The check tested on the experts\' own receipts (R0): ' + F.PARTS.map((p) => p + ' held on ' + fs.r0[p].held + ' of ' + fs.r0[p].ran).join('; ') + ' (bar 80%); parts kept: ' + fs.parts.join(', ') + '.',
    'On the page\'s sample receipt: the library answers ' + mine.rows.filter((r) => r.answer !== 'unknown').length + ' of ' + mine.rows.length + ' questions (its check: ' + say(mine.check) + '); the same check on ctrl-F\'s answers: ' + say(cc) + '.',
    'The keying calculator uses the buyer\'s own inputs (placeholders 500 receipts a month, 2 minutes each, 25 an hour) times the measured coverage and precision: today it shows 0 hours.',
  ].join('\n');
}
const figures = FIN ? await financeFigures() : [
  'Night ' + night.cycle + ' (' + night.at.slice(0, 10) + '): ' + night.patterns + ' proven patterns; ' + night.promoted.length + ' kept, ' + night.dropped.length + ' dropped.',
  'Kept: ' + night.promoted.map((p) => p.rule + ' (held-out ' + p.held.right + '/' + p.held.cover + ', final ' + p.final.right + '/' + p.final.cover + ')').join('; ') + '.',
  'Coverage on the 60 measuring contracts: ' + (last.coverage * 100).toFixed(1) + '% of questions answered; right ' + (last.precision * 100).toFixed(1) + '% when it answers.',
  'Questions it answers today: ' + [...new Set(state.library.map((r) => r.then))].join(', ') + '; the other questions come back "unknown".',
  'The local 7B on night 0: ' + (night.why7b || 'used') + '. The paid tier: off; 0 calls.',
  'The calculator (defaults from the CUAD paper: $500/hour, 5 minutes a page, 18.2 pages a contract, 100 contracts a month) shows about 2 expert hours a month saved today.',
].join('\n');
const PERSONAS = FIN ? [
  ['a finance director at a mid-size restaurant group', 'the money: what it saves, whether the numbers and the check are believable, what happens with a wrong amount'],
  ['an accounts-payable and bookkeeping lead', 'whether it would cut keying tomorrow, what "unknown" and "flagged" mean for the team, what is confusing'],
  ['a financial controller who signs off the books', 'whether an auditor could rely on an answer and on the check, what is evidenced, what is not'],
  ['the owner of a small cafe with no bookkeeper', 'whether you could use it tomorrow on your own receipts, what you would have to do, what is confusing'],
  ['a head of IT security', 'where receipts go, what runs where, what can leak, what an auditor would ask'],
] : [
  ['a finance director at a mid-size company', 'the money: what it saves, what it costs to run, whether the numbers are believable'],
  ['a head of IT security', 'where documents go, what runs where, what can leak, what an auditor would ask'],
  ['a general counsel', 'whether a lawyer could rely on an answer, liability, what it gets wrong, what "unknown" means for the team'],
  ['the owner of a 20-person firm with no IT staff', 'whether you could use it tomorrow, what you would have to do, what is confusing'],
  ['a procurement lead comparing it with contract-AI vendors', 'what is missing for a purchase decision, support, roll-out, proof, risks'],
];
const prompt = (who, focus) => `You are ${who}. You have just opened this product page for the first time. Focus on ${focus}.\n\nTHE PAGE (its words):\n${html.slice(0, 9500)}\n\nTHE FIGURES THE PAGE SHOWS (filled in from its records):\n${figures}\n\nList up to 6 specific problems a buyer like you would have with this page: confusions, dead ends, unanswered objections, claims with no evidence, numbers you cannot trace. Quote the sentence each one is about. One problem per line, starting with "- ". No praise, no summary.`;

// --dry prints what the walk would read and asks no model
if (process.argv.includes('--dry')) { console.log(figures + '\n\n' + html.slice(0, 1200) + '\n… (' + html.length + ' characters of page)'); process.exit(0); }

async function ask(text) {
  const r = await fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen2.5:7b', prompt: text, stream: false, keep_alive: 0, options: { temperature: 0.2, seed: 7, num_ctx: 4096, num_predict: 400 } }) });
  if (!r.ok) throw new Error('HTTP ' + r.status);   // an error, never an empty answer
  return (await r.json()).response || '';
}

const out = ['# Buyer walk, first pass (local qwen2.5:7b), ' + new Date().toISOString(), '', 'Five personas read the page cold: its words and the figures it fills in from the records. The frontier read comes after this pass. Every item is answered on the page or in RESULTS.md.', ''];
for (const [who, focus] of PERSONAS) {
  let a;
  try { a = await ask(prompt(who, focus)); } catch (e) { a = 'ERROR: ' + String(e && e.message); }
  out.push('## ' + who, '', a.trim(), '');
  console.log('walked: ' + who);
}
writeFileSync(fileURLToPath(new URL(FIN ? 'data/walk-7b-finance.md' : 'data/walk-7b.md', ROOT)), out.join('\n') + '\n');
console.log('wrote ' + (FIN ? 'data/walk-7b-finance.md' : 'data/walk-7b.md'));
