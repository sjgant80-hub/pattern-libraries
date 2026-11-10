#!/usr/bin/env node
// si-didy · patlibs-night.mjs — THE PATTERN LIBRARIES' NIGHT (2026-11-10; Simon's PATTERN LIBRARY BUILD PLAN). It runs in
// the 03:00 dream-bridge turn, after patlib-night.mjs and patlib-teach.mjs (both untouched). Sealed first:
// C:/Users/sjgan/pattern-libraries/CLAIMS.md (SEAL 1, 1c6108e). Every decision is that repo's src/night.mjs; this file
// only reads, asks the local 7B and writes. It contacts nothing but the local model on this machine (127.0.0.1) and
// makes no subscription call: the credit step is patlibs-teach.mjs, a separate process through the wall (P5).
//   library 1, document extraction: CUAD v1 (The Atticus Project, CC BY 4.0), its data.zip pinned by sha256
// --dry computes and prints, and writes nothing.
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
const DRY = process.argv.includes('--dry');
const NO7B = process.argv.includes('--no-7b');
const rd = (p, fb) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; } };
const save = (p, s) => { if (DRY) return; const t = p + '.tmp'; writeFileSync(t, s); renameSync(t, p); };
const imp = (rel) => import(pathToFileURL(join(REPO, rel)).href).then((m) => m.default);

async function main() {
  const [Y, N, C, B] = await Promise.all([imp('src/cycle.mjs'), imp('src/night.mjs'), imp('tools/cuad.mjs'), imp('src/build.mjs')]);
  const at = new Date().toISOString();
  mkdirSync(join(DIR, 'nights'), { recursive: true });
  const zip = join(SRC, 'data.zip'), json = join(SRC, 'CUADv1.json');
  if (!existsSync(zip) || !existsSync(json)) { console.log('document extraction library: the source is not on this machine (' + SRC + ')'); return; }
  const sha = createHash('sha256').update(readFileSync(zip)).digest('hex');
  if (sha !== C.SOURCE.sha256) { console.log('document extraction library: data.zip is not the pinned file (sha256 ' + sha.slice(0, 12) + '…), so nothing runs'); process.exitCode = 1; return; }
  const docs = C.load(json);
  const plan = Y.schedule(docs.map((d) => d.id));
  const state = rd(join(DIR, 'state.json'), { cycle: 0, library: [], records: [] });
  const slices = Y.slicesFor(plan, state.cycle);
  // only the documents tonight needs are read into units: the meter, and the cycle's train / held / final
  const need = new Set([...plan.meter, ...(slices ? [...slices.train, ...slices.held, ...slices.final] : [])]);
  const units = C.units(docs.filter((d) => need.has(d.id)));

  let model = null, why7b = NO7B ? 'the local 7B was not asked: ' + String(process.env.PL_NO7B_WHY || '--no-7b was given').slice(0, 200) : '';
  if (!NO7B && slices) {
    const chosen = await pickModel(['qwen2.5:7b']);
    if (chosen.ok && chosen.model === 'qwen2.5:7b') model = chosen.model; else why7b = 'the 7B did not fit tonight: ' + String(chosen.why || '').slice(0, 160);
  }
  const deadline = Date.now() + N.NIGHT.clockMinutes * 60000;
  const ask = model ? async (task, prompt) => {
    if (Date.now() > deadline) return { ok: false, code: 'clock', why: 'past the ' + N.NIGHT.clockMinutes + '-minute clock' };
    try { return { ok: true, text: await generate(model, prompt, { numPredict: N.NIGHT.numPredict, seed: 7 + state.cycle }) }; }
    catch (e) { return { ok: false, code: 'error', why: String((e && e.message) || e).slice(0, 200) }; }   // a 500 is an error, never an empty answer
  } : null;
  const r = await N.night({ units, plan, cycle: state.cycle, library: state.library, records: state.records, at, ask, model });
  if (model) await unload(model);
  const rec = { ...r.record, source: { file: 'data.zip', sha256: sha }, why7b: why7b || null, dry: DRY };
  const say = N.line(rec) + (why7b ? ' (' + why7b + ')' : '');
  if (!DRY) {
    save(join(DIR, 'nights', 'cycle-' + state.cycle + '.json'), JSON.stringify(rec, null, 1));
    if (r.ok) {
      if (existsSync(join(DIR, 'state.json'))) copyFileSync(join(DIR, 'state.json'), join(DIR, 'state.c' + state.cycle + '.json'));
      save(join(DIR, 'state.json'), JSON.stringify(r.state, null, 1));
      save(join(DIR, 'asks.json'), JSON.stringify({ at, cycle: state.cycle, asks: r.asks }, null, 1));
    }
    appendFileSync(join(DIR, 'ledger.jsonl'), JSON.stringify({ at, kind: 'library-night', library: 'doc', cycle: state.cycle, ok: r.ok, promoted: rec.promoted.length, dropped: rec.dropped.length, patterns: rec.patterns, meter: rec.meter && (rec.meter.after || rec.meter), exam: rec.exam ? rec.exam.receipt : null, calls7b: (rec.replies || []).length, callsCredit: 0, asks: (rec.asks || []).map((a) => a.task) }) + '\n');
    save(join(ROOT, 'libraries.txt'), say + '\n');
  }
  // the build-pattern library's second half (B2): Kar's own build checks, refreshed from the retrospectives, kept locally
  let checks = null;
  try {
    const md = readFileSync(join(HOME, '.claude', 'projects', 'C--Users-sjgan--claude', 'memory', 'build-retrospectives.md'), 'utf8');
    checks = B.checksOf(md);
    if (!DRY) { mkdirSync(join(ROOT, 'build'), { recursive: true }); save(join(ROOT, 'build', 'checks.json'), JSON.stringify({ at, from: 'build-retrospectives.md', checks }, null, 1)); }
  } catch { /* no retrospectives on this machine */ }
  console.log(say + (checks ? ' · build checks: ' + checks.length : ''));
  if (DRY || process.argv.includes('--show')) console.log(JSON.stringify({ ...rec, proposals: rec.proposals ? rec.proposals.length : 0 }, null, 1).slice(0, 6000));
}

main().catch((e) => { console.log('pattern libraries night failed: ' + String((e && e.message) || e).slice(0, 300)); process.exitCode = 1; });
