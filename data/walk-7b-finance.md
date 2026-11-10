# Buyer walk, first pass (local qwen2.5:7b), 2026-11-10T22:06:46.944Z

Five personas read the page cold: its words and the figures it fills in from the records. The frontier read comes after this pass. Every item is answered on the page or in RESULTS.md.

## a finance director at a mid-size restaurant group

- "The inputs are yours; the example figures are placeholders, not measurements." This sentence implies that the figures shown are not based on real data, which could make the claims about the system's performance seem unreliable.

- "The check on those receipts: 0 reconciled, 0 flagged, 100 unchecked." This suggests that the system has not yet processed any receipts, making it hard to assess its reliability.

- "The check tested on the experts' own receipts (R0): A held on 595 of 656; B held on 619 of 650; C held on 518 of 535 (bar 80%)." The low coverage and precision percentages indicate that the system is not yet accurate enough to be trusted.

- "On the page's sample receipt: the library answers 0 of 8 questions (its check: flagged)." This shows that the system cannot even correctly identify the amounts on a sample receipt, which is a critical flaw.

- "The keying calculator uses the buyer's own inputs (placeholders 500 receipts a month, 2 minutes each, 25 an hour) times the measured coverage and precision: today it shows 0 hours." This suggests that the system is not expected to save any time, which contradicts the claim that it will reduce keying time.

- "Library 2 (receipts), night 0 (2026-11-10): 0 proven patterns; 0 kept, 55 dropped, every drop with its reason." This indicates that the system has not yet processed any receipts, and the reasons for dropping receipts are not clear, raising doubts about the system's functionality.

## an accounts-payable and bookkeeping lead

- "The sample is made up, in the style of the receipts the library learns from: one printed line per row." This implies the sample is not real, which might confuse users about the library's capabilities.

- "A receipt that does not add up is flagged for a person to look at; the check never changes an answer." It is unclear what happens to flagged receipts, and whether they are corrected or re-keyed.

- "Every amount it answers arrives with the line it came from and the pattern that read it, and every receipt it answers in full is either reconciled by the arithmetic or flagged." This statement is confusing as it does not clearly explain the process for receipts that are flagged.

- "The check on those receipts: 0 reconciled, 0 flagged, 100 unchecked." This suggests the check did not perform any validation, which is contradictory to the previous statements about flagged receipts.

- "The keying calculator uses the buyer's own inputs (placeholders 500 receipts a month, 2 minutes each, 25 an hour) times the measured coverage and precision: today it shows 0 hours." This implies zero time savings, which might be confusing given the title of the page.

- "The check tested on the experts' own receipts (R0): A held on 595 of 656; B held on 619 of 650; C held on 518 of 535 (bar 80%); parts kept: A, B, C." The results are confusing as they do not clearly indicate the overall performance or reliability of the library.

## a financial controller who signs off the books

ERROR: fetch failed

## the owner of a small cafe with no bookkeeper

- "The sample is made up, in the style of the receipts the library learns from: one printed line per row." This implies the sample is not real, which might confuse the buyer about the tool's effectiveness.

- "It is read in your browser; nothing is sent anywhere." This could be confusing if the buyer is unsure about the security and privacy of their receipt data.

- "A receipt that does not add up is flagged for a person to look at; the check never changes an answer." This might confuse the buyer about how the tool handles incorrect receipts.

- "The check on those receipts: 0 reconciled, 0 flagged, 100 unchecked." This lack of feedback on the tool's performance could be confusing and raise doubts about its reliability.

- "The keying calculator uses the buyer's own inputs (placeholders 500 receipts a month, 2 minutes each, 25 an hour) times the measured coverage and precision: today it shows 0 hours." This might confuse the buyer about the tool's actual utility and time savings.

- "Parts kept: A, B, C." This claim without further explanation could be confusing, as the buyer might not understand what "parts" refers to or why certain parts are kept.

## a head of IT security

ERROR: fetch failed

## What was changed on the page because of this walk (and the frontier read after it)

- **What happens to a flagged receipt** (bookkeeping lead, cafe owner). The receipt reader now says it plainly: a flagged
  receipt is not corrected and not booked by itself; it goes to whoever keys receipts today, with the failing sum written
  out, so they know where to look.
- **"0 hours saved" reads as a contradiction** (finance director, bookkeeping lead, cafe owner). The calculator now opens
  with "Today this is zero, and the page says so: no pattern has passed both exams yet", read from the record, and the
  figure moves as soon as one does.
- **What "parts A, B, C" are, and what R0 means for reliability** (cafe owner, bookkeeping lead, finance director). The
  reader names each part (items = subtotal, the totals, cash less change), and a new line under the R0 table turns the
  record into what a buyer can use: on receipts whose amounts are all right, how often each part still fails, so a flag
  means "look at this one", not "this one is wrong".
- **The bookkeeping lead quoted "every receipt it answers in full is either reconciled or flagged"**: the frontier read
  had already replaced it before this walk was read (it hid the unchecked case); the finance director card now names all
  three outcomes. The same read fixed "every word labelled" (it is every word CORD kept) and "flagged instead of booked".
- **Security** (cafe owner): the reader links to the security section.
- **Not changed:** "the sample is made up" (two personas): it is, on purpose, and the page says so; "the drop reasons are
  not clear" (finance director): the walk saw only the figures, and the page's drop table lists every reason. The
  finance director's reading of the R0 rates as "low" and of the library's own check as "flagged" are misreadings (the
  record: R0 held at 90.7% to 96.8%; the library's check on the sample is unchecked, ctrl-F's is flagged).
- **Two calls failed** (`fetch failed`: the controller and the head of IT security) when another session reloaded the
  shared 7B with a larger context during the walk. They are kept here as errors and were not re-run beside that job.
