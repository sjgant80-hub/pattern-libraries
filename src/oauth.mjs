// pattern-libraries · src/oauth.mjs — THE SUBSCRIPTION TIER'S RULES (Simon's §3 "OAuth budget wall"). Sealed first:
// CLAIMS.md (SEAL 1, 1c6108e; W1-W3, P2). The decisions are kar-spendwall's own law (vendor/spendwall/src/wall.mjs,
// byte for byte): the same ceiling, the same day cap and stop through the wallet's canDo, the same latch, the same
// settle. This file only holds what differs for a subscription signed in through the official CLI: its defaults, the
// CLI's arguments and environment, and how its reply is read. Pure and total; no clock, disk, network or key.
import W from '../vendor/spendwall/src/wall.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => (typeof x === 'string' ? x : '');

/** W2: the safe defaults until Simon sets his own. Metered in API-equivalent cents: a subscription has no price per call. */
export const DEFAULTS = Object.freeze({ dayCents: 100, stopCents: 3000, creditCents: 3000, model: 'claude-opus-5-5', effort: 'medium', maxTokens: 4000, frame: 6000, perNight: 3 });
export const SYSTEM = 'You write extraction rules for a deterministic pattern library. Reply with rules only, one per line, in exactly the form asked for. No other text.';
/** The jobs the wire serves, each with its own system prompt (Simon 2026-11-11: "give kar opus, let him build"). A job not
 *  on this list gets no call. The model never gets tools: what it writes is text the caller checks, files nothing. */
export const SYSTEMS = Object.freeze({
  teacher: SYSTEM,
  sandbox: 'You are Kar, building in your own sandbox: small, pure, deterministic JavaScript kernels and their tests, chosen by you. Every kernel you write goes through a mutation gate before anything is kept, so write tests that would fail if the code were wrong. Reply in exactly the format the prompt asks for. No other text.',
});
export const KEEP_ENV = Object.freeze(['CLAUDE_CODE_GIT_BASH_PATH', 'CLAUDE_CODE_OAUTH_TOKEN']);

/** settingsOf(file) → { on, settings }: Simon's file over the defaults. The tier is on only when his file says so. */
export function settingsOf(file) {
  const f = isObj(file) ? file : {};
  const settings = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) if (k in f) settings[k] = f[k];
  return { on: f.on === true, settings };
}

/** systemFor(job) → the job's system prompt, or null for a job not on the list (no job means the teacher, as before) */
export function systemFor(job) {
  const j = job === undefined ? 'teacher' : job;
  return typeof j === 'string' && Object.prototype.hasOwnProperty.call(SYSTEMS, j) ? SYSTEMS[j] : null;
}

/** args(cfg, ceilingCents, job) → the CLI's arguments: print mode, JSON out, the model and effort, the job's system
 *  prompt, no tools, no MCP, no session saved, no slash commands, and the reserved ceiling as the CLI's own budget
 *  limit (W1, W3). An unknown job gets no arguments, so no call. */
export function args(cfg, ceilingCents, job) {
  if (!isObj(cfg) || !str(cfg.model) || str(cfg.model).startsWith('-') || !Number.isInteger(ceilingCents) || ceilingCents < 1) return null;
  if (!W.EFFORTS.includes(cfg.effort)) return null;
  const system = systemFor(job);
  if (system === null) return null;
  return ['-p', '--output-format', 'json', '--model', cfg.model, '--effort', cfg.effort, '--system-prompt', system, '--tools', '',
    '--setting-sources', 'project', '--strict-mcp-config', '--no-session-persistence', '--disable-slash-commands', '--no-chrome',
    '--max-budget-usd', (ceilingCents / 100).toFixed(2)];
}

/** env(base, maxTokens, token) → the child's environment: every ANTHROPIC_* and CLAUDE* variable removed (an API key
 *  would bill the API instead of the subscription), except the two the CLI needs; the output limit set; and Kar's
 *  durable sign-in token, when the caller holds one, as the CLI's OAuth token (it wins over the environment's) */
export function env(base, maxTokens, token) {
  const out = {};
  for (const [k, v] of Object.entries(isObj(base) ? base : {})) {
    if (/^(ANTHROPIC_|CLAUDE)/i.test(k) && !KEEP_ENV.includes(k)) continue;
    if (typeof v === 'string') out[k] = v;
  }
  if (Number.isInteger(maxTokens) && maxTokens > 0) out.CLAUDE_CODE_MAX_OUTPUT_TOKENS = String(maxTokens);
  if (typeof token === 'string' && token.trim()) out.CLAUDE_CODE_OAUTH_TOKEN = token.trim();
  return out;
}

/** reply(stdout) → { ok, text, usage, model, why }: the CLI's one JSON result. One model in its usage, or it cannot be
 *  priced (and the wall then charges the whole ceiling). */
export function reply(stdout) {
  let j = null;
  const lines = str(stdout).trim().split(/\r?\n/).filter(Boolean);
  // the last result line wins
  for (const line of lines.reverse()) { try { const x = JSON.parse(line); if (isObj(x) && x.type === 'result') { j = x; break; } } catch { /* not this line */ } }
  if (!j) return { ok: false, text: '', usage: null, model: null, why: 'no result from the CLI' };
  const models = isObj(j.modelUsage) ? Object.keys(j.modelUsage) : [];
  const model = models.length === 1 ? models[0] : null;
  const usage = isObj(j.usage) ? { input_tokens: j.usage.input_tokens, output_tokens: j.usage.output_tokens, cache_creation_input_tokens: j.usage.cache_creation_input_tokens ?? 0, cache_read_input_tokens: j.usage.cache_read_input_tokens ?? 0 } : null;
  const bad = j.is_error === true || j.subtype !== 'success';
  return { ok: !bad && typeof j.result === 'string', text: typeof j.result === 'string' ? j.result : '', usage, model, why: bad ? 'the CLI reported ' + str(j.subtype || 'an error') + ': ' + str(j.result).slice(0, 160) : '' };
}

/** brief(entries, file, now) → the morning line for the subscription tier, from its ledger alone */
export function brief(entries, file, now) {
  const { on, settings } = settingsOf(file);
  const c = W.config(settings);
  if (!c.ok) return 'subscription tier: the settings are refused (' + c.why + '), so no call can be made';
  const s = W.replay(entries), day = W.dayOf(now), today = day ? s.days[day] || 0 : 0;
  const $ = (n) => '$' + (n / 100).toFixed(2);
  const head = !on ? 'subscription tier OFF until Simon switches it on' : W.isOff(s, c.cfg) ? 'subscription tier STOPPED at ' + $(c.cfg.stopCents) + ' (latched until Simon raises it)' : 'subscription tier on';
  return head + ' · API-equivalent: today ' + $(today) + ' of ' + $(c.cfg.dayCents) + ' · ' + $(s.total) + ' in total, stop at ' + $(c.cfg.stopCents) + ' · ' + s.calls + ' calls, ' + s.refused + ' refused'
    + (s.overruns ? ' · ' + s.overruns + ' OVERRUN' : '') + (s.open.length ? ' · ' + s.open.length + ' unsettled, counted at the ceiling' : '');
}

export default { DEFAULTS, SYSTEM, SYSTEMS, KEEP_ENV, settingsOf, systemFor, args, env, reply, brief };
