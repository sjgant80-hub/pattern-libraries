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

By the seal's own rule (a library is landed only when all its claims are decided on a real run), **document extraction and the build-pattern library are RUNNING, not landed**: built, gated, live and growing every night; X1 and P4 are first decided on night 1 (2026-11-11, 03:00), P2 and P3 only once Simon switches the paid tier on. **Finance is RUNNING** (library 2, below, since 2026-11-10) and **triage and routing is RUNNING** (library 3, below, since 2026-11-11); **sales, novel angles and compression are NOT LANDED** (not built).

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

## Changed after night 0 (a proposer, never a gate)

7. **A third free miner, coverage-first**, from night 1 on: the most-used words that are right at least 4 times in 5 on
   the training contracts. Night 0's own miners rank by precision and propose rare words, and 71 of its 81 drops were
   patterns that met too few candidates in a 20-contract exam. Both gates and every bar are unchanged; the proposer set
   is written in each record (`free: 2`), and night 0 still replays as set 1, byte for byte. Checked first on the seed
   contracts only (8 kept against 7), never on an exam batch.

---

# Results · library 2 (finance / accounting: receipts), night 0 (2026-11-10)

Sealed first in SEAL 2 (`CLAIMS.md`, commit e28a504), before any of its code. Read from the records in `data/finance/`
and re-derived byte for byte (`node tools/rederive.mjs CUADv1.json --cord cord-v2-ground-truth.jsonl`; CI fetches the
pinned receipts and does the same). The live page computes the same verdicts in the browser from the same files.

## The data

CORD v2 (NAVER CLOVA, CC BY 4.0, checked on its GitHub README and its Hugging Face card), at revision 7f0115a4…. Only the
`ground_truth` column was read, by HTTP range requests: about 1.9 MB over the wire for 1,000 receipts; the receipt images
(2.31 GB) were never downloaded. The derived file is 6,198,162 bytes, sha256 `27243282…2c613`, and the committed fetch tool
reproduces it exactly. Hugging Face's own row service refused the set (its parquet row groups carry the images, past the
service's scan limit), which is why the range reads were used. CORD has **no dates, suppliers or payment terms** (its makers
removed store and payment information), so this library does not read them, as SEAL 2 says.

## The check, tested on the experts' own receipts first (R0)

Over all 1,000 receipts, each part of the arithmetic run on the experts' own values, where they labelled every term:

| part | what it checks | held on | verdict |
|---|---|---|---|
| A | the line items add up to the subtotal | 595 of 656 (90.7%) | **HELD**, kept in the check |
| B | subtotal + tax + service − discount = total | 619 of 650 (95.2%) | **HELD**, kept in the check |
| C | cash − change = total | 518 of 535 (96.8%) | **HELD**, kept in the check |

The bar was 80%. The receipts where a part fails on the experts' own values stay in the count; they are why the check
flags a receipt for a person and never corrects an amount.

## Night 0, what happened

- **The local 7B sat out.** At build time the shared qwen2.5:7b was busy with another session's job
  (`tools/run-multiplier.mjs`), and this build never runs a second 7B job beside one. So night 0 ran the free tiers alone
  (`--no-7b`), and the record says so. The 7B's first night for this library is the 03:00 run on 2026-11-11.
- **55 proposals, 0 kept, 55 dropped**, every drop with its reason: 40 met fewer than 5 amounts in the 40 unseen
  receipts; 8 did only as well as ctrl-F on the held-out receipts (`beats the cheap baseline by 0.000`: the English
  label words TAX, CASH, CHANGE and SUB restate the cheap method); 2 were right on fewer than 80% of the amounts they
  fired on (`total`, `subtotal`); 2 (`pb1 ⇒ tax`, right on 3 of the 4 receipts it decided) were right on fewer than 80%
  of the receipts; 3 failed the final exam.
- **On the 100 measuring receipts:** coverage 0.0% (nothing answered of 800 questions); the check ran on none of them
  (100 unchecked).
- **The paid tier:** no call. It had no candidate (the 7B did not run), and it is off until Simon switches it on.

## The claims

| claim | verdict | from |
|---|---|---|
| P1 only fresh-exam winners kept; drops logged | **HELD** on night 0 (0 kept; 55 dropped with reasons) | `nights/cycle-0.json` |
| P2 the paid tier last; the day cap never exceeded | **NO CALL YET** (the tier is off) | the subscription ledger is empty |
| P3 how each was built; spend per library falls | records **HELD** (0 of 0); the fall **PENDING** | `state.json` |
| P4 coverage climbs night over night | **PENDING** (night 0 measured: 0.0%) | decided from 2026-11-11 |
| P5 nothing outward at night; every pattern gated; the model only proposes | **HELD** by the source scans (CI) | `test/scan.test.mjs` |
| F1 each night's library beats ctrl-F on that night's fresh final exam | **UNDECIDED** (nothing carried in) | `nights/cycle-0.json` |
| F2 right ≥ 90% where it answers on the meter | **UNDECIDED** (nothing answered yet) | `summary.json` |
| F3 every night re-derives byte for byte | **HELD** (local and CI) | CI |
| F4 licence and credit | **HELD** (CORD v2, NAVER CLOVA, CC BY 4.0: NOTICE, README, the page) | |
| R0 each part holds on ≥ 80% of the experts' receipts | **HELD** (A, B, C all kept) | `nights/cycle-0.json` (`r0`) |
| R1 the check is arithmetic; never changes an answer; no model | **HELD** (tests; the kernel holds no clock, disk, network or process) | `test/finance.test.mjs`, `test/scan.test.mjs` |
| R2 reconciled means right (≥ 95%, over ≥ 10) | **UNDECIDED** (0 reconciled) | `summary.json` |
| R3 flagged means look (≥ half, over ≥ 5) | **UNDECIDED** (0 receipts with a wrong amount) | `summary.json` |
| B1 a how-it-was-built record the same night | **HELD** (0 of 0) | `state.json` |
| N3 inside the same night, after library 1, 3 + 3 local-7B calls, one clock | **WIRED**; the first scheduled night is 2026-11-11 03:00 | `night/patlibs-night.mjs` |

Witness v0.6, uncapped, nothing baselined: finance 93/93 (new), cycle 66/66 (one cycle per library now: `cycleFor`),
night 41/41 (`nightOf`), value 27/27 (`keying` added); extract 99/99, build 37/37, oauth 26/26 unchanged and re-run.
Library 1's night 0 still re-derives byte for byte.

## Landed or not

By the seal's own rule, **library 2 (finance / receipts) is RUNNING, not landed**: built, gated, live and run every
night, with **no proven pattern yet** after night 0. F1, F2, P4, R2 and R3 are decided on the nights that follow, P2 and P3
only once Simon switches the paid tier on. R0 is decided (held).

## Disclosures: what changed after seal 2, before night 0 was read (and which way it moves the bar)

1. **The experts' words for a field are its value words.** CORD marks each word with `is_key`: the label words (TOTAL,
   CASH, or the rate `10.00 %` printed beside a tax) are the key, not the value. "A word the experts gave that label" is
   read as the value words only. Stricter: a printed rate never counts as the tax.
2. **"A receipt that prints decimals" is read per part**, from the amounts that part uses, so a tax rate printed as
   `10.00 %` does not switch a whole-rupiah receipt to the 0.05 tolerance. Neutral: it makes the rule do what the seal means.
3. **An amount never crosses a line**: the optional space after a currency mark or a minus sign is a space or a tab, not
   a line break. Found on a synthetic test sentence, before any read. Neutral.
4. **Night 0 ran without the 7B** (above). It makes night 0 weaker, not easier.
5. **The night runner can run one library** (`--only=finance`), so this build-time night 0 did not spend library 1's
   night 1, which stays the 03:00 run. No gate or bar is touched.
6. **The runner cuts the 7B reason at 200 characters**, and night 0's reason was cut mid-sentence. The record is kept as
   written; the page marks where it was cut.

---

# Seal 4 · a flaw in the exam order, found and fixed (2026-11-11)

Library 3's first routing night kept `visa ⇒ visa-or-mastercard` after it was right on 16 of 16 held-out and 15 of 15
final-exam queries, yet it answered none of the 1,000 measuring queries: the meter held no query of that intent. The
order every library cuts its slices from (FNV-1a of salt + id, seal 1) does not shuffle ids that are consecutive row
numbers. Measured on the ids alone: routing's meter held 47 of the 77 intents and every exam batch 46 to 52; the receipt
meter came from 8 of CORD's 20 blocks of 50 rows; library 1 (contract titles) was not affected. Simon chose the fix in
chat, and seal 4 (`3f9b024`) was committed alone before any night under it: libraries 2 and 3 order by SHA-256 of salt +
id, which puts all 77 intents in every routing slice. No bar moved.

**What it voids.** Six nights ran under the old order: night 0 of libraries 2 and 3 at build time, and their night 1,
which the scheduled 03:00 night ran at 03:14 (the runner already carried library 3), before seal 4 existed. All six are
kept as written in `data/<library>/void/`, re-derived in CI under the old order, and counted toward nothing; the
library 2 results above (its night 0) are therefore void. The patterns they kept (finance 2, routing 20) did not carry
over. Libraries 2 and 3 started again from empty with a fresh night 0 under the new order, on the free tiers, like the
void night 0s.

**Disclosure.** Seal 4's commit was amended once before it was pushed: as first written it counted three void nights;
the three 03:14 night 1s were found after it was committed and the seal was corrected to six. Nothing else changed.

## Library 1, night 1 (the scheduled 03:00 night, 2026-11-11 03:14; not affected by seal 4)

- 114 proposals, **2 kept**, both from the free miners: `governed ⇒ governing law` and `renew ⇒ renewal term`.
- **The local 7B's first night**: 3 calls. `party` and `liability-cap` answered with 9 rules, none of which passed
  (`corporation ⇒ party` only tied the baseline; `inc ⇒ party` was right 41 of 61); the `notice-period` call failed
  ("no first token in 600s", the shared model) and is recorded as an error. Those two open tasks are the credit tier's
  candidates; the tier is off, so no call.
- **Coverage on the measuring contracts 2.9% → 4.8%**, right 96.4% when it answers: P4 HOLDING (it rose on the night
  that kept patterns). X1: **INSUFFICIENT** (the library as carried in answered 12 final-exam cases, all right, against the
  cheap method's 6; the agreement needs 20). It re-derives byte for byte, the 7B's replies replayed from the record.

## Library 2, fresh night 0 under seal 4's order (2026-11-11)

53 proposals, **0 kept**: 37 met fewer than 5 amounts in the 40 unseen receipts, 11 only tied ctrl-F (`beats the cheap
baseline by 0.000`), 2 were right on fewer than 80% of amounts, 2 on fewer than 80% of receipts, 1 failed the final
exam. Coverage 0.0%; the check ran on none of the 100 measuring receipts. R0 is unchanged (it reads all 1,000 receipts,
in any order). Library 2 is **RUNNING, not landed**, with no proven pattern yet.

---

# Results · library 3 (triage and routing), night 0 under seal 4's order (2026-11-11)

Sealed first in SEAL 3 (`d6a9001`). Data: Banking77 and NLU++ (PolyAI, CC BY 4.0) at commit 57ec275, 45 files,
1,925,654 bytes, manifest sha256 `d014c397…`; the committed fetch tool reproduces it, and CI fetches and checks it.
Library 3 runs on the free proposers only (N4).

## Routing (Banking77)

- **396 proposals, 20 kept, 376 dropped**: 265 met fewer than 5 unseen queries, 73 were right less than 80% of the
  time, 17 were duplicates and 2 near-duplicates of kept patterns, 14 failed the final exam, 5 only tied the keyword
  router. The 20 route 16 of the 77 teams (for example `unblock ⇒ pin blocked`, `passcode ⇒ passcode forgotten`,
  `duplicate ⇒ transaction charged twice`, `countries ⇒ country support`).
- **T5, the router on the 1,000 measuring queries:** it routed 117 (11.7%), 105 to the right team (89.7%), with 1
  conflict. The keyword router, on the same queries: 185 routed (18.5%), 139 right (75.1%).
- **T2 HELD on this night**: right 89.8% where it answers (106 of 118 (query, team) answers, the one conflict counted on
  both teams), against a bar of 80%.

## Triage (NLU++)

- **10 proposals, 0 kept**: 5 met fewer than 5 unseen queries (the two flags are each on under 3% of queries), 3 were
  right less than 80% of the time, 2 only tied ctrl-F. No flag is raised yet.

## The claims

| claim | verdict | from |
|---|---|---|
| P1 only fresh-exam winners kept; drops logged | **HELD** (routing 20 kept, 376 dropped; triage 0 kept, 10 dropped) | `nights/cycle-0.json` |
| P2 the paid tier last; the day cap never exceeded | **NO CALL, by construction** (no 7B call, so no candidate) | N4 |
| P3 how each was built; spend falls | records **HELD** (20 of 20); the fall cannot arise (no paid tier) | `state.json` |
| P4 coverage climbs night over night | **PENDING** (night 0 measured) | from 2026-11-12 03:00 |
| P5 nothing outward at night | **HELD** by the source scans | CI |
| T1 beats the cheap method on each night's fresh final exam | **UNDECIDED** (nothing carried in) | `nights/cycle-0.json` |
| T2 right ≥ 80% where it answers | routing **HELD** (89.8%); triage **UNDECIDED** (nothing answered) | `summary.json` |
| T3 re-derives byte for byte | **HELD** (local and CI, live and void nights) | CI |
| T4 licence and credit | **HELD** (PolyAI, CC BY 4.0; both papers cited) | NOTICE, README, the page |
| T5 the router measured whole every night | **HELD** (all six counts in the record, re-derived) | `nights/cycle-0.json` |
| N4 inside the same night, free tiers only, one clock | **WIRED** and ran at 03:14 (a night now void) | `night/patlibs-night.mjs` |

Witness v0.6, uncapped, nothing baselined: **triage 31/31** (new), cycle 69/69 (the SHA-256 order), night 44/44 (a
check per library), finance 93/93; extract 99/99, build 37/37, oauth 26/26, value 27/27 unchanged.

## Landed or not

**Library 3 is RUNNING, not landed**: built, gated, live and run every night; routing has 20 proven patterns, triage
none yet. T1 and P4 are decided on the nights that follow.

## Disclosures

1. **Two parts, two libraries in the night.** Routing and triage have separate schedules and records (`route`, `triage`),
   as seal 3 describes; the page shows them as one library.
2. **The keyword router reads every word; the patterns read the first 40**, as sealed. Banking77 queries are short (58
   characters on average), so the cut rarely bites.
3. **The router's precision on the generic meter counts a conflict once per team it fired on** (106 of 118); the
   router's own count (105 of 117) counts each query once. Both are in the record.
