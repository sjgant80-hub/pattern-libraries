# Results · library 1 (document extraction) and the build-pattern library, night 0 (2026-11-10)

Read from the records in `data/doc/` and re-derived byte for byte on GitHub's runner (`tools/rederive.mjs`). The live
page computes the same verdicts in the browser from the same files.

## Night 0, what happened

- **The local 7B sat out.** At build time the shared qwen2.5:7b was busy with Kar's own 04:00 sandbox night and another
  session's measuring job, and this build's rule is never to run a second 7B job beside them. So night 0 ran the free
  tiers alone (`--no-7b`), and the record says so. The 7B's first night is the 03:00 run on 2026-11-11.
- **83 proposals** (the recipe lookup had nothing yet; the one-word and two-word miners proposed the rest), **2 kept, 81
  dropped**, every drop with its reason: 71 fired on fewer than 5 candidates in the 20 unseen contracts, 7 were right
  less than 80% of the time, 3 failed the final exam.
- **Kept:** `construed ⇒ governing law` (held-out 13/14, final 10/10; contracts 12/12 vs the cheap method's 4, then 9/9 vs
  0) and `conflict ⇒ governing law` (5/5, 7/7; contracts 4/4 vs 0, then 6/6 vs 2).
- **On the 60 measuring contracts** (never used to propose or gate): coverage 0.0% → 2.9% (33 of 1,140 questions),
  right 32 of 33 (97.0%), against the cheap method's 9 of the same 33. Signed by the baseline agreement: **PROMOTE**,
  +0.697, z 5.84 (receipt `bc352e1c…`).
- **The paid tier:** no call. It had no candidate (the 7B did not run), and it is off until Simon switches it on.

## The claims

| claim | verdict | from |
|---|---|---|
| P1 only fresh-exam winners kept; drops logged | **HELD** on night 0 (2 kept, both gates; 81 dropped with reasons) | `nights/cycle-0.json` |
| P2 the paid tier last; the day cap never exceeded | **NO CALL YET** (the tier is off) | the subscription ledger is empty |
| P3 how each was built; spend per library falls | records **HELD** (2 of 2); the fall **PENDING** (needs two weeks of paid-tier nights) | `state.json` |
| P4 coverage climbs night over night | **PENDING** (night 0 measured: 2.9%) | decided from 2026-11-11 |
| P5 nothing outward at night; every pattern gated; the model only proposes | **HELD** by the source scans (`test/scan.test.mjs`, CI) | CI |
| X1 each night's library beats the cheap method on that night's fresh final exam | **UNDECIDED** on night 0 (nothing carried in to examine); first decided on night 1 | `nights/cycle-0.json` |
| X2 right ≥ 75% where it answers on the meter | **HELD** (97.0%) | `summary.json` |
| X3 every night re-derives byte for byte | **HELD** (local and CI) | CI |
| X4 licence and credit on every source | **HELD** | NOTICE, the page |
| B1 a how-it-was-built record the same night | **HELD** | `state.json` |
| B2 Kar's build checks with provenance, local only | **HELD** (88 checks, near-duplicates merged, `tools/build-checks.mjs --ask`) | Kar's machine |
| N1 the night inside dream-bridge, after the pattern night and teacher, ≤ 6 7B calls, its own 25-minute clock | **WIRED**; the first scheduled night is 2026-11-11 03:00 | `dream-bridge.ps1` |
| N2 one morning block | **WIRED** (block 1f of the morning surface) | `morning-surface.mjs` |
| W1 reserve, cap, stop, budget limit, settle | **HELD** in tests against a stand-in CLI (8 tests) | `test/oauth.test.mjs` |
| W2 safe defaults; the cap is Simon's | **SHIPPED OFF**; defaults $1.00/day, 3 calls a night, stop $30.00 | `src/oauth.mjs` |
| W3 no key or token committed; CLI run with no tools, no MCP, no session | **HELD** (scan clean on 47 files) | CI |

Witness v0.6, uncapped, nothing baselined, re-derived on the runner: extract 99/99, cycle 55/55, build 37/37, night
38/38, oauth 26/26, value 23/23.

## Landed or not

By the seal's own rule (a library is landed only when all its claims are decided on a real run), **document extraction and the build-pattern library are RUNNING, not landed**: built, gated, live and growing every night; X1 and P4 are first decided on night 1 (2026-11-11, 03:00), P2 and P3 only once Simon switches the paid tier on. **Finance, triage, sales, novel angles and compression are NOT LANDED** (not built).

## Disclosures: what changed after seal 1, before night 0 was read (and which way it moves the bar)

1. **The paid tier ships switched off** (`"on": true` in Simon's settings file turns it on). Spending waits for him. Stricter.
2. **X1 examines the library as carried into the night**, on that night's final exam, not the library after tonight's
   promotions: tonight's winners were selected on that very batch, so judging them on it would flatter them. Stricter;
   it also means night 0 (nothing carried in) cannot decide X1.
3. **The field gate compares in whole thousandths**, so a rate exactly on a sealed bar passes as sealed ("≥"): in
   floating point 0.1 × 30 is not 3. Neutral: it makes the gate do what the seal says.
4. **The exam receipt needs at least 20 answered cases** (the baseline agreement's sample floor), fixed in code before
   any read; fewer is INSUFFICIENT, never a pass. Stricter.
5. **The company-name scanner dropped "Bank", "Trust", "Partners" and "Holdings" as name endings** after a test showed
   "Bank of America Corporation" read as "America Corporation". Found on a synthetic test sentence, not on the exam.
6. **Night 0 ran without the 7B** (above). It makes night 0 weaker, not easier.
