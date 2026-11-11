# Pattern Libraries

**Live: https://sjgant80-hub.github.io/pattern-libraries/**

Readers that grow every night on real documents and have to prove every pattern they learn. **Library 1** reads
contracts; **library 2** reads receipts and checks them by arithmetic. Paste a contract
and it reads it for the dates, the parties, the governing law, the renewal and notice terms, the liability cap and minimum
commitment, and flags ten kinds of clause. Each answer names the pattern that found it. When no proven pattern fires,
it says **unknown** instead of guessing. It answers only what it has proven; the live page shows how much that is tonight.

**Library 2, receipts (finance / accounting).** Paste a receipt's text and it reads the line items, subtotal, tax, service
charge, discount, total, cash and change, then checks its own answers: the items add up to the subtotal; subtotal plus
tax plus service, less discount, is the total; cash less change is the total. A receipt is **reconciled**, **flagged**
(look at it) or **unchecked**. Learned on CORD v2 (1,000 real Indonesian receipts, NAVER CLOVA, CC BY 4.0); its bars
were sealed first in [CLAIMS.md](CLAIMS.md) (seal 2), and the check itself was tested on the experts' own receipts
before it was trusted. CORD has no dates, suppliers or payment terms, so this library does not read them.

**Library 3, triage and routing (customer messages).** Paste a customer message and it routes it to one of 77 banking
teams (naming any other team that also matched) and flags it when the customer wants a human or something was lost or
stolen. Learned on Banking77 and NLU++ (16,163 real messages, PolyAI, CC BY 4.0); sealed first in seal 3. It runs on the
free proposers only.

**Seal 4, a flaw fixed in the open.** The exam order (FNV-1a of salt + id) did not shuffle row-numbered ids, so libraries
2 and 3 now order by SHA-256; the nights run under the old order are kept in `void/`, re-derived, and counted toward
nothing. Library 1 was not affected.

## How a pattern gets in

A pattern is one or two words near a candidate: `WHEN governed THEN governing-law`. Each night:

1. **Free proposers first**: the recipe lookup (words that worked for a sibling question) and three counting miners (the most precise words, the most-used words still right 4 times in 5, and pairs).
2. **The local 7B** (qwen2.5:7b through Ollama on the same machine), only for questions the free tiers kept nothing for.
3. **The paid tier last**: the owner's Claude subscription through the official CLI, behind a wall (a day cap and a stop,
   reserved on disk before each call), and **off until the owner switches it on**.
   The same wire serves a second job since 2026-11-11: **sandbox**, Kar's own builds. It too may be called only after the
   local 7B has tried that experiment and nothing it wrote passed the gate; the model gets no tools, and every kernel it
   writes goes through the same mutation gate.
4. **Two gates**: Kar's pattern law (`vendor/patlib`, reused byte for byte) on candidates in contracts the proposers never
   saw, then a field gate on whole contracts against a cheap method (the first date, the first jurisdiction, ctrl-F for
   the clause's word). Both again on a second batch nobody has looked at.
5. **A fresh exam every night**: 60 contracts only measure, 150 seed the training set, and 15 batches of 20 are each an
   exam exactly once.
6. Winners are kept with a receipt; losers are dropped with the reason; how each winner was built goes into the
   build-pattern library, so the next night tries it first.

Every bar was sealed before any code: [CLAIMS.md](CLAIMS.md).

## Re-run it

```bash
npm test
node tools/rederive.mjs path/to/CUADv1.json
pip install pyarrow && python -I tools/cord_fetch.py cord.jsonl   # library 2's receipts: text and labels only, ~1.9 MB over the wire
node tools/rederive.mjs path/to/CUADv1.json --cord cord.jsonl
node tools/polyai_fetch.mjs polyai   # library 3: Banking77 + NLU++ at a pinned commit, ~1.9 MB
node tools/rederive.mjs path/to/CUADv1.json --cord cord.jsonl --polyai polyai
```

`rederive.mjs` replays every committed night from the public contracts and the recorded model replies and fails on any
difference. CI does this on every push, plus the witness mutation gate (v0.6, pinned) on every kernel.

| kernel | what it is | witness v0.6 |
|---|---|---|
| `src/extract.mjs` | scanners, units, the cheap method, the answer | see `data/witness.json` |
| `src/triage.mjs` | library 3: 77 routes and 2 flags, the keyword router and ctrl-F, the router and its whole measure | 〃 |
| `src/finance.mjs` | library 2: the amount scanner, units, ctrl-F, the answer, the three-part check and its own test (R0) | 〃 |
| `src/cycle.mjs` | the fresh exam, the field gate, the meter, the signed exam, miners, recipes; one cycle per library | 〃 |
| `src/night.mjs` | one night, cheapest tier first; its replay | 〃 |
| `src/build.mjs` | how each pattern was built; Kar's build checks | 〃 |
| `src/oauth.mjs` + `tools/oauth-ask.mjs` | the paid tier's rules and its one wire | 〃 |
| `src/value.mjs` | what it is worth to a buyer, from sourced figures | 〃 |

The night itself runs on Kar's laptop at 03:00 (`night/patlibs-night.mjs`, mirrored here; it talks only to the local
model) followed by the separate credit step (`night/patlibs-teach.mjs`, through the wire).

## Data

CUAD v1, the Contract Understanding Atticus Dataset, by The Atticus Project, CC BY 4.0 (Zenodo record 4595826):
510 contracts from SEC EDGAR, marked up by trained reviewers. No contract text is committed here; the patterns and
records in `data/doc/` are derived from it and shared under the same terms.

CORD v2, the Consolidated Receipt Dataset, by NAVER CLOVA (Park et al., 2019), CC BY 4.0: 1,000 Indonesian receipts.
Only the `ground_truth` column is read (by `tools/cord_fetch.py`, HTTP range requests at a pinned revision); no image and
no receipt text is committed here; the records in `data/finance/` are derived from it under the same terms.

Banking77 and NLU++ by PolyAI (Casanueva et al., 2020 and 2022), CC BY 4.0: 13,083 and 3,080 customer messages, read
by `tools/polyai_fetch.mjs` at a pinned commit; no message is committed here; the records in `data/route/` and
`data/triage/` are derived from them under the same terms. See [NOTICE](NOTICE).

Powered by the Konomi architecture, created by Thomas Frumkin. Code MIT.
