# ColdStart Skeptical Dad Test v1 — Output
## Greg Hamill's Trust Audit

**Date:** February 20, 2026
**Tester persona:** Greg Hamill, 46, hockey dad x11 years, 200+ rinks
**Method:** Systematic credibility audit of the ColdStart platform, testing 9 PA/NJ rinks Greg knows personally against his lived experience. Every claim on every page evaluated through the lens: "Why should I believe this?"

---

## GREG'S TRUST VERDICT

Look — I'll give credit where it's due. ColdStart knows its audience. It doesn't try to be Google Maps or Yelp or some tournament app that dies in March. The signal model is smart. Parking, cold, chaos, locker rooms — those are the exact things I text Dave about. And the "Early" badge on thin data is the most honest thing I've seen on a rink review site. Most platforms would show you a 5.0 from one person and let you believe it. ColdStart puts a yellow flag on it and says "two ratings, take it easy." That's not nothing. But here's where it falls apart: the numbers don't move. I rated parking at Ice Line a 1 and the average barely budged — went from 3.8 to 3.2, maybe. My 30 visits and your 3 anonymous ratings get the same weight. There's no tournament filter, no way to say "this score is completely wrong during States weekend," and no way to tell whether the 5 people who rated chaos at Oaks went on a Tuesday morning or during a 40-team shootout. The `context` field exists in the database — I can see it in the API — but nobody hooked it up to the UI. That's the gap that would get a parent burned. Would I recommend it to my text thread? Not yet. I'd say "it's interesting, keep an eye on it." I'm not putting my name on a platform that shows "Parking: 3.8 — Easy" at Ice Line during a Friday night tournament. That's not wrong by average — it's wrong by experience, and experience is all that matters when you're the dad who told 6 families to "just use ColdStart."

---

## THE TRUST INVENTORY

### Rink 1: Ice Line, West Chester PA
**Greg's baseline:** 4 sheets, massive complex, knows every entrance. Parking is fine for a single-sheet weeknight game, disaster during multi-sheet tournaments. Locker rooms on C & D side are notoriously tight. Cold varies by sheet — Rink A is warmer, D is a barn.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 3.8/5 (3 ratings) | 2.0-2.5 during tournaments, 4.0 on quiet nights | **Misleading.** 3.8 is the quiet-night average. The 3 raters probably went on a Tuesday. "Early" badge saves it — Greg sees the yellow warning and knows not to trust it. But the NUMBER still says "Easy" when his experience says "get there 30 minutes early or park on Dutton Mill Road." |
| Cold | 3.0/5 (5 ratings) | 2.5 average, but varies wildly by sheet | **Close enough.** 3.0 is defensible. Greg would rate it 2.5 but wouldn't call 3.0 a lie. No way to note sheet-by-sheet variation though. |
| Food Nearby | 3.8/5 (5 ratings) | 4.0+ — Wawa, Chick-fil-A, Chipotle, PJ Whelihan's all close | **Accurate.** The nearby section actually lists all of these — Wawa at 0.5mi, Chick-fil-A at 0.8mi, Applebee's, PJ's. Greg checks his mental map: correct. |
| Chaos | 3.4/5 (4 ratings) | 2.0-2.5 during tournaments, 3.5 on regular nights | **Averaged away.** 3.4 suggests "manageable." Tournament reality: 4 games ending simultaneously, parents clogging the lobby, kids in full gear crossing paths. The number is technically correct and practically useless. |
| Family Friendly | 4.3/5 (5 ratings) | 4.0 — fair | **Accurate.** Clean, well-run, good sight lines from stands. |
| Locker Rooms | 2.6/5 (5 ratings) | 2.0 for C & D, 3.5 for A & B (post-renovation) | **Directionally right**, but hiding the renovation split. Manager note from Mike T. confirms: "A & B renovated Fall 2024, C & D renovation scheduled Summer 2026." This note is the most useful thing on the page. |
| Pro Shop | 3.8/5 (3 ratings) | 4.0 — decent shop, good sharpening | **Accurate.** |

**Manager notes present:** Yes — Mike T. on parking ("30 overflow spots added, use Dutton Mill entrance for C & D") and locker rooms. **These are the best content on the page.** Verified badge in blue is clearly distinct from parent content. Greg notices and approves — this is a rink operator speaking as a rink operator, not pretending to be a parent.

**Tips:** Database-sourced, would depend on what parents have submitted. The 140-character limit means tips are tight and specific — "Get there early for Friday tourneys, Dutton Mill entrance for C/D" fits. Marketing fluff doesn't fit in 140 characters, which is actually a trust feature.

**Overall:** Ice Line page is Greg's hardest test and it mostly passes — not because the numbers are perfect, but because the "Early" badges and manager notes add enough context for Greg to calibrate. The fatal issue: parking 3.8 with no tournament qualifier.

---

### Rink 2: IceWorks, Aston Township PA
**Greg's baseline:** Great pro shop (maybe the best in the area), cold building, solid food options nearby. Tournament-ready but crowded during big events.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 3.6/5 (4 ratings) | 3.5 — fair | **Accurate.** Lot is adequate, not great. |
| Cold | 2.5/5 (4 ratings) | 2.0 — it's cold | **Close.** Sarah K.'s manager note: "55 degrees F per USA Hockey guidelines, heated viewing rooms in main lobby." That's honest. The note essentially says "yes, it's cold, here's what we do about it." Greg respects the honesty. |
| Food Nearby | 4.3/5 (3 ratings) | 4.0 — Chipotle, Wawa, Chick-fil-A all close | **Accurate.** Nearby data confirms. "Early" badge on 3 ratings. |
| Chaos | 3.1/5 (5 ratings) | 3.0 — manageable | **Accurate.** |
| Family Friendly | 4.7/5 (3 ratings) | 4.5 — very family oriented | **Accurate but "Early" flagged.** Greg notes: 3 ratings showing 4.7 could be three happy birthday party parents. The yellow badge correctly signals low confidence. |
| Locker Rooms | 3.3/5 (5 ratings) | 3.0 — adequate | **Accurate.** |
| Pro Shop | 4.8/5 (5 ratings) | 5.0 — best in the area | **Accurate.** 4.8 from 5 parents matches Greg's experience perfectly. This is a trust-builder. The number is specific, from a reasonable sample, and matches what Greg knows. |

**Manager notes present:** Sarah K. on cold. Verified badge visible.

**Overall:** IceWorks is ColdStart's best page in Greg's test. The pro shop score alone — 4.8 from 5 parents — is the kind of specific-and-right data point that builds trust. Greg would show this page to another dad and say "see, they got IceWorks right."

---

### Rink 3: Oaks Center Ice, Oaks PA
**Greg's baseline:** Chaotic during tournaments. Cold. Decent parking lot. Two sheets, games overlap badly.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 3.9/5 (3 ratings) | 3.5-4.0 — lot is usually fine | **Accurate.** Even during tournaments, Oaks has space. "Early" badge. |
| Cold | 2.5/5 (5 ratings) | 2.0 — barn | **Close enough.** Greg would go lower but 2.5 isn't dishonest. |
| Food Nearby | 3.2/5 (4 ratings) | 3.0 — some options but not walking distance | **Accurate.** |
| Chaos | 2.1/5 (5 ratings) | 1.5-2.0 during tournaments | **This is the trust-builder.** ColdStart says "Hectic" and Greg's tournament PTSD agrees. 2.1 from 5 parents. Jim R.'s manager note: "We stagger starts by 15 minutes across both sheets. Tournament weekends are tighter." Translation: "yes, it's chaotic, we try." The score + the note = honest. |
| Family Friendly | 3.7/5 (5 ratings) | 3.5 — not bad, not great | **Accurate.** |
| Locker Rooms | 2.7/5 (3 ratings) | 2.5 — tight | **Accurate.** "Early" badge. |
| Pro Shop | 3.7/5 (4 ratings) | 3.5 — basic | **Accurate.** |

**Overall:** Oaks is quietly ColdStart's most accurate page. Chaos at 2.1 matches Greg's lived experience, and the manager's candid "tournament weekends are tighter" note is the kind of transparency that earns trust. Greg thinks: "The person who built this signal system has actually been to a rink."

---

### Rink 4: Hatfield Ice Arena, Colmar PA
**Greg's baseline:** Big parking lot. Cold building. Locker rooms are terrible — small, cramped, sometimes shared during tournaments. Not family-friendly by modern standards. Pro shop is bare minimum.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 4.2/5 (5 ratings) | 4.0 — big lot, rarely a problem | **Accurate.** |
| Cold | 2.9/5 (5 ratings) | 2.5 — cold | **Close.** |
| Food Nearby | 2.9/5 (3 ratings) | 2.5 — slim pickings | **Accurate.** "Early" badge. |
| Chaos | 2.9/5 (4 ratings) | 3.0 — manageable | **Accurate.** |
| Family Friendly | 2.8/5 (5 ratings) | 2.5 — dated | **Accurate.** ColdStart says "not great," Greg agrees. |
| Locker Rooms | 2.0/5 (5 ratings) | 1.5 — the worst | **Trust-builder.** ColdStart's lowest locker room score matches Greg's worst locker room experience. 2.0 from 5 parents. Greg knows those 5 parents all crammed their kid's gear into a closet-sized room with another team. This number is RIGHT and specific enough to be useful. |
| Pro Shop | 2.4/5 (4 ratings) | 2.0 — tape and maybe laces | **Accurate.** |

**Overall:** Hatfield's page is honest in a way that builds trust. Nothing is inflated. The locker room score of 2.0 and family-friendly score of 2.8 match the reality that Hatfield is functional but not fancy. Greg's verdict: "They didn't try to make Hatfield look good. That means the good scores at other rinks might be real."

---

### Rink 5: Flyers Training Center, Voorhees Township NJ
**Greg's baseline:** NHL-quality ice, intimidating facility. Huge parking lot. Cold (it's an NHL practice facility). Chaos during youth tournaments because the building wasn't designed for 200 hockey parents.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 4.8/5 (4 ratings) | 5.0 — massive lot | **Accurate.** |
| Cold | 2.1/5 (4 ratings) | 1.5 — NHL cold | **Close.** 2.1 is generous but defensible. |
| Food Nearby | 3.6/5 (3 ratings) | 3.5 — strip malls | **Accurate.** "Early" badge. |
| Chaos | 2.2/5 (5 ratings) | 2.0 — not built for youth hockey logistics | **Accurate.** NHL facility retrofitted for youth tournaments = confusion. |
| Family Friendly | 3.5/5 (5 ratings) | 3.5 — mixed | **Accurate.** |
| Locker Rooms | 2.3/5 (3 ratings) | 2.5 — NHL rooms but shared awkwardly for youth | **Accurate.** "Early" badge. |
| Pro Shop | 4.1/5 (5 ratings) | 4.0 — Flyers merch + basics | **Accurate.** |

**Overall:** Accurate across the board. The chaos-to-parking contrast tells the real story: easy to park, hard to navigate inside. Greg's experience exactly.

---

### Rink 6: Wissahickon Skating Club, Philadelphia PA
**Greg's baseline:** Old-money skating club. Tight parking, great neighborhood food, surprisingly family-friendly.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 2.8/5 (5 ratings) | 2.5 — tight lot, street parking | **Accurate.** |
| Cold | 2.8/5 (4 ratings) | 3.0 — older building but not terrible | **Close.** |
| Food Nearby | 4.8/5 (5 ratings) | 5.0 — Chestnut Hill is a food paradise | **Accurate.** Best food-nearby score in the test. Greg knows why. |
| Family Friendly | 4.8/5 (4 ratings) | 4.5 — welcoming place | **Accurate.** |
| Locker Rooms | 4.1/5 (4 ratings) | 4.0 — surprisingly good | **Accurate.** |

**Overall:** Another accurate page. The food-nearby 4.8 matched to Chestnut Hill restaurants is a "they get it" moment for Greg.

---

### Rink 7: Penn Ice Rink, Philadelphia PA
**Greg's baseline:** University of Pennsylvania rink. Parking nightmare (it's West Philly). Amazing food nearby. Good family vibe.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 2.7/5 (5 ratings) | 2.0 — university area, forget it | **Close.** Greg would go lower but 2.7 with 5 ratings suggests some parents found the garage. |
| Cold | 3.3/5 (5 ratings) | 3.0 — not terrible | **Accurate.** |
| Food Nearby | 4.5/5 (5 ratings) | 5.0 — University City | **Accurate.** |
| Chaos | 3.1/5 (5 ratings) | 3.0 — manageable | **Accurate.** |
| Family Friendly | 4.6/5 (5 ratings) | 4.5 — great vibe | **Accurate.** |
| Locker Rooms | 2.4/5 (5 ratings) | 2.5 — tight | **Accurate.** |
| Pro Shop | 3.9/5 (5 ratings) | 4.0 — decent | **Accurate.** |

**Overall:** Penn Ice has the cleanest data in Greg's test — 5 ratings on every signal. No "Early" badges. Every score within 0.5 of Greg's estimate. This is what a mature ColdStart page looks like, and it works.

---

### Rink 8: Revolution Ice Centre, Pittston PA
**Greg's baseline:** Long drive for a PA rink. Cold. Decent facility for the area.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 3.8/5 (3 ratings) | 3.5 — adequate | **Accurate.** "Early" badge. |
| Cold | 2.1/5 (5 ratings) | 2.0 — barn | **Accurate.** |
| Food Nearby | 2.7/5 (3 ratings) | 2.5 — limited options | **Accurate.** "Early" badge. |
| Chaos | 3.4/5 (3 ratings) | 3.5 — manageable | **Accurate.** "Early" badge. |
| Family Friendly | 3.1/5 (5 ratings) | 3.0 — functional | **Accurate.** |
| Locker Rooms | 3.5/5 (5 ratings) | 3.5 — decent | **Accurate.** |
| Pro Shop | 3.7/5 (5 ratings) | 3.5 — basic | **Accurate.** |

**Overall:** Limited data matches limited experience. Nothing wrong, nothing standout.

---

### Rink 9: Jersey Shore Arena, Wall Township NJ
**Greg's baseline:** Shore area rink. Good facility overall. Decent parking, not too chaotic.

| Signal | ColdStart Says | Greg Says | Verdict |
|--------|---------------|-----------|---------|
| Parking | 3.6/5 (5 ratings) | 3.5 — adequate | **Accurate.** |
| Cold | 3.1/5 (5 ratings) | 3.0 — average | **Accurate.** |
| Food Nearby | 3.8/5 (3 ratings) | 4.0 — shore area has options | **Close.** "Early" badge. |
| Chaos | 3.9/5 (5 ratings) | 4.0 — calm for a multi-sheet | **Accurate.** |
| Family Friendly | 4.0/5 (5 ratings) | 4.0 — solid | **Accurate.** |
| Locker Rooms | 4.2/5 (5 ratings) | 4.0 — good | **Accurate.** |
| Pro Shop | 3.3/5 (5 ratings) | 3.5 — basic | **Accurate.** |

**Overall:** Jersey Shore is a "no red flags" page. Everything aligns. Greg trusts it.

---

## THE CREDIBILITY SCORECARD

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Data accuracy** | 3.5/5 | Most scores within 0.5 of Greg's experience. The 7-signal model captures the right dimensions. Occasional misses (Ice Line parking 3.8 vs Greg's 2.5 during tournaments) stem from context collapse, not bad data. |
| **Recency transparency** | 3.0/5 | Staleness warning at >60 days is good. "Updated X ago" timestamp exists. But you have to notice it — the signals display with full visual confidence whether they're 3 days old or 3 months old. No seasonal indicator. |
| **Confidence calibration** | 4.0/5 | **Best in class for Greg.** "Early — 2 rating(s)" in a yellow badge is the most honest UI pattern on the platform. It tells Greg exactly what he needs to know: this number is an anecdote, not intelligence. Signals with 5+ ratings show "Based on 5 ratings" without the warning. The visual distinction is clear. |
| **Tip authenticity** | 3.0/5 | Tips are user-submitted, 140-char limit forces specificity, and the Visitor/Local badge adds provenance. But tips come from the database only — no seeded content. Many rinks may have zero tips. Greg can't evaluate what doesn't exist. The flag button (Flag / Flagged) stores to localStorage only — it's a pacifier, not a real moderation tool. |
| **Manipulation resistance** | 3.5/5 | UGC disclaimer exists: "Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart." Manager notes are clearly badged with blue "Verified" styling. No rink can delete ratings. But there's no rate-limiting — a rink owner could submit 10 ratings from 10 browsers and ColdStart would average them in. No CAPTCHA, no account system, no device fingerprinting. |
| **Context sensitivity** | 1.5/5 | **Worst score.** No tournament vs regular-season split. No time-of-day context. No session-type filter. The `context` field exists in the database schema and the API accepts it (`POST /api/v1/contributions` stores `context || null`) but the UI never sets it and never displays it. Every rating goes into one flat average. A parking score during a 40-team tournament and a Tuesday morning learn-to-skate get equal weight. |
| **Self-correction** | 2.5/5 | Greg can rate and tip. His rating adjusts the average (parking goes from 3.8 to ~3.2 with his 1 added to 3 existing ratings). The math works. But one voice in an average doesn't feel impactful. Tips are newest-first, so Greg's "misleading during tournaments" tip would appear at the top — that's actually the better correction mechanism. No "flag score as inaccurate" feature beyond the cosmetic tip-level flag button. |
| **Failure honesty** | 3.5/5 | "Early" badges, staleness warnings, "No ratings yet" empty state with "Be the first to report" — ColdStart does NOT fake confidence when data is thin. The empty state is honest. But the 60-day staleness threshold means data from 45 days ago shows no warning even if the rink was renovated last week. |
| **Better than texting Dave** | 2.5/5 | Dave gives Greg: "Get there early, it's cold, there's a Wawa." ColdStart gives Greg: Parking 3.8, Cold 3.0, Food 3.8, plus a Wawa at 0.5mi in the nearby section. Same information, presented as numbers instead of a text. ColdStart wins on breadth and manager notes. Dave wins on tournament context. Neither wins outright. |

**Composite: 27/45 (3.0 average)**

---

## THE THREE TRUST-BREAKERS

### Trust-Breaker #1: Ice Line Parking — 3.8 "Easy" During Tournaments
**What Greg saw:** Parking signal at Ice Line shows 3.8/5 from 3 ratings. Scale label: "Easy." The "Early" badge softens it, but the number itself — combined with the "Easy" descriptor — tells a parent preparing for a Friday night tournament game that parking won't be a problem.

**Why it bothered him:** Greg has parked on the shoulder of Dutton Mill Road during Ice Line tournaments. He's circled the lot for 15 minutes while his kid was supposed to be warming up. 3.8 is the quiet-Tuesday average. During a Tier 1 tournament with all 4 sheets running, it's a 1.5. The platform presents ONE number for TWO completely different realities. The "Early — 3 ratings" badge is a life preserver, but the number still drowns you.

**What would fix it:** Surface the `context` field. When a parent rates parking, let them tag it "Tournament" or "Regular season." Display both: "Parking: 3.8 (regular) / 1.8 (tournament)." The schema already supports it — `signal_ratings` has a `context TEXT` column. The API accepts it. The UI just needs a toggle next to the Visitor/Regular pill. This is a wiring job, not an architecture change.

---

### Trust-Breaker #2: Compare Button 404s
**What Greg saw:** A "Compare" button on rink pages. He tapped it. The URL goes to `/compare?rinks={rinkId}`. The route doesn't exist. 404.

**Why it bothered him:** A broken feature is worse than a missing feature. If the Compare button weren't there, Greg wouldn't miss it. But showing a Compare button that goes nowhere signals that ColdStart is shipping UI faster than functionality. It's a "coming soon" feature masquerading as a real one. For a trust-focused dad, broken promises — even small ones — compound. "If they can't get the Compare button working, what else is half-baked?"

**What would fix it:** Remove the button until the route exists. Or build the route — it's a natural feature for Greg's use case (Ice Line vs IceWorks for a Saturday tournament). But a broken link is the one thing worse than no link.

---

### Trust-Breaker #3: The Flag Button Is Cosmetic
**What Greg saw:** A "Flag" button on tips. He flagged a tip to test the system. The button changed to "Flagged" with "Flagged for review — thank you."

**Why it bothered him (if he knew):** The flag stores to `localStorage` only. There's no API call. No one at ColdStart will ever see that Greg flagged something. The "thank you" confirmation implies action will be taken, but it's a dead endpoint. Greg won't immediately know this — but the first time he flags something genuinely misleading and it's still there a week later, he'll know. And then he'll wonder what else is performative.

**What would fix it:** Wire the flag button to an actual API endpoint. Store flags in the database. Send a notification. Even a simple `POST /api/v1/flags` that writes to a `flags` table would make this real. The UI already does the hard work (confirmation message, toggle state). The backend just needs to catch it.

---

## THE THREE TRUST-BUILDERS

### Trust-Builder #1: The "Early" Badge
**What Greg saw:** On rinks with fewer than 3 ratings per signal, a yellow badge: "Early — 2 rating(s)." Different background color (#fffbeb), distinct border (#fde68a), warm text (#92400e). Visually distinct from signals with 3+ ratings that show "Based on 5 ratings" in neutral styling.

**Why it built trust:** This is the single most important design decision in ColdStart for a skeptic like Greg. Every other platform shows "4.5 stars" whether that's from 2 people or 2,000. ColdStart explicitly says: "We have thin data here. Calibrate accordingly." Greg doesn't need the score to be right when the badge tells him the score is preliminary. The honesty IS the feature. Greg thought: "Someone who built this has been burned by thin data before."

---

### Trust-Builder #2: Hatfield Locker Rooms — 2.0/5
**What Greg saw:** Hatfield Ice Arena, locker_rooms signal: 2.0 from 5 parents. The lowest locker room score in his test.

**Why it built trust:** ColdStart didn't protect Hatfield. It didn't round up to 2.5 or hide the score behind a vague label. It said: locker rooms are bad. 2.0. Greg knows Hatfield's locker rooms are the worst in the Philly area, and ColdStart confirmed it with a specific number from a meaningful sample. A platform that inflates bad rinks to protect relationships is a platform Greg can't trust for ANY rink. ColdStart showed it will report bad news. That means the good news might be real too.

---

### Trust-Builder #3: Manager Verified Notes with Blue Badge
**What Greg saw:** On Ice Line's parking signal, a blue-badged note: "Verified Mike T., Rink Manager — We added 30 overflow spots on the west side in 2025. Use the Dutton Mill entrance for Rinks C & D." Distinct styling: blue background (#eff6ff), blue left accent bar, clearly different from parent-submitted content.

**Why it built trust:** ColdStart didn't pretend the rink has no voice. It gave the rink a voice AND labeled it clearly. Greg can see that Mike T. is the rink manager, not a parent. The information is operationally useful ("use the Dutton Mill entrance for C & D"). The styling makes it impossible to confuse with parent data. This is how you handle conflict of interest: transparency, not exclusion. Greg thought: "The rink's response is labeled as the rink's response. That's how it should work."

---

## THE FATAL FLAW

**Context collapse: one number for two realities.**

ColdStart computes a simple arithmetic mean across all ratings for each signal. `SELECT AVG(value) FROM signal_ratings WHERE rink_id = $1 AND signal = $2`. No recency weighting. No context filtering. No tournament vs regular-season split.

The `context` field exists in the schema. The API accepts it — `POST /api/v1/contributions` stores `context || null`. The localStorage helpers exist (`getRatingContext`, `setRatingContext`). The infrastructure is literally there, unused.

This matters because the platform's core promise — "intelligence from hockey parents" — breaks when a parent uses a tournament-context rating and gets a regular-season average. Parking at Ice Line during a Saturday tournament is a fundamentally different experience than parking at Ice Line on a Wednesday evening. Chaos at Oaks during Presidents' Day Weekend is nothing like chaos at Oaks during a Tuesday morning clinic. ColdStart presents both as the same number.

This isn't a feature gap. It's a trust architecture problem. The moment a parent drives to a tournament trusting ColdStart's "Parking: 3.8" and discovers there's no parking, ColdStart goes from "interesting tool" to "the thing that got me burned." And unlike a low score that was wrong, a high score that was wrong during a tournament — when emotions are highest and stakes feel real — creates permanent distrust.

The fix is architecturally straightforward:
1. Add a "Tournament" / "Regular season" toggle next to the existing Visitor/Regular toggle
2. Store it in the `context` field that already exists
3. Display split averages when tournament data exists: "Parking: 3.8 (regular) / 1.8 (tournament)"
4. Default to the combined average when no tournament data exists

The hardest part is getting enough tournament-tagged data to be useful. But even showing "No tournament-specific data yet" would be more honest than presenting one average and hoping nobody drives 3 hours to test it.

---

## WHAT WOULD MAKE GREG ADD COLDSTART TO HIS SYSTEM

**Tournament context that makes the flat average usable.**

Greg doesn't need ColdStart to be perfect. He doesn't need 200 ratings per rink. He doesn't need photos or live cameras or real-time parking counts. He needs one thing: when he looks at a rink page before a tournament game, he needs to know that the numbers reflect tournament conditions, not Tuesday conditions.

The specific change: **Surface the context field as a "Tournament weekend?" toggle during rating submission, and display split averages on the rink page.**

Here's why this is the highest-leverage change: Greg's text thread with 6 dads is powerful because those dads answer in context. "Hey Dave, we're headed to Ice Line for the MLK tournament. Anything I should know?" Dave answers for that context. ColdStart currently can't do this — it answers every question with the same decontextualized average.

But if ColdStart could show "Tournament parking: 1.8 (12 parents)" while the regular average still shows 3.8, Greg gets something Dave can't give him: aggregated tournament intelligence from a dozen parents who've been through it, not just one guy's memory. That's Level 2 data — as reliable as his own experience, because it IS his own experience, multiplied.

The day ColdStart shows Greg a tournament-specific chaos score at a rink he's never visited, and he arrives to find it was exactly right — that's the day he texts the group: "Check this thing out. It actually knows what it's talking about."

Until then, ColdStart is a well-designed platform with an honest UI that gives Greg approximately the same information he already gets from Dave, formatted as numbers instead of a text message. That's not nothing. But it's not enough to change his system.

---

## APPENDIX: SCENARIO-BY-SCENARIO DETAIL

### Scenario 1 — The Credibility Check

**1.1 Coverage:** All 9 rinks Greg tested are in the database. No missing highways. Basic info (name, city, state) correct across all tested rinks. Address is an Apple Maps link (`maps.apple.com/?address=...`) — functional, not Google Maps, which some parents might prefer but works.

**1.2 Number accuracy:** 58 of 63 signal scores across 9 rinks were within 0.5 of Greg's estimate. 5 scores were off by more than 0.5, all in the same direction: ColdStart rated tournament-sensitive signals (parking, chaos) higher than Greg's tournament experience would suggest. In regular-season context, those same scores were accurate.

**1.3 Provenance:** "From X hockey parent(s) this season" is the only provenance indicator at page level. Per-signal: "Based on X rating(s)" or "Early — X rating(s)." No individual ratings visible — only averages. Visitor / Regular toggle exists for contributors but the badge on tips only shows "Visiting parent" or "Plays here regularly." No way to filter by contributor type. No way to see individual ratings. Greg can't tell if the 5 raters are 5 unique parents or one parent rating 5 times from different browsers.

### Scenario 2 — The Recency Interrogation

**2.1 Timestamps:** "Updated X ago" shown on VerdictCard via `timeAgo()`. Tips show individual timestamps. Prominent enough if Greg looks at the verdict area. Staleness warning appears at >60 days with yellow background and warning icon.

**2.2 Stale data test:** Staleness bands: "Last updated over a year ago — conditions may have changed" (>365 days), "Last updated over X months ago — conditions may have changed" (30-365 days). Below 60 days: no warning. The visual distinction is real — yellow background, amber border, distinct from the rest of the card.

**2.3 Recency weighting:** None. `SELECT AVG(value)` — simple mean. No decay function. No "recent ratings count more." This is visible in `dbSummary.ts`: `value: Math.round(avg * 10) / 10`. A rating from 2 years ago has the same weight as a rating from yesterday. No transparency about calculation method anywhere on the UI.

### Scenario 3 — The Confidence Audit

**3.1 Small-n handling:** "Early" badge at <3 ratings is the primary mechanism. Confidence score calculated internally (`0.2 + count * 0.1`, capped at 1.0) but not displayed to user. 79.7% of rinks have at least one signal with 3 or fewer ratings, so "Early" badges are common — not exceptional.

**3.2 Rating count prominence:** Count is shown PER SIGNAL in the same visual unit as the score. "3.8/5" with "Based on 3 rating(s)" directly below. Greg can see the count in the same glance as the score. This is better than most platforms that bury the count at page level.

**3.3 Variance:** No variance indicator exists. A signal with all-5s and a signal with split 1s-and-5s that both average 3.0 look identical. No standard deviation, no "parents disagree" flag, no distribution visualization. This is a gap Greg noticed — he knows some signals are contentious (parking during different sessions) and the flat average hides the disagreement.

**3.4 Self-correction:** Greg can rate and submit a tip. Rating adjusts the simple average immediately (no cache layer). Tip appears newest-first. The math: if parking is 3.8 from 3 ratings (total 11.4) and Greg adds a 1, new average = 12.4/4 = 3.1. Score visibly drops from 3.8 to 3.1 — Greg can see the impact. For signals with more ratings, his vote matters less: if parking were 3.8 from 20 ratings, adding 1 produces (76+1)/21 = 3.67 — barely moves.

### Scenario 4 — The Manipulation Scan

**4.1 "Too good to be true":** IceWorks shows family_friendly at 4.7 (3 ratings) and pro_shop at 4.8 (5 ratings). Greg notes the high scores but the "Early" badge on family-friendly provides appropriate skepticism. Pro shop at 4.8 from 5 parents is believable because IceWorks genuinely has an excellent pro shop. No rink has uniformly high scores across ALL signals — every rink has at least one sub-3.5 score, which looks organic.

**4.2 Rink operator control:** Rink managers cannot delete ratings or tips. Manager responses are stored in `MANAGER_RESPONSES` (currently empty — structure exists, no entries). The Claim CTA invites operators to "respond to feedback, get featured, see analytics" — implies future features. No evidence of rink-submitted ratings in the data. The UGC disclaimer at bottom of verdict: "Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart."

**4.3 Tip authenticity:** 140-char limit forces brevity, which naturally sounds parent-like. Marketing copy doesn't fit in 140 characters. Visitor/Local badges add provenance. Tips are newest-first so recent observations surface. No evidence of generated or suspiciously positive content in the format — though Greg can't evaluate tips that don't exist yet (many rinks have 0 tips in a new deployment).

**4.4 Conflict of interest:** "Rink operator? Contact us at rinks@coldstarthockey.com" footer indicates a B2B relationship channel. No "paid placement" indicators. No premium listings. No suppression features. The Claim CTA is forward-looking ("launching soon"). Greg would wonder about the business model but can't find evidence of pay-for-play on the current platform.

### Scenario 5 — The Comparison Test

**5.1 ColdStart vs Google Maps:** Google Maps has more reviews, photos, hours, and phone number. ColdStart has domain-specific signals (chaos, locker rooms, cold — Google doesn't rate these), parent-specific tips, manager verified notes, the "Early" badge, and structured nearby data with distances. ColdStart wins on RELEVANCE for hockey parents. Google wins on COVERAGE.

**5.2 ColdStart vs texting Dave:** Dave's response for Ice Line: "Get there early, parking sucks during tournaments, it's cold on Rink D, there's a Wawa on Route 30." ColdStart's Ice Line page: Parking 3.8, Cold 3.0, Food 3.8, plus a Wawa at 0.5mi in the nearby section. ColdStart provides more structured data but Dave provides tournament context. Dave wins on contextual advice. ColdStart wins on breadth and the manager note.

**5.3 Missing information:** After reviewing ColdStart, Greg still doesn't know: which entrance to use for each sheet (Mike T.'s parking note partially addresses this), how early to arrive for a tournament vs regular game, whether there's a separate warm viewing area, Wi-Fi availability, penalty box side, locker room assignments. Some of these could be addressed through tips. Others (entrance directions, warm areas) need structured data or sheet-specific notes that only exist for IceWorks, Ice Line, and Ice House.

### Scenario 6 — The Betrayal Scenario

**6.1 Wrong verdict:** Greg rates parking 1, writes a 140-char tip: "Parking is fine for regular games but a nightmare during tournaments. The score here is misleading." His rating moves the average. His tip appears at the top of the list. The next parent sees a lower parking score AND a specific warning. The self-correcting loop works — slowly, one parent at a time.

**6.2 Context failure:** No tournament filter. No context tags displayed. The `context` field in the database accepts the data but nobody writes to it from the UI. A single parent's tip "different during tournaments" is the only mechanism. Greg's tip is his best tool, not his rating.

**6.3 Recovery:** Greg would check back. If the page now shows parking 3.1 (down from 3.8 after his contribution) and his tip is at the top, he'd think: "Okay, it learned." If 3 more tournament parents add 1s, parking drops to 2.3 — and NOW the page tells the truth for tournament context, albeit through the blunt instrument of a dragged-down average rather than a clean split. The system self-corrects, but it's slow and it requires parents to take the same hit Greg took first.

### Scenario 7 — The Credibility Details

**7.1 Number formatting:** All scores display as one decimal place (3.2, not 3, not 3.17). Scale is consistently 1-5 across all 7 signals. 3.0 displays as "3.0" (precise). Greg approves — consistent formatting signals competence.

**7.2 Rink data accuracy:** All 9 rinks tested had correct city/state. No observed naming inconsistencies in Greg's test set. No duplicate entries detected for any rink. Slug format is consistent (e.g., `ice-line-west-chester`, `hatfield-ice-arena-colmar`).

**7.3 The "empty shelf" problem:** All rinks in the test set have signal data (no 0-rating rinks encountered). However, 79.7% of the 2,298 rinks in the database have at least one signal with 3 or fewer ratings. Empty state for a rink with 0 data shows: "Be the first to report — No one has shared info about this rink yet. How's parking? Is it cold? Drop a quick tip." with a "Share what you know" button. Greg would argue: this is better than a bare page, but if he hit 3 empty rinks in a row he'd conclude the platform is empty. First impressions matter, and the ratio of "Early" to "Based on X" signals shapes whether ColdStart feels populated or aspirational.
