# Buyer walk, first pass (local qwen2.5:7b), 2026-11-10T04:37:02.447Z

Five personas read the page cold: its words and the figures it fills in from the records. The frontier read comes after this pass. Every item is answered on the page or in RESULTS.md.

## a finance director at a mid-size company

- "When no proven pattern fits, it says unknown instead of guessing." This implies the tool is conservative but does not clarify the frequency or impact of "unknown" responses.

- "The paid tier is walled (see the credit wall): last resort, capped, ledgered, off unless switched on." This suggests the paid tier is not always available, which could be a significant risk for ongoing operations.

- "The paid tier is a frontier model reached through the owner's own Claude subscription, through the official command-line tool." This statement is vague and does not provide clear pricing or usage details.

- "The paid tier: off; 0 calls." This indicates the paid tier is currently inactive, which could be concerning for potential buyers.

- "The defaults are figures from the CUAD paper itself; replace them with yours." This suggests the provided numbers are not tailored to the specific user's needs, which could lead to inaccurate cost estimates.

- "The case for the board" section does not provide concrete evidence or performance metrics for the tool's accuracy or reliability beyond the initial night's results.

## a head of IT security

- "It learns every night, on this laptop, from 510 real commercial contracts." This implies continuous learning, but the page does not clarify how this affects the paid tier or the owner's data privacy.

- "Everything else is thrown away, and the reason is written down." The page does not specify what "everything else" is, making it unclear what data might be discarded.

- "The paid tier is walled (see the credit wall): last resort, capped, ledgered, off unless switched on." This suggests limitations, but the page does not explain the exact conditions under which the paid tier would be activated.

- "The paid tier is a frontier model reached through the owner's own Claude subscription, through the official command-line tool." The page does not clarify how the Claude subscription integrates with the paid tier or the specific costs involved.

- "The paid tier: off; 0 calls." This indicates the paid tier is currently inactive, but the page does not explain why or provide a timeline for activation.

- "The paid tier is the last resort, capped per day, off until the owner switches it on." The page does not provide details on the daily cap or the process for switching the tier on.

## a general counsel

ERROR: fetch failed

## the owner of a 20-person firm with no IT staff

- "It learns every night, on this laptop, from 510 real commercial contracts." This implies continuous learning, but it's unclear how this will be managed without IT staff.

- "A new pattern is kept only if it beats a cheap method on contracts it has never seen, and then passes a second exam on contracts nobody has looked at." The criteria for pattern retention are complex and not fully explained, which could be confusing.

- "Last night, traced shows the real night: how many patterns were proposed, by whom (a free word-counting miner, or the local AI model), which were kept, and why every other one was thrown out." The term "traced" is used without context, making it unclear what this feature displays.

- "The credit wall shows the paid tier: the last resort, capped per day, off until the owner switches it on." The paid tier is described but the current status is unclear, as it says "off until the owner switches it on."

- "The paid tier is walled (see the credit wall): last resort, capped, ledgered, off unless switched on." This sentence is repetitive and confusing, as it refers back to itself without providing clear information.

- "The paid tier is a frontier model reached through the owner's own Claude subscription, through the official command-line tool." The specific steps to activate the paid tier are not clearly outlined, making it difficult to understand how to proceed.

## a procurement lead comparing it with contract-AI vendors

- "When no proven pattern fits, it says unknown instead of guessing." This statement does not clarify how the "unknown" responses are handled in a real-world deployment scenario.
- "The paid tier is walled (see the credit wall): last resort, capped, ledgered, off unless switched on." The exact cost structure and how the cap is enforced are not clearly defined.
- "The method. Grow the rules, but let nothing in unproven. Each night, cheap proposers (counting miners, the recipes of past winners) and then a local model propose short rules; deterministic code tests each one on contracts the proposers never saw, against a cheap method, by margins written down before any code existed, and then again on a second set nobody has looked at." The specific details of the "cheap method" and the "second set nobody has looked at" are not provided.
- "Night 0 (2026-11-10): 2 proven patterns; 2 kept, 81 dropped." The performance metrics are based on a single night, and there is no information on the consistency or improvement over time.
- "The paid tier: off; 0 calls." There is no information on the cost or usage of the paid tier, and the current state of the paid tier is unclear.
- "The case for the board" section mentions that the method is sealed, but there are no specific claims or evidence provided to support the assertions made.

## What was changed on the page because of this walk

- **The paid tier read as something the buyer pays for and runs** (finance director, IT security, owner, procurement). The
  credit-wall section now opens with "This is on the builder's side, not yours": reading a contract never calls any model
  and costs nothing; the paid tier only proposes patterns while the library is grown, through the library keeper's own
  subscription. The security list says "Your reading never touches a paid model". "The owner" is now "the keeper" throughout.
- **How often "unknown" comes back, and what happens then** (finance director, procurement). The "Today" line now gives
  the share answered on the measuring contracts, from the record, and says unknown questions go to reviewers or a model
  exactly as today.
- **Only one night of evidence** (finance director, procurement). The board case now says how many nights the evidence
  covers, from the record, and that the record over time builds up on the page.
- **"Everything else is thrown away"** (IT security): now "every other proposed pattern"; and the hero says reading never
  calls a model.
- **No IT staff** (owner of a 20-person firm): week 1 now says there is nothing to install; the nightly learning runs on
  the builder's machine.
- **"Last night, traced"** (owner): renamed "Last night, step by step".
- **Not changed:** "the defaults are not tailored to me" (finance director): they are sourced defaults on purpose, and
  every one is an input the reader replaces. The general counsel's call failed (`fetch failed`, the model was shared with
  two other jobs) and is kept here as an error; the legal points were covered by the frontier read (not legal advice;
  each answer points at its sentence; unknown is not a guess).
