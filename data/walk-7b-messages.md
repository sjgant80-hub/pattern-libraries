# Buyer walk, first pass (local qwen2.5:7b), 2026-11-11T11:41:14.764Z

Five personas read the page cold: its words and the figures it fills in from the records. The frontier read comes after this pass. Every item is answered on the page or in RESULTS.md.

## a head of customer service at a retail bank

- "The sample is made up, in the style of the messages the library learns from. Paste a real one: a chat line or an email to a bank." This suggests the sample is not real, which could be confusing if the user expects to see actual customer messages.

- "Route it Put the sample back" This instruction is unclear and could be confusing, as it does not specify what "Route it" means in the context of the page.

- "The route is the team the first kept routing pattern points to; if patterns for other teams also fired, they are named, never hidden." This could be confusing if the user expects to see only the primary route and not other potential matches.

- "Only the share of messages the router routes, and only the share it routes right, count." This statement might be confusing if the user is unsure how to interpret the metrics or what "right" means in this context.

- "The router on the 1000 measuring messages: 117 routed, 105 to the right team, 1 with a conflict. A keyword router on the same messages: 185 routed, 139 right." These numbers are presented without context or explanation, making it hard to understand the significance or reliability of the router's performance.

- "Library 3 runs on the free proposers only: no local model call and no paid tier." This could be a dead end if the user is interested in the paid tier and its benefits, as it is not mentioned or explained.

## an operations director

- "The sample is made up, in the style of the messages the library learns from. Paste a real one: a chat line or an email to a bank." This sentence is confusing because it suggests that the sample should be real, but the page also states that it is made up.

- "The route is the team the first kept routing pattern points to; if patterns for other teams also fired, they are named, never hidden." This could be confusing as it does not clarify what happens if no patterns fire or if multiple patterns point to different teams.

- "Only the share of messages the router routes, and only the share it routes right, count." This statement is unclear about what "right" means and how it is determined, which could lead to confusion.

- "Every receipt is then marked by the arithmetic: reconciled, flagged (it does not add up), or unchecked (too few amounts answered to check)." This sentence does not explain how the arithmetic is performed or what criteria are used to flag a receipt.

- "The router on the 1000 measuring messages: 117 routed, 105 to the right team, 1 with a conflict. A keyword router on the same messages: 185 routed, 139 right." This comparison is confusing because it does not explain the criteria for what constitutes "right" routing.

- "The sorting calculator uses the buyer's own inputs (placeholders 5000 messages a month, 1 minute each, 25 an hour) times the measured share routed and right." This sentence is unclear about how the inputs are to be used and does not provide a clear example of the calculation.

## a head of risk and compliance

- "Route it Put the sample back" is not clear and could be confusing. It is not immediately obvious what this means or how to proceed.

- "Paste a real one: a chat line or an email to a bank. It is read in your browser; nothing is sent anywhere." This sentence is unclear and could be misleading. It is not clear if the message is being read by the system or just displayed in the browser.

- "Library 3 runs on the free proposers only: no local model call and no paid tier." This statement is vague and does not provide enough detail about the capabilities or limitations of the free tier.

- "Triage night 0: 0 proven patterns; 10 dropped." This sentence does not provide any evidence or explanation for why 10 messages were dropped without a proven pattern.

- "On the page's sample message the route is Pin blocked; the keyword router says nothing; flags raised: none." This sentence does not provide any evidence or context for why the sample message was routed as "Pin blocked" or why the keyword router did not raise any flags.

- "The sorting calculator uses the buyer's own inputs (placeholders 5000 messages a month, 1 minute each, 25 an hour) times the measured share routed and right." This sentence does not provide any evidence or explanation for the accuracy or reliability of the sorting calculator's measurements.

## the owner of a 15-person online shop with a shared inbox

- "The sample is made up, in the style of the messages the library learns from. Paste a real one: a chat line or an email to a bank. It is read in your browser; nothing is sent anywhere." This sentence is confusing because it suggests using a made-up sample, but then asks for a real message, which seems contradictory.

- "Route it Put the sample back" This is unclear and does not provide guidance on what exactly should be routed or how to proceed.

- "Customer messages: routing and triage (library 3)" This heading is confusing as it does not clearly explain what routing and triage entail or how they are related.

- "Only the share of messages the router routes, and only the share it routes right, count." This statement is vague and does not provide clear metrics or criteria for success or failure.

- "The router on the 1000 measuring messages: 117 routed, 105 to the right team, 1 with a conflict. A keyword router on the same messages: 185 routed, 139 right." This comparison is confusing as it does not explain the context or significance of the numbers provided.

- "Its first two nights ran under an exam order that did not shuffle and are kept as void (not counted); it started again from empty." This sentence is unclear and does not provide details on what the exam order was or why the first two nights are void.

## a head of IT security

- "Route it Put the sample back" implies an action that is not clear or necessary.
- "Someone reads every incoming message to decide which team it belongs to" is vague and does not specify who "someone" is.
- "Only the share of messages the router routes, and only the share it routes right, count" is unclear without more context.
- "Only the share of questions the library answers, and only the share it gets right, count: a wrong amount still has to be keyed" lacks a clear explanation of what "questions" refers to.
- "Every receipt is then marked by the arithmetic: reconciled, flagged (it does not add up), or unchecked (too few amounts answered to check)" does not specify who performs the marking.
- "The router on the 1000 measuring messages: 117 routed, 105 to the right team, 1 with a conflict" does not provide the criteria for what constitutes a "conflict."


## What was changed on the page because of this walk (and the frontier read before it)

- **The buttons read as unclear** (four personas): "Route it" is now "Route this message", "Put the sample back" is
  "Bring back the example".
- **"Made up" beside "paste a real one" read as a contradiction** (three personas): the box now says it holds an
  invented example, and how to try a real message instead.
- **What "right" means, and what a conflict is** (operations director, shop owner, head of customer service, IT
  security): the section and the router card now say it: right is the team the dataset's makers labelled the message
  with, scored only on messages it never learned from; a conflict is a message on which patterns for two teams fired;
  and when no pattern fires, the message goes to a person.
- **The router's numbers had no plain reading** (head of customer service, shop owner): the router card adds "of every
  100 messages, it sends N to a team, and about M in 10 of those are right", computed from the record.
- **"Free proposers only" read as vague** (head of customer service, head of risk): the section says what proposes the
  patterns (plain code counting which words go with which team) and that no AI model proposes or reads anything in
  library 3.
- **"Someone reads every message"** (IT security): "Today a person reads every incoming message".
- **Not changed:** "why 10 were dropped" (head of risk): the walk saw only the figures; the page's drop table lists every
  reason. "How the receipt arithmetic is done" (two personas, quoting library 2's card): the receipt section spells out
  the three sums.
- **Before the walk, the frontier read** fixed "arrive in the right queue more often" (nothing measures it against a
  person) and an unclear sentence in the model-cost card.
