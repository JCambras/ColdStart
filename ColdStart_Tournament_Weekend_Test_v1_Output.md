# ColdStart Tournament Weekend Stress Test — After-Action Report
## Presidents' Day Classic, Lehigh Valley PA
### Eval executed: 2026-02-21

---

## THE WEEKEND VERDICT

ColdStart made the tournament weekend meaningfully better for the 3 out of 6 personas whose needs aligned with its current model: Amy (team logistics via Trip Builder), Denise (between-games food/directions), and Marcus (post-game contribution). It was partially useful for Rich (first-timer, anxiety reduction via Trip page Glancer mode) and Priya (experienced mom, baseline rink info). It was essentially useless for Tom (coach, operational needs). The information did flow — Marcus's 4 PM tip appeared for anyone loading the page at 4:01 PM, and Amy's Trip pages gave 18 families a single link with directions, parking verdicts, and food options. The platform got smarter by Sunday: 10-15 new ratings shifted signal averages meaningfully (with only 5 prior votes, 10 new votes produce a 2:1 ratio that moves averages by 0.3-0.8 points). But the fundamental tension surfaced hard: ColdStart's time-averaged model couldn't distinguish "tournament Saturday parking chaos" from "regular Tuesday evening" — and the dead `context` field, plumbed through API and database but never wired to UI, is the exact architectural seam that would resolve it.

---

## THE TIMELINE

### THURSDAY 10:00 PM — Amy Lester, Team Manager

**Action:** Amy opens ColdStart and navigates to `/trip/new` to build Trip pages for her Downingtown Cougars PeeWee A team.

**Trip 1 — Steel Ice Center (Friday game):**
- Amy selects Pennsylvania in the state filter, searches "Steel Ice" — result appears immediately with city "Bethlehem" and state "PA" clearly displayed.
- She fills in: team name ("Downingtown Cougars PeeWee A"), date (Friday), selects Steel Ice Center from the rink dropdown.
- **Game schedule section:** She adds one game — Friday 5:00 PM vs Morristown Mustangs, sheet: "Main" (Steel Ice is single-pad, so this is the only option, though Amy may not know that).
- **Lodging via NearbyPicker:** The picker surfaces only 2 options — Comfort Suites Bethlehem (0.4 mi) and a private rental listing (0.5 mi). No Hampton Inn, no Holiday Inn, no chain hotels that tournament parents actually book. Amy knows her families are at a Hampton Inn but can't select it from the picker. She types it into the notes instead.
- **Food via NearbyPicker:** Steel Ice has solid food data — Sizzling Bites Halal (0.2 mi), The Steel Pub (0.1 mi), BeneCasa's Pizzeria, Subway (0.3 mi). Amy picks The Steel Pub for post-game dinner. The directions link works (Google Maps).
- **Notes for the team:** Amy types: "Tournament weekend — arrive 45 min early, parking fills up fast. Steel Ice is COLD, bring extra blankets. Single-sheet rink, one entrance."
- **Collaborative mode:** On by default. Good — other parents can add restaurant finds or tips during the weekend.

**Trip 2 — Lehigh Valley Ice, Coplay (Saturday games):**
- Amy searches "Lehigh Valley" — **two results appear with identical names**: "Lehigh Valley Ice" (Coplay, PA) and "Lehigh Valley Ice" (Allentown, PA). The cities are displayed below each name, but the names themselves are identical. Amy knows the tournament is at the Coplay location (904 Chestnut St) because she checked the tournament PDF, but she has to read the city carefully. She picks correctly.
- She adds two Saturday games with opponents and times.
- **Lodging via NearbyPicker:** Coplay shows 4 options — Wacu's Landing (0.3 mi), Columbia House (0.5 mi), The Laurel Fox Hotel (1.4 mi), and a 60-day-minimum rental (1.7 mi). All boutique/B&B. None are the chain hotels her families actually booked. The Hampton Inn, Holiday Inn Express, Homewood Suites — those are all near the **Allentown** location, 15 minutes away. Amy can't surface them from the Coplay rink page. She writes "Most hotels are near the Allentown Lehigh Valley Ice — 15 min drive to Coplay" in the notes.
- **Food via NearbyPicker:** Coplay has 10 quick_bite + 5 team_lunch + 6 dinner options. Amy picks Chick-fil-A (1.8 mi) for between-games lunch and Thai Diner (0.1 mi) for dinner.

**Step count:** From opening ColdStart to having 2 shareable Trip pages: ~45 taps/steps total (rink search + selection + 3-4 game entries + food/lodging picks + notes + save, times 2). The one-rink-per-trip limitation is mildly annoying (she has to create two separate pages) but actually helps: each Trip link is a self-contained venue guide that works standalone in the group chat. Parents going only to the Saturday games don't need Friday's info cluttering their view.

**Share:** Amy taps "Share with team" on each Trip page. The share text is: `Downingtown Cougars PeeWee A at Steel Ice Center — Fri Feb 20\n\nGame day info: [URL]`. On iOS, this opens the native share sheet. She sends both links to her iMessage group. Done.

**What Amy couldn't do:**
- She couldn't indicate "this is a tournament weekend" anywhere except the free-text notes field. The `context` field in the database (`signal_ratings.context`, `tips.context`) exists and the API accepts it, but the Trip Builder doesn't set it and there's no tournament-context toggle.
- She couldn't link the two trips together as a "Presidents' Day Classic tournament package."
- The verdict text on each rink page reflects all-time averages, not tournament-day conditions. Amy knows this from experience and compensates in her notes. A first-timer wouldn't.

---

### THURSDAY 10:30 PM — Rich Dominguez, First-Time Tournament Dad

**Action:** Rich's friend from another team forwards Amy's Trip link for Lehigh Valley Ice (Coplay) — his son's Trenton Thunder Squirt B plays there Saturday too.

**Glancer mode activation:** Rich taps the link. The vibe engine classifies him as a **Glancer** (arrived via shared link, first visit, no prior ColdStart activity). He lands on the Trip detail page in Glancer view: a compact card showing:
- Rink address: 904 Chestnut St, Coplay, PA 18037 (tappable Apple Maps link)
- Next game time and opponent (from Amy's schedule — but this is Amy's team's game, not Rich's)
- Parking verdict from signals
- No entrance tip (Steel Ice has no SHEET_NOTES; Coplay also has none)
- "See full trip details" button with count: "3 games, hotel, costs"

**Does Glancer mode help?** Partially. Rich gets the address and parking score, which are the two highest-anxiety items for a first-timer. The Apple Maps link means he can tap and save the destination now, Thursday night, and not fumble for it Saturday morning. But the game schedule shown is Amy's team's games — not Rich's. This is a Trip-specific issue: Trip pages are team-specific. Rich would need his own team's Trip page, or to search the rink directly.

**Rich searches on his own:** He opens ColdStart and searches "Lehigh Valley Ice." **Two results appear with identical names.** "Lehigh Valley Ice" — Coplay, PA. "Lehigh Valley Ice" — Allentown, PA. The cities are displayed, but Rich's tournament PDF says "Lehigh Valley Ice Arena" with no address. He has no way to know which one. He might guess Allentown because it's a bigger city. He'd be wrong. **This is the single biggest UX landmine in the tournament weekend** — and ColdStart doesn't resolve it. The cities are shown, but there's no disambiguation helper, no "Did you mean the one at 904 Chestnut St?" prompt, no address preview in the search results.

**What Rich doesn't know that the page should tell him:**
- How early to arrive for a tournament game (the general norm is 45 min, but he's never done this)
- Whether there's a tournament check-in table
- Where to go once inside (locker room assignment, jersey pickup)
- Whether spectators can watch from the stands during all games

None of these are in the signal model. None are in the tips (tips are from regular-season visits). The Trip page notes might help — Amy wrote "arrive 45 min early" — but Rich is reading someone else's team's Trip page.

**Rich's anxiety level:** HIGH entering, MEDIUM after seeing the Glancer card (he has an address and knows parking is decent). But the Lehigh Valley name collision could spike it back to HIGH if he second-guesses which rink to drive to.

---

### SATURDAY 5:45 AM — Priya Nair, Experienced Hockey Mom

**Action:** Priya opens the Steel Ice Center page on ColdStart. She knows the rink. She's looking for the delta from normal.

**What she sees:**
- **Verdict:** Based on overall signals (parking 3.0, cold 3.3, food 2.5, organization 2.2, family_friendly 4.1). The verdict reflects historical averages. Nothing indicates today is a tournament day.
- **Signals:** All time-averaged. Parking shows 3.0/5 from 5 votes. This is the average across all visits — not this morning's lot, which at 5:45 AM is half empty (it'll overflow by 8 AM).
- **Tips:** Sorted newest-first. If any parents have tipped about tournament conditions at Steel Ice, they'd appear at the top. But it's 5:45 AM Saturday — nobody has contributed yet this weekend.
- **Freshness indicator:** The VerdictCard shows a freshness badge. If the last rating was >7 days ago, it shows a plain gray timestamp. If >60 days, it shows an amber warning. But even a "2 days ago" badge doesn't tell Priya whether that rating was from a tournament or a Tuesday practice.

**The "is it different today?" answer:** No. ColdStart cannot tell Priya that today is different. There's no tournament indicator, no "live conditions" overlay, no time-filtered view. The signals represent average conditions across all visits. Priya doesn't realize the 3.0 parking score reflects a typical visit — at 5:45 AM it's fine, by 8 AM it'll be pandemonium, and neither scenario is captured by "3.0."

**No disclaimer or framing** explains that signals are historical averages. Priya might assume "Parking: 3.0" means parking is mediocre right now, which at 5:45 AM would be wrong (it's fine) and at 8 AM would be generous (it's terrible).

**Real-time gap:** This is ColdStart's fundamental model limitation for tournaments. The platform aggregates ratings over time to build stable, trustworthy signals. Tournaments create hour-by-hour volatility. One new rating moves a 5-vote average by 0.17-0.33 points — not enough to signal "conditions changed in the last hour." The tip feed is the only real-time signal: if Marcus tips at 4 PM, Priya sees it at 5 PM. But tips are text, not structured data — there's no "parking is bad RIGHT NOW" alert.

---

### SATURDAY 5:45 AM — Tom Brennan, Away Coach

**Action:** Tom is sitting in the Steel Ice Center parking lot. First game at 7 AM. He's never been here. He opens ColdStart on his phone.

**What he needs:** Which entrance has locker room access. Does his team have a locker room. How early before game time should they be inside. Where do spectators go vs. players.

**What ColdStart shows him:**
- Signal badges: Parking 3.0, Comfort 3.3, Food Nearby 2.5, Organization 2.2, Family-Friendly 4.1. **None of these answer Tom's questions.** He already parked. He can feel the cold. He doesn't need food at 5:45 AM. The signals are irrelevant to his immediate need.
- Address: 320 E 1st St, Bethlehem, PA 18015 (he's already here).
- Tips: If any user-submitted tips mention "use the main door" or "locker rooms are to the left," Tom would find them. But the tips are from parents, not coaches, and focus on spectator experience (parking, food, temperature). No operational facility info.
- **No SHEET_NOTES** for Steel Ice Center. This is correct — it's single-pad — but Tom doesn't know that until he walks inside.
- **No entrance directions**, no locker room info, no warm-up schedule guidance.
- The "Compare rinks" button links to `/compare?rinks=steel-ice-center-bethlehem` — which **404s**. The Compare route doesn't exist. A broken affordance on the page Tom is looking at, though irrelevant to his immediate need.

**Tom's 30-second test:** ColdStart does not earn those 30 seconds. Tom sees numbers about parking and food. He needs "front entrance, locker rooms on the right, warm-up starts 15 minutes before game time." He closes the app and walks inside to ask someone.

**Coach as user type:** The Visitor toggle offers "Visiting" and "Regular" — both parent-oriented. There's no "Coach" contributor type. The signal model (parking, food, cold, organization, family_friendly, locker_rooms, pro_shop) is designed for spectator parents. Locker_rooms is the closest signal to a coach's need, but it rates spaciousness, not location or assignment. ColdStart doesn't actively exclude coaches — the page is just neutral toward them. The data model doesn't have fields for operational facility info (entrance locations, locker room count, referee room, warm-up protocols). This is a category of valuable data that never enters the system because coaches aren't part of the contribution loop.

---

### SATURDAY 11:15 AM — Denise Kowalski, Rink-Hopping Mom

**Action:** Denise just left Steel Ice Center. Game at Lehigh Valley Ice (Coplay) at 1 PM. She has 4 kids in the car and 75 minutes until warm-up arrival.

**The Lehigh Valley name collision (again):** Denise types "Lehigh Valley" into ColdStart search. Two identical-name results appear. She needs Coplay. If she drove from Steel Ice Center (Bethlehem), Coplay is ~15 minutes north. Allentown is ~20 minutes west. She has to read the city name carefully. The rink address IS shown — and it's a tappable Apple Maps link. If she picks the right one and taps the address, she gets turn-by-turn directions. That works. But the moment of confusion is real, and with 4 kids screaming, misreading "Coplay" vs "Allentown" is plausible.

**No rink-to-rink navigation:** If Denise is already on the Steel Ice page, there's no "Other tournament rinks" or "Nearby rinks" suggestion linking to Lehigh Valley Ice. She has to go back to search. Not a major friction point, but a missed opportunity — the Trip Builder knows both rinks are in the same tournament, but the rink pages don't cross-reference.

**The team lunch problem:** Denise opens the Lehigh Valley Ice (Coplay) page and scrolls to the Nearby section.

She sees food organized by category:
- **Quick bite** (10 options): Dunkin' (0.7 mi), Mario's Pizza Shop (0.9 mi), Happy Garden (1.0 mi), Wawa (1.3 mi), Chick-fil-A (1.8 mi), Wendy's (1.8 mi), Arby's (1.9 mi), Subway (2.0 mi), JJ's Sushi (2.2 mi)
- **Team lunch** (5 options): Eastern Chinese Restaurant (1.0 mi), Baked By Mais (1.0 mi), Mrs.pattery (1.6 mi), Kogelman Distributing Co (2.0 mi), Egypt Star Bakery (2.2 mi)
- **Dinner** (6 options): Thai Diner (0.1 mi), Coplay Eatery (0.2 mi), The Bacon Strip (0.5 mi), Samuel Owens Restaurant & Bar (0.5 mi)

**Does the categorization help Denise decide fast?** Partially:
- The `team_lunch` vs `quick_bite` distinction is genuinely useful — Denise wants something that seats 5 with real food, not a drive-through.
- But the team_lunch data quality is uneven: "Kogelman Distributing Co" is likely not a restaurant (it reads like a wholesale distributor). "Mrs.pattery" is unclear. "Eastern Chinese Restaurant" and "Baked By Mais" are plausible team lunch spots.
- **No "open now" indicator.** It's 11:15 AM Saturday — is Thai Diner open for lunch? Egypt Star Bakery? Denise doesn't know from ColdStart.
- **No group-seating indicator.** Can Eastern Chinese fit a table of 5 quickly on a Saturday?
- **No drive-time estimate.** Just distance in miles. "1.0 mi" in a town means ~3 minutes; "2.2 mi" might mean 8 minutes. Fine, but Denise is doing mental math under pressure.
- Each place name links to Google Maps — so she can tap and go. That's the critical feature and it works.

**Did Amy pre-select a lunch spot in the Trip Builder?** If Amy picked Chick-fil-A in the NearbyPicker when building the Coplay Trip, it appears on the shared Trip page with a directions link. If Denise is checking the Trip page (not the rink page), the lunch spot is already chosen. **This is the Trip Builder's value proposition** — pre-curated logistics. If Amy used it, Denise's problem is solved. If Amy didn't (or if Denise is looking at the rink page instead), she's scanning 21 food options with one hand while 4 kids argue about where to eat.

**Time pressure math:** 11:15 AM → 12:30 PM arrival → 60 minutes for lunch → drive to rink (15 min from Steel Ice). That's 45 minutes to eat. Quick bite is safer than team lunch for a 45-minute window. Does ColdStart help Denise calculate this? No — and it shouldn't. But the quick_bite/team_lunch distinction implicitly guides her toward the faster option.

---

### SATURDAY 4:00 PM — Marcus Webb, Angry Dad

**Action:** Marcus's team just lost after a 25-minute Zamboni delay at Steel Ice Center. His kid froze in the locker room. Parking was a mud pit. He opens ColdStart.

**The emotional state and signal interpretation:** Marcus sees Steel Ice Center's Organization signal at **2.2/5** from 5 votes. The signal is now labeled "Organization" (renamed from "chaos" in a recent update) with scale labels: "Hectic" (1) ← → "Calm" (5). The SignalBar shows "← Hectic ... Calm →" with the value positioned at 2.2.

**Does the presentation match his experience?** Actually, yes — 2.2 on a scale where 1 is "Hectic" means "closer to hectic." The existing data already flags this rink as poorly organized. But here's the interpretation challenge: Marcus sees "Organization: 2.2/5" and his first instinct might be "only 2.2 out of 5 — bad." Which is correct. The label "Organization" with "← Hectic" at the low end communicates the direction clearly. The expanded SignalBar shows: "How organized and easy to navigate is the rink? Lower means crowded lobbies, confusing layouts, and overlapping game times." This info text validates Marcus's experience.

**Trust moment:** Marcus's experience confirms the existing data. The platform IS presenting a reality that matches what he lived through. This is a positive trust signal — he's more likely to contribute because the data resonates. If the Organization score had been 4.5 ("Calm"), Marcus would have felt gaslit and likely abandoned the platform.

**Rating attempt:** Marcus taps "Rate the rink." The ContributeFlow opens with the VisitorToggle (✈️ Visiting / Regular) — Marcus selects "Visiting." Then QuickVoteRow shows 7 signals with 1-5 buttons each.

- He rates Parking: **1** (mud pit)
- He rates Organization: **1** (Zamboni breakdown, 25-min delay, chaos)
- He rates Comfort: **1** (kid froze in locker room)
- He might rate Food: **1** (concession stand out of hot chocolate) or skip it

Each rating submits immediately via POST to `/api/v1/contributions`. Each gets a green checkmark. Satisfying feedback loop for an angry user — he sees his input register instantly.

**Tournament context:** There is no "Tournament day" toggle. The Visitor/Regular toggle captures his contributor type as `visiting_parent`. But there's nothing to distinguish "I visited during a tournament and conditions were extreme" from "I visited on a regular Tuesday." The `context` field exists in the database schema (`signal_ratings.context TEXT`) and the API accepts it (`context || null` in the POST body), and `getRatingContext()`/`setRatingContext()` helpers exist in `lib/storage.ts` — but no UI component ever calls them. The wiring is there. The switch is missing.

Marcus's tournament-day ratings of 1-1-1 will drag down averages without any mechanism to separate them from regular-season data. This is accurate (the rink WAS terrible today) but potentially unfair (it's not always this bad). Without context tagging, there's no way to later filter "tournament ratings" from "regular ratings."

**The tip that captures the moment:** Marcus wants to write: "Tournament day was rough. Zamboni broke before our 7 AM game, 25-minute delay, kids freezing in the locker room. Parking lot was a swamp in the rain. Bring boots and patience."

That's 185 characters. ColdStart enforces **140 characters** — both frontend (`maxLength={140}` on the textarea in ContributeFlow) and backend (API returns 400 for >140). The ContributeFlow textarea shows a character counter: "X/140" — visible as Marcus types, turning amber at 120 and bold at 130. He sees himself approaching the limit and has to cut.

What fits in 140: "Tournament day: Zamboni broke, 25-min delay, kids froze in locker room. Parking was a mud pit in rain. Bring boots." (116 chars). He loses "and patience" and the emotional texture, but keeps the essential warning. The character counter prevents a post-submit rejection — Marcus sees the limit in real time and self-edits. Better than a 400 error after hitting send.

**After submission:** The tip appears in the database immediately (no moderation queue, no cache). Tips display newest-first. The next parent who loads Steel Ice Center's page sees Marcus's warning at the top of the tips section.

**The math on signal shift:**
- Parking: was 3.0 from 5 votes. Marcus rates 1. New average: (3.0 x 5 + 1) / 6 = **2.67**. A shift of -0.33.
- Organization: was 2.2 from 5 votes. Marcus rates 1. New average: (2.2 x 5 + 1) / 6 = **2.0**. A shift of -0.2.
- Comfort: was 3.3 from 5 votes. Marcus rates 1. New average: (3.3 x 5 + 1) / 6 = **2.83**. A shift of -0.47.

One voter moved averages by 0.2-0.47 points. Noticeable on the 1-5 scale? Barely — the signal badges might not change color thresholds. But Marcus's **tip** is the real signal. The specificity ("Zamboni broke, 25-min delay") and recency timestamp ("just now" → "4h ago" → "1d ago") make it the most informative item on the page for the next 48 hours.

**Tip timestamp display:** The `timeAgo()` function in `lib/rinkHelpers.ts` shows:
- <60 sec: "just now"
- Minutes: "Xm ago"
- Hours: "Xh ago"
- Days: "Xd ago"
- Older: "Mon, Jan 15" format

If Amy checks the page Sunday morning, Marcus's tip shows "18h ago" — clearly from today/yesterday. The recency is communicated effectively.

---

### SATURDAY 5:00 PM — The Cross-Character Flow

**Flow 1: Amy → Rich (via Trip page)**
Amy shared Trip links Thursday night. Rich received one via a friend-of-a-friend forward. The Glancer quick view gave Rich the rink address and parking verdict — enough to save the destination and know parking is manageable. But the Trip page showed Amy's team's game schedule, not Rich's. Rich would need to scroll past irrelevant game times to find the rink info. The full Trip page (after tapping "See full trip details") showed lodging, food picks, and Amy's notes ("arrive 45 min early"). This gives Rich a mental model for tournament logistics even though it's another team's trip. **Verdict: Partial success.** Rich got the address and some context, but the Trip page's team-specificity limits cross-team utility.

**Flow 2: Marcus → Priya (via tip)**
Marcus rates at 4 PM. Priya checks the page at 5 PM for Sunday morning planning. The API recalculates on every contribution — no cache layer. Marcus's tip appears newest-first with timestamp "1h ago." Priya reads: "Tournament day: Zamboni broke, 25-min delay, kids froze in locker room. Parking was a mud pit in rain. Bring boots." The specificity and recency make this actionable. Priya now knows: (a) the Zamboni is unreliable, so arrive with extra time buffer, (b) parking was bad in rain (she can check the Sunday forecast), (c) it was cold even by Steel Ice standards.

Does she interpret it as a one-time incident? Probably not — the tip says "tournament day," which signals recurring conditions. But there's no structured way to confirm "was this during a tournament?" vs "was this a regular Tuesday." **Verdict: Success.** The tip flows in near-real-time and is specific enough to be actionable.

**Flow 3: Tom → Nobody**
Tom had a frustrating experience — couldn't find the entrance, no locker room assignment, no warm-up guidance. But Tom is a coach. He doesn't think of himself as a ColdStart user. The Visitor/Regular toggle doesn't include "Coach." The signals don't cover his information needs. Tom never rates, never tips, never enters his operational knowledge into the system. His information — which entrance to use, where locker rooms are, warm-up timing — would be the most valuable tip on the page for the next away coach. It's lost. **Verdict: Failure.** ColdStart's contribution loop doesn't capture coach knowledge. This is a category of high-value data that the platform systematically misses.

**Flow 4: This Tournament → Next Tournament**
A different team plays a tournament at these same rinks in 3 weeks. Their team manager opens ColdStart. What's different from Amy's Thursday experience?
- Marcus's tip is still visible (newest-first, timestamped "3w ago" — in the "Mon, Feb 21" format now).
- Signal averages shifted: Parking 2.67 (was 3.0), Organization 2.0 (was 2.2), Comfort 2.83 (was 3.3). If 10+ parents rated over the weekend, averages shifted more dramatically. With 5 original + 10 new votes, the weekend's data has 2:1 weight. If 8 of those 10 tournament parents rated parking as 1-2, the new average drops to ~2.0.
- The next team manager knows: parking is tough, organization is weak, comfort is poor, and someone's specific tip warns about Zamboni issues.
- **Without the `context` field wired up**, these tournament-specific tips are mixed with future regular-season tips. In 3 weeks, if 5 regular-season parents rate parking as 3-4, the average drifts back up, and the tournament-specific signal dilutes. A "tournament" context filter would let the next team manager see ONLY tournament-tagged ratings — but that filter doesn't exist in the UI.

---

## THE TOURNAMENT SCORECARD

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Pre-tournament prep** | 3.5/5 | Amy's Trip Builder workflow covered logistics well. Rich's cross-team Trip page gave partial help. The Lehigh Valley name collision is a real hazard for prep — Rich could save directions to the wrong rink Thursday night and not discover the error until Saturday morning. |
| **Trip Builder adoption** | 4.0/5 | The Trip Builder is functional and well-structured. NearbyPicker surfaces food/lodging with directions links. One-rink-per-trip limitation is a minor friction for multi-rink tournaments but actually organizes info better per venue. Collaborative mode lets parents add finds. The hotel gap (boutique B&Bs at Coplay vs. chain hotels near Allentown) is a data coverage issue, not a Trip Builder design flaw. |
| **Morning-of arrival** | 2.0/5 | Priya got baseline signals but no indication of tournament-day conditions. Tom got nothing useful — no entrance directions, no locker room info, no operational facility data. The signals are irrelevant to someone who's already parked and standing outside. The morning-of use case needs operational info, not rating averages. |
| **Between-games utility** | 3.5/5 | Denise found food categories and directions links. The quick_bite/team_lunch distinction helped. But 21 food options under time pressure is a lot, data quality is uneven ("Kogelman Distributing Co" in team_lunch), and there's no "open now" or group-seating filter. If Amy pre-selected a lunch spot in the Trip Builder, Denise's problem was solved. Otherwise, she's scrolling. |
| **Nearby discoverability** | 3.0/5 | Categories exist and are labeled clearly. Google Maps links work. Vote scores provide weak social proof. But the data is not curated for tournament parents: no "kid-friendly" filter, no "seats 10+" indicator, no hours data. The hotel mismatch between Coplay (boutique B&Bs) and Allentown (chain hotels) is a real coverage gap for tournament parents staying at chain hotels near the wrong rink. |
| **Post-game contribution** | 4.0/5 | Marcus successfully rated 3 signals and submitted a 116-character tip. The character counter prevented a frustrating post-submit rejection. Immediate submission with green checkmarks gave satisfying feedback. The Visitor toggle captured his contributor type. The contribution flowed to the database instantly. Missing: tournament-context tagging (the `context` field is plumbed but not exposed). |
| **Real-time accuracy** | 1.5/5 | ColdStart's signals are historical averages. One rating from Marcus moved the average by 0.2-0.47 points — not enough to signal "conditions changed today." There's no time-filtered view, no "today's conditions" overlay, no real-time element. The tip feed is the only near-real-time signal, and it works (newest-first, relative timestamps), but it's unstructured text, not queryable data. |
| **Tournament context** | 1.0/5 | Zero tournament awareness in the UI. The `context` field exists in the schema, the API accepts it, and localStorage helpers are defined — but nothing wires it to any component. Tournament ratings are indistinguishable from regular-season ratings. No toggle, no filter, no tag. The architectural plumbing is complete; the UI integration is entirely missing. |
| **Cross-parent information flow** | 3.5/5 | Amy → Rich worked via Trip page sharing. Marcus → Priya worked via newest-first tip display with relative timestamps. But Tom → Nobody is a systemic gap — coach knowledge never enters the system. The no-cache API means contributions appear immediately, which is the right architectural choice for tournament-day information flow. |
| **Weekend learning** | 3.0/5 | Sunday's data is better than Thursday's — 10-15 new ratings shift averages meaningfully (2:1 ratio over 5 original votes), and Marcus's tip adds specific tournament intelligence. But the improvement is undifferentiated — tournament-specific wisdom is mixed with the overall average. There's no "this rink was recently rated by many parents" indicator to signal freshness or momentum. The VerdictCard freshness badge shows "Updated Xh ago" but doesn't indicate volume. |
| **Multi-rink handling** | 2.5/5 | The one-rink-per-trip model works for organizing info per venue. But the Lehigh Valley name collision is unresolved — two rinks with identical names, different cities, 15 minutes apart. The city names ARE displayed in search results, but they're insufficient when tournament PDFs don't specify city. No disambiguation prompt, no address preview in search results, no "these rinks have similar names" warning. Parents could drive to the wrong rink. |
| **Coach usability** | 1.0/5 | ColdStart is designed for spectator parents. The signal model doesn't cover facility operations. The contributor types are "Visiting" and "Regular" — no "Coach." The tip model could accommodate coach tips, but the prompt ("One thing parents should know...") is parent-focused. Tom's operational knowledge never enters the system. ColdStart doesn't actively exclude coaches — it just doesn't acknowledge they exist. |

**Overall tournament weekend score: 2.5/5**

---

## THE FUNDAMENTAL MODEL QUESTION

ColdStart's time-averaged model is **adequate for tournament weekends at the "preparation" layer** — parents planning a trip 2-7 days out get useful baseline information (parking is generally tough, the building is cold, food is available). It is **inadequate for the "game-day" layer** — real-time conditions that change by the hour (parking lot flooded at 8 AM, Zamboni broke at 6:30 AM, schedule running 25 minutes behind). These are two different information needs, and ColdStart currently serves only the first.

The Waze real-time model (ephemeral hazard reports, crowd-sourced conditions, auto-expiring data) would solve game-day accuracy but would break the stable-signal model that makes ColdStart trustworthy for preparation. A parent checking "Parking: 3.2" two weeks before a game wants that to be a reliable average, not a number that fluctuates hourly.

The `context` field provides the correct middle path: tag contributions with context (`tournament`, `regular_season`, `playoff`, etc.), keep the core time-averaged model intact, but enable filtered views. The default view shows the all-time average (stable, trustworthy). A "Tournament conditions" filter shows only tournament-tagged ratings (volatile, recent, situational). This preserves both use cases without breaking either.

**Is that enough?** For v1, yes — with two additions:
1. The `context` toggle in the UI (minimum viable: a "Tournament day" / "Regular season" selector next to the Visitor/Regular toggle). No schema or API changes needed.
2. A "Recent tournament" badge on rink pages when >3 tournament-tagged contributions exist in the last 30 days, linking to the filtered view.

This won't deliver Waze-style real-time reporting. But it will let the next team manager filter for "what happened at this rink during tournaments" — which is 80% of the value at 10% of the implementation cost.

---

## THE THREE FEATURES THIS WEEKEND DEMANDS

### 1. Context Toggle — Wire the Dead `context` Field

**What broke without it:** Marcus's tournament-day ratings (Parking: 1, Organization: 1, Comfort: 1) permanently drag down the all-time averages with no way to distinguish "this happened during a chaotic tournament" from "this is what the rink is always like." The next team manager in 3 weeks can't filter for tournament-specific conditions. As regular-season ratings accumulate, tournament wisdom dilutes.

**Who was affected:** Marcus (couldn't tag his experience), Priya (couldn't filter for tournament conditions), the next tournament's team manager (can't see tournament-only data), and the rink itself (unfairly penalized by tournament-day chaos that doesn't reflect normal operations).

**Minimum viable scope:**
- Add a toggle next to the Visitor/Regular selector in ContributeFlow and ReturnRatingPrompt: "Tournament day" / "Regular season" (default: Regular season).
- When "Tournament day" is selected, set `context: 'tournament'` in the POST body. The API already accepts and stores it. The schema already has the column.
- On the rink page, if >3 tournament-tagged contributions exist in the last 60 days, show a "Tournament reports" badge that opens a filtered tip/signal view.
- **Zero schema changes. Zero API changes. Just UI wiring + a filtered query.**

### 2. Lehigh Valley Disambiguation — Same-Name Rink Warning

**What broke without it:** Rich and Denise both encountered two search results with the identical name "Lehigh Valley Ice" — one in Coplay, one in Allentown, 15 minutes apart. The tournament PDF says "Lehigh Valley Ice Arena" with no address. Picking the wrong one means missing warmups. The cities are displayed in search results but are insufficient disambiguation when the parent doesn't know which city to look for.

**Who was affected:** Rich (Thursday night prep — saved directions to potentially wrong rink), Denise (Saturday between-games — could drive to wrong rink with 4 kids), and every family on all 8 tournament teams whose schedule says "Lehigh Valley Ice Arena."

**Minimum viable scope:**
- In search results, when two rinks share the same name, show the full address inline (not just city/state). Currently results show "Lehigh Valley Ice — Coplay, PA." Change to "Lehigh Valley Ice — 904 Chestnut St, Coplay, PA."
- Add a subtle warning badge: "Multiple rinks with this name exist — check the address." This could be as simple as an amber info icon next to same-name results.
- On the rink detail page, if a same-name sibling exists, show a banner: "Not the right one? There's also a Lehigh Valley Ice in Allentown" with a link.
- **Detection:** Query `rinks` table for `WHERE name = $1 AND id != $2`. If results > 0, trigger disambiguation UI.

### 3. Tip Character Limit Expansion (or Structured Tournament Tips)

**What broke without it:** Marcus's 185-character tournament warning was cut to 116 characters. He lost "Bring boots and patience" — the emotional texture that makes tips feel human and builds community trust. Tournament experiences are inherently richer than "park behind building 2" — they involve sequences (Zamboni broke → delay → kids freezing → schedule cascaded) that don't compress to 140 characters.

**Who was affected:** Marcus (had to self-censor his warning), and every future parent reading a truncated tournament tip that loses specificity and emotion.

**Minimum viable scope — choose one:**

**Option A: Raise the limit to 280 characters.** Simple. Matches Twitter's expanded limit. Marcus's full tip (185 chars) fits easily. Cost: tips take more vertical space on the page. Benefit: tournament stories can breathe.

**Option B: Keep 140 for quick tips, add a "Tournament story" mode** that allows 500 characters and is tagged with `context: 'tournament'`. This pairs with Feature 1 (the context toggle) — tournament stories appear in the tournament-filtered view, while quick tips stay compact in the default view. More complex but architecturally cleaner.

---

## THE B2B SIGNAL

The tournament organizer for the Presidents' Day Classic looks up both rinks on ColdStart after hearing parents are rating them.

**What they see:**
- **Steel Ice Center:** Organization dropped from 2.2 to ~1.8 (with 10+ tournament ratings). Parking dropped from 3.0 to ~2.2. Multiple tips mention Zamboni delays, cold locker rooms, mud-pit parking. Family-friendly remains at 4.1 (parents noted the community was welcoming despite the chaos).
- **Lehigh Valley Ice (Coplay):** Scores relatively stable or slightly improved. Better parking (4.5), decent organization (3.3). No Zamboni complaints. Food options rated positively.

**Would a Tournament Intelligence Report be valuable?**

The data ColdStart collected this weekend — if context-tagged — would tell the organizer:
- Steel Ice had operational failures (Zamboni, parking lot drainage) that are fixable before next year
- Lehigh Valley (Coplay) performed better across all signals
- The hotel coverage gap (no chain hotels near Coplay) caused logistical friction for families
- Parent tips provide specific, quotable feedback: "Zamboni broke, 25-min delay" is more actionable than "Organization: 1.8"

**Would an organizer pay for this?**
- **$500:** Probably, if the report included: (1) signal comparison across tournament rinks, (2) parent tip digest, (3) hotel/food gap analysis, (4) year-over-year comparison if the tournament repeats. This replaces a post-tournament survey that most organizers don't run.
- **$2,000:** Only if the report included benchmarking against OTHER tournaments at the same rinks, regional signal comparison ("how does Steel Ice compare to other Lehigh Valley rinks?"), and actionable improvement recommendations. The current data is too thin for this — one weekend of 10-15 parents doesn't produce statistically rigorous benchmarks.

**The data quality challenge:** Tournament parents are emotionally biased contributors. Marcus rated during peak frustration. His ratings are accurate to his experience but may overweight temporary failures (Zamboni breaks happen everywhere, mud pits are weather-dependent). A Tournament Intelligence Report would need to normalize for emotional state and separate structural issues (inadequate parking lot drainage) from incident issues (one Zamboni breakdown). The tip text provides this nuance — "Zamboni broke" is clearly an incident, not a structural problem — but the numerical ratings don't.

**The real B2B play:** The `context` field enables the query `SELECT signal, AVG(value) FROM signal_ratings WHERE context = 'tournament' AND rink_id IN (...) GROUP BY signal`. But the report's value isn't in the averages — it's in the tip digest. "Parents said: Zamboni delays, cold locker rooms, mud parking, good community feel." That qualitative layer, organized by rink and signal, is what a tournament organizer would pay for. The averages are the skeleton; the tips are the meat. At scale (50+ tournament parents contributing with context tags), this becomes a genuinely differentiated data product that no competitor offers.
