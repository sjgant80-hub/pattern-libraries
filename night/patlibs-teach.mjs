#!/usr/bin/env node
// si-didy · patlibs-teach.mjs — THE PATTERN LIBRARIES' CREDIT STEP (2026-11-10; Simon's §3, the last tier). It runs right
// after patlibs-night.mjs. Sealed first: C:/Users/sjgan/pattern-libraries/CLAIMS.md (SEAL 1; P2, W1-W3; SEAL 2, N3).
//   1 READ     tonight's asks for each library (written by patlibs-night.mjs, under 12 hours old): only tasks the free
//              tiers kept nothing for AND the local 7B tried with nothing passing, each with the wall's evidence
//   2 SWITCH   the subscription tier runs only when Simon has switched it on (~/.si-didy/oauth/settings.json "on": true);
//              until then this step writes what it WOULD have asked and stops: spending waits for him
//   3 ASK      each one, at most the night's allowance across both libraries, through tools/oauth-ask.mjs, the ONLY wire:
//              the wall reserves the call's whole ceiling before it goes out and checks the daily cap and the stop
//              (kar-spendwall's own law)
//   4 TEST     the answers are proposals: the same two gates on the same fresh batches of the same night (P1)
//   5 RECORD   kept patterns into that library with how they were built (tier 'oauth', the cents they cost); one
//              ledger entry per library; libraries-teach.txt, the line the morning surface shows
// --dry prints what it would ask and asks nothing.
import { readFileSync, writeFileSync, appendFileSync, renameSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HOME = homedir();
const REPO = process.env.PATTERN_LIBRARIES || 'C:/Users/sjgan/pattern-libraries';
const ROOT = join(HOME, '.si-didy', 'patterns', 'libraries');
const SOURCES = join(HOME, '.si-didy', 'patterns', 'sources');
const OAUTH = join(HOME, '.si-didy', 'oauth');
const DRY = process.argv.includes('--dry');
const STOP_TONIGHT = new Set(['day', 'stop', 'off', 'key', 'config', 'price', 'busy', 'crash', 'args', 'clock', 'big']);
const rd = (p, fb) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; } };
const save = (p, s) => { const t = p + '.tmp'; writeFileSync(t, s); renameSync(t, p); };
const imp = (rel) => import(pathToFileURL(join(REPO, rel)).href).then((m) => m.default);

async function main() {
  const [P, Y, B, C, O, E, F, C2] = await Promise.all([imp('vendor/patlib/patlib.mjs'), imp('src/cycle.mjs'), imp('src/build.mjs'), imp('tools/cuad.mjs'), imp('src/oauth.mjs'), imp('src/extract.mjs'), imp('src/finance.mjs'), imp('tools/cord.mjs')]);
  const at = new Date().toISOString();
  const say = (s) => { if (!DRY) save(join(ROOT, 'libraries-teach.txt'), s + '\n'); console.log(s); };
  // each library: where its night wrote, how to read its source, its cycle and its domain
  const LIBS = [
    { id: 'doc', feed: 'cuad-v1', D: E, Q: Y, schedule: undefined, load: () => C.load(join(SOURCES, 'cuad', 'CUADv1.json')), units: (d) => C.units(d) },
    { id: 'finance', feed: 'cord-v2', D: F, Q: { ...Y, ...Y.cycleFor(F.DOMAIN) }, schedule: F.SCHEDULE, load: () => C2.load(join(SOURCES, 'cord-v2', C2.SOURCE.file)), units: (d) => C2.units(d) },
  ];
  const fresh = (t) => t && Array.isArray(t.asks) && Date.now() - Date.parse(t.at) < 12 * 3600000;
  const tonight = LIBS.map((L) => ({ L, t: rd(join(ROOT, L.id, 'asks.json'), null) })).filter((x) => fresh(x.t));
  if (!tonight.length) { say('pattern libraries, credit step: nothing from tonight to ask'); return; }
  const all = tonight.flatMap((x) => x.t.asks.map((a) => ({ ...a, L: x.L, cycle: x.t.cycle })));
  if (!all.length) { say('pattern libraries, credit step: no call tonight — the free tiers and the local 7B left nothing open that the credit tier may take'); return; }
  const { on, settings } = O.settingsOf(rd(join(OAUTH, 'settings.json'), {}));
  const picks = all.slice(0, Number.isInteger(settings.perNight) && settings.perNight >= 0 ? settings.perNight : O.DEFAULTS.perNight);
  if (!on || DRY) { say('pattern libraries, credit step: ' + (on ? '(dry) ' : 'the subscription tier is OFF until Simon switches it on, so no call; ') + 'tonight it would have asked about ' + picks.map((a) => a.L.id + ' ' + a.task).join(', ') + ' (each one the free tiers and the 7B could not crack)'); return; }

  const lines = [];
  let stopAll = null;
  for (const L of LIBS) {
    const mine = picks.filter((a) => a.L === L);
    if (!mine.length || stopAll) continue;
    const cycle = mine[0].cycle, DIR = join(ROOT, L.id);
    const docs = L.load();
    const plan = Y.schedule(docs.map((d) => d.id), L.schedule);
    const slices = Y.slicesFor(plan, cycle);
    if (!slices) { lines.push(L.id + ': night ' + cycle + ' has no fresh exam, so nothing may be promoted'); continue; }
    const need = new Set([...plan.meter, ...slices.train, ...slices.held, ...slices.final]);
    const units = L.units(docs.filter((d) => need.has(d.id)));
    const state = rd(join(DIR, 'state.json'), { cycle: cycle + 1, library: [], records: [] });
    const asked = [], proposals = [], cost = {};
    for (const a of mine) {
      const train = L.Q.casesFor(units, slices.train, a.task, 'train');
      const run = spawnSync(process.execPath, [join(REPO, 'tools', 'oauth-ask.mjs')], { input: JSON.stringify({ job: 'teacher', library: L.id, evidence: a.evidence, prompt: L.Q.promptFor(a.task, train, cycle) }), encoding: 'utf8', timeout: 360000, windowsHide: true });
      let o = null;
      try { o = JSON.parse(String(run.stdout || '').trim().split('\n').pop()); } catch { /* below */ }
      if (!o) o = { ok: false, code: 'crash', why: 'the wire gave no answer: ' + String(run.stderr || run.error || '').slice(0, 200) };
      const got = o.ok ? Y.proposalsOf(o.text, a.task) : [];
      for (const r of got) proposals.push({ ...r, prov: { source: 'oauth', model: o.model, proposedAt: at, feed: L.feed, trainN: train.length, recipe: 'prompt-v1 salt ' + cycle, seq: o.seq } });
      cost[a.task] = { oauth: { calls: 1, cents: Number.isInteger(o.costCents) ? o.costCents : 0 } };
      asked.push({ task: a.task, ok: o.ok === true, code: o.code || null, why: o.why || '', seq: o.seq ?? null, costCents: o.costCents ?? null, proposed: got.length, text: o.ok ? String(o.text || '').slice(0, 2000) : '' });
      if (!o.ok && STOP_TONIGHT.has(o.code)) { stopAll = o; break; }
    }
    const g = L.Q.grow(units, slices, proposals, state.library);
    const built = B.recordsOf(g.promoted, { library: L.id, cycle, at, typeOf: L.D.typeOf, cost });
    const m = L.Q.meter(g.library, L.D.TASKS, units, plan.meter);
    if (g.promoted.length) {
      copyFileSync(join(DIR, 'state.json'), join(DIR, 'state.t' + cycle + '.json'));
      save(join(DIR, 'state.json'), JSON.stringify({ ...state, library: g.library, records: [...(state.records || []), ...built] }, null, 1));
    }
    // the credit step's own record, with the answers as they came, so the step re-derives from the record (X3)
    save(join(DIR, 'nights', 'teach-' + cycle + '.json'), JSON.stringify({ at, kind: 'library-teach', library: L.id, cycle, asked, proposals: proposals.map((x) => ({ when: x.when, then: x.then, prov: x.prov })), promoted: g.promoted.map((r) => ({ rule: P.ruleKey(r), receipt: r.receipt, held: r.scores.held, final: r.scores.final, heldDocs: r.scores.heldDocs, finalDocs: r.scores.finalDocs })), dropped: g.dropped, patterns: g.library.length, meter: { coverage: m.coverage, precision: m.precision, answered: m.answered, cases: m.cases } }, null, 1));
    const spent = asked.reduce((n, x) => n + (Number.isInteger(x.costCents) ? x.costCents : 0), 0);
    appendFileSync(join(DIR, 'ledger.jsonl'), JSON.stringify({ at, kind: 'library-teach', library: L.id, cycle, asked, proposed: proposals.length, promoted: g.promoted.map((r) => ({ rule: P.ruleKey(r), receipt: r.receipt })), dropped: g.dropped, patterns: g.library.length, meter: { coverage: m.coverage, precision: m.precision }, cents: spent }) + '\n');
    const stopped = asked.find((x) => !x.ok);
    lines.push(L.id + ': asked about ' + asked.length + ' task(s) (' + asked.map((x) => x.task + (x.ok ? '' : ' ' + x.code)).join(', ') + ') · ' + proposals.length + ' rules proposed, ' + g.promoted.length + ' kept, ' + g.dropped.length + ' dropped · $' + (spent / 100).toFixed(2) + ' API-equivalent'
      + (stopped ? ' · stopped: ' + stopped.why.slice(0, 160) : '') + ' · coverage now ' + (m.coverage * 100).toFixed(1) + '%');
  }
  say('pattern libraries, credit step: ' + lines.join(' | '));
}

main().catch((e) => { console.log('pattern libraries credit step failed: ' + String((e && e.message) || e).slice(0, 300)); process.exitCode = 1; });
