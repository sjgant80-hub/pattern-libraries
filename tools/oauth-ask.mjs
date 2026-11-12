#!/usr/bin/env node
// tools/oauth-ask.mjs — THE ONLY WIRE TO THE SUBSCRIPTION TIER (W1-W3). One call per run. Reads one JSON request on
// stdin: { job, library, evidence, prompt }. Writes one JSON line on stdout: { ok, code, why, text, seq, ceilingCents,
// costCents, model }. In order:
//   1 take the lock (a lock older than 10 minutes is cleared)
//   2 read the ledger and Simon's settings; the tier must be switched on and a sign-in must be on disk
//   3 the wall's own plan(): a reservation of the call's whole ceiling, or a refusal and why; appended and fsynced
//   4 run the official CLI once: no tools, no MCP, no session saved, from a folder outside the profile, with the
//     ceiling as its own budget limit and every ANTHROPIC_* / CLAUDE* variable removed except the two it needs
//   5 the wall's own settle(): priced from the usage the CLI reports, rounded up; unreadable usage costs the ceiling
// Nothing here prints or stores a token. Test mode (PL_OAUTH_TEST_DIR + PL_OAUTH_TEST_CLI) refuses the real ledger.
import { readFileSync, readdirSync, appendFileSync, openSync, closeSync, fsyncSync, mkdirSync, existsSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { spawnSync } from 'node:child_process';
import W from '../vendor/spendwall/src/wall.mjs';
import O from '../src/oauth.mjs';

const HOME = userInfo().homedir;
const REAL = join(HOME, '.si-didy', 'oauth');
const TEST = process.env.PL_OAUTH_TEST_DIR || '';
const DIR = TEST ? resolve(TEST) : REAL;
const PRICES = new URL('../data/prices.json', import.meta.url);
const out = (o) => { process.stdout.write(JSON.stringify(o) + '\n'); };
const rd = (p, fb) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; } };

function cliPath() {
  if (TEST) return { file: process.execPath, pre: [resolve(process.env.PL_OAUTH_TEST_CLI || '')] };
  // the Claude app's own copy first (it can serve the newest models), the newest version wins
  const base = join(process.env.LOCALAPPDATA || join(HOME, 'AppData', 'Local'), 'Claude-Data');
  const found = [];
  try {
    for (const pk of readdirSafe(base)) for (const v of readdirSafe(join(base, pk, 'claude-code'))) for (const b of readdirSafe(join(base, pk, 'claude-code', v))) {
      const f = join(base, pk, 'claude-code', v, b, process.platform === 'win32' ? 'claude.exe' : 'claude');
      if (existsSync(f)) found.push({ f, v: v.split('.').map(Number) });
    }
  } catch { /* none */ }
  found.sort((a, b) => { for (let i = 0; i < 3; i++) if ((b.v[i] || 0) !== (a.v[i] || 0)) return (b.v[i] || 0) - (a.v[i] || 0); return 0; });
  return found.length ? { file: found[0].f, pre: [] } : null;
}
function readdirSafe(d) { try { return readdirSync(d); } catch { return []; } }

/** Kar's durable sign-in (a `claude setup-token` token Simon saved), else the env token, else null. Read fresh each
 *  call; never printed, never written. The cockpit's own rule (si-didy/kar-cockpit.mjs oauthToken). */
function karToken() {
  if (TEST) return null;
  try { const t = readFileSync(join(HOME, '.si-didy', 'kar-oauth.token'), 'utf8').trim(); if (t) return t; } catch { /* none */ }
  return typeof process.env.CLAUDE_CODE_OAUTH_TOKEN === 'string' && process.env.CLAUDE_CODE_OAUTH_TOKEN ? process.env.CLAUDE_CODE_OAUTH_TOKEN : null;
}

/** a sign-in is on disk: Kar's durable token file, the env token, or the CLI's own credentials (never printed) */
function signedIn() {
  if (TEST) return process.env.PL_OAUTH_TEST_SIGNED_IN === '1';
  if (karToken()) return true;
  const c = rd(join(HOME, '.claude', '.credentials.json'), null);
  return !!(c && c.claudeAiOauth && typeof c.claudeAiOauth.accessToken === 'string' && c.claudeAiOauth.accessToken.length > 0);
}

function append(file, entry) {
  const fd = openSync(file, 'a');
  try { appendFileSync(fd, JSON.stringify(entry) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
}

async function main() {
  if (TEST && resolve(TEST).toLowerCase() === resolve(REAL).toLowerCase()) { out({ ok: false, code: 'args', why: 'test mode cannot use the real ledger' }); return; }
  let req = null;
  try { req = JSON.parse(readFileSync(0, 'utf8')); } catch { /* below */ }
  if (!req || typeof req.prompt !== 'string' || !req.prompt) { out({ ok: false, code: 'args', why: 'one JSON request with a prompt on stdin' }); return; }
  mkdirSync(DIR, { recursive: true });
  const LEDGER = join(DIR, 'ledger.jsonl'), LOCK = join(DIR, 'lock');
  try { if (existsSync(LOCK) && Date.now() - statSync(LOCK).mtimeMs > 600000) unlinkSync(LOCK); } catch { /* raced */ }
  try { writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); } catch { out({ ok: false, code: 'busy', why: 'another call holds the lock' }); return; }
  try {
    const { on, settings } = O.settingsOf(rd(join(DIR, 'settings.json'), {}));
    if (!on) { out({ ok: false, code: 'off', why: 'the subscription tier is off until Simon switches it on' }); return; }
    const entries = (() => { try { return readFileSync(LEDGER, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }); } catch { return []; } })();
    const prices = rd(PRICES, null);
    const at = new Date().toISOString();
    const bare = typeof req.job === 'string' && req.job ? req.job : 'teacher';
    if (O.systemFor(bare) === null) { out({ ok: false, code: 'args', why: 'no such job: ' + bare.slice(0, 40) }); return; }
    const job = (typeof req.library === 'string' && req.library ? req.library + ':' : '') + bare;
    const p = W.plan(entries, { job, evidence: req.evidence, bytes: W.bytesOf([O.systemFor(bare), req.prompt]) }, settings, prices, at, signedIn());
    if (p.entry.kind === 'refuse' && p.entry.code === 'key') p.entry.why = 'no sign-in on disk for the official CLI, so the subscription tier cannot run';
    append(LEDGER, p.entry);
    if (!p.ok) { out({ ok: false, code: p.entry.code, why: p.entry.why, seq: p.entry.seq }); return; }
    const res = p.entry, cli = cliPath(), a = O.args(p.cfg, res.ceilingCents, bare);
    let r = null, why = '';
    if (!cli || !a) why = !cli ? 'the official CLI was not found' : 'the CLI arguments were refused';
    else {
      const room = process.platform === 'win32' ? 'C:\\tmp\\kar-oauth' : '/tmp/kar-oauth';
      mkdirSync(room, { recursive: true });
      // the token file counts as a sign-in above, so it must reach the CLI here (as the cockpit's claudeEnv does):
      // before 2026-11-11 it did not, and the CLI fell back to an expired on-disk login
      const run = spawnSync(cli.file, [...cli.pre, ...a], { input: req.prompt, cwd: room, env: O.env(process.env, p.cfg.maxTokens, karToken()), encoding: 'utf8', timeout: 300000, windowsHide: true, maxBuffer: 1 << 24 });
      r = O.reply(run.stdout);
      if (!r.ok) why = r.why || ('the CLI exited ' + run.status + ': ' + String(run.stderr || run.error || '').slice(0, 160));
    }
    const s = W.settle(res, r && r.usage ? { usage: r.usage, model: r.model, stop_reason: r.ok ? 'end_turn' : 'error' } : null, prices, new Date().toISOString());
    append(LEDGER, s);
    out({ ok: !!(r && r.ok), code: r && r.ok ? 'ok' : 'error', why, text: r && r.ok ? r.text : '', seq: res.seq, ceilingCents: res.ceilingCents, costCents: s.costCents, model: res.model });
  } finally { try { unlinkSync(LOCK); } catch { /* gone */ } }
}

main().catch((e) => out({ ok: false, code: 'crash', why: String((e && e.message) || e).slice(0, 200) }));
