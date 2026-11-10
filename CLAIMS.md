# Pattern Libraries · sealed claims (SEAL 1, written before any code)

Simon's spec, 2026-11-10: **PATTERN LIBRARY BUILD PLAN — real estate builds for Kar's overnight work.** Grow the libraries
that become products (the SLM suite) or make Kar itself more capable. Each one grows the gated night-loop way: propose
cheap and local first, gate on real held-out data, keep only what beats the baseline, cache how it was built, and measure
the coverage climbing night over night. The credit tier (Simon's Claude subscription, through the official CLI) buys only
the hard 10%, behind a wall.

Every bar below is fixed here, before the code. A claim that misses its bar is kept and published as failed. Nothing is
relaxed after a result is seen; any change before the first read is disclosed in a later seal with which way it moves the bar.

## Build order (Simon's §6) and what this seal covers

1. **DOCUMENT EXTRACTION** — this seal.
2. **FINANCE / ACCOUNTING** — sealed separately (SEAL 2), before its code.
3. **BUILD PATTERNS** — this seal, alongside the first library from day one.
4. **TRIAGE / ROUTING** and **SALES** — sealed separately, before their code.
5. **NOVEL ANGLE** and **COMPRESSION / STACKED LIGHT** — sealed separately, before their code.

Simon's five claims bind every library. This seal adds the bars for library 1, the build-pattern library, the night
wiring and the credit wall. A library is reported **landed** only when all its claims are decided on a real run, its
kernels are witness-clean, and the live page shows it; otherwise it is reported **not landed**, by name.

## The rule language and the law (reused, never rewritten)

- A pattern reads **WHEN word [AND word] THEN label**. The law that admits one is Kar's own pattern-library law,
  `si-didy/patlib.mjs` (sealed 2026-11-06, 53cfed8), **vendored byte for byte** and pinned by hash. Its gate is used
  unchanged: held-out cover ≥ 5, precision ≥ 0.8, margin ≥ 0.2 over the train-majority baseline; competence (fires on at
  most half of the held-out cases); final exam cover ≥ 3 at the same bars; deterministic over two scorings; provenance
  present; no duplicate; no near-duplicate (Jaccard ≥ 0.9).
- The signed receipt is mint-a-department's baseline agreement, `ai-first-company/src/baseline.mjs` (+ experiment.mjs,
  journal.mjs, sha256.mjs), **vendored byte for byte**: the same engine that judges the money-back guarantee judges each
  night's library.
- The credit wall is kar-spendwall's law, `src/wall.mjs` (+ the wallet), **vendored byte for byte**, with its own ledger
  and settings for the subscription tier. The API key tier is not touched.

## Library 1 · DOCUMENT EXTRACTION (contracts)

**Data.** CUAD v1 (The Atticus Project; CC BY 4.0, Zenodo record 4595826): 510 commercial contracts filed on SEC EDGAR,
with expert annotations. Source file `data.zip` from github.com/TheAtticusProject/cuad, sha256
`f8161d18bea4e9c05e78fa6dda61c19c846fb8087ea969c172753bc2f45b999a`. The derived feed in this repo is regenerated from that
file by a committed tool, and its own hash is pinned.

**What it extracts.**
- **Fields** (a deterministic scanner finds every candidate of the field's type; a pattern picks the right one by the
  words around it): agreement date, effective date, expiration date (dates); governing law (a jurisdiction); the parties
  (company names); renewal term, notice period (durations); liability cap, minimum commitment (money amounts).
- **Clauses** (a pattern flags the sentence): non-compete, exclusivity, termination for convenience, change of control,
  anti-assignment, audit rights, insurance, cap on liability, warranty duration, post-termination services.
- A candidate is right when it lies inside the experts' annotation for that field (or, for a field value, when its value
  equals the value of one that does); a sentence is right when it overlaps the experts' annotation for that clause.

**The cheap baseline it must beat** (fixed here): for a field, the first candidate of its type in the document (the first
date, the first jurisdiction, the first company name, the first duration, the first amount); for a clause, the first
sentence containing its search word (ctrl-F): compet, exclusiv, terminat, control, assign, audit, insurance, liabilit,
warrant, termination.

**The fresh exam per cycle.** Documents are put in one fixed order (FNV-1a of `cuad:` + title). The first 60 are the
**METER**: never used to propose or to gate, only to measure coverage. The next 150 are the seed training set. The other
300 are 15 batches of 20. Cycle n (one per night) gates on batch 2n (held-out) and batch 2n+1 (the final exam), both
never seen by any earlier cycle; its training set is the seed plus every batch before 2n. A batch is an exam once, then
only training. When the batches run out, the library says plainly that it needs fresh data and stops promoting; no exam
is ever re-used.

**The second gate (field level, added to the law's).** On the cycle's held-out documents where a pattern fires, its first
firing candidate must be right in ≥ 80% of them, and beat the cheap baseline's rightness on those same documents by
≥ 0.10, over ≥ 3 documents; the same on the final-exam documents, over ≥ 3 documents.

**The answer.** For each field or clause, the first candidate in document order on which a kept pattern fires, with the
pattern and its receipt; otherwise **unknown**, left for a model. The library never guesses.

## Claims

**Simon's (every library):**
- **P1** — each library grows only patterns that beat the baseline on FRESH held-out data per cycle; every drop is logged
  with its reason. *Bar:* every kept pattern passed the law's gate and the field gate on that cycle's never-used batches;
  every proposal not kept is in the ledger with the gate's reason; at least one proposal is dropped.
- **P2** — the credit tier is the last tier; the daily cap is never exceeded. *Bar:* no subscription call for a task the
  library already answers, or for which nothing the local 7B wrote was tried, or where a cheaper tier's pattern passed
  tonight (the wall's own `escalate`, unchanged); the ledger, re-added by kar-tally, shows no UTC day above the cap and no
  call above its reserved ceiling.
- **P3** — the build-pattern library captures how each pattern was built, and credit spend per library drops over time.
  *Bar:* every kept pattern has a how-it-was-built record (library, task, kind, tier, recipe, cost, cycle); a cheaper
  recipe that worked for a task of the same kind is tried first next time; spend per kept pattern, per library, falls
  between the first and the latest week of real nights that used the credit tier. PENDING until such weeks exist.
- **P4** — the % of a domain's cases the library resolves climbs night over night. *Bar:* coverage on the METER (field and
  clause cases answered without a model) never falls, and rises on every night that keeps a pattern, over the real nights
  recorded in the ledger. Night 1 is measured at build time; the climb is decided on the real nights after it.
- **P5** — nothing outward at night; every pattern gated; the model only proposes. *Bar:* the night file contacts only
  127.0.0.1 and makes no subscription call (a source scan proves it); the credit step is a separate process through the
  wall; no publish, push, post or send at night; no pattern enters except through the gates.

**Library 1's own:**
- **X1** — each cycle, on its fresh final-exam batch, the library beats the cheap baseline on the cases it answers,
  judged and signed by the baseline agreement (rate, higher, minimum improvement 0.10, z 1.96). A cycle whose answered
  cases are too few is recorded as such, never as a pass.
- **X2** — the library abstains rather than guesses: on the METER, wherever it answers, it is right at least 75% of the time.
- **X3** — every cycle re-derives byte for byte from the committed feed and the recorded proposals (CI re-runs it).
- **X4** — every source carries its licence and attribution; the page credits The Atticus Project (CC BY 4.0).

**The build-pattern library:**
- **B1** — every kept pattern's how-it-was-built record is written the same night it is kept (P3's record).
- **B2** — Kar's own build checks (the "CHECK" lessons from every build's retrospective) are kept as patterns with their
  provenance (which build, which date), near-duplicates merged, retrievable by a plain lookup. They are kept because a
  real build caught the fault, not because they beat a baseline, and the page says so. They stay on this laptop (they cite
  private work); the public page shows the growth recipes only.

**The night and the morning:**
- **N1** — the libraries' night runs inside the 03:00 dream-bridge turn, after the existing pattern night and teacher,
  within its 120-minute cap, at most 6 local-7B calls and a 25-minute clock of its own. patlib-night.mjs and
  patlib-teach.mjs are not edited; their sealed L1–L7 and K-claims still stand (their tests re-run green).
- **N2** — the morning surface carries one block: patterns added and dropped per library (with why), credit spent and
  what it bought, the coverage climb, and what needs Simon.

**The credit wall (the subscription tier):**
- **W1** — every subscription call goes through one wire that reserves the call's whole ceiling on disk before it goes
  out, checks the daily cap and the stop with the vendored wall law, passes the ceiling to the CLI as its own budget
  limit, settles from the usage the CLI reports (rounded up), and charges the whole ceiling when the usage is unreadable.
  It is metered in API-equivalent dollars, because a subscription has no price per call; the page says so.
- **W2** — safe defaults until Simon sets his own: $1.00 API-equivalent a UTC day, at most 3 calls a night, a stop that
  latches at $30.00 API-equivalent in total, claude-opus-5-5 at effort medium, 4,000 output tokens. **The cap is Simon's
  decision**; his settings file overrides these.
- **W3** — no key or token is printed or committed (a scan of every tracked file proves it); the wire runs the CLI from a
  folder outside the profile, with no tools, no MCP, no session saved.

## Lessons carried in (from today)

- Ollama with `format: 'json'` can abort qwen2.5:7b with HTTP 500 "token repeat limit": an error, never an empty answer.
  This build does not use the JSON format; any non-200 is recorded as an error.
- Python writes JSON with CRLF; every hash is taken over the bytes git stores.
