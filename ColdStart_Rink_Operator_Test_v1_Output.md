# ColdStart: The Rink Operator Discovery Test
## Evaluation v1 — Diane Russo's Fairness Audit

**Evaluator Persona:** Diane Russo, 54, GM of Twin Pines Ice Arena — a twin-pad facility in Exton, PA. 11 years running the building. Two kids who played AAA. Knows every rink operator within 60 miles by first name. Board member of the PA Ice Rink Operators Association.

**Test Rinks:** Ice Line (West Chester, PA), IceWorks (Aston Township, PA), Oaks Center Ice (Oaks, PA), plus her own facility (generic rink page)

**Date:** 2026-02-20

---

## Operator Verdict

**Would Diane call her lawyer? Not today. Would she claim her rink? Not yet. But she screenshots the contact email and tells Kevin to keep an eye on it.**

ColdStart makes six decisions that keep Diane from escalating: the "Parents report:" attribution prefix, the UGC disclaimer, the flag button on tips, the contact email in the footer, the claim CTA, and the seeded facility details that show her what operator engagement looks like. These are small things. They add up to something larger: evidence that someone on the ColdStart team thought about the operator side before launching.

But ColdStart also makes four decisions that make Diane's jaw tighten: grading her rink on "Chaos level" (a loaded word for an operator), rating a pro shop she doesn't have, accepting anonymous tips with no verification, and saving her claim form to `localStorage` instead of anywhere real. The gap between the promise ("respond to feedback, get featured, see analytics") and the reality (data goes to the browser's local storage and nowhere else) is the single biggest trust failure from an operator's perspective.

---

## The Scene

It's 2:15 PM on a Tuesday in February. Diane is in the office above Rink B at Twin Pines, working through the weekend tournament schedule. Her assistant manager Kevin walks in with his phone.

"Hey — have you seen this ColdStart thing? Someone in the Lehigh Valley operators group posted it. It's like Yelp for rinks."

He hands her the phone. She's looking at the detail page for a rink she doesn't manage — Ice Line in West Chester, one of her competitors. She sees a rink photo, a verdict, signal bars with numbers, tips from anonymous parents, and a "Manage this rink?" CTA at the bottom.

Her first instinct: find Twin Pines. She scrolls to the top, taps the back arrow, and searches. If Twin Pines is listed — and ColdStart lists any rink with an API entry or seed data match — she's now looking at her own facility being publicly rated by people she's never met, on a platform she's never heard of, with no prior notification.

Diane takes Kevin's phone. She puts on her reading glasses. This is no longer a casual browse — it's a fairness audit.

---

## What Diane Sees (The Operator's Eye)

### The Verdict — First 5 Seconds

The VerdictCard is the first piece of evaluative content on the page. It sits directly below the parent count line, rendered as a `<section>` with `borderRadius: 16`, `padding: '20px 24px'`, and a tinted background computed by `getVerdictBg(summary.verdict)`.

Here's the rendering sequence from `VerdictCard.tsx`:

**Line 1:** `PARENTS REPORT:` — 11px, `fontWeight: 600`, `colors.textTertiary` (`#6b7280`), `textTransform: 'uppercase'`, `letterSpacing: 0.3`. This is visually small but structurally critical. It appears *above* the verdict text, making attribution the first thing the eye hits inside the card.

**Line 2:** The verdict string itself — 18px, `fontWeight: 700`, colored by verdict tier. The three possible strings come from `dbSummary.ts`:
- `overallAvg >= 3.8` → `"Good rink overall"` (green: `colors.success`, `#16a34a`)
- `overallAvg >= 3.0` → `"Mixed reviews"` (amber: `colors.warning`, `#d97706`)
- `overallAvg < 3.0` → `"Heads up — some issues reported"` (red: `colors.error`, `#dc2626`)

**Line 3:** `"X of Y parent ratings above average · From N hockey parents this season · Updated Xd ago"` — 12px, `colors.textTertiary`. The word "parent" now appears twice in this line: "parent ratings" and "hockey parents." This is intentional redundancy — every quantitative claim on the card is attributed to parents.

**Line 4:** The UGC disclaimer — `"Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart."` — 10px, `colors.textMuted` (`#9ca3af`), `margin: '12px 0 0'`. This sits outside the main `<div>` that contains the verdict data, giving it visual separation. It renders unconditionally — even if the rink has no data, the disclaimer appears.

**What Diane processes:** She reads top-down. "PARENTS REPORT:" tells her these aren't ColdStart's grades — they're parent opinions. The verdict string confirms this is an aggregate sentiment. The disclaimer at the bottom is the legal backstop: ColdStart is explicitly distancing itself from the content. Diane's read: "They're saying 'this isn't us, this is what parents told us.' That's Yelp's defense, and it works for them."

**What a lawyer would process:** The "Parents report:" prefix and the UGC disclaimer together create a defensible Section 230 posture. ColdStart is positioning itself as a platform for third-party content, not a publisher of its own opinions. The disclaimer language — "not the views of ColdStart" — is a standard UGC safe harbor formulation. It's not bulletproof (no disclaimer is), but it demonstrates awareness of the issue. Before these additions, the verdict rendered as a bare statement: `"Heads up — some issues reported"` with no attribution prefix and no disclaimer. That read as ColdStart's editorial judgment — a materially different legal position.

### The Signal Bars — Next 30 Seconds

Diane taps through the seven signal bars in `SignalBar.tsx`. Each bar shows an icon, a label, a numeric score (22px, `fontWeight: 700`), a word label (the `highLabel` or `lowLabel` from `SIGNAL_META`), and a colored progress bar.

The labels are defined in `constants.ts`:

| Signal | Label | Low Label | High Label |
|--------|-------|-----------|------------|
| `cold` | Cold factor | Freezing | Comfortable |
| `parking` | Parking | Tough | Easy |
| `food_nearby` | Food nearby | None | Plenty |
| `chaos` | Chaos level | Hectic | Calm |
| `family_friendly` | Family friendly | Not great | Great |
| `locker_rooms` | Locker rooms | Tight | Spacious |
| `pro_shop` | Pro shop | Sparse | Stocked |

When expanded, each signal shows:
1. A range display with low/high labels
2. Rating count text — either "No ratings yet" (italic, muted), "Early — X rating(s)" (amber badge for count < 3), or "Based on X ratings" (normal)
3. An info blurb from `meta.info` in a light gray box (`#f8fafc` background)
4. A facility detail from `FACILITY_DETAILS[rinkSlug]?.[signal.signal]` — if populated, this renders in an indigo box with a `VERIFIED` badge, the manager's name, and their note

**Diane's operator-eye reactions to specific signals:**

**"Chaos level: 2.8 — Hectic"** — Diane's face tightens. "Chaos" is a word operators hate. It implies the building is poorly run. The info text when expanded is actually reasonable: *"How organized and easy to navigate is the rink? Lower means crowded lobbies, confusing layouts, and overlapping game times."* But collapsed, the user sees `🌀 Chaos level` with `2.8` and the word `Hectic`. That's an insult to someone who runs a tournament schedule with 15-minute gaps across two sheets. Diane manages chaos — she doesn't create it.

**"Pro shop: 2.1 — Sparse"** — Twin Pines doesn't have a pro shop. It has a vending machine with tape, laces, and mouthguards. ColdStart grades it anyway. The `lowLabel` is "Sparse," which reads as "your pro shop sucks" rather than "you don't have one." A score of 2.1 out of 5 on something Diane has intentionally chosen not to offer — because the margin is negative and the liability is real — feels like being graded on someone else's test.

**"Family friendly: 2.5 — Not great"** — The `lowLabel` "Not great" is a subjective editorial judgment baked into the signal metadata. It doesn't say "needs work" or "limited" — it says "not great," which reads as a universal assessment rather than a relative rating. Diane takes this personally. She runs family skate sessions on Saturdays and birthday parties on Sundays.

**Where the operator voice appears:** Diane taps into Ice Line's parking signal and sees the indigo box:

> **VERIFIED** Mike T., Rink Manager
> *We added 30 overflow spots on the west side in 2025. Use the Dutton Mill entrance for Rinks C & D.*

This is rendered by `SignalBar.tsx` lines 110-131 when `facilityDetail` is truthy. The box has `background: colors.indigoBg`, `borderLeft: '3px solid ${colors.brandAccent}'`, and the "Verified" badge in 10px white-on-indigo uppercase. The manager's name is rendered as `{facilityDetail.name}, Rink Manager`.

This is the conversion moment. Diane sees what she could do: add context to her own scores. If parents say parking is tough, she can explain the overflow lot. If parents say it's cold, she can cite the heated viewing room. This turns a one-sided report card into a conversation.

The seeded facility details exist for three rinks:
- **Ice Line / parking:** Overflow spots + entrance directions (Mike T.)
- **Ice Line / locker_rooms:** Renovation timeline (Mike T.)
- **IceWorks / cold:** Temperature policy + heated rooms (Sarah K.)
- **Oaks / chaos:** Staggered start times (Jim R.)

For any rink not in `FACILITY_DETAILS`, this indigo box never renders. Diane's own rink would show nothing — no operator voice, no context, no "Verified" badge. Just bare scores from anonymous parents.

### The Tips — Next 60 Seconds

Diane reads the tips in `TipCard.tsx`. Each tip renders as a card with vote buttons (▲/▼), the quoted tip text in `text.md` size, and a "Local"/"Visitor" badge. Tips are fully anonymous — the contributor type (`local_parent` or `visiting_parent`) is self-reported during submission, and the only displayed identity is the corresponding badge.

When expanded, each tip shows:
1. The full contributor label ("Plays here regularly" or "Visiting parent") with a colored badge
2. A relative timestamp via `timeAgo(tip.created_at)`
3. A manager response if `MANAGER_RESPONSES[rinkSlug]?.[tipIndex]` exists (currently: never — `MANAGER_RESPONSES` is `{}`)
4. **The flag button** — new in this version

The flag button renders at the bottom of the expanded tip view:

```
⚑ Flag    (when unflagged — colors.textTertiary, cursor: pointer)
🚩 Flagged  (when flagged — colors.textMuted, cursor: default)
```

On click, `handleFlag` fires: `e.stopPropagation()` prevents the card from collapsing, `localStorage.setItem('coldstart_tip_flag_${rinkSlug}_${tipIndex}', ...)` persists the flag, the button state updates to `flagged: true`, and a green confirmation message appears: *"Flagged for review — thank you."* The confirmation auto-hides after 3 seconds via `setTimeout`.

**What Diane does:** She reads a tip about her rink. Maybe it says "Parking lot needs to be repaved — potholes everywhere." She knows about the potholes. She's got a paving contract for April. But this tip is public, attributed to an anonymous "Visiting parent," and she can't respond to it. She expands the tip. She sees the flag button. She taps it. The icon changes to 🚩 and the confirmation appears. She thinks: "OK, they know tips can be wrong. Someone's going to look at this."

**What actually happens:** The flag is saved to `localStorage` on Kevin's phone. It doesn't go to a server. It doesn't trigger an email. It doesn't enter a moderation queue. If someone else views the same tip on their phone, the flag doesn't exist. The mechanism is purely local — a client-side gesture with no backend.

**Does Diane know this?** Probably not. The confirmation says "Flagged for review" which implies someone will review it. The gap between the promise ("for review") and the reality (saved to browser storage only) is a trust liability. But the existence of the button is still net positive — it communicates intent. ColdStart is telling operators: "We acknowledge tips can be inaccurate, and we want to know about it." That's different from a platform with no flag button, which communicates: "We don't care."

### The Claim CTA

Diane scrolls past the nearby places, past the gas stations, and reaches `ClaimRinkCTA.tsx`. In its collapsed state, it's a dashed-border card (`1.5px dashed ${colors.brandLight}`) with a stadium emoji, "Manage this rink?" in `text.base` indigo, and a description: "Claim your profile — respond to feedback, get featured, see analytics."

She taps it. The form expands: three inputs (name, email, role) and a "Request early access" button. The submit text below reads: "No charge until you activate. We'll email you when it's ready."

**What happens on submit:** `handleSubmit()` calls `storage.getClaims()`, which reads from `localStorage` key `coldstart_claims`. It pushes the new claim (rink_id, name, email, role, timestamp) to the array and writes it back via `storage.setClaims()`. The success state shows: "We'll be in touch!" with a note about verified profiles launching soon and "priority access + a free month."

**What Diane processes:** The promises are significant — "respond to feedback, get featured, see analytics." These are the exact features an operator needs to feel like they have a seat at the table. But the delivery mechanism is `localStorage`. Diane's claim exists only on Kevin's phone. If Kevin clears his browser data, the claim is gone. No email was sent. No server was notified. No human at ColdStart knows Diane expressed interest.

This is the widest gap between promise and reality in the entire product. The CTA promises a relationship. The implementation provides a dead letter.

### The Footer

At the bottom of every rink detail page and the homepage:

```
Built by hockey parents, for hockey parents.                v0.3
Rink operator? Contact us at rinks@coldstarthockey.com
```

The contact line is 11px, `colors.textMuted`, with the email as a `mailto:` link. It renders in a new row below the existing footer text, inside a flex column with `gap: 6`.

**What this does for Diane:** It's an escape valve. If she has a legal concern, a factual dispute, or just a question, she has somewhere to send it. She screenshots this. The email address is the single most important piece of operator-facing infrastructure on the entire platform — not because it's technically sophisticated, but because it says "there's a human on the other side."

---

## The Fairness Audit

Diane has dealt with Google Reviews, Yelp, the local newspaper, and angry parents on Facebook for 11 years. She evaluates ColdStart through one lens: **Is this fair to me?**

### What ColdStart Gets Right

**1. Attribution is primary, not secondary.** The "PARENTS REPORT:" prefix in 11px uppercase renders *above* the 18px verdict string. The eye hits the attribution before the claim. This is a deliberate inversion of the pre-fix layout, where the verdict was the first and largest text in the card, with "From N hockey parents" buried in 12px tertiary text below. The visual hierarchy now says: "This is from parents → here's what they say." Before, it said: "Here's the verdict → (oh, and it's from parents)."

**2. The UGC disclaimer is unconditional.** The disclaimer renders outside the `hasData` conditional — it appears even when the rink has no ratings. This means every rink page, whether it has 50 ratings or zero, displays the legal distancing language. Diane can't find a page where ColdStart appears to endorse the content.

**3. The flag button signals good faith.** Even without a backend, the flag button communicates awareness. Diane compares this to Google Reviews, where the only recourse is to report a review and wait weeks for an opaque process. The ColdStart flag is faster (one tap), more visible (inline on the tip), and provides immediate feedback ("Flagged for review — thank you"). The mechanics are thinner — no actual review happens — but the surface-level UX is more respectful of the operator's concern.

**4. The operator voice has a visual identity.** The indigo box with "VERIFIED" badge, manager name, and indigo text creates a distinct visual language for operator content. It's visually elevated above parent tips (which are white cards) and parent ratings (which are gray bars). When Diane sees this on Ice Line's parking signal, she understands immediately: "If I claim my rink, my voice gets this treatment." The `borderLeft: '3px solid ${colors.brandAccent}'` accent stripe makes the box scan differently from everything else on the page.

**5. Contact information exists and is persistent.** The `rinks@coldstarthockey.com` email appears on every page — both the rink detail page footer and the homepage footer. It's not behind a "Contact Us" link that leads to a form. It's a visible email address. Diane can email it from her phone in 10 seconds. The specificity of the address (`rinks@` rather than `info@` or `support@`) tells her there's an operator-specific channel.

### What ColdStart Gets Wrong

**1. "Chaos level" is loaded language.** `SIGNAL_META.chaos.label` is `'Chaos level'`. The `lowLabel` is `'Hectic'`. When a rink scores 2.5 on this signal, the collapsed view shows: `🌀 Chaos level ... 2.5 Hectic`. To a parent, this means "it's hectic there — be prepared." To Diane, it means "ColdStart is telling the world my building is chaotic." The info text is balanced, but the collapsed label — the only thing most users see — is editorial. "Game day flow" or "Organization" would measure the same thing without implying the operator is failing.

**2. Mandatory signals create unfair grades.** Every rink page renders all seven signals via `ensureAllSignals()` in `rinkHelpers.ts`. If a rink has no pro shop, it still gets a pro shop signal bar. If parents rate it a 2.0 (because there's nothing to rate), the bar shows `🏒 Pro shop ... 2.0 Sparse`. Diane is being graded on a feature she doesn't offer. The `lowLabel` "Sparse" adds insult — it describes a pro shop that exists but is poorly stocked, not a deliberate absence. There's no mechanism for operators to mark a signal as "N/A" or "not applicable."

**3. The family-friendly `lowLabel` is dismissive.** `SIGNAL_META.family_friendly.lowLabel` is `'Not great'`. This is an opinion disguised as a scale label. "Limited," "Needs improvement," or even "Basic" would be descriptive. "Not great" is something you'd say to a friend, not something you'd print on a public business profile. When Diane sees "Family friendly: 2.5 — Not great" on her rink, she reads it as: "ColdStart says my rink is not great for families." The attribution machinery (the "Parents report:" prefix on the verdict) doesn't extend to signal labels.

**4. Tips have no verification, thin anti-abuse, and no operator response path.** The tip submission flow in `ContributeFlow.tsx` accepts a 140-character string with a trivial math captcha. Contributor type is self-reported. There's no email verification, no rate limiting beyond what the API provides, and no content filter. `MANAGER_RESPONSES` is `{}` — the infrastructure for operator responses on tips exists in `TipCard.tsx` (the indigo response box renders when `response` is truthy) but there's no way for an operator to create one. If someone posts "the owner is a crook" or "this rink violates fire codes," Diane can flag it (client-side only) and email `rinks@coldstarthockey.com`. That's it.

**5. The claim flow is a dead end.** `ClaimRinkCTA.tsx` promises "respond to feedback, get featured, see analytics." The submit handler calls `storage.setClaims()`, which writes to `localStorage`. No network request. No email notification. No webhook. No server-side record. The success screen says "We'll be in touch!" — but nobody at ColdStart knows Diane submitted a claim. The promise-to-delivery gap here is the largest trust failure in the product. An operator who submits a claim and never hears back will not try again.

**6. No terms, privacy policy, or content guidelines.** There are no legal pages anywhere in the app. No `/terms`, no `/privacy`, no content policy. If Diane's lawyer reviews ColdStart, the first question is: "What are the terms governing user-submitted content?" The answer is: there are none. Section 230 likely still protects ColdStart as a platform, but the absence of published terms communicates immaturity. Every UGC platform Diane has dealt with — Google, Yelp, Facebook — has published terms. ColdStart doesn't.

---

## Credibility Scorecard — Operator Perspective

| Dimension | Score | What Diane sees |
|-----------|-------|-----------------|
| **Attribution** | 8/10 | "Parents report:" prefix + UGC disclaimer + "from N hockey parents" triple-layer. Strong. Only gap: signal labels aren't attributed (they read as ColdStart's words). |
| **Fairness** | 4/10 | Mandatory signals with no N/A option. "Chaos level" and "Not great" are editorial language in a data product. Pro shop grades for rinks without pro shops. |
| **Recourse** | 3/10 | Flag button is client-side only. No moderation backend. No operator response path. No escalation beyond a single email address. The flag says "for review" but nothing is reviewed. |
| **Operator on-ramp** | 5/10 | Claim CTA looks good but saves to localStorage. Facility details on featured rinks show the vision. Contact email is the only real touchpoint. The gap between promise and implementation is the problem. |
| **Legal posture** | 6/10 | UGC disclaimer and attribution prefix are solid Section 230 foundations. No published terms, no content policy, no privacy policy bring this down. ColdStart is doing better than most v0.3 products but worse than what a lawyer would recommend. |
| **Parent utility** | 8/10 | Credit where it's due: the signal bars, nearby places, share button, tappable address, LiveBarn links, compare feature — this is genuinely useful for visiting parents. Diane acknowledges this even while auditing it. |
| **Overall** | **5.7/10** | *"I don't hate it. I don't trust it yet. But someone thought about me, and that's more than Yelp ever did."* |

---

## Lawsuit Triggers

Diane doesn't want to sue anyone. She wants to run her rink. But she knows what triggers legal review because she's been through it before — once with a Google reviewer who claimed her Zamboni leaked oil onto the ice (it didn't), once with a Facebook parent who said her concession stand gave kids food poisoning (the health department cleared her). Here are the scenarios where ColdStart crosses from "annoyance" to "I'm calling my lawyer":

**Trigger 1: Factually false tip with no removal path.** Someone posts "Twin Pines failed its fire inspection." It's not true — Diane has the certificate on the wall. She flags the tip (client-side). She emails `rinks@coldstarthockey.com`. Nobody responds within 48 hours. The tip is still public. Now she's calling her lawyer. The flag button bought ColdStart some time — it demonstrated good faith. But without a response, good faith evaporates.

**Trigger 2: The verdict reads as ColdStart's own assessment.** If the "Parents report:" prefix were removed — or if it were ever absent (a rendering bug, a different page layout, a cached version) — the verdict `"Heads up — some issues reported"` reads as ColdStart's editorial judgment. That's a commercial entity making a public negative claim about her business. The prefix changes the sentence from "ColdStart says there are issues" to "Parents told ColdStart there are issues." That's a different legal sentence. The prefix must never be conditionally rendered.

**Trigger 3: Negative scores on dimensions she can't control.** If "Food nearby: 1.5 — None" drags her overall average below 3.0, the verdict flips to "Heads up — some issues reported" because of geography, not quality. `overallAvg` in `dbSummary.ts` is a simple average across all rated signals — it doesn't weight by controllability. Diane can't move a restaurant closer to her rink. Being punished for geography in a public verdict is the kind of unfairness that makes operators litigate.

**Trigger 4: A competitor gaming the system.** The tip submission requires no email verification. A parent at a rival rink could submit "the locker room doors don't lock, creepy" — 140 characters, one math problem, done. There's no IP logging visible to Diane, no verification, and no way to know if the submitter ever visited her rink. The `contributor_type` is self-reported. The flag button is the only defense, and it's client-side.

---

## Language Changes Diane Would Request

If Diane got 15 minutes with the ColdStart team, she'd bring this list:

| Current | Proposed | Why |
|---------|----------|-----|
| `Chaos level` | `Game day flow` | "Chaos" implies operator failure. "Flow" describes the experience neutrally. Same measurement, different connotation. |
| `Sparse` (pro shop low) | `Limited` — or skip signal if no pro shop | "Sparse" describes a bad pro shop. Many rinks intentionally don't have one. Grade what exists, not what doesn't. |
| `Not great` (family friendly low) | `Needs improvement` | "Not great" is dismissive editorial voice. "Needs improvement" is constructive and neutral. |
| `Hectic` (chaos low) | `Busy` | "Hectic" implies the rink is poorly managed. "Busy" describes volume without judgment. |
| `Heads up — some issues reported` | `Some areas rated below average` | "Heads up" is ColdStart's voice — it's an advisory from the platform. "Some areas rated below average" is a factual description of parent input. |
| `Mixed reviews` | `Mixed ratings from parents` | Add "from parents" to make the verdict self-attributing even without the prefix above. |

---

## The Operator On-Ramp: What Moves Diane from "Watching" to "Claiming"

### What she sees today (on a featured rink like Ice Line):

She taps the parking signal. It expands. Below the info text, the indigo "VERIFIED" box appears with Mike T.'s note about overflow parking. This is the moment Diane thinks: *"I could do that for my rink."* The visual treatment — indigo background, accent stripe, badge, name — makes the operator voice feel elevated, not buried. It sits below the parent-sourced info text and above nothing else. It gets the last word.

The seeded facility details demonstrate four different use cases:
1. **Operational improvement** (Ice Line/parking: "We added 30 overflow spots")
2. **Renovation timeline** (Ice Line/locker_rooms: "Rink A & B renovated in Fall 2024")
3. **Policy explanation** (IceWorks/cold: "55°F per USA Hockey guidelines")
4. **Process transparency** (Oaks/chaos: "We stagger game starts by 15 minutes")

These are exactly the kinds of responses operators want to give. Not defensive rebuttals — contextual additions.

### What she doesn't see (on her own rink):

No facility details. No manager responses on tips. No "Verified" badge anywhere. Just bare scores from anonymous parents, a claim CTA that saves to `localStorage`, and a contact email. The gap between the featured rink experience and the generic rink experience is the product's conversion cliff.

### What would close the gap:

**1. The claim form must hit a server.** Even if it's just `POST /api/v1/claims` that sends an email to the ColdStart team. Diane needs to feel like her claim was received by a human. The `localStorage`-only path means her interest literally cannot survive clearing browser data.

**2. Show operator engagement examples on every rink page.** The "Manage this rink?" CTA should include a preview of what the operator voice looks like — a sample facility detail or tip response in the indigo box. Diane shouldn't have to browse a competitor's rink to discover the feature.

**3. Let operators respond to tips.** `MANAGER_RESPONSES` is `{}`. The rendering code in `TipCard.tsx` is ready — the indigo box with "Verified" badge, name, role, and response text all render when `response` is truthy. The missing piece is a submission mechanism. Even a simple "Email us your response at rinks@coldstarthockey.com and we'll add it" would be better than nothing.

**4. Let operators mark signals as N/A.** If Twin Pines doesn't have a pro shop, Diane should be able to say so. The signal would still appear but with a note: "This rink does not offer a pro shop." This prevents unfair grading on absent features.

---

## The B2B Preview

Diane puts Kevin's phone down. She leans back.

"It's not Yelp," she says. "Yelp is hostile — they want you to pay to fix your own page. This is different. The 'Parents report' thing above the verdict — that matters. The disclaimer at the bottom — that matters. The little flag button on tips — that tells me they thought about what happens when someone posts something wrong. The email in the footer tells me there's a human I can reach."

She pauses.

"But the claim form is broken. I fill in my name, my email, my role — and it says 'We'll be in touch.' Will they? I don't think they even got my information. It felt like shouting into a hole."

"And 'Chaos level' — I don't want to see that on my rink's page. I run a tournament schedule with 15-minute changeovers across two sheets. It's tight. It's not chaotic. Call it 'game day flow' or something. Don't call my operation chaotic on a public website."

"The thing that got me: I looked at Ice Line's parking score. I tapped it open. And there's this indigo box that says 'VERIFIED — Mike T., Rink Manager' with a note about overflow parking. That's what I want. I want to be able to say: 'We're repaving the lot in April. We know about the potholes. Here's our plan.' That turns a complaint into a conversation. That makes me look professional, not defensive."

Kevin asks: "So do we claim it?"

Diane thinks for a moment.

"Not yet. Email that rinks@ address first. Ask them what claiming actually does — like, where does my information go? And ask about the response thing — can I respond to tips? If I can get the indigo box treatment on my signals and respond to tips, I'll claim it. If it's just a form that goes nowhere, I'll wait."

"But keep an eye on our page. If someone posts something false, I want to know about it before parents see it. And screenshot everything — just in case."

**Diane's final line:** *"They're trying. That's more than I can say for Google."*

---

## Changes Implemented

### Fix A: "Parents Report:" Attribution Prefix
**File:** `components/rink/VerdictCard.tsx` — line 43
Added `PARENTS REPORT:` in 11px uppercase `textTertiary` above the verdict string. `fontWeight: 600`, `letterSpacing: 0.3`, `textTransform: 'uppercase'`. Renders unconditionally when the VerdictCard is shown. Also changed "signals above average" to "parent ratings above average" in the sub-line (line 59).

### Fix B: UGC Disclaimer
**File:** `components/rink/VerdictCard.tsx` — line 76
Added disclaimer text outside the main data `<div>`: *"Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart."* 10px, `colors.textMuted`, `margin: '12px 0 0'`. Renders unconditionally — even on rinks with no data.

### Fix C: Flag/Report Button on Tips
**File:** `components/rink/TipCard.tsx` — lines 19-20, 31-47, 185-205
State: `flagged` (boolean) and `showFlagConfirm` (boolean). Initialization reads `localStorage` key `coldstart_tip_flag_${rinkSlug}_${tipIndex}`. `handleFlag()` writes the flag to `localStorage`, sets `flagged: true`, shows confirmation for 3 seconds. Button renders in expanded view: `⚑ Flag` (unflagged) or `🚩 Flagged` (flagged). Confirmation text: "Flagged for review — thank you." in `colors.success`.

### Fix D: Contact Email in Footers
**Files:** `app/rinks/[id]/page.tsx` — lines 878-882, `app/page.tsx` — lines 368-372
Added `"Rink operator? Contact us at rinks@coldstarthockey.com"` in 11px muted text with a `mailto:` link. Footer layout changed from single-row flex to flex column with `gap: 6` to accommodate the new line. Both the rink detail page and homepage footers updated.

### Fix E: Seeded FACILITY_DETAILS
**File:** `lib/seedData.ts` — lines 14-25
Populated `FACILITY_DETAILS` for three featured rinks:
- `'ice-line'` → `parking` (Mike T.: overflow spots + entrance) and `locker_rooms` (Mike T.: renovation timeline)
- `'iceworks-skating-complex-aston-township'` → `cold` (Sarah K.: temperature policy + heated rooms)
- `'oaks-center-ice-oaks'` → `chaos` (Jim R.: staggered start times)

These render in `SignalBar.tsx` via the `facilityDetail` check (line 16, 110-131) — indigo box, "VERIFIED" badge, `{name}, Rink Manager` attribution.

### Fix F: MANAGER_RESPONSES — Deferred
`MANAGER_RESPONSES` remains `{}`. The tip response rendering code in `TipCard.tsx` (lines 164-183) is ready — indigo box with "Verified" badge, name, role, response text. But no tips are seeded for featured rinks, so there's nothing to respond to. This is a dependency on seeding tips for demo rinks, which was out of scope for this evaluation.
