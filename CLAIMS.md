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

---

# SEAL 2 · library 2, FINANCE / ACCOUNTING (receipts), written before its code (2026-11-10)

Seal 1 above is unchanged, byte for byte. Simon's P1-P5 bind this library as they bind every library. This seal adds
the bars for library 2, the reconciliation rule, the night's wiring for a second library, and one disclosed change to
library 1's night. A claim that misses its bar is kept and published as failed. Nothing here is relaxed after a result
is seen.

## Data

**CORD v2**, the Consolidated Receipt Dataset (NAVER CLOVA; Park, Shin, Lee, Lee, Surh, Seo and Lee, Document
Intelligence Workshop at NeurIPS 2019), licence **CC BY 4.0**, as stated in two places: the clovaai/cord repository's
README and the Hugging Face dataset card of naver-clova-ix/cord-v2. 1,000 real Indonesian shop and restaurant receipts,
with the experts' labels on every word they kept.

- Pinned at dataset revision `7f0115a4b758a71d6473b8d085751692da2fef98` (the revision is in every URL, so the files
  cannot change under it): six parquet files, with the sha256 Hugging Face lists for each: train 0
  `da3994eee1bf9bd3c57f0d53a72c3a6812c8696c5ba26245987949ddf73483cc`, train 1
  `cce4def16a0d6a6c75f80be712f7494c56c318a8829b712f5c62650155c9e58e`, train 2
  `591e2db8fe8b1d364b054f46e8c375b7f00e72578914ba46a573b6858162cab2`, train 3
  `1ffd9de8d6fbcee7630fd4cdfedff05b9b7fabc0fae4fc17557c5fe7cf178748`, validation
  `0d0f6dac11fdcc549de2746aa9f53136a3bc22a2a1aff2b0b847f7622ad60c15`, test
  `51c65f1788faff392abe2a0b55b023eb23e9be551c509138eaa3a832514224e7`. These whole files (2.31 GB, mostly images) are
  not downloaded, so those hashes name the files; the hash this build checks is the derived file's, below.
- Only the `ground_truth` column is read, by HTTP range requests; the receipt images are never downloaded. The derived
  file `cord-v2-ground-truth.jsonl` (1,000 lines, one per receipt: split, row, ground_truth; 6,198,162 bytes) has
  sha256 `272432829e501edde76ee9457a04c146e4e6e5d7fb40c0c395fc71a93f82c613`. A committed tool regenerates it from the
  pinned files and CI checks that hash before it re-derives any night. This repository commits no receipt text.
- **What CORD does not have.** Its makers removed the store and payment information before publishing (clovaai/cord
  README, 2019-12-12), so the receipts carry **no dates, no supplier names and no payment terms**. No pattern for them
  can be gated on this data, and this library does not claim them; the page says so. A later seal may add a
  licence-checked source that has them. (Kleister Charity, UK charity accounts with report dates, was checked: its
  repository states no licence, so it is not used.)

**A receipt as text.** The experts' words are grouped into rows by their `row_id`, rows run top to bottom (by the
smallest y of their words, then the row_id), words left to right (by the smallest x, then their order in the file),
joined by single spaces, rows by newlines. That text is all the library reads; a stranger's pasted receipt is read the
same way, one printed line per row.

## What it reads

- **Amounts** are found by a deterministic scanner: an optional currency mark (Rp, IDR, £, $, €, USD, GBP, EUR), an
  optional minus or bracket, then digits in groups of three with `.` or `,` between them (with or without two decimals
  after), or digits with exactly two decimals, or three to seven plain digits, or a lone `0`. Its value is kept in
  hundredths, the sign apart. Each amount's words are the words on its own row before it (up to 6) and after it (up to
  3), with all-digit words left out, plus where it sits: `zfirst` and `zlast` (the first and last amount on the
  receipt), `zmax` (the largest), `zend` (the last on its row), `zalone` (the only one on its row), `zneg` (printed
  negative), and `ztop` / `zmid` / `zlow` (its row in the first, middle or last third of the rows).
- **Seven fields**, one value per receipt: `total` (the experts' total.total_price), `subtotal`
  (sub_total.subtotal_price), `tax` (sub_total.tax_price), `service` (sub_total.service_price), `discount`
  (sub_total.discount_price), `cash` (total.cashprice), `change` (total.changeprice). An amount is right for a field
  when its value equals the value of an amount lying inside a word the experts gave that label.
- **Line items**, many per receipt: `item-price` (menu.price). An amount is right when it lies inside a word the experts
  labelled menu.price. The library's line items are every amount on which a kept line-item pattern fires.

**The cheap baseline it must beat** (fixed here): ctrl-F. For a field, the first amount at or after the first row whose
text contains the field's search word (lower case): total `total`, subtotal `sub`, tax `tax`, service `serv`, discount
`disc`, cash `cash`, change `change`; no such row, no answer (counted wrong). For line items, every amount on the rows
above the first row containing `total` (all of them when there is none).

**The fresh exam per cycle.** Receipt id = the source split and row (`train-000` … `test-099`). One fixed order: FNV-1a
of `cord:` + id. The first **100** are the finance METER (never used to propose or to gate); the next **300** are the
seed training set; the other 600 are **15 batches of 40**. Cycle n gates on batch 2n (held-out) and 2n+1 (the final
exam), never seen by an earlier cycle; its training set is the seed plus every batch before 2n. Seven nights, then the
library says plainly that it needs fresh data and stops promoting. No exam is ever re-used.

**The two gates.** The law's gate, unchanged (vendor/patlib), on the cycle's amounts; then the field gate with library
1's numbers: on the held-out receipts where a pattern fires, it must be right on at least 80% of them and beat the cheap
baseline's rightness on those same receipts by at least 0.10, over at least 3 receipts; the same on the final exam. For
a field, "right on a receipt" is its first firing amount being right. For line items, the same bars are taken over the
amounts the pattern picks on those receipts, against the amounts the cheap baseline picks on the same receipts.

**The answer.** For a field, the first amount (top to bottom) on which a kept pattern fires, with the pattern and its
receipt; for line items, every amount a kept pattern fires on; otherwise **unknown**, left for a person or a model. It
never guesses. On the meter a field is right when its answer is right; line items are right only when the amounts
picked are exactly the experts' line items, nothing missed and nothing extra.

## The reconciliation rule (arithmetic over the library's own answers)

Three parts, each run only when every term it needs was answered:

- **A, items:** the line items add up to the subtotal.
- **B, totals:** subtotal + tax + service − discount = total (an unanswered tax, service or discount counts as zero).
- **C, change:** cash − change = total.

A part holds when its two sides differ by at most **100** units on receipts printed in whole units (100 rupiah, the cash
rounding Indonesian receipts use) and at most **0.05** on receipts that print decimals. The receipt is **reconciled**
when at least one part ran and every part that ran holds, **flagged** when a part that ran fails (look at it), and
**unchecked** when no part could run. The check never changes an answer and never calls a model.

## Claims for library 2

- **F1** — each night, the library as carried in beats the cheap baseline on the cases it answers on that night's fresh
  final exam, judged and signed by the baseline agreement (rate, higher, minimum improvement 0.10, z 1.96, at least 20
  answered cases; fewer is INSUFFICIENT, never a pass). Night 0 carries nothing in, so night 0 cannot decide it.
- **F2** — it abstains rather than guesses: on the finance METER, wherever it answers, it is right at least **90%** of
  the time (higher than library 1's 75%, because a wrong amount costs more than a missed one).
- **F3** — every night re-derives byte for byte from the pinned file and the recorded proposals (CI re-runs it).
- **F4** — the source carries its licence and attribution: the page and NOTICE credit CORD (NAVER CLOVA, CC BY 4.0).
- **R0** — the rule is tested on the experts' own answers before it is trusted: over all 1,000 receipts, each part holds
  on at least **80%** of the receipts where the experts labelled every term it needs (the experts' value of a field is
  the value of the scanned amount inside their word; their line items are the amounts inside their menu.price words).
  A part that misses this bar is published as failed and **dropped from the check**: it neither reconciles nor flags.
  (R0 measures a fixed rule on the labels; it proposes and gates nothing, so it spends no exam.)
- **R1** — the check is pure arithmetic: it never changes an answer, never calls a model (tests and the source scan).
- **R2** — reconciled means right: on the METER, of the receipts the check marks reconciled, every amount the check used
  is right in at least **95%**, decided over at least 10 reconciled receipts (fewer is undecided).
- **R3** — flagged means look: on the METER, of the receipts where a part ran and at least one amount it used was
  wrong, the check flags at least **half**, decided over at least 5 such receipts (fewer is undecided).
- **N3** — library 2 runs inside the same night process as library 1, after it, under N1's limits for the two
  together: at most 6 local-7B calls (**3 for each library**) and the one 25-minute clock; its records live apart
  (in their own folder beside library 1's), and the morning block carries its line. Its credit-tier candidates go to
  the same credit step through the same wire, sharing the night's call allowance; the tier stays OFF until Simon
  switches it on.

Library 2 is reported **landed** only under seal 1's definition. Until then it is **running** (built, gated, live,
growing) or **not landed**.

## Disclosed change to library 1 (before its first night with the 7B)

Library 1's night asks the local 7B about at most **3** tasks a night, not 6, from night 1 on (night 0 asked none), so
the two libraries together stay within N1's six calls. It is a proposer budget, never a gate: it makes library 1 grow
more slowly, never more easily. Night 0 still re-derives byte for byte.
