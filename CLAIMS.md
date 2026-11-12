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

---

# SEAL 3 · library 3, TRIAGE AND ROUTING, written before its code (2026-11-10)

Seals 1 and 2 above are unchanged, byte for byte. Simon's P1-P5 bind this library as they bind every library. This
seal adds the bars for library 3 and its place in the night. A claim that misses its bar is kept and published as
failed. Nothing here is relaxed after a result is seen.

## Data

Both sources come from one repository, **github.com/PolyAI-LDN/task-specific-datasets**, pinned at commit
`57ec275d8078af65b7731c2a98be812d844a6d6b`, licence **CC BY 4.0** (its LICENSE file; the Hugging Face card of
PolyAI/banking77 says the same). Simon approved the download in this session's chat.

- **Banking77** (Casanueva, Temčinas, Gerz, Henderson and Vulić, 2020, "Efficient Intent Detection with Dual Sentence
  Encoders"): 13,083 online banking customer queries, each labelled with one of 77 intents (files `banking_data/train.csv`,
  `test.csv`, `categories.json`). Its makers describe it as "online banking queries annotated with their corresponding
  intents".
- **NLU++** (Casanueva, Vulić, Spithourakis and Budzianowski, 2022): 3,080 banking and hotel queries, each with the
  experts' list of intent modules (`nlupp/data/{banking,hotels}/fold0-19.json`, `ontology.json`). Two of its modules are
  triage questions: `handoff` ("is the intent to speak to a human or hand off?", 83 queries) and `lost_stolen` ("is the
  intent asking about something being lost or stolen?", 81 queries).
- The 45 files fetched (the two datasets and the LICENSE; 1,925,654 bytes) hash, as sorted "path sha256" lines, to the
  manifest sha256 `d014c397bfa65560859b7856a4f855fbd738f6e49c71640b7219e3ab5f9549e5`. A committed tool fetches them at the
  pinned commit and checks that hash; CI does the same before it re-derives any night. This repository commits no query.

## What it reads (two parts, each a library of its own in the night)

**3a, ROUTING (Banking77).** A query is a document. Each of the 77 intents is a route, its task id the intent name in
lower case with every run of other characters turned into one `-` and none at either end (`Refund_not_showing_up` is
`refund-not-showing-up`, `reverted_card_payment?` is `reverted-card-payment`). For each route the query is one unit,
right when the experts' intent is that route. A query's words are the law's own tokens of its text (`tokensOf`), the
first 40. **The router**: the first kept route pattern, in the order the library kept them, that fires on the query; the
answer also names every other route whose pattern fired (a conflict, said, never hidden); otherwise **unknown**.

**3b, TRIAGE (NLU++).** A query is a document with two flags: `handoff` (wants a human) and `lost-stolen` (something lost
or stolen). For each flag the query is one unit, right when the experts' list holds that module. A flag is raised when a
kept pattern for it fires; a query with no flag raised is left to the normal queue, never called safe.

**The cheap baseline each must beat** (fixed here):
- a route: **the keyword router**, the query holds every word of the route's own name (the law's tokens of the intent
  name: `card_arrival` needs `card` and `arrival`; `card_not_working` needs `card` and `working`). On the meter, the
  keyword router's answer for a query is the first route, in the order of `categories.json`, whose name words it holds.
- `handoff`: ctrl-F for `human`; `lost-stolen`: ctrl-F for `lost` or `stol` (lower case, anywhere in the text).

**The fresh exam per cycle** (one fixed order each, FNV-1a of salt + id; cycle n gates on batch 2n held-out and 2n+1
final, never seen before; a batch is an exam once, then only training; when the batches run out the library says it needs
fresh data and stops promoting). The sizes are set so that a pattern firing on about half of a label's queries can reach
the law's cover of 5 in one night's exam (finance's night 0 lesson):
- routing: id `b77-<split>-<row>` (row: five digits, file order), salt `banking77:`: METER 1,000, seed 3,000, batches of
  1,000 (nine; the 83 left over only ever train). Four nights.
- triage: id `nlu-<domain>-f<fold>-<index>` (index: three digits, file order), salt `nlupp:`: METER 500, seed 580,
  batches of 500 (four). Two nights.

**The two gates**: the law's gate unchanged (vendor/patlib) on the cycle's units, then the field gate with library 1's
numbers (on the held-out queries where a pattern fires: right on at least 80%, beating the cheap baseline's rightness on
those same queries by at least 0.10, over at least 3 queries; the same on the final exam).

## Claims for library 3

- **T1** — each night, the library as carried in beats the cheap baseline on the cases it answers on that night's fresh
  final exam, judged and signed by the baseline agreement (rate, higher, minimum improvement 0.10, z 1.96, at least 20
  answered cases; fewer is INSUFFICIENT, never a pass), for routing and for triage apart. Night 0 cannot decide it.
- **T2** — it abstains rather than guesses: on each METER, wherever it answers (a route, or a flag raised), it is right at
  least **80%** of the time.
- **T3** — every night re-derives byte for byte from the pinned files and the recorded proposals (CI re-runs it).
- **T4** — the sources carry their licence and attribution: the page and NOTICE credit PolyAI (CC BY 4.0) and cite both
  papers.
- **T5** — the router is measured whole, against the keyword router: each night records, on the routing METER, how many
  queries it routed, how many right, how many with a conflict, and the keyword router's routed and right on the same
  queries. *Bar:* every night's record holds all six counts, re-derived in CI.
- **N4** — library 3 runs inside the same night process, after library 2, within the one 25-minute clock, on the **free
  tiers only**: N1's six local-7B calls stay with libraries 1 and 2 (three each), so library 3 makes no model call, and
  because a credit-tier candidate needs the local 7B to have tried, it has none either (P2 holds by construction). Its
  records live in their own folders, and the morning block carries its line.

Library 3 is reported **landed** only under seal 1's definition. Until then it is **running** or **not landed**.

---

# SEAL 4 · the exam order for row-numbered ids, written before any night under it (2026-11-11)

Seals 1, 2 and 3 above are unchanged, byte for byte. This seal changes ONE sealed procedure, after results were read,
so it says what was found, what changes, what does not, and which way it moves the bars. Simon approved it in chat.

## What was found

Every library puts its documents in one fixed order by **FNV-1a of salt + id** (seal 1), then cuts the meter, the seed
and the exam batches from that order. For ids that are **consecutive row numbers** (`train-000`…, `b77-train-00000`…,
`nlu-banking-f0-000`…), that order does not shuffle: neighbouring rows stay in long runs. It was found on library 3's
routing night 0, where `visa ⇒ visa-or-mastercard` passed both exams (16/16, 15/15) yet answered none of the 1,000
measuring queries, because the meter held **no** query of that intent. Measured on the ids alone:

- **Library 3, routing** (Banking77 is stored grouped by intent): the meter holds 47 of the 77 intents, and every exam
  batch only 46 to 52, with up to 82 queries of one intent where about 13 are expected; the meter draws on 81 of the file's
  50-row blocks where a shuffle gives about 256.
- **Library 2, receipts**: the 100 measuring receipts come from 8 of CORD's 20 blocks of 50 rows (a shuffle: about 20);
  night 0's held-out batch from 4 (about 17).
- **Library 3, triage**: its two labels were spread evenly over the slices, but its ids are row numbers too.
- **Library 1, contracts**: unaffected. Its ids are contract titles; its meter draws on 20 of 21 blocks of 25 (a shuffle:
  about 19).

## What changes

For **libraries 2 and 3** (finance, routing, triage) the fixed order is **SHA-256 of salt + id** (UTF-8 bytes; the
lowercase hex compared as text; equal hashes, which do not occur, broken by the id's code-point order), using the
vendored SHA-256 (`vendor/mint/vendor/fall-kit/light/sha256.mjs`, already pinned). It was chosen for one property, tested
on the ids alone with no pattern proposed or gated: under it every routing slice holds all 77 intents, and the receipt
meter draws on 20 of 20 blocks. Salts, sizes, slices, bars, gates, baselines and claims are all unchanged.

## What happens to the nights already run

The six nights made under the old order are **void**: each library's night 0 (finance 2026-11-10T21:40:54Z: 0 kept, 55
dropped; routing and triage 2026-11-10T23:16:32Z: 12 kept and 0 kept) and its night 1, which the scheduled 03:00 night
ran at 2026-11-11T03:14:04Z, before this seal was written (finance: 2 kept, with three local-7B calls; routing: 8 more
kept; triage: 0). They are kept and published as they were written, under each library's `void/` folder, re-derived in
CI under the old order to prove they are unchanged, and **not counted** toward any claim. The patterns they kept
(finance 2, routing 20) do not carry over. Libraries 2 and 3 start again from an empty library with a fresh night 0
under the new order, on the same tiers as the void night 0s (the free tiers only), so the two can be compared; library
2's local-7B proposals resume with the next scheduled night. Library 1's night 1 (the same 03:14 run) is unaffected
and counts.

## Which way this moves the bars

It moves no bar. It makes each meter and each exam a fair sample of its data, which can make the results better or
worse; the order was fixed by its mixing alone, before any night under it was run or read. The void nights stay on the
record, including library 3's T2 readings on its void nights (night 0: 23 of 30 routed queries right, 76.7%; night 1:
71 of 82, 86.6%; against a bar of 80%).

---

# SEAL 5 · the catalogue: finding the right pattern fast as the library grows, written before its code (2026-11-12)

Seals 1 to 4 above are unchanged, byte for byte. This seal adds one organ and changes no bar, gate, slice or claim of
libraries 1 to 3.

## What it is, and whose idea it is

Today the router reads the whole library for every message: it asks every kept pattern, in library order, whether it
fires. That is right at 22 patterns and too slow at tens of thousands. **The catalogue** gives every pattern an address
and files it so that, for a job, only the patterns that could fire on it are read, and then the law decides exactly as
before. The design, a Dewey-style address for every item and cross-reference layers between items, is Gary W. Floyd's:
Gary W. Floyd, Lumiea Systems Research Division — ThunderStruck Service LLC, "NEXUS — Distributed Synthetic
Intelligence," 2026 (its library scanner routes every item by a Dewey address; its graph linker links items across nine
cross-reference layers). The build here, for WHEN/THEN patterns, is Kar's.

## How it works (fixed before the code)

- **The law still decides.** The catalogue only chooses which patterns to ask. Every pattern it returns has been asked
  with the vendored law's own `fires()`, so it can never return a pattern the linear scan would not.
- **Filing.** Every valid pattern is filed under exactly ONE of its own words: the word that occurs in the fewest
  training messages of its library (ties broken by the word's code-point order); with no counts given, the word shared
  by the fewest patterns. A pattern fires only when all its words are in the job, so its filing word is in the job, so
  looking up the job's words finds every pattern that can fire. The patterns found are put back in library order.
- **The address.** `<library>.<class>.<words>`: the library's number (contracts 100, receipts 200, routing 300, triage
  400, Kar's own estate map 000), the label's place in that library's fixed list of labels (three digits), and the
  pattern's words in code-point order joined by `+`. The law refuses a duplicate pattern, so an address names one
  pattern; it never depends on library order, so adding patterns never changes an existing pattern's address.
- **Five cross-reference layers**, from the only features a WHEN/THEN pattern has: (1) **words**, a pattern to each of its
  words; (2) **class**, patterns that answer the same label; (3) **shadow**, pattern A shadows a later pattern B when
  A's words are a subset of B's: whenever B fires A fires too and A comes first, so B can never be the answer;
  (4) **fires together**, two patterns that fired on the same training message; (5) **provenance**, patterns kept on
  the same night by the same recipe. Gary's other four layers (vectors, a knowledge graph, time, an ethics layer) have
  no counterpart in a two-word rule and are not built.

## Data for the measurement

Banking77 (PolyAI, CC BY 4.0, the pinned commit of seal 3). The **training messages** (`banking_data/train.csv`) only
grow libraries; the **test messages** (`banking_data/test.csv`, 3,080) are the jobs, and are never used to grow. A
message's words are the router's own: the law's tokens of its text, the first 40.

- **The real library:** library 3's routing library as committed (its kept patterns, in order).
- **Grown libraries:** every one-word and two-word pattern seen in the training messages, each answering the intent it
  most often goes with there (ties: the intent's place in the fixed list), ordered by how many training messages it
  occurs in (most first; ties by the pattern's address). The library of size N is the first N. They are not gated or
  verified: they stand in for the SHAPE of a large library, because finding patterns does not depend on whether they
  are good. Sizes: 22 (the real library's size), 100, 1,000, 10,000, and every candidate the training messages give
  (about 74,000; there are not 100,000).

## Claims for the catalogue

- **K1 · Exact (the +1).** On every test message, for the real library and every grown size: the patterns the catalogue
  says fire are exactly the patterns the linear scan says fire, in the same order. So the router's answer, its pattern,
  its conflicts and its right/wrong, and the law's `answer()`, are identical. Also on every message of library 3's
  routing meter (1,000) through the router itself. Pass: zero differences anywhere. One difference fails it.
- **K2 · Sub-linear.** Patterns asked per message, at each size: median, 95th percentile and largest, against N (the
  linear scan asks all N). Pass: at the largest size, the median asks at most 1% of N. Wall time per message for both
  ways is reported (median of 5 runs, the machine named), not claimed.
- **K3 · Addresses.** Every address is unique within its library; the same library gives the same addresses on any
  machine; and every prefix of a library (as it grew, pattern by pattern) gives its patterns the same addresses as the
  whole library does. Tested on the real library and every grown size.
- **K4 · Shadows.** A pattern the shadow layer marks shadowed is never the first to fire on any message of K1. Reported:
  which patterns of the committed libraries are shadowed.
- **K5 · Fires-together (measured, no target).** Of the test messages where two patterns of different labels fire (the
  router's conflicts), the share whose first two patterns were already linked as "fired together" on the training
  messages.
- **K6 · Wired in place.** The router (`route`, `routeOn`) and the extractor's `pick` take a catalogue and use it; every
  committed night of every library still re-derives byte for byte.
- **K7 · Gated.** The catalogue's kernel and every kernel it changes pass witness v0.6 with every mutant run and nothing
  baselined; its functions never throw on garbage (fuzz).
- **K8 · Re-derived in the tab.** The page downloads the two Banking77 files from PolyAI's repository at the pinned commit
  (about 1.1 MB), refuses them unless their SHA-256 is pinned below, and re-runs K1 and K2 in the visitor's browser.
  This repository still commits no message.
  - `banking_data/train.csv` b06e26ac675513959a63135f11b94ea7786ed02da65db93a5650d8838cbc664b
  - `banking_data/test.csv` d12d6e3bc4c3103966ae786dc435913c0c563dfa328f5a3646d0e62cfeeb474d

---

# SEAL 6 · the law's three-word shape (2026-11-12, before the law is re-vendored)

Simon, 2026-11-12: "yes give the law a three-word shape". The law (`si-didy/patlib.mjs`) is amended in its own record
first (amendment 1, sealed 8770d67 in the law's backup before its code; code 485c3d1): a rule may hold one, two or
three words, and the 7B's lines may read "WHEN a AND b AND c THEN label". Every bar is unchanged: held cover ≥ 5,
precision ≥ 0.8, margin ≥ 0.2; final cover ≥ 3, precision ≥ 0.8, margin ≥ 0.2; competence; near-duplicates; scoring
twice must agree. The refusal wording is unchanged too, so past records keep their text. Why: measured beforehand on
Banking77 under these same bars, three-word patterns added right answers at the same precision. A one-excluded-word
shape was tested too and is not adopted: it cost precision.

- **S6.1** · `vendor/patlib/patlib.mjs` is re-vendored byte for byte from `si-didy/patlib.mjs` at amendment 1 and
  pinned by its new hash.
- **S6.2** · Every committed night of every library re-derives byte for byte under the amended law (`tools/rederive.mjs`
  in CI), and every claim already decided in this file stands as decided.
- **S6.3** · The catalogue (seal 5) stays exact with three-word patterns: through the catalogue, a library that holds
  them answers exactly as the law answers.
- **S6.4** · Every kernel's gate re-runs clean with the amended law.

Not in this seal: growing three-word patterns into any library here. Every proposer in this repository still
proposes one or two words; using the new shape in a library is its own decision and its own seal.
