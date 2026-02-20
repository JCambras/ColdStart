# ColdStart: The Tournament Weekend Stress Test
## Claude Code Implementation Prompt

---

**Purpose:** Simulate the single weekend that makes or breaks ColdStart's reputation — a multi-team tournament where everything that can go wrong does, and every type of ColdStart user shows up simultaneously with competing needs and escalating urgency. This isn't a single-persona test. It's a systems test. It evaluates whether ColdStart holds up when a team manager is building Trip pages for 18 families at 10 PM Thursday, when 6 parents hit the same rink page at 6 AM Saturday looking for different information, when someone rates a rink between games and another parent reads that rating 20 minutes later, and when the information changes mid-tournament because the Zamboni broke, the parking lot flooded, or a game ran long and threw the whole schedule sideways. Every other prompt tests ColdStart in isolation. This one tests it under load, across time, with real-world chaos.

**How to use:** Save this file in your project directory, then in Claude Code: `Read [path]/ColdStart_Tournament_Weekend_Test_v1.md and execute the instructions in it.`

---

## The Prompt

You are simulating an entire tournament weekend. The tournament is the "Presidents' Day Classic" at two rinks in Lehigh Valley, PA:

- **Steel Ice Center** — 320 E 1st St, Bethlehem, PA 18015. Older single-pad facility, small parking lot (signal: 3.0/5 from 5 votes), cold building (3.3/5), limited food nearby (2.5/5), chaos signal at 2.2/5 (closer to hectic — the scale runs 1=hectic to 5=calm), but beloved by locals (family-friendly: 4.1/5). No SHEET_NOTES entrance tips in the system.
- **Lehigh Valley Ice Arena** — 904 Chestnut St, Coplay, PA 18037. ⚠️ **Important:** A sibling rink named "Lehigh Valley Ice" also exists at 1 Cascade Dr, Allentown, PA 18109. Both appear in ColdStart search results under the same name. This is a real usability landmine for tournament parents — Coplay and Allentown are 15 minutes apart, and going to the wrong one means missing warmups. The Coplay location has parking 4.5/5, chaos 3.3/5, food_nearby 3.1/5, family_friendly 3.5/5.

Eight teams from PA, NJ, NY, and CT are competing across Squirt, PeeWee, and Bantam divisions. Games run Friday 5 PM through Sunday 4 PM. Each team has 15-20 families. That's roughly 120-160 families interacting with these two rinks over 3 days.

You will simulate the experience of **six different people** across the tournament timeline, from Thursday night prep through Sunday afternoon departure. Each person has different needs, different ColdStart experience levels, and different urgency. The test evaluates whether ColdStart serves all of them, whether information flows correctly between them, and whether the platform handles the temporal dimension — conditions that change hour by hour during a live tournament.

---

## THE CAST

**THURSDAY 10 PM — Logistics prep**

**Person 1: Amy Lester, Team Manager, Downingtown Cougars PeeWee A**
Amy's team has 3 games this weekend — one Friday night at Steel Ice, two Saturday at Lehigh Valley Ice (Coplay). She needs to send logistics to her parent group chat tonight. She's used ColdStart twice before for regular-season away games and has built a Trip page once before. She knows the basics.

**Person 2: Rich Dominguez, First-Time Tournament Dad, Trenton Thunder Squirt B**
Rich's kid just moved up to travel. This is their first tournament. Rich's wife is staying home with their younger kids. He's driving solo with his 9-year-old, staying at a Hampton Inn, and has no idea what to expect. Another parent mentioned ColdStart but Rich has never opened it.

**SATURDAY 5:45 AM — Game day arrival**

**Person 3: Priya Nair, Experienced Hockey Mom, Bethlehem Blades Bantam A**
Priya has been to both rinks before. She's checking ColdStart not for basic info (she knows the rinks) but for CURRENT conditions — did something change? Is parking worse because of the tournament? Is the building colder than usual? She wants the delta from normal, not the baseline.

**Person 4: Tom Brennan, Away-Team Coach, Stamford Stallions PeeWee B**
Tom drove 2.5 hours from Connecticut. He's never been to either rink. His team's first game is at 7 AM at Steel Ice Center. He's sitting in the parking lot at 5:45 AM, phone in hand, trying to figure out which entrance to use and whether his team has a locker room. He has 15 minutes before he needs to be inside.

**SATURDAY 11 AM — Between games**

**Person 5: Denise Kowalski, Rink-Hopping Mom, Chester County Blades Squirt A**
Denise's kid just finished a game at Steel Ice and has another at Lehigh Valley Ice (Coplay) at 1 PM. She has 2 hours. She needs: directions to the correct Lehigh Valley rink, food options near Lehigh Valley (the team wants to eat together), and any heads-up about the second rink. She's in her car with 4 kids (her son plus 3 teammates she's carpooling).

**SATURDAY 4 PM — Post-game contribution**

**Person 6: Marcus Webb, Angry Dad, Morristown Mustangs Bantam A**
Marcus's team just lost. He's not angry about the loss — he's angry because the game at Steel Ice Center started 25 minutes late due to a Zamboni breakdown. His kid sat in full gear in a freezing locker room for half an hour. The "Chaos" signal on ColdStart says 2.2 — which actually means "closer to hectic" on the 1-5 scale (1=hectic, 5=calm). So the existing data already flags chaos as a problem, and Marcus's experience confirms it. But the signal label doesn't scream "warning" — it just shows a number that most parents won't interpret correctly. Marcus wants to rate the rink and warn other parents about tournament-day conditions.

---

### ACT 1: THURSDAY NIGHT — The Prep

**Amy's task (experienced user, team logistics):**

**1.1 The Trip Builder workflow**
- Amy's primary tool is the Trip Builder (`/trip/new`). She needs to create Trip pages for her parent group.
- ColdStart's Trip Builder enforces **one rink per trip**. The `rink` field is a single `TripRink` object — not an array. Amy must create two separate Trip pages: one for Steel Ice Center (Friday game) and one for Lehigh Valley Ice - Coplay (Saturday games).
- For each Trip, she fills in: team name, dates, rink selection (searchable dropdown filtered by state), game schedule (day, time, opponent, sheet number, notes), lodging via NearbyPicker (hotel selection from seeded nearby data + optional cost), lunch/dinner via NearbyPicker, cost breakdown (registration, gas, food — split per-family or per-player), and "Notes for the team" (free-text field, placeholder: "Arrive 45 min early, parking fills up fast on tournament weekends").
- The Trip Builder also has a **collaborative mode** (on by default) — team families can add restaurants, tips, or notes to the shared trip page after Amy creates it.
- **Test the workflow**: How many total taps/steps from opening ColdStart to having two shareable Trip pages? Is the "one rink per trip" limitation painful for a multi-rink tournament, or does it actually help organize information by venue?
- Does Amy discover the Trip Builder at all? Or does she go straight to the rink page and try to screenshot it like a first-time user?

**1.2 The tournament-specific information**
- Amy knows that tournament conditions are different from regular-season conditions. Parking is worse. The building is more crowded. Schedules run late.
- The Trip Builder's "Notes for the team" field is her current workaround for tournament-specific context: "Tournament weekend — arrive 45 min early, parking will be rough, bring extra blankets for Steel Ice."
- **The `context` field**: ColdStart's database has a `context TEXT` column on both `signal_ratings` and `tips` tables. The API at `POST /api/v1/contributions` accepts `context` in the request body and stores it (line 38: `context || null`). But the UI never sets it and never displays it. Storage helpers exist (`getRatingContext`/`setRatingContext` in `lib/storage.ts`) but are never called. This dead field is the architectural foundation for tournament-context tagging — it just hasn't been wired up. Document this gap: the plumbing exists, but the faucet is missing.
- Does the verdict text on the rink page account for tournament conditions? Or does it present regular-season averages that will be misleading this weekend?
- If there are tips from parents who've been to tournaments at these rinks, can Amy find them? Or are they mixed in with regular-season tips with no way to filter?

**1.3 Sharing Trip pages with the group chat**
- Amy taps "📤 Share with team" on each Trip page. The share text includes: `{Team Name} at {Rink Name} — {Dates}\n\nGame day info: {URL}`.
- On iOS, this triggers the native share sheet (via `navigator.share`). On desktop, it copies to clipboard.
- The rink page share text is different: `{Rink Name} (Parking: X/5)\n📍 {Address}\n💡 "{top tip}"\nRink info from hockey parents: {URL}`. The address is an Apple Maps link.
- When a parent in the group chat taps the Trip link, they land on the Trip detail page. If the vibe engine classifies them as a **Glancer** (short session, arrived via shared link, single page visit), they see a minimal card: rink address, next game time, parking verdict, and entrance tip (if SHEET_NOTES exist for that rink). A "See full trip details" button expands to the full view.
- **The real test**: After Amy shares both Trip links, do the 18 families have everything they need? Or do 3 parents still reply asking questions Amy can't answer from the Trip page?
- What are those unanswered questions? Not "where to park?" (the Trip page shows the parking signal) — more likely: "Which entrance for our rink sheet?" (Steel Ice has no SHEET_NOTES), "Is there a tournament check-in table?" and "Where do we pick up jerseys?"
- These questions are tournament-operational — they're not about the rink, they're about the event. ColdStart doesn't model events. The `context` field could bridge this gap.

---

**Rich's task (first-time tournament, zero context):**

**1.4 The overwhelmed newcomer**
- Rich's friend forwards him Amy's Trip link. Rich taps it and lands on the Trip detail page in **Glancer mode** — a minimal card showing the rink address, first game time, and parking verdict.
- Does Glancer mode reduce Rich's anxiety or increase it? He sees a compact summary but may not realize there's more detail behind the "See full trip details" button.
- Rich also tries searching ColdStart on his own. He searches for "Lehigh Valley Ice." **Two results appear** — Lehigh Valley Ice (Coplay) and Lehigh Valley Ice (Allentown). They have the same name. Rich has no idea which one his kid plays at. The tournament schedule PDF says "Lehigh Valley Ice Arena" with no address. This is a real confusion point — does ColdStart help Rich distinguish between them? Are the cities (Coplay vs Allentown) prominent enough? Is there any visual cue that these are different facilities?
- As a first-time user at a tournament, what does Rich NOT know that the page should tell him?
  - How early should he arrive for a tournament game (vs a regular game)?
  - Is there a specific entrance for tournament teams?
  - Where does he go once inside? (Check-in table? Straight to locker room?)
  - Can he watch from the stands, or do some rinks restrict access during tournaments?
- None of these are in the signal model. Are any of them in the tips?
- Rich's anxiety level is HIGH. He's never done this. Does ColdStart reduce his anxiety or just show him numbers that he doesn't know how to interpret?

**1.5 The hotel question**
- Rich is staying at a Hampton Inn. He wants to know if it's close to the rinks.
- ColdStart's Nearby section DOES include hotels — but the data tells a story about coverage gaps:
  - **Steel Ice Center (Bethlehem)**: 2 lodging options — "Comfort Suites Bethlehem Near Lehigh University and LVI Airport" (0.4 mi) and a private rental listing (0.5 mi). No Hampton Inn.
  - **Lehigh Valley Ice (Coplay)**: 4 lodging options — Wacu's Landing (0.3 mi), Columbia House (0.5 mi), The Laurel Fox Hotel (1.4 mi), and a 60-day-minimum rental (1.7 mi). All boutique/local — no chain hotels.
  - **Lehigh Valley Ice (Allentown)**: 4 lodging options — Days Hotel by Wyndham (0.6 mi), Homewood Suites by Hilton (1.0 mi), Holiday Inn Express (1.1 mi), Home2 Suites by Hilton (1.1 mi). These ARE the chain hotels tournament parents actually book.
- The gap isn't "does ColdStart show hotels?" — it does. The gap is that the **hotel TYPE** doesn't match what tournament parents need. The Coplay rink (where the games are) shows boutique B&Bs. The chain hotels Rich is actually staying at are near the Allentown location. Rich has no way to know this from the Coplay rink page.
- Does the NearbyPicker in the Trip Builder surface these hotels when Amy builds the trip? If Amy picks one, does it appear with a directions link on the shared Trip page?

---

### ACT 2: SATURDAY MORNING — The Arrival

**Priya's task (experienced user, wants current conditions):**

**2.1 The "is it different today?" question**
- Priya knows both rinks well. She's not looking for the baseline signals — she's looking for what's DIFFERENT today because of the tournament.
- Does ColdStart show any indication that today is a tournament day? (More crowded than usual, parking worse than usual, schedule delays)
- If Marcus rates the rink at 4 PM (Act 4), does that rating appear when Priya checks at 5 PM? ColdStart hits the live database on each page load — no cache layer. The API recalculates averages on every `POST /api/v1/contributions` call and returns the updated summary. So yes: Marcus's 4 PM rating appears at 5 PM. Tips are displayed newest-first. The real question is whether Priya notices the change — does one new rating move the average enough to be visible?
- Is there a way to filter tips or ratings by "today" or "this weekend"?
- Priya's ideal experience: open the rink page and see "🔴 Tournament in progress — parking at capacity, games running 15 min behind." Does anything like this exist?

**2.2 The real-time gap**
- ColdStart is built on aggregated ratings over time. Tournaments create REAL-TIME conditions that change by the hour.
- At 6 AM, the parking lot is half empty. By 8 AM, it's overflowing. The ColdStart parking score is an average that's neither — it represents a typical visit, not this morning's visit.
- Does Priya realize that the signals are averages, not live conditions? Or does she assume "Parking: 3.0" means parking is fine RIGHT NOW?
- Is there any disclaimer or framing that sets this expectation?
- Is this a fundamental limitation of ColdStart's model, or is there a path to real-time tournament data? The `context` field could tag ratings as "tournament" vs "regular season," enabling filtered views — but that only helps after enough tournament-tagged data accumulates.

---

**Tom's task (away coach, parking lot, 15 minutes):**

**2.3 The coach's needs (different from a parent's needs)**
- Tom needs to know: which entrance has locker room access, is there a team room, how early before game time should his team be inside, and where do spectators go.
- He opens ColdStart on his phone. Does the rink page answer ANY of these questions?
- The signal badges (parking, cold, food) are irrelevant to Tom right now. He already parked. He can feel the cold. He needs OPERATIONAL information, not condition ratings.
- Steel Ice Center has **no SHEET_NOTES** entrance tips in the system. The only rinks with entrance directions are IceWorks Skating Complex, Ice Line Quad Rinks, and Ice House — multi-sheet facilities with complex layouts. Steel Ice is a single-pad rink, so there's no sheet-specific wayfinding. But Tom doesn't know it's single-pad until he walks inside.
- Are there any user-submitted tips that answer his questions? Or are all tips focused on spectator/parent experience?
- Tom has 15 minutes. He gives ColdStart about 30 seconds. If it doesn't show him what he needs, he walks inside and asks someone. Does it earn those 30 seconds?
- The Compare button on the rink page links to `/compare?rinks=${rinkId}` — but no `/compare` route exists. It 404s. Not relevant to Tom's immediate need, but a broken affordance on the page he's looking at.

**2.4 The coach as a different user type**
- Tom's needs expose a gap: ColdStart is designed for PARENTS preparing for a visit. Coaches have different information needs (facility operations, team logistics, warm-up space, ref room location).
- Is there any indication that ColdStart recognizes coaches as a user type? The Visitor toggle offers "✈️ Visiting" and "🏠 Regular" — both are parent-oriented.
- This isn't necessarily a problem to solve now — but document whether the current design actively excludes coaches or is just neutral toward them.

---

### ACT 3: SATURDAY MIDDAY — Between Games

**Denise's task (on the move, 4 kids in the car):**

**3.1 The transition between rinks**
- Denise is leaving Steel Ice Center and heading to Lehigh Valley Ice (Coplay) for a 1 PM game.
- She opens ColdStart to look up Lehigh Valley. She types "Lehigh Valley" and **two results appear with the same name**: Lehigh Valley Ice (Coplay) and Lehigh Valley Ice (Allentown). She's 15 minutes from one and 25 from the other. Picking the wrong one means missing warmups.
- **Test this moment**: Can Denise distinguish the two rinks quickly enough? The city names (Coplay vs Allentown) appear — but does she know which city she needs? If the tournament schedule just says "Lehigh Valley Ice Arena," she's guessing.
- The rink address IS an Apple Maps link (`maps.apple.com/?address=...`). Tapping it opens directions. This works.
- Is there any way to navigate from one rink page to another without going back to search? (If she's looking at Steel Ice, is Lehigh Valley suggested as "Other tournament rinks" or "Nearby rinks"?)
- She needs this to work with one hand, with CarPlay or phone mounted on the dashboard.

**3.2 The team lunch problem**
- 4 hungry kids, 2 hours between games, unfamiliar area. Denise needs food.
- She checks the ColdStart page for Lehigh Valley Ice (Coplay). The Nearby section HAS specific restaurants with names and distances, organized by category:
  - **quick_bite** (10 options): Dunkin' (0.7 mi), Mario's Pizza Shop (0.9 mi), Happy Garden (1.0 mi), Wawa (1.3 mi), Chick-fil-A (1.8 mi), Wendy's (1.8 mi), Arby's (1.9 mi), Subway (2.0 mi), JJ's Sushi (2.2 mi)
  - **team_lunch** (5 options): Eastern Chinese Restaurant (1.0 mi), Baked By Mais (1.0 mi), Mrs.pattery (1.6 mi), Kogelman Distributing Co (2.0 mi), Egypt Star Bakery (2.2 mi)
  - **dinner** (6 options): Thai Diner (0.1 mi), Coplay Eatery (0.2 mi), The Bacon Strip (0.5 mi), Samuel Owens Restaurant & Bar (0.5 mi), and more
- Each restaurant name links to Google Maps directions. Denise can tap and go.
- **The real question is not "does food info exist?" but "does the categorization help Denise decide fast?"**
  - The `team_lunch` category is labeled — but is "Eastern Chinese Restaurant" actually team-friendly for 4 kids? Is "Kogelman Distributing Co" even a restaurant? The category label suggests curation but the data quality varies.
  - There's no "open now" indicator. It's 11:15 AM Saturday — is Thai Diner open? Denise doesn't know.
  - There's no "seats 15 kids" filter. No group-seating indicator.
  - There's no drive-time estimate (just distance in miles).
  - ColdStart distinguishes `quick_bite` from `team_lunch` — that's genuinely useful. But does Denise understand the category labels? Does the UI present them clearly enough for a one-handed, 4-kids-screaming decision?

**3.3 The time pressure**
- It's 11:15 AM. Game at 1 PM. Minus 30 minutes for warm-up arrival. That's 11:15 to 12:30 for food. 75 minutes, minus 15 minutes driving to the second rink. 60 minutes for lunch.
- Does ColdStart help Denise calculate this? (Probably not — and it shouldn't. But does the nearby-food section give her enough info to make a fast decision?)
- The Nearby section shows 10 quick_bite + 5 team_lunch + 6 dinner = 21 food options. That's a lot to scan under time pressure. Is there any sorting, filtering, or "recommended for tournament families" curation?
- The NearbyPicker in the Trip Builder lets Amy pre-select a lunch spot when building the trip. If Amy did that, Denise sees it on the Trip page with a directions link. **This is the Trip Builder's value proposition for between-games logistics** — did Amy use it? If she did, Denise's problem is solved. If she didn't, Denise is back to scanning 21 options.

---

### ACT 4: SATURDAY AFTERNOON — The Contribution

**Marcus's task (angry, wants to rate, wants to be heard):**

**4.1 The emotional state**
- Marcus's kid sat in a freezing locker room for 30 minutes because the Zamboni broke. The game started late. The concession stand was out of hot chocolate. The parking lot was a mud pit because it's been raining.
- Marcus opens ColdStart. His emotional state: frustrated, protective, wants to warn other parents.
- The rink page shows Steel Ice Center's chaos signal at **2.2/5** from 5 votes. On the 1-5 scale (1=hectic, 5=calm), 2.2 already means "closer to hectic." The existing data *agrees* with Marcus's experience — the rink is already flagged as chaotic. But does the UI communicate this clearly? A parent reading "Chaos: 2.2" might think that's a low score meaning "low chaos" rather than "rated 2.2 on a scale where 1 is hectic." The signal label and scale direction matter enormously here.
- This is the critical trust moment: if Marcus feels the platform is presenting a reality that doesn't match what he just lived through (even if the data actually agrees with him), he won't contribute. Signal presentation is as important as signal accuracy.

**4.2 The tournament-day rating**
- Marcus wants to rate Steel Ice Center based on TODAY. Not based on a typical Tuesday.
- Can he indicate that his rating is from a tournament? The Visitor toggle (✈️ Visiting / 🏠 Regular) captures `contributor_type` (`visiting_parent` vs `local_parent`). But there's no "tournament day" selector.
- The `context` field in the database (`signal_ratings.context TEXT`, `tips.context TEXT`) is designed for exactly this — but the UI never exposes it. The API at `POST /api/v1/contributions` accepts `context` as a body parameter and stores it: `context || null`. The localStorage helpers `getRatingContext()`/`setRatingContext()` exist in `lib/storage.ts` but are never called. **The minimum viable change**: add a toggle next to the Visitor/Regular selector — "🏆 Tournament day" / "📅 Regular season" — that sets the `context` field. No schema change needed. No API change needed. Just UI.
- If there is no tournament context toggle: Marcus rates parking as 1 (it was a mud pit) and chaos as 1 (it was pandemonium). These ratings will drag down the overall averages, which might be unfair to the rink on a normal day — but are completely accurate for today.
- Is there any mechanism to separate "this is what the rink is normally like" from "this is what happened during a specific tournament"?

**4.3 The tip that captures the moment**
- Marcus wants to write: "Tournament day was rough. Zamboni broke before our 7 AM game, 25-minute delay, kids freezing in the locker room. Parking lot was a swamp in the rain. Bring boots and patience."
- That tip is **185 characters**. ColdStart enforces a **140-character limit** — both in the frontend (`maxLength={140}` on the input in `QuickTipInput.tsx`) and the API (`tip text must be 140 characters or fewer`, returns 400).
- Marcus gets cut off. What fits in 140 characters? Something like: "Tournament day: Zamboni broke, 25-min delay, kids froze in locker room. Parking was a mud pit. Bring boots." (111 chars). He loses the emotional texture — "bring boots and patience" — but keeps the essential warning.
- **Test what happens**: Does the UI show a character counter? Does Marcus see he's over the limit before submitting, or does the API reject it after he hits send? Which is worse for an already-frustrated user?
- The Visitor toggle exists: ✈️ Visiting / 🏠 Regular. Marcus is a visiting parent. Does he notice and use the toggle? Does it matter for how his tip is displayed?
- After Marcus submits: the tip appears immediately in the database. There's no moderation queue, no cache. Tips display newest-first. The next parent who loads the page sees Marcus's warning at the top.

**4.4 The self-correcting loop — with math**
- Marcus rates parking as 1. The existing average is **3.0 from 5 votes**. New average: (3.0 × 5 + 1) / 6 = **2.67**. One vote moved the average from 3.0 to 2.67 — a shift of 0.33. Noticeable? Barely. The parking badge might change color thresholds, but the number itself barely moves.
- Marcus rates chaos as 1. Existing average: **2.2 from 5 votes**. New average: (2.2 × 5 + 1) / 6 = **2.0**. Even less movement — from 2.2 to 2.0.
- **The real signal isn't the average — it's the tip.** Marcus's 140-character warning appears newest-first at the top of the tips section. That tip, with its specificity and recency, does more to inform the next parent than the 0.33-point shift in the parking average.
- Does the recency timestamp on Marcus's tip show that it's from TODAY? Does it say "4 hours ago" or "Saturday" or just a date?
- If Amy checks the page Sunday morning before her team's game, does she see Marcus's tip and the updated signals? Walk through the entire flywheel: bad experience → contribution → better data → better preparation for the next parent. Does it work?

---

### ACT 5: SUNDAY — The Aftermath

**6 parents across 6 teams experienced the same tournament. Evaluate the aggregate impact.**

**5.1 The data accumulation**
- Assume 10-15 parents rated the two rinks over the weekend.
- Did the rink pages noticeably improve from Thursday (pre-tournament) to Sunday (post-tournament)?
- Are there more tips? Are the new tips tournament-specific?
- Did the signal scores shift to reflect tournament conditions? Or are they still mostly reflecting historical averages? (With 5 existing votes and 10 new ones, the averages will shift significantly — model this.)
- Is there a visible "this rink was recently rated by many parents" indicator that signals freshness?

**5.2 The next tournament**
- A different team is playing a tournament at the same rinks in 3 weeks.
- Their team manager opens ColdStart. What's their experience?
- Do they see tournament-specific tips from this weekend? Or have those been buried by regular-season ratings?
- Do they get better preparation than Amy did on Thursday? Specifically, what do they know now that Amy didn't?
- If the `context` field were wired up, a "tournament" filter could surface only tournament-tagged tips and ratings. Without it, tournament wisdom is mixed in with regular-season noise.
- This is the longitudinal test: does ColdStart get SMARTER over time as more tournaments happen?

**5.3 The tournament organizer**
- The tournament organizer for the Presidents' Day Classic hears that parents are rating the rinks on ColdStart.
- They look up both rinks. What do they see?
- If one rink scored significantly worse than the other, does the organizer have useful data for choosing rinks for next year's tournament?
- Would the organizer pay for a "Tournament Intelligence Report" that aggregates parent feedback across all tournament rinks? (This is the B2B play.)
- The `context` field is the technical foundation for this report. If contributions are tagged with `context: 'tournament'`, a query can aggregate tournament-only ratings across rinks, time periods, and signal types. A Tournament Intelligence Report aggregating context-tagged contributions is architecturally straightforward — `SELECT signal, AVG(value) FROM signal_ratings WHERE context = 'tournament' AND rink_id IN (...) GROUP BY signal`. The data model supports it. The question is whether enough parents would use a tournament toggle to generate statistically meaningful data.

---

### THE CROSS-CHARACTER INFORMATION FLOW

This is the test no single-persona prompt can run. Evaluate whether information created by one person reaches another person at the right time.

**Flow 1: Amy → Rich**
Amy creates two Trip pages Thursday night and shares the links to her group chat. Rich isn't on Amy's team — but his friend is, and forwards one Trip link. Rich taps it and lands on the Trip detail page in **Glancer mode**: a minimal card showing the rink address, first game time, and parking verdict. Does Rich get enough from the Glancer view to reduce his anxiety? Does he tap "See full trip details"? Does the full view — with game schedule, lodging, costs, and Amy's notes — give Rich a mental model for what his own tournament experience will look like, even though it's a different team's trip?

**Flow 2: Marcus → Priya**
Marcus rates the rink at 4 PM Saturday. Priya opens the rink page at 5 PM Saturday for a Sunday morning game. The API recalculates on every contribution — no cache. Marcus's tip appears newest-first. Does she see it? Does the tip's timestamp ("1 hour ago") and specificity ("Zamboni broke, 25-min delay") give her actionable information for Sunday? Or does she read it as a one-time incident that won't recur?

**Flow 3: Tom → Nobody**
Tom had a bad experience (couldn't find the entrance, no locker room assignment). But Tom is a coach, not a typical ColdStart user. He doesn't rate the rink. The information he has — operational, coach-specific — never enters the system. How many Toms exist? Is ColdStart missing an entire category of valuable data because coaches aren't part of the contribution loop?

**Flow 4: This Tournament → Next Tournament**
All the data from this weekend should make the next tournament at these rinks better. Does it? Without the `context` field wired up, tournament-specific tips are mixed with regular-season data. Time-averaged signals dilute tournament intensity. The two-Lehigh-Valley naming confusion remains unsolved. What would change if `context` tagging were live? Model the difference.

---

### OUTPUT FORMAT

Produce a tournament weekend after-action report — not a bug list, not a single persona's diary, but a multi-perspective evaluation of how ColdStart performed across 3 days, 6 people, 2 rinks, and dozens of information needs.

**THE WEEKEND VERDICT:**
One paragraph: did ColdStart make this tournament weekend better for the parents who used it? Did the information flow? Did the platform get smarter by Sunday than it was on Thursday? Or did it sit there static while real conditions changed around it?

**THE TIMELINE:**
A chronological narrative of every ColdStart interaction across the weekend, showing what each person did, what they found, what they needed but didn't get, and what they contributed back. Show the information flowing (or failing to flow) between people.

**THE TOURNAMENT SCORECARD:**

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Pre-tournament prep** | ?/5 | Did Amy and Rich get what they needed Thursday night? |
| **Trip Builder adoption** | ?/5 | Did the Trip Builder workflow serve Amy's multi-rink tournament needs? |
| **Morning-of arrival** | ?/5 | Did Priya and Tom get current, useful info at 6 AM? |
| **Between-games utility** | ?/5 | Did Denise find food and directions fast enough? |
| **Nearby discoverability** | ?/5 | Did categories (quick_bite, team_lunch) help parents decide fast? |
| **Post-game contribution** | ?/5 | Could Marcus capture his experience quickly and meaningfully? |
| **Real-time accuracy** | ?/5 | Did the data reflect TODAY's conditions or just historical averages? |
| **Tournament context** | ?/5 | Can ColdStart distinguish tournament-day from regular-day conditions? |
| **Cross-parent information flow** | ?/5 | Did one parent's contribution help the next parent that day? |
| **Weekend learning** | ?/5 | Was Sunday's data better than Thursday's? |
| **Multi-rink handling** | ?/5 | Could parents manage info about 2 rinks — and avoid the Lehigh Valley name collision? |
| **Coach usability** | ?/5 | Did ColdStart serve coaches or only spectator parents? |

**THE FUNDAMENTAL MODEL QUESTION:**
ColdStart aggregates ratings over time to produce stable, reliable signals. Tournaments create ephemeral, volatile, high-intensity conditions that change by the hour. These two realities are in tension. Based on this weekend simulation, assess: is ColdStart's time-averaged model fundamentally adequate for tournament weekends? Or does the tournament use case require a different data model — something closer to Waze's real-time hazard reports than Yelp's permanent reviews? The `context` field provides a middle path: tag contributions with context, enable filtered views, but keep the core model intact. Is that enough? What is the minimum viable change to serve both regular-season AND tournament parents without breaking the model for either?

**THE THREE FEATURES THIS WEEKEND DEMANDS:**
The three capabilities — not polish, not design tweaks, but structural features — that this tournament weekend proves ColdStart needs. For each: what broke without it, who was affected, and what it would look like at minimum viable scope. Consider: the `context` toggle (wiring up the existing dead field), the two-rink disambiguation (Lehigh Valley name collision), and the tip character limit (140 chars vs tournament stories).

**THE B2B SIGNAL:**
Based on the tournament organizer's experience in Act 5, assess: is the data ColdStart collected this weekend valuable enough to sell? The `context` field enables a Tournament Intelligence Report: `SELECT signal, AVG(value) FROM signal_ratings WHERE context = 'tournament' AND rink_id IN (...) GROUP BY signal`. What would that report contain beyond signal averages? Parent tips about Zamboni delays and parking chaos? Hotel proximity data showing the chain-hotel gap at Coplay? Would a tournament organizer pay $500 for it? $2,000? Or is the data too thin, too unstructured, or too parent-biased to be useful for professional event planning?
