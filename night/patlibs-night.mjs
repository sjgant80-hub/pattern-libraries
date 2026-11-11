#!/usr/bin/env node
// si-didy · patlibs-night.mjs — THE PATTERN LIBRARIES' NIGHT (2026-11-10; Simon's PATTERN LIBRARY BUILD PLAN). It runs in
// the 03:00 dream-bridge turn, after patlib-night.mjs and patlib-teach.mjs (both untouched). Sealed first:
// C:/Users/sjgan/pattern-libraries/CLAIMS.md (SEAL 1, 1c6108e; SEAL 2, e28a504). Every decision is that repo's
// src/night.mjs; this file only reads, asks the local 7B and writes. It contacts nothing but the local model on this
// machine (127.0.0.1) and makes no subscription call: the credit step is patlibs-teach.mjs, a separate process through
// the wall (P5).
//   library 1, document extraction: CUAD v1 (The Atticus Project, CC BY 4.0), its data.zip pinned by sha256
//   library 2, receipt reading (finance): CORD v2 (NAVER CLOVA, CC BY 4.0), its derived file pinned by sha256
//   library 3, triage and routing: Banking77 + NLU++ (PolyAI, CC BY 4.0), its files pinned by a manifest sha256
// All share one clock (25 minutes); libraries 1 and 2 share N1's six local-7B calls, three each (N3); library 3 runs its
// two parts (route, triage) on the free tiers only (N4). --dry computes and prints, and writes nothing.
// --only=<ids> (comma-separated: doc, finance, route, triage) runs only those (a build-time night 0 must not spend
// another library's night).
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, renameSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { pickModel, generate, unload } from './local-wire.mjs';

const HOME = homedir();
const REPO = process.env.PATTERN_LIBRARIES || 'C:/Users/sjgan/pattern-libraries';
const ROOT = join(HOME, '.si-didy', 'patterns', 'libraries');
const DIR = join(ROOT, 'doc');
const SRC = join(HOME, '.si-didy', 'patterns', 'sources', 'cuad');
const DIR2 = join(ROOT, 'finance');
const SRC2 = join(HOME, '.si-didy', 'patterns', 'sources', 'cord-v2');
const DRY = process.argv.includes('--dry');
const NO7B = process.argv.includes('--no-7b');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7) || null;
const runs = (id) => !ONLY || ONLY.split(',').includes(id);
const rd = (p, fb) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; } };
const save = (p, s) => { if (DRY) return; const t = p + '.tmp'; writeFileSync(t, s); renameSync(t, p); };
const imp = (rel) => import(pathToFileURL(join(REPO, rel)).href).then((m) => m.default);

async function main() {
  const [Y, N, C, B, C2, F, PA, T] = await Promise.all([imp('src/cycle.mjs'), imp('src/night.mjs'), imp('tools/cuad.mjs'), imp('src/build.mjs'), imp('tools/cord.mjs'), imp('src/finance.mjs'), imp('tools/polyai.mjs'), imp('src/triage.mjs')]);
  const at = new Date().toISOString();
  const deadline = Date.now() + N.NIGHT.clockMinutes * 60000;   // one clock for both libraries
  let model = null, picked = false, why7b = NO7B ? 'the local 7B was not asked: ' + String(process.env.PL_NO7B_WHY || '--no-7b was given').slice(0, 200) : '';
  const getModel = async () => {
    if (NO7B) return null;
    if (!picked) {
      picked = true;
      const chosen = await pickModel(['qwen2.5:7b']);
      if (chosen.ok && chosen.model === 'qwen2.5:7b') model = chosen.model; else why7b = 'the 7B did not fit tonight: ' + String(chosen.why || '').slice(0, 160);
    }
    return model;
  };
  const askWith = (m, cycle) => (m ? async (task, prompt) => {
    if (Date.now() > deadline) return { ok: false, code: 'clock', why: 'past the ' + N.NIGHT.clockMinutes + '-minute clock' };
    try { return { ok: true, text: await generate(m, prompt, { numPredict: N.NIGHT.numPredict, seed: 7 + cycle }) }; }
    catch (e) { return { ok: false, code: 'error', why: String((e && e.message) || e).slice(0, 200) }; }   // a 500 is an error, never an empty answer
  } : null);
  const says = [];

  // ── library 1, document extraction ──
  mkdirSync(join(DIR, 'nights'), { recursive: true });
  const zip = join(SRC, 'data.zip'), json = join(SRC, 'CUADv1.json');
  if (!runs('doc')) { /* not this run's library */ }
  else if (!existsSync(zip) || !existsSync(json)) says.push('document extraction library: the source is not on this machine (' + SRC + ')');
  else {
    const sha = createHash('sha256').update(readFileSync(zip)).digest('hex');
    if (sha !== C.SOURCE.sha256) { says.push('document extraction library: data.zip is not the pinned file (sha256 ' + sha.slice(0, 12) + '…), so nothing runs'); process.exitCode = 1; }
    else {
      const docs = C.load(json);
      const plan = Y.schedule(docs.map((d) => d.id));
      const state = rd(join(DIR, 'state.json'), { cycle: 0, library: [], records: [] });
      const slices = Y.slicesFor(plan, state.cycle);
      // only the documents tonight needs are read into units: the meter, and the cycle's train / held / final
      const need = new Set([...plan.meter, ...(slices ? [...slices.train, ...slices.held, ...slices.final] : [])]);
      const units = C.units(docs.filter((d) => need.has(d.id)));
      const m = slices ? await getModel() : null;
      const r = await N.night({ units, plan, cycle: state.cycle, library: state.library, records: state.records, at, ask: askWith(m, state.cycle), model: m });
      const rec = { ...r.record, source: { file: 'data.zip', sha256: sha }, why7b: why7b || null, dry: DRY };
      says.push(N.line(rec) + (why7b ? ' (' + why7b + ')' : ''));
      if (!DRY) {
        save(join(DIR, 'nights', 'cycle-' + state.cycle + '.json'), JSON.stringify(rec, null, 1));
        if (r.ok) {
          if (existsSync(join(DIR, 'state.json'))) copyFileSync(join(DIR, 'state.json'), join(DIR, 'state.c' + state.cycle + '.json'));
          save(join(DIR, 'state.json'), JSON.stringify(r.state, null, 1));
          save(join(DIR, 'asks.json'), JSON.stringify({ at, cycle: state.cycle, asks: r.asks }, null, 1));
        }
        appendFileSync(join(DIR, 'ledger.jsonl'), JSON.stringify({ at, kind: 'library-night', library: 'doc', cycle: state.cycle, ok: r.ok, promoted: rec.promoted.length, dropped: rec.dropped.length, patterns: rec.patterns, meter: rec.meter && (rec.meter.after || rec.meter), exam: rec.exam ? rec.exam.receipt : null, calls7b: (rec.replies || []).length, callsCredit: 0, asks: (rec.asks || []).map((a) => a.task) }) + '\n');
      }
      if (DRY || process.argv.includes('--show')) console.log(JSON.stringify({ ...rec, proposals: rec.proposals ? rec.proposals.length : 0 }, null, 1).slice(0, 6000));
    }
  }

  // ── library 2, receipt reading (finance) ──
  const file2 = join(SRC2, C2.SOURCE.file);
  let receipts = null;
  if (!runs('finance')) { /* not this run's library */ }
  else if (!existsSync(file2)) says.push('receipt reading library: the source is not on this machine (' + SRC2 + ')');
  else { try { receipts = C2.load(file2); } catch (e) { says.push('receipt reading library: ' + String((e && e.message) || e).slice(0, 200) + ', so nothing runs'); process.exitCode = 1; } }
  if (receipts) {
    mkdirSync(join(DIR2, 'nights'), { recursive: true });
    const FN = N.nightOf(N.FINANCE);
    const ids = receipts.map((d) => d.id);
    const plan = Y.schedule(ids, F.SCHEDULE);
    const state = rd(join(DIR2, 'state.json'), { cycle: 0, library: [], records: [] });
    const slices = Y.slicesFor(plan, state.cycle);
    // every receipt is read: the rule's own test (R0) runs on all of them; it proposes and gates nothing
    const units = C2.units(receipts);
    const r0 = F.ruleTest(units, ids), parts = F.partsOf(r0);
    const m = slices ? await getModel() : null;
    const r = await FN.night({ units, plan, cycle: state.cycle, library: state.library, records: state.records, at, ask: askWith(m, state.cycle), model: m, parts });
    const rec = { ...r.record, source: { file: C2.SOURCE.file, sha256: C2.SOURCE.sha256 }, r0, why7b: why7b || null, dry: DRY };
    says.push(FN.line(rec) + (why7b ? ' (' + why7b + ')' : ''));
    if (!DRY) {
      save(join(DIR2, 'nights', 'cycle-' + state.cycle + '.json'), JSON.stringify(rec, null, 1));
      if (r.ok) {
        if (existsSync(join(DIR2, 'state.json'))) copyFileSync(join(DIR2, 'state.json'), join(DIR2, 'state.c' + state.cycle + '.json'));
        save(join(DIR2, 'state.json'), JSON.stringify(r.state, null, 1));
        save(join(DIR2, 'asks.json'), JSON.stringify({ at, cycle: state.cycle, asks: r.asks }, null, 1));
      }
      appendFileSync(join(DIR2, 'ledger.jsonl'), JSON.stringify({ at, kind: 'library-night', library: 'finance', cycle: state.cycle, ok: r.ok, promoted: rec.promoted.length, dropped: rec.dropped.length, patterns: rec.patterns, meter: rec.meter && (rec.meter.after || rec.meter), check: rec.meter && rec.meter.check, exam: rec.exam ? rec.exam.receipt : null, calls7b: (rec.replies || []).length, callsCredit: 0, asks: (rec.asks || []).map((a) => a.task) }) + '\n');
    }
    if (DRY || process.argv.includes('--show')) console.log(JSON.stringify({ ...rec, proposals: rec.proposals ? rec.proposals.length : 0 }, null, 1).slice(0, 6000));
  }
  // ── library 3, triage and routing: two night libraries, the free tiers only (no model call, so no credit candidate) ──
  const SRC3 = join(HOME, '.si-didy', 'patterns', 'sources', 'polyai');
  let poly = null;
  if (!runs('route') && !runs('triage')) { /* not this run's library */ }
  else if (!existsSync(join(SRC3, 'banking_data', 'train.csv'))) says.push('triage and routing library: the source is not on this machine (' + SRC3 + ')');
  else { try { poly = PA.load(SRC3); } catch (e) { says.push('triage and routing library: ' + String((e && e.message) || e).slice(0, 200) + ', so nothing runs'); process.exitCode = 1; } }
  const parts3 = poly ? [['route', N.ROUTE, poly.routes, T.ROUTE_SCHEDULE, PA.routeUnits], ['triage', N.TRIAGE, poly.triage, T.TRIAGE_SCHEDULE, PA.triageUnits]] : [];
  for (const [id, LIB, docs, sched, unitsOf] of parts3) {
    if (!runs(id)) continue;
    const D3 = join(ROOT, id);
    mkdirSync(join(D3, 'nights'), { recursive: true });
    const LN = N.nightOf(LIB);
    const plan = Y.schedule(docs.map((d) => d.id), sched);
    const state = rd(join(D3, 'state.json'), { cycle: 0, library: [], records: [] });
    const slices = Y.slicesFor(plan, state.cycle);
    const need = new Set([...plan.meter, ...(slices ? [...slices.train, ...slices.held, ...slices.final] : [])]);
    const units = unitsOf(docs.filter((d) => need.has(d.id)));
    const r = await LN.night({ units, plan, cycle: state.cycle, library: state.library, records: state.records, at, ask: null, model: null });
    const rec = { ...r.record, source: { repo: PA.SOURCE.repo, commit: PA.SOURCE.commit, manifest: PA.SOURCE.manifest }, why7b: 'library 3 runs on the free tiers only (SEAL 3, N4)', dry: DRY };
    says.push(LN.line(rec));
    if (!DRY) {
      save(join(D3, 'nights', 'cycle-' + state.cycle + '.json'), JSON.stringify(rec, null, 1));
      if (r.ok) {
        if (existsSync(join(D3, 'state.json'))) copyFileSync(join(D3, 'state.json'), join(D3, 'state.c' + state.cycle + '.json'));
        save(join(D3, 'state.json'), JSON.stringify(r.state, null, 1));
      }
      appendFileSync(join(D3, 'ledger.jsonl'), JSON.stringify({ at, kind: 'library-night', library: id, cycle: state.cycle, ok: r.ok, promoted: rec.promoted.length, dropped: rec.dropped.length, patterns: rec.patterns, meter: rec.meter && (rec.meter.after || rec.meter), check: (rec.meter && rec.meter.check) || null, exam: rec.exam ? rec.exam.receipt : null, calls7b: 0, callsCredit: 0, asks: [] }) + '\n');
    }
  }
  if (model) await unload(model);
  if (!ONLY) save(join(ROOT, 'libraries.txt'), says.join('\n') + '\n');

  // the build-pattern library's second half (B2): Kar's own build checks, refreshed from the retrospectives, kept locally
  let checks = null;
  try {
    const md = readFileSync(join(HOME, '.claude', 'projects', 'C--Users-sjgan--claude', 'memory', 'build-retrospectives.md'), 'utf8');
    checks = B.checksOf(md);
    if (!DRY) { mkdirSync(join(ROOT, 'build'), { recursive: true }); save(join(ROOT, 'build', 'checks.json'), JSON.stringify({ at, from: 'build-retrospectives.md', checks }, null, 1)); }
  } catch { /* no retrospectives on this machine */ }
  console.log(says.join('\n') + (checks ? '\nbuild checks: ' + checks.length : ''));
}

main().catch((e) => { console.log('pattern libraries night failed: ' + String((e && e.message) || e).slice(0, 300)); process.exitCode = 1; });
