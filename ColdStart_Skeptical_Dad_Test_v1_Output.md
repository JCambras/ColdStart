# ColdStart: The Skeptical Hockey Dad Test
## Evaluation v1 — Greg Hamill's 3-Minute Trust Audit

**Evaluator Persona:** Greg Hamill, 11-year hockey dad. 200+ rinks visited. Trusts his own memory and a text thread with 6 hockey dads. Giving ColdStart exactly 3 minutes.

**Test Rinks:** Ice Line (West Chester, PA), IceWorks (Aston Township, PA), Oaks Center Ice (Oaks, PA)

**Date:** 2026-02-20

---

## Trust Verdict

**Would Greg switch from the group text? Not yet — but he wouldn't delete the app.**

ColdStart gets the architecture right. It asks the questions hockey parents actually care about (parking, cold, chaos, food, lockers, pro shop, family-friendly). It shows real numbers with bars instead of stars. It doesn't hide behind "4.2 out of 5" — it makes you see that parking at Ice Line is a 3.8 from 3 ratings, which is a very different thing.

But Greg's BS detector fires twice in the first 30 seconds, and that's enough to file it under "nice try."

---

## Trust Inventory — What Greg Sees in 3 Minutes

### The First 10 Seconds (Ice Line detail page)
- Name, address (tappable — good), home teams with links
- "From 7 hockey parents" ← **immediate red flag** (see Trust-Breakers)
- VerdictCard says "From 30 hockey parents this season" ← **contradicts the number above it**
- Signal bars with actual numbers: Parking 3.8, Cold 3.0, Family 4.3, Lockers 2.6
- Share button with parking score and address in share text

### The Next 30 Seconds (scrolling, tapping)
- 7 signal bars, each expandable with low/high labels
- Parking shows 3 ratings — bar is grayed out but no text explains why
- Tips section: **completely empty** — "No tips yet" with a CTA
- Nearby places: restaurants, team activities, hotels, gas — legitimately useful
- Fan favorites for food
- LiveBarn link, Pro Shop link — these say "we know this rink"

### The Last 2 Minutes (IceWorks, Oaks, homepage)
- Same pattern repeats: fake parent count vs real count in VerdictCard
- Featured rink cards on homepage show the same fabricated numbers
- Signal data is thin across the board (3-5 ratings per signal, all rinks)
- No tips on any rink — the entire tips feature is empty for demo rinks
- Manager responses and facility details: empty
- Compare feature exists, plan-a-trip feature exists (these are trust builders)

---

## Credibility Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Signal selection** | 9/10 | Parking, cold, chaos, food, family, lockers, pro shop — these are exactly what hockey parents argue about in the group text. Only missing: ice quality, ref quality, game-day vs practice. |
| **Data honesty** | 4/10 | Fabricated parent counts are a disqualifier. Real counts are shown elsewhere (VerdictCard), making the fake number look like a deliberate lie rather than an oversight. Gray bar for low confidence is too subtle. |
| **Source transparency** | 6/10 | "Visiting parent" vs "Plays here regularly" distinction exists but is hidden behind a tap on tips. No way to see who rated signals. Contribution counts exist but are contradicted. |
| **Freshness signals** | 3/10 | "Updated Xd ago" in tiny muted text is the only staleness indicator. A rink rated 6 months ago looks identical to one rated yesterday. No warning when data is old. |
| **Density of useful info** | 7/10 | When data exists, it's presented well. Signal bars are scannable. Nearby places with categories (quick bite, team restaurants, bowling) are genuinely useful for tournament weekends. |
| **Empty state honesty** | 7/10 | "Be the first to report" is honest. "No tips yet" is honest. But the fake parent count undermines this — you can't be honest about empty states while lying about full ones. |
| **Contribution friction** | 8/10 | Post-visit rating prompt is smart. One-tap 1-5 scale per signal. "Skip this" option. Tip flow is simple. Low friction without being annoying. |
| **Action utility** | 8/10 | Tappable address opens Maps. Share button includes parking score and address. LiveBarn link. Compare feature. Plan trip. These turn information into action. |

**Overall Credibility: 6.5/10** — "Useful but I'd verify"

---

## Trust-Breakers (Things That Make Greg Close the App)

### 1. CRITICAL: Fabricated Parent Counts (now fixed)
**What Greg sees:** "From 7 hockey parents" in the header, "From 30 hockey parents this season" in the VerdictCard directly below it. The 7 is computed from the rink name's string length (`5 + (rink.name.length % 6)`). The 30 is the real sum of all signal rating counts.

**Why it kills trust:** Greg counted 30 ratings worth of data in the signals. He sees "7 parents" at the top. He does the math — 7 parents can't produce 30 ratings across 7 categories unless every parent rated every signal, which he knows doesn't happen. Now everything on the page is suspect.

**Severity:** Fatal. This appears on every rink detail page, every RinkCard, and every featured rink on the homepage. Three UI surfaces, all lying.

**Fix applied:** All three locations now use `summary.contribution_count`, the real number.

### 2. No Staleness Warning (now fixed)
**What Greg sees:** A rink rated months ago looks identical to one rated this week. The only freshness signal is "Updated Xd ago" in 12px muted text buried in the VerdictCard.

**Why it kills trust:** Greg's #1 complaint about Yelp/Google reviews is outdated info presented with current confidence. "Parking: 3.8" from last April means nothing if they repaved the lot in September.

**Fix applied:** VerdictCard now shows an amber warning when data is >60 days old: "Last updated over X months ago — conditions may have changed."

### 3. Low-Confidence Data Looks Like High-Confidence Data (now fixed)
**What Greg sees:** "Parking: 3.8" with a gray bar. That gray is the only hint that this number comes from 3 ratings instead of 30. The actual count is in smaller text below — "3 ratings" — but it looks identical in weight to "5 ratings" on the next signal.

**Why it kills trust:** Greg knows that 3 parents saying parking is 3.8 is an anecdote. 30 parents saying it is intelligence. The UI treats both the same.

**Fix applied:** Signals with count < 3 now show "Early — X rating(s)" in a distinct amber badge.

---

## Trust-Builders (Things That Make Greg Come Back)

### 1. The Right Questions
Parking, cold, chaos, food, family-friendly, lockers, pro shop. This is the actual group text. Greg doesn't care about "atmosphere" or "value." He cares about whether his kid will be cold and whether there's food within 5 minutes. ColdStart asks exactly what matters.

### 2. Bars, Not Stars
A bar showing 3.8/5 with a color that shifts from red to green is more honest than "4.2 stars." You can see at a glance that parking is mediocre and family-friendliness is good. Greg processes this in 2 seconds.

### 3. Nearby Places with Real Categories
"Team Restaurants: Where you take 15 kids in hockey gear between games. Needs big tables and patience." This description proves the builder has been in that situation. The categories (quick bite, coffee, team restaurant, bowling, arcade, movies, hotel, gas) are tournament-weekend-specific. Fan favorites with parent tips on restaurants add credibility.

### 4. Tappable Address + Smart Share
Address opens in Apple Maps. Share button produces a text that includes the rink name, parking score, address, and top tip. This is exactly what Greg would paste into the group text.

### 5. LiveBarn / Pro Shop Links
Linking to LiveBarn streams and the pro shop site says "we actually know this rink." It's not scraped data — it's curated.

### 6. Compare Feature
Greg can add Ice Line and IceWorks side by side. This is what the group text does — "which rink is better for the tournament?" — but with actual data.

### 7. Honest Empty States
"No tips yet — be the first to report" is more trustworthy than filling the page with scraped Google reviews. ColdStart would rather show nothing than show garbage.

---

## The Fatal Flaw

**Data is too thin to be useful, and the UI doesn't admit it loudly enough.**

Every signal on every featured rink has 3-5 ratings. That's 3-5 anonymous parents whose judgment Greg is supposed to trust over his own 200-rink memory and 6 dads he's known for a decade. The data isn't wrong — it's just too early to be authoritative.

The fix isn't more data (that takes time). The fix is **aggressive transparency about data thinness.** The "Early" label helps. But ColdStart should consider:
- Showing the actual count prominently on every signal (not just below the bar)
- A header badge: "Early data — 30 ratings from ~5 parents" instead of hiding behind a definitive-looking verdict
- Making the VerdictCard explicitly say "Early verdict" or "Preliminary" when total contribution count is below a threshold

Greg respects someone who says "we only have 5 reports but here's what they say." He doesn't respect someone who presents 5 reports like they're 500.

---

## What Would Make Greg a Champion

### Level 1: "I'd check it before a tournament" (4 changes)
1. **Real parent counts everywhere** (done)
2. **Staleness warnings** (done)
3. **"Early data" labels** (done)
4. **Show contributor type on collapsed tips** (done)

### Level 2: "I'd send it to the group text" (4 more changes)
5. **Seed 3-5 real tips per featured rink** — Empty tip sections on demo rinks make the whole feature feel dead. Greg needs to see "Use the side entrance for Rink C — it's closer to the locker rooms" to understand the value.
6. **Show rating distribution, not just average** — "Parking: 3.8" from [1, 4, 5, 5, 3] is very different from [4, 4, 4, 3, 4]. If parents disagree, show it. "2 of 3 parents said Easy" is more trustworthy than "3.8."
7. **Add a "Last visited" prompt** — "When were you last at this rink?" before accepting ratings. This timestamps the data and lets Greg filter by recency.
8. **Tournament mode** — Flag when a rating was collected during a tournament vs a regular-season game. Tournament parking at Ice Line is a completely different animal.

### Level 3: "I'd recruit my 6 dads to contribute" (3 more changes)
9. **Team integration** — "Invite your team to rate rinks" with a share link. Greg's 6 dads become 6 seed contributors per rink. This is the growth hack for a cold start problem.
10. **Rink-to-rink comparison shareable** — "Ice Line vs IceWorks" as a shareable card that Greg can paste in the group text. This is the killer feature.
11. **Show Greg his own contribution trail** — "You've rated 12 rinks. Your intel helped 47 families." This turns passive users into invested contributors.

### The Champion Trigger
Greg becomes a champion when ColdStart knows something he doesn't. Right now, with 3-5 ratings and no tips, Greg knows more than the app. The moment ColdStart surfaces a tip like "Construction on Route 202 adds 20 minutes to Ice Line on weekdays — take 322 instead" from a parent who was there last Tuesday, Greg will screenshot it and send it to the group text with "yo have you guys seen this app?"

That's the bar. Not feature completeness. Not design polish. **One piece of intel Greg didn't have.**

---

## Summary

| Category | Status |
|----------|--------|
| Trust architecture | Solid — asks the right questions, shows data not opinions |
| Data integrity | Fixed — fake counts replaced, staleness warned, early data labeled |
| Data density | Thin — 3-5 ratings per signal, no tips, no manager responses |
| Action utility | Strong — maps, share, compare, plan trip, LiveBarn |
| Would Greg switch? | Not yet — but he'd keep it installed |
| Path to champion | Surface one piece of intel Greg's group text doesn't have |

**Bottom line:** ColdStart has the right skeleton. The trust fixes close the credibility gaps that would make Greg delete it. But the cold start problem is real — you can't earn a hockey dad's trust with 5 anonymous ratings. You earn it with one tip that saves him 20 minutes of parking-lot circling at 5:45am on a Saturday.
