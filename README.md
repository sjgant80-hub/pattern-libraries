# Pattern Libraries

**Live: https://sjgant80-hub.github.io/pattern-libraries/**

A contract reader that grows every night on real contracts and has to prove every pattern it learns. Paste a contract
and it reads it for the dates, the parties, the governing law, the renewal and notice terms, the liability cap and minimum
commitment, and flags ten kinds of clause. Each answer names the pattern that found it. When no proven pattern fires,
it says **unknown** instead of guessing. It answers only what it has proven; the live page shows how much that is tonight.

## How a pattern gets in

A pattern is one or two words near a candidate: `WHEN governed THEN governing-law`. Each night:

1. **Free proposers first**: the recipe lookup (words that worked for a sibling question) and three counting miners (the most precise words, the most-used words still right 4 times in 5, and pairs).
2. **The local 7B** (qwen2.5:7b through Ollama on the same machine), only for questions the free tiers kept nothing for.
3. **The paid tier last**: the owner's Claude subscription through the official CLI, behind a wall (a day cap and a stop,
   reserved on disk before each call), and **off until the owner switches it on**.
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
```

`rederive.mjs` replays every committed night from the public contracts and the recorded model replies and fails on any
difference. CI does this on every push, plus the witness mutation gate (v0.6, pinned) on every kernel.

| kernel | what it is | witness v0.6 |
|---|---|---|
| `src/extract.mjs` | scanners, units, the cheap method, the answer | see `data/witness.json` |
| `src/cycle.mjs` | the fresh exam, the field gate, the meter, the signed exam, miners, recipes | 〃 |
| `src/night.mjs` | one night, cheapest tier first; its replay | 〃 |
| `src/build.mjs` | how each pattern was built; Kar's build checks | 〃 |
| `src/oauth.mjs` + `tools/oauth-ask.mjs` | the paid tier's rules and its one wire | 〃 |
| `src/value.mjs` | what it is worth to a buyer, from sourced figures | 〃 |

The night itself runs on Kar's laptop at 03:00 (`night/patlibs-night.mjs`, mirrored here; it talks only to the local
model) followed by the separate credit step (`night/patlibs-teach.mjs`, through the wire).

## Data

CUAD v1, the Contract Understanding Atticus Dataset, by The Atticus Project, CC BY 4.0 (Zenodo record 4595826):
510 contracts from SEC EDGAR, marked up by trained reviewers. No contract text is committed here; the patterns and
records in `data/` are derived from it and shared under the same terms. See [NOTICE](NOTICE).

Powered by the Konomi architecture, created by Thomas Frumkin. Code MIT.
