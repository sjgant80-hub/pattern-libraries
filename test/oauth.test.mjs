// test/oauth.test.mjs — the subscription tier's rules (W1-W3), and the wire end to end against a stand-in CLI on this
// machine: the ceiling reserved before the call, the CLI's own budget limit, the environment cleaned, the settle, the
// day cap, the stop that latches, the switch that keeps it off until Simon turns it on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import O from '../src/oauth.mjs';
import Wl from '../vendor/spendwall/src/wall.mjs';

test('settings: the safe defaults; Simon\'s file over them; off unless he says on', () => {
  assert.deepEqual(O.DEFAULTS, { dayCents: 100, stopCents: 3000, creditCents: 3000, model: 'claude-opus-5-5', effort: 'medium', maxTokens: 4000, frame: 6000, perNight: 3 });
  assert.deepEqual(O.settingsOf(null), { on: false, settings: { ...O.DEFAULTS } });
  assert.deepEqual(O.settingsOf({ on: 'yes', dayCents: 50, stray: 1 }), { on: false, settings: { ...O.DEFAULTS, dayCents: 50 } });
  assert.equal(O.settingsOf({ on: true }).on, true);
  assert.equal(Wl.config(O.settingsOf({}).settings).ok, true);
});

test('args: print mode, JSON, no tools, no MCP, nothing saved, and the ceiling as the CLI\'s own budget', () => {
  const a = O.args({ model: 'claude-opus-5-5', effort: 'medium' }, 123);
  assert.deepEqual(a, ['-p', '--output-format', 'json', '--model', 'claude-opus-5-5', '--effort', 'medium', '--system-prompt', O.SYSTEM, '--tools', '',
    '--setting-sources', 'project', '--strict-mcp-config', '--no-session-persistence', '--disable-slash-commands', '--no-chrome', '--max-budget-usd', '1.23']);
  assert.equal(O.args({ model: 'm', effort: 'medium' }, 1).at(-1), '0.01');
  assert.equal(O.args({ model: 'm', effort: 'medium' }, 0), null);
  assert.equal(O.args({ model: 'm', effort: 'medium' }, 1.5), null);
  assert.equal(O.args({ model: '-x', effort: 'medium' }, 5), null);
  assert.equal(O.args({ model: '', effort: 'medium' }, 5), null);
  assert.equal(O.args({ model: 'm', effort: 'huge' }, 5), null);
  assert.equal(O.args(null, 5), null);
});

test('jobs: each job its own system prompt; no job is the teacher, as before; anything else gets no call', () => {
  assert.deepEqual(Object.keys(O.SYSTEMS), ['teacher', 'sandbox']);
  assert.equal(O.SYSTEMS.teacher, O.SYSTEM);
  assert.equal(O.systemFor(undefined), O.SYSTEM);
  assert.equal(O.systemFor('teacher'), O.SYSTEM);
  assert.match(O.systemFor('sandbox'), /^You are Kar, building in your own sandbox/);
  for (const j of ['', 'nope', 'toString', '__proto__', 'constructor', null, 5, {}]) assert.equal(O.systemFor(j), null, String(j));
  const cfg = { model: 'claude-opus-5-5', effort: 'medium' };
  assert.deepEqual(O.args(cfg, 123), O.args(cfg, 123, 'teacher'));                 // the teacher's call is unchanged
  const s = O.args(cfg, 123, 'sandbox');
  assert.equal(s[s.indexOf('--system-prompt') + 1], O.SYSTEMS.sandbox);
  assert.equal(s[s.indexOf('--tools') + 1], '');                                   // still no tools
  assert.equal(O.args(cfg, 123, 'nope'), null);
  assert.equal(O.args(cfg, 123, '__proto__'), null);
});

test('env: every ANTHROPIC_* and CLAUDE* variable removed except the two the CLI needs; the output limit set', () => {
  const e = O.env({ PATH: 'p', ANTHROPIC_API_KEY: 'k', anthropic_base_url: 'u', CLAUDECODE: '1', CLAUDE_CODE_OAUTH_TOKEN: 't', CLAUDE_CODE_GIT_BASH_PATH: 'g', N: 5 }, 4000);
  assert.deepEqual(e, { PATH: 'p', CLAUDE_CODE_OAUTH_TOKEN: 't', CLAUDE_CODE_GIT_BASH_PATH: 'g', CLAUDE_CODE_MAX_OUTPUT_TOKENS: '4000' });
  assert.deepEqual(O.env(null, 0), {});
  assert.deepEqual(O.env({}, 1), { CLAUDE_CODE_MAX_OUTPUT_TOKENS: '1' });
  assert.deepEqual(O.env({}, 2.5), {});
});

test('env: Kar\'s durable sign-in token reaches the CLI, wins over the environment\'s, and nothing else counts as one', () => {
  // the 2026-11-11 fault: the token file counted as a sign-in but never reached the CLI, which then used an expired login
  assert.deepEqual(O.env({ PATH: 'p' }, 0, 'tok'), { PATH: 'p', CLAUDE_CODE_OAUTH_TOKEN: 'tok' });
  assert.deepEqual(O.env({ CLAUDE_CODE_OAUTH_TOKEN: 'old' }, 0, 'new'), { CLAUDE_CODE_OAUTH_TOKEN: 'new' });
  assert.deepEqual(O.env({ CLAUDE_CODE_OAUTH_TOKEN: 'old' }, 0), { CLAUDE_CODE_OAUTH_TOKEN: 'old' });
  assert.deepEqual(O.env({}, 0, '  padded\n'), { CLAUDE_CODE_OAUTH_TOKEN: 'padded' });
  for (const t of [undefined, null, '', '   ', 5, {}, ['x']]) assert.deepEqual(O.env({ PATH: 'p' }, 0, t), { PATH: 'p' }, String(t));
  assert.deepEqual(O.env({ ANTHROPIC_API_KEY: 'k' }, 7, 'tok'), { CLAUDE_CODE_MAX_OUTPUT_TOKENS: '7', CLAUDE_CODE_OAUTH_TOKEN: 'tok' });
});

const RESULT = (over) => JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'WHEN laws THEN governing-law', usage: { input_tokens: 900, output_tokens: 40, cache_creation_input_tokens: 10, cache_read_input_tokens: 5 }, modelUsage: { 'claude-opus-5-5': {} }, ...over });

test('reply: the CLI\'s one JSON result read; errors and other shapes refused', () => {
  const r = O.reply('noise\n' + RESULT());
  assert.deepEqual(r, { ok: true, text: 'WHEN laws THEN governing-law', usage: { input_tokens: 900, output_tokens: 40, cache_creation_input_tokens: 10, cache_read_input_tokens: 5 }, model: 'claude-opus-5-5', why: '' });
  assert.deepEqual(O.reply(RESULT({ usage: { input_tokens: 1, output_tokens: 2 } })).usage, { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 });
  assert.equal(O.reply(RESULT({ modelUsage: { a: {}, b: {} } })).model, null);
  assert.equal(O.reply(RESULT({ modelUsage: null })).model, null);
  assert.equal(O.reply(RESULT({ usage: 5 })).usage, null);
  const bad = O.reply(RESULT({ is_error: true, subtype: 'error_max_budget_usd', result: 'over budget' }));
  assert.deepEqual([bad.ok, bad.why], [false, 'the CLI reported error_max_budget_usd: over budget']);
  assert.equal(O.reply(RESULT({ subtype: 'error_during_execution', is_error: false })).ok, false);
  assert.equal(O.reply(RESULT({ is_error: true })).ok, false);
  assert.match(O.reply(RESULT({ is_error: true, subtype: undefined, result: 5 })).why, /^the CLI reported an error: $/);
  assert.equal(O.reply(RESULT({ result: 7 })).ok, false);
  assert.equal(O.reply(RESULT({ result: 7 })).text, '');
  assert.deepEqual(O.reply('{"type":"other"}\nnot json'), { ok: false, text: '', usage: null, model: null, why: 'no result from the CLI' });
  assert.equal(O.reply(null).why, 'no result from the CLI');
  assert.equal(O.reply(RESULT() + '\n' + JSON.stringify({ type: 'result', subtype: 'success', result: 'later' })).text, 'later');
});

test('brief: off, on, stopped; API-equivalent dollars from the ledger alone', () => {
  const day = '2026-11-10';
  const res = (seq, cents, d) => ({ seq, at: d + 'T03:00:00Z', day: d, kind: 'reserve', job: 'doc:teacher', ceilingCents: cents });
  assert.equal(O.brief([], {}, day + 'T09:00:00Z'), 'subscription tier OFF until Simon switches it on · API-equivalent: today $0.00 of $1.00 · $0.00 in total, stop at $30.00 · 0 calls, 0 refused');
  assert.equal(O.brief([res(1, 40, day)], { on: true }, day + 'T09:00:00Z'), 'subscription tier on · API-equivalent: today $0.40 of $1.00 · $0.40 in total, stop at $30.00 · 1 calls, 0 refused · 1 unsettled, counted at the ceiling');
  const full = [res(1, 3000, '2026-11-01'), { seq: 1, at: '2026-11-01T03:01:00Z', kind: 'settle', costCents: 3000 }];
  assert.match(O.brief(full, { on: true }, day + 'T09:00:00Z'), /^subscription tier STOPPED at \$30\.00 \(latched until Simon raises it\) · API-equivalent: today \$0\.00 of \$1\.00 · \$30\.00 in total/);
  const over = [res(1, 10, day), { seq: 1, at: day + 'T03:01:00Z', kind: 'settle', costCents: 12 }];
  assert.match(O.brief(over, { on: true }, day + 'T09:00:00Z'), / · 1 OVERRUN$/);
  assert.match(O.brief([], { dayCents: 0 }, day), /^subscription tier: the settings are refused \(/);
  assert.match(O.brief([], {}, 'not a time'), /today \$0\.00/);
});

// ── the wire, end to end, against a stand-in CLI ─────────────────────────────────────────────────────────────────
const WIRE = fileURLToPath(new URL('../tools/oauth-ask.mjs', import.meta.url));
function standIn(dir, body) {
  const f = join(dir, 'cli.mjs');
  writeFileSync(f, `import { readFileSync, writeFileSync } from 'node:fs';\nconst input = readFileSync(0, 'utf8');\nwriteFileSync(${JSON.stringify(join(dir, 'seen.json'))}, JSON.stringify({ argv: process.argv.slice(2), input, env: Object.keys(process.env).filter((k) => /^(ANTHROPIC|CLAUDE)/i.test(k)), max: process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS, cwd: process.cwd() }));\n${body}\n`);
  return f;
}
function wire(dir, cli, req, extraEnv = {}) {
  const r = spawnSync(process.execPath, [WIRE], { input: typeof req === 'string' ? req : JSON.stringify(req), encoding: 'utf8', timeout: 60000,
    env: { ...process.env, PL_OAUTH_TEST_DIR: dir, PL_OAUTH_TEST_CLI: cli, PL_OAUTH_TEST_SIGNED_IN: '1', ANTHROPIC_API_KEY: 'decoy-key', ANTHROPIC_BASE_URL: 'http://127.0.0.1:9', ...extraEnv } });
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const ledger = (dir) => readFileSync(join(dir, 'ledger.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const EV = { tier1: { asked: true, answered: false, what: 'miners' }, tier2: { tried: 2, passed: 0, model: 'qwen2.5:7b', dropped: ['r: why'] } };

test('the wire: off until switched on; then reserve, call once, settle; the env cleaned; nothing else kept', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pl-oauth-'));
  const cli = standIn(dir, `process.stdout.write(${JSON.stringify(RESULT())} + '\\n');`);
  assert.deepEqual(wire(dir, cli, { prompt: 'p', evidence: EV }), { ok: false, code: 'off', why: 'the subscription tier is off until Simon switches it on' });
  assert.ok(!existsSync(join(dir, 'ledger.jsonl')));
  writeFileSync(join(dir, 'settings.json'), JSON.stringify({ on: true }));
  const o = wire(dir, cli, { job: 'teacher', library: 'doc', evidence: EV, prompt: 'Write rules.' });
  assert.deepEqual([o.ok, o.code, o.text, o.seq, o.model], [true, 'ok', 'WHEN laws THEN governing-law', 1, 'claude-opus-5-5']);
  const L = ledger(dir);
  assert.deepEqual(L.map((e) => e.kind), ['reserve', 'settle']);
  assert.equal(L[0].job, 'doc:teacher');
  assert.equal(L[0].ceilingCents, o.ceilingCents);
  assert.equal(L[0].ceilingCents, Wl.ceiling(Wl.rate(JSON.parse(readFileSync(new URL('../data/prices.json', import.meta.url), 'utf8')), 'claude-opus-5-5'), Wl.bytesOf([O.SYSTEM, 'Write rules.']), Wl.config(O.settingsOf({ on: true }).settings).cfg));
  assert.ok(L[1].costCents <= L[0].ceilingCents && L[1].priced === true);
  assert.equal(o.costCents, L[1].costCents);
  const seen = JSON.parse(readFileSync(join(dir, 'seen.json'), 'utf8'));
  assert.equal(seen.input, 'Write rules.');
  assert.deepEqual(seen.env.sort(), ['CLAUDE_CODE_MAX_OUTPUT_TOKENS']);
  assert.equal(seen.max, '4000');
  assert.equal(seen.argv[seen.argv.indexOf('--max-budget-usd') + 1], (o.ceilingCents / 100).toFixed(2));
  assert.equal(seen.argv[seen.argv.indexOf('--tools') + 1], '');
  assert.ok(!seen.cwd.toLowerCase().startsWith(tmpdir().toLowerCase().slice(0, 12)) || seen.cwd.toLowerCase().includes('kar-oauth'));
  assert.ok(!existsSync(join(dir, 'lock')));
});

test('the wire: the wall refuses without evidence, past the day cap, and at the stop (which latches)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pl-oauth-'));
  const cli = standIn(dir, `process.stdout.write(${JSON.stringify(RESULT({ usage: { input_tokens: 1000, output_tokens: 400 } }))} + '\\n');`);
  writeFileSync(join(dir, 'settings.json'), JSON.stringify({ on: true, dayCents: 13, stopCents: 240, creditCents: 300 }));
  assert.equal(wire(dir, cli, { prompt: 'p' }).code, 'tier');
  const a = wire(dir, cli, { prompt: 'p', evidence: EV });
  assert.equal(a.ok, true);
  const b = wire(dir, cli, { prompt: 'p', evidence: EV });
  assert.equal(b.code, 'day');
  const L = ledger(dir);
  assert.deepEqual(L.map((e) => e.kind + ':' + (e.code || '')), ['refuse:tier', 'reserve:', 'settle:', 'refuse:day']);
  assert.ok(Object.values(Wl.replay(L).days).every((c) => c <= 13));
  assert.equal(Wl.replay(L).overruns, 0);
  assert.equal(L[2].costCents, 2);
  // the stop: a ledger already at it refuses and latches
  const d2 = mkdtempSync(join(tmpdir(), 'pl-oauth-'));
  writeFileSync(join(d2, 'settings.json'), JSON.stringify({ on: true }));
  writeFileSync(join(d2, 'ledger.jsonl'), JSON.stringify({ seq: 1, at: '2026-10-01T03:00:00Z', day: '2026-10-01', kind: 'reserve', job: 'doc:teacher', ceilingCents: 3000 }) + '\n');
  assert.equal(wire(d2, cli, { prompt: 'p', evidence: EV }).code, 'off');
});

test('the wire: an error is priced from its usage, or charged the whole ceiling without one; no sign-in, bad requests, a held lock, the real ledger in test mode', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pl-oauth-'));
  writeFileSync(join(dir, 'settings.json'), JSON.stringify({ on: true }));
  const bad = standIn(dir, `process.stdout.write(${JSON.stringify(RESULT({ is_error: true, subtype: 'error_during_execution', result: 'rate limited' }))} + '\\n');`);
  const e = wire(dir, bad, { prompt: 'p', evidence: EV });
  assert.deepEqual([e.ok, e.code, e.why], [false, 'error', 'the CLI reported error_during_execution: rate limited']);
  const L = ledger(dir);
  assert.equal(L[1].costCents, 1);                    // an error that reports its usage is priced from it (the wall's own settle)
  const silent = standIn(dir, 'process.exit(3);');
  const s = wire(dir, silent, { prompt: 'p', evidence: EV });
  assert.equal(s.why, 'no result from the CLI');
  assert.equal(ledger(dir).at(-1).costCents, ledger(dir).at(-2).ceilingCents);
  const n = wire(dir, silent, { prompt: 'p', evidence: EV }, { PL_OAUTH_TEST_SIGNED_IN: '0' });
  assert.deepEqual([n.code, n.why], ['key', 'no sign-in on disk for the official CLI, so the subscription tier cannot run']);
  assert.equal(wire(dir, silent, 'not json').code, 'args');
  assert.equal(wire(dir, silent, { prompt: '' }).code, 'args');
  writeFileSync(join(dir, 'lock'), '1');
  assert.equal(wire(dir, silent, { prompt: 'p', evidence: EV }).code, 'busy');
  const home = process.env.USERPROFILE || process.env.HOME;
  assert.equal(wire(join(home, '.si-didy', 'oauth'), silent, { prompt: 'p' }).why, 'test mode cannot use the real ledger');
});
