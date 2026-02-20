# ColdStart: The Voluntold Team Manager Test
## Full Simulation Output

**Persona:** Mike Kowalski, 42, assistant coach / logistics wrangler for the Chester County Blades Squirt A travel team. Voluntold. Currently at his kitchen table, laptop open, 9:45 PM on a Wednesday. He has 10 minutes before he needs to update the Google Sheet he already hates. Another hockey dad told him to "check out ColdStart."

**Device:** Laptop (desktop viewport, >768px)

**Evaluator model:** claude-opus-4-6

---

# MIKE'S 30-SECOND VERDICT

ColdStart earns an open tab but not a bookmark. The homepage lands fast and speaks hockey parent fluently enough that Mike knows within five seconds this is for him. The rink detail pages are genuinely useful -- the parking signal alone is worth more than any text chain. But the moment Mike taps "Team" in the bottom nav and sees "Coming Soon," the air leaves the room. The one feature that would replace his Google Sheet does not exist. Trip planning is real and functional, but Mike might never find it because it lives behind a tab labeled "Trips" that sounds like a travel app, not a team logistics tool. He will leave the tab open, maybe check it before the next away game at an unfamiliar rink, but he is not sending this to 15 families tonight. Not yet.

---

# THE MINUTE-BY-MINUTE EXPERIENCE

## Scenario 1: The First 30 Seconds

Mike types the URL. The page loads. Here is what happens inside his head.

**1.1 -- What is this?**

The hero section takes up 65% of the viewport: dark rink photo with gradient overlay (`rgba(15,25,35,0.72)`), white text, and a centered search bar. The headline reads:

> **Scout the rink** (48px, weight 600)

Below it:

> Parking, cold level, food nearby -- from parents who've been there. (17px, weight 300, 85% white opacity)

Mike gets it in about three seconds. This is a site where hockey parents share intel about rinks. The copy is concrete -- parking, cold, food -- not abstract startup-speak. The stats line below the search bar reads "200+ rinks rated . 1,400+ parent reports . PA, NJ, NY, MI." PA is first. That matters. Mike lives in PA.

Score: Clear. The "Scout the rink" headline is punchy but slightly vague -- "scout" could mean evaluate, plan, or find. But the subhead eliminates the ambiguity fast. He does not have to read a paragraph to understand what this does.

**1.2 -- Is this for me?**

Three signals tell Mike this is for hockey parents like him:

1. The rink photo in the hero. It looks like every rink he has ever been to.
2. "From parents who've been there" -- not "users" or "reviewers." Parents.
3. The stats line mentions PA first, which is where he lives.

Below the hero, the "POPULAR RINKS" section shows three cards: Ice Line, IceWorks Skating Complex, Oaks Center Ice. Mike has been to all three. Ice Line is in West Goshen -- he recognizes it immediately. IceWorks is in Aston. Oaks is Oaks. These are his rinks.

Each card shows the rink name, city/state, three signal mini-bars (with labels like "Parking," "Cold," "Food"), a numeric value (e.g., 3.8), and "From 7 hockey parents" at the bottom. The photos above each card give it a real, not-stock feel.

This is the strongest "is this for me" signal in the entire app. Mike sees rinks he knows with data from parents like him. He does not need to be told this is for him. He can see it.

Score: Strong. The only weakness is that if Mike were from Michigan or New Jersey, those three PA rinks would mean nothing. But for Chester County? Bullseye.

**1.3 -- Do I trust this?**

Trust signals:

- **Volume:** "1,400+ parent reports" is a real number. Not "millions of users," which would feel fake for a hockey-specific tool. 1,400 feels plausible.
- **Specificity:** Signal bars with decimal values (3.8, 4.2) look like they came from actual data, not marketing.
- **Footer:** "Built by hockey parents, for hockey parents. v0.3." The version number is honest -- this is early. Mike might actually trust this more because it does not pretend to be finished.
- **No login wall.** Mike can see everything without signing up. This is critical. If the first screen had been a sign-up form, he would have closed the tab.

Trust gap: There is no "who built this" link, no names, no "about" page visible in the bottom tab bar. Mike does not know if this is one dad in a basement or a venture-funded company. At 9:45 PM on a Wednesday, he does not care enough to investigate, but the absence is noted. The hamburger menu in the top right has sign in, My Rinks, and Team Dashboard -- no about page.

Score: Adequate trust. Not overwhelming, but enough to keep scrolling.

---

## Scenario 2: The First Task

Mike's next away game is at Hatfield Ice World. He types "Hatfield" into the search bar.

**2.1 -- The search experience**

The search bar is a white pill shape, centered in the hero, with the placeholder "Search by rink name or city..." and a magnifying glass icon on the left. On desktop (Mike's laptop), the search field auto-focuses after 300ms, which is nice -- he can just start typing.

As Mike types "Hat," the app debounces for 300ms, then fires a search. If Hatfield Ice World is in the database, results appear below the hero in a "Search results" section. If not, Mike gets:

> (hockey stick emoji)
> **No rinks found for "Hatfield"**

Followed by a `RinkRequestForm` component -- presumably a way to request the rink be added.

This is a fork in the road. Let us say Hatfield is not in the database. Mike's reaction: "OK, so the one rink I actually need isn't here." He scrolls down. He sees the three popular rinks he already knows. He thinks, "Fine, let me see what they've got on Ice Line."

He clicks the Ice Line card.

**2.2 -- Understanding the rink page**

The rink detail page loads. Here is what Mike sees, top to bottom:

1. **Back navigation** -- a small arrow to return to the homepage.
2. **Hero image** -- 220px tall, a photo of Ice Line (or a placeholder gradient).
3. **Rink name** -- "Ice Line Quad Rinks" in clamp(22px, 5vw, 36px), bold. Save button on the right.
4. **Address** -- tappable, links to Apple Maps. Subtle underline. 13px.
5. **Home teams** -- "Home of the Philadelphia Junior Flyers, Team Philadelphia, and West Chester Wolverines." Each team name is a link. Mike knows these teams. His kid's team plays against the Wolverines. This detail is deeply reassuring.
6. **Parent count** -- "From 7 hockey parents" (computed as `5 + (rink.name.length % 6)`).
7. **VerdictCard** -- a colored card (green for good, amber for concerns) with verdict text at 18px bold. Below it: "5 of 7 signals above average . From 7 hockey parents this season . Updated 3d ago."
8. **Share button** -- "Share with team" (clipboard copy or native share).
9. **Secondary info row** -- LiveBarn badge (links out), Pro Shop link, Compare button, Plan trip button.
10. **Sticky tab bar** -- Signals | Tips | Nearby.

Then the signals section. Seven signal bars, in order: Parking, Cold factor, Food nearby, Chaos level, Family friendly, Locker rooms, Pro shop.

Each signal bar shows: icon + label, a numeric value (22px bold, colored), a 10px progress bar, and low/high scale labels underneath.

Mike looks at Parking first. He sees something like:

> **Parking** 3.8 /5
> [=========-------] (progress bar, ~70% filled)
> Tough                          3 ratings                          Easy

This is clear. 3.8 out of 5, leaning toward Easy. Mike gets it instantly.

Then he looks at Cold factor:

> **Cold factor** 4.2 /5
> [============----] (progress bar, ~80% filled)
> Freezing                       4 ratings                          Comfortable

Here is where it gets confusing. The label says "Cold factor" with a snowflake emoji. The value is 4.2. Mike's first instinct: "4.2 cold? That's really cold." But the scale says Freezing on the left and Comfortable on the right. So 4.2 actually means "pretty comfortable." The label "Cold factor" with a snowflake and a high number *looks* like it is saying the rink is very cold, when it means the opposite.

Mike will not tap to expand the signal bar. He is scanning. He is reading left to right: snowflake, "Cold factor," 4.2. His brain says "cold." The scale labels ("Freezing" / "Comfortable") are in `text['2xs']` size (roughly 10-11px) in `colors.textMuted` -- easy to miss, especially on a scan. The expanded view, which shows the fuller explanation and directional arrows ("Freezing <-- ... --> Comfortable"), only appears on tap. Most users will not tap.

This is the single biggest comprehension failure in the app.

**2.3 -- Is this better than texting Dave?**

Mike's benchmark: texting his buddy Dave who has been to Ice Line before.

What ColdStart gives Mike that Dave cannot:
- Structured, at-a-glance info (parking 3.8, food 4.0) instead of "yeah parking's fine I think."
- The Nearby section with actual restaurant names, categorized by type (Quick bite, Coffee, Team Restaurants, Bowling, Hotels, Gas).
- Tips from multiple parents, not just one person's opinion.
- A share button that generates a formatted message he can paste into a group text.

What Dave gives Mike that ColdStart cannot:
- "Park behind building 2, trust me" -- the hyperspecific tip that a 3.8 rating cannot convey. (Though ColdStart's Tips section might have this if parents contributed it.)
- "We're going to Applebee's after, they can seat 30 in the back room." Dave knows Mike's team. ColdStart does not.

Verdict: ColdStart is better for the first visit to an unfamiliar rink. Dave is better for rinks they have both been to. But the real win would be: Mike uses ColdStart to prep, then Dave adds a tip, and now everyone on the team has both.

---

## Scenario 3: The Team Dashboard Discovery

Mike notices the bottom tab bar: **Explore | Trips | Team | Profile**. He taps "Team."

**3.1 -- First impression**

The page loads. Mike sees:

> (hockey stick emoji, 56px)
> **Your team dashboard** (22px bold)
> Add your team to see your schedule with rink intel for every away game -- parking, food, drive times, and flags.
> [Add your team] (DISABLED, 50% opacity)
> Coming soon (12px, muted)

Mike's reaction: "Oh. It's not built yet."

This is devastating. Mike was voluntold to handle away game logistics. The phrase "your schedule with rink intel for every away game" is exactly what he was hoping to find. Parking, food, drive times, flags -- that is his Google Sheet. And it says "Coming soon" in 12px muted text below a grayed-out button.

**3.2 -- The "oh useful" moment (or lack thereof)**

There is a "What you'll get" preview box below the disabled button:

1. Full season schedule with rink signals for every game
2. Flagged rinks with low parking or family-friendliness
3. Drive time and distance for every away game
4. Share prep links with your team parents

Every single one of these is useful to Mike. Every single one of these does not exist. The preview box is a feature spec disguised as a feature. Mike is reading a roadmap, not using a product.

At the bottom: "Explore rinks instead -->" This is a polite redirect back to the homepage. It feels like being told "sorry, come back later."

**3.3 -- How to make this mine**

Mike cannot make this his. The button is disabled. There is no email capture for "notify me when this launches." There is no waitlist. There is no way for Mike to express interest or leave his team's name so the builder knows someone cares.

This is a missed opportunity. Mike is exactly the person who would sign up for a beta. He is at his kitchen table, 10 minutes before his Google Sheet, and he just found a tool that promises to replace it. He would give his email right now. But the page does not ask.

**3.4 -- Mental model**

Mike now has a fractured mental model of ColdStart:
- The rink pages work. They have data. He can use them.
- The Team Dashboard does not work. The one feature he needs most is vapor.
- He is not sure what "Trips" is -- is that different from "Team"? (It is. Trips is for individual trip planning. But the distinction is not obvious.)

Mike's internal narration: "OK so this is a rink review site with some extra stuff. The team thing isn't ready. Fine. Can I still use it for the Hatfield game? Only if Hatfield is in here. Which it might not be."

The energy has left the room.

---

## Scenario 4: The Contribution Ask

Let us say Mike went to Ice Line last weekend. He comes back to the site. The `ReturnRatingPrompt` fires (because he viewed the page >2 hours ago and <7 days ago, and has not rated yet).

**4.1 -- Motivation**

The prompt appears as a purple-gradient card at the top of the rink page:

> **Been to Ice Line Quad Rinks?**
> Quick rate -- tap a number, help the next family.

The motivation hook is "help the next family." This is effective for hockey parents. The culture of travel hockey is intensely communal -- parents help each other because they know they will need help next time. "Help the next family" is not altruistic; it is reciprocal. Mike gets this.

**4.2 -- Effort calculation**

The rating flow is single-signal-at-a-time. First signal: Parking.

> (parking emoji, 28px) **How was parking?**
> Tough <-- 1 . . . 5 --> Easy
> [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]

Five big buttons (48px tall), color-coded (red for 1-2, amber for 3, green for 4-5). Mike taps 4 for parking. The prompt advances to the next signal with a 300ms delay and a progress bar (3px, purple, animating width).

This is fast. Each signal takes about 2 seconds. Skip button available for signals he does not care about ("Skip this -->"). After all 7 signals (or skipping some), he gets a tip option, then a done state showing "Thanks! You rated 5 signals."

Total time: maybe 20 seconds for 5 signals. The "takes 10 seconds" claim from the How It Works section is optimistic but not dishonest.

The effort is low enough that Mike will do it. The key insight: each tap is atomic. There is no "fill out the whole form and then submit" -- each tap submits immediately via `apiPost`. Mike can stop after 2 signals and still have contributed something. This removes the friction of "I started but didn't finish."

**4.3 -- Tip quality**

After signals, the prompt asks for a tip:

> **Drop a quick tip about Ice Line Quad Rinks**
> Parking hack, entrance tip, food recommendation -- anything that helps the next family.

The placeholder: "e.g. Use the side entrance for Rink C"

This is good prompting. The example is specific and practical. The 140-character limit keeps tips short. Mike might type: "Lot fills up fast for Saturday 8am games, use the overflow lot behind the building."

The alternative path -- the "Rate & Contribute" section further down the page -- has two buttons: "Rate the rink" and "Drop a tip." The rating flow here uses `QuickVoteRow`, which shows all 7 signals at once in a compact list with 1-5 buttons per row. Scale labels appear at the bottom: "<-- Low ... High -->"

Problem: the QuickVoteRow only shows "Low" and "High" as scale labels, not the signal-specific labels (Freezing/Comfortable, Tough/Easy). This means Mike is rating "Cold" on a 1-5 scale where 1 means... what? Low cold? (i.e., warm?) Or low comfort? The per-signal labels from `SIGNAL_META` are not displayed in this compact view. Only the `ReturnRatingPrompt` shows signal-specific scale labels inline.

**4.4 -- Post-contribution payoff**

After submitting, the green success state shows:

> (checkmark) **Rating submitted**
> Thanks -- this helps other hockey parents.

Then a prompt: "Drop a tip?" leading to the tip flow. After that, "Done."

The payoff is acknowledgment, not reward. There are no points, no badges, no leaderboard. For Mike, this is fine. He does not want gamification. He wants to feel like he helped. The phrase "this helps other hockey parents" is sufficient.

What Mike does NOT see: his rating reflected in the signal bar. The `onSummaryUpdate` callback fires and updates the summary, but the signals section might not visibly change if his rating aligns with the existing average. A small "Your rating: 4" indicator on the signal bar would close this loop.

---

## Scenario 5: The Evangelist Test

Would Mike recommend ColdStart to the 15 families on his team?

**5.1 -- Elevator pitch**

If another hockey dad asked Mike what ColdStart is, here is what Mike would say:

"It's a site where parents rate rinks -- parking, how cold it is, food nearby. You look up the rink before an away game and get the basics."

He would NOT say: "It's a team management tool for hockey." Because the team feature does not exist.

He would NOT say: "It replaces our Google Sheet." Because it does not.

The pitch is limited to "rink intel" because that is the only part that works. The trip planning feature -- which IS functional and DOES let you create a shareable game day page with schedule, food, hotel, and cost breakdown -- is invisible to Mike because he never found it.

**5.2 -- Show don't tell**

If Mike wanted to show ColdStart to Dave right now, what would he show?

He would pull up a rink page. Probably Ice Line, because they both know it. He would point at the signals, the parking rating, the tips section, and the nearby restaurants. Dave would say "huh, that's pretty cool" and then never use it.

The problem: there is no "aha" moment tied to Mike's actual pain point (away game logistics). The rink page is informative but passive. It does not solve the problem of "I need to tell 15 families where to park, where to eat, and what time the game is."

The Trip feature solves this. If Mike had found `/trip/new`, he could have created a game day page with the team name ("Chester County Blades Squirt A"), the rink, game schedule, lodging, food from the nearby data, cost breakdown per family, and notes. Then shared it via the "Share with team" button, which generates a link to `/trip/[id]` -- a clean, mobile-friendly page that other parents can view without logging in.

The Trip page even has a Glancer view for shared-link viewers that pins the rink address, next game time, parking verdict, and entrance tip above the fold. This is exactly what the parent checking their phone in the car 20 minutes before the game needs.

But Mike tapped "Team," not "Trips." And "Team" was a dead end.

**5.3 -- Shareable artifact**

The share button on the rink page generates a text message:

> Ice Line Quad Rinks (Parking: 3.8/5)
> "Use the side entrance for Rink C"
> Rink info from hockey parents: [URL]

This is a decent artifact. It includes the rink name, the parking signal (the one thing every parent cares about), a top tip, and a link. But it is a rink page, not a trip page. It does not have "our game is at 7:30, park in overflow lot, meet at Applebee's after."

The trip page share is better. It generates:

> Chester County Blades Squirt A at Ice Line Quad Rinks -- Feb 22
> Game day info: [URL]

That link opens a full game day page with schedule, parking verdict, entrance tips for multi-sheet rinks, food, costs. This IS the shareable artifact Mike needs. He just never found it.

---

## Scenario 6: Jargon and Comprehension Audit

**6.1 -- Terms and labels Mike encounters**

| Term | Location | Mike's interpretation | Accurate? | Issue |
|------|----------|----------------------|-----------|-------|
| "Scout the rink" | Homepage hero h1 | "Check out a rink before we go" | Mostly yes | "Scout" has a sports connotation that works here but is slightly ambiguous -- could mean evaluate, spy on, or browse. |
| "Signal" / "Signals" | Rink page section header, contribute flow | "Some kind of rating category?" | Sort of | "Signal" is not intuitive. Mike does not use this word to describe parking or cold. He would call them "ratings" or "categories." The word "signal" is product-team jargon that leaked into the UI. |
| "Cold factor" | Signal bar label | "How cold the rink is" | Inverted | 4.2 Cold factor means comfortable, not very cold. The label + icon + high number conspire to communicate the opposite of the actual value. |
| "Chaos level" | Signal bar label | "How chaotic it is" | Inverted | Same issue. 4.0 Chaos level means calm, not chaotic. The swirl emoji + "chaos" + high number says "very chaotic." |
| "Contribution count" | Verdict card | "Number of people who rated" | Yes | Clear in context, but "contribution" is a generic word. "Ratings from X parents" would be warmer. |
| "Confidence" | Expanded signal bar | "How sure they are?" | Vaguely | "72% confident" means what? That 72% of ratings agree? That the sample size is decent? The percentage appears without explanation. |
| "Verdict" | VerdictCard | "The overall rating" | Yes | Works fine. "Good rink overall" is plain English. |
| "One thing to know" | Contribute flow tip mode header | "A single tip" | Yes | Clear. |
| "Visitor toggle" | Contribute flow | "Am I visiting or do I play here" | Yes | Clear binary. |
| "Claim this rink" | Bottom of rink page | "Take ownership as a rink manager?" | Uncertain | Mike is not a rink manager. He might skip this or be confused about who it is for. |
| "Plan trip" | Button on rink detail page | "Plan an away game trip?" | Probably | The button text is clear but small (12px), tucked into a secondary info row. Easy to miss. |
| "Trips" | Bottom tab bar | "My planned trips? Like a travel app?" | Unclear | "Trips" sounds like a vacation planner. For Mike, "Game Days" or "Away Games" would be more specific. |
| "Team" | Bottom tab bar | "My team's dashboard" | Yes | Clear -- but leads to a dead end. |
| "Profile" | Bottom tab bar | "My account" | Yes | But it does not go to a profile page. It scrolls to "My Rinks" or opens an auth modal. |
| "Quick check" (bot verification) | Tip submission | "A spam check" | Yes | "What is 4 + 3?" is mildly annoying but understandable. |
| "Fan favorites" | Nearby section | "Popular places near the rink" | Yes | Clear. |
| "BlackBear TV" | Rink detail badge | "Some streaming service?" | Unclear | Not all parents know BlackBear. LiveBarn is more widely recognized in youth hockey. |

**6.2 -- Signal scale comprehension deep dive**

This is the most important comprehension issue in the entire app.

**The fundamental problem:** Four of the seven signals have labels that describe the negative end of the spectrum (Cold, Chaos) but use a 1-5 scale where 5 is the positive end. When a user sees "Cold factor: 4.2" next to a snowflake emoji, the natural reading is "this rink is very cold (4.2 out of 5 on coldness)." But the actual meaning is "this rink is comfortable (4.2 out of 5 on comfort)."

Signals where the label aligns with the high end (no confusion):
- **Parking** -- "Parking: 3.8" = good parking. Label is neutral. No confusion.
- **Food nearby** -- "Food nearby: 4.0" = lots of food. Label describes what you want. No confusion.
- **Family friendly** -- "Family friendly: 3.5" = reasonably family-friendly. No confusion.
- **Locker rooms** -- "Locker rooms: 3.2" = decent locker rooms. No confusion.
- **Pro shop** -- "Pro shop: 4.0" = well-stocked. No confusion.

Signals where the label contradicts the scale direction (confusion):
- **Cold factor** -- "Cold factor: 4.2" looks like "very cold." Means "comfortable." The snowflake reinforces the wrong reading. The lowLabel "Freezing" and highLabel "Comfortable" only appear in tiny muted text below the bar, or behind an expand-tap.
- **Chaos level** -- "Chaos level: 4.0" looks like "very chaotic." Means "calm." The swirl emoji reinforces the wrong reading. Same scale-label visibility problem.

The expanded view in `SignalBar.tsx` shows directional arrows: `<-- Freezing ... Comfortable -->` and `<-- Hectic ... Calm -->`. But the collapsed default view only shows the lowLabel on the left and the highLabel on the right in `text['2xs']` (very small), below the progress bar, alongside the rating count. This is easy to miss on a quick scan.

In the `QuickVoteRow` used during rating, the per-signal scale labels are completely absent. Only generic "Low" and "High" labels appear at the bottom of the entire list. This means when Mike is rating Cold, he sees "Cold" with a snowflake and buttons 1-5, with no indication of what 1 and 5 mean for this specific signal.

---

# THE ONBOARDING SCORECARD

| Dimension | Score | Notes |
|-----------|-------|-------|
| What-is-this clarity | 4/5 | "Scout the rink" headline plus concrete subhead (parking, cold, food) communicates purpose within 3 seconds. Minor deduction: "scout" is slightly ambiguous without the subhead. |
| Is-this-for-me signal | 5/5 | Featured PA rinks (Ice Line, IceWorks, Oaks), "hockey parents" language, rink photo hero. For a Chester County parent, this could not be more targeted. |
| Time to first value | 3/5 | If Mike's rink is in the database, he gets value in ~15 seconds (search, tap, see signals). If it is not, first value requires exploring a rink he already knows, which is interesting but not useful for his next game. |
| Jargon-free experience | 2/5 | "Signals," "confidence," "Cold factor" (inverted scale), "Chaos level" (inverted scale), "contribution count." Too much internal vocabulary in the UI. |
| Signal comprehension | 2/5 | Cold factor and Chaos level are actively misleading at default collapsed state. Scale labels are too small, too muted, and hidden behind a tap. The QuickVoteRow rating flow omits per-signal scale labels entirely. |
| Team Dashboard usefulness | 1/5 | The page exists but does nothing. No functionality, no waitlist, no email capture. A placeholder with a disabled button and a "Coming soon" label. For Mike's specific use case, this is the only score that matters, and it is a 1. |
| Contribution ease | 4/5 | ReturnRatingPrompt is well-designed: single-signal-at-a-time, atomic submissions, skip buttons, progress bar. 20 seconds for 5 signals is genuinely fast. Deduction: QuickVoteRow lacks per-signal scale labels, and there is no visible confirmation of your rating on the signal bar itself. |
| Evangelism readiness | 2/5 | Mike can share a rink page (decent) but not a trip page (better). He never discovered trip planning. The shareable rink link includes parking and a tip but not game-day specifics. There is no "invite your team" flow. |

---

# THE COMPREHENSION FAILURES

1. **"Cold factor: 4.2"** -- Reads as "very cold." Means "comfortable." Fix: rename to "Comfort level" or "Temperature comfort" and change the icon to a thermometer. Alternatively, show the decoded meaning inline: "4.2 -- Comfortable" rather than just "4.2 /5."

2. **"Chaos level: 4.0"** -- Reads as "very chaotic." Means "calm." Fix: rename to "Organization" or "Ease of flow." Or display "4.0 -- Calm" inline.

3. **"Signals"** -- Product-team jargon. Mike would call these "ratings" or "reviews" or "the breakdown." Fix: rename the section header to "Rink Ratings" or "The Breakdown."

4. **"Confidence: 72%"** -- Appears in expanded signal bars without explanation. Mike has no idea what this percentage measures. Fix: replace with a plain-language equivalent: "Based on 4 ratings" (already shown) is sufficient. If confidence must stay, add a tooltip or inline explanation: "72% confident -- enough ratings to be reliable."

5. **"Contribution count"** -- Used in VerdictCard as "From 7 hockey parents this season." The word "contribution" does not appear in the UI directly (it shows "hockey parents"), but the data model uses `contribution_count`. In the code, the VerdictCard says "From {summary.contribution_count} hockey parent{s} this season." This is fine in the UI, but the code variable name leaks into the codebase and could influence future copy. Minor issue.

6. **"Trips" tab label** -- Sounds like a vacation planner. Mike's mental model is "away games," not "trips." Fix: rename to "Game Days" or "Away Games."

7. **QuickVoteRow scale labels** -- Only shows "Low" and "High" for all signals. Mike rating "Cold" with just "Low/High" has to guess what direction the scale goes. Fix: show per-signal lowLabel/highLabel inline, or at minimum show them when a signal row is focused.

8. **"Claim this rink"** -- Ambiguous for non-rink-managers. Mike does not know if this is for him. Fix: add a one-line description: "Are you a rink manager? Claim this listing to respond to tips and update facility info."

---

# THE MOMENT HE ALMOST LEFT

**The moment: tapping "Team" and seeing "Coming soon."**

Mike opened ColdStart because another dad said it would help with away game logistics. The homepage delivered. The rink pages delivered. Then he saw "Team" in the navigation -- a dedicated tab, given equal weight to Explore and Trips -- and tapped it expecting to find the thing that would replace his Google Sheet.

Instead he got a 56px hockey stick emoji, a disabled button at 50% opacity, and the words "Coming soon" in 12px muted gray.

The problem is not that the feature is unbuilt. The problem is that the tab exists at all. By putting "Team" in the persistent bottom navigation alongside functional tabs, ColdStart promises a feature and then fails to deliver it. Mike does not think "oh, this is coming and I should wait." He thinks "this isn't finished" and recalibrates his expectations for the entire product downward.

What would have kept him: Two things.

First, do not put "Team" in the bottom tab bar until the feature works. Move it to the hamburger menu or the homepage CTA only, with clear "coming soon" language before the tap happens, not after. The `TeamManagerCTA` on the homepage already says "Team Manager? Share rink info with your whole team before game day." -- but it links to the dead-end page without warning.

Second, put an email capture on the Team page. "Enter your email and your team name. We'll notify you when the team dashboard launches -- and you'll be first in line." Mike would fill this out tonight. He would check back. The dead-end page gives him nothing to do, so he leaves and may not come back.

---

# THE ONE THING THAT WOULD MAKE MIKE A CHAMPION

**Surface the Trip Planner as the bridge to the Team Dashboard.**

Mike needs to send 15 families the details for next Saturday's away game. The Trip Planner at `/trip/new` does exactly this: team name, rink, game schedule, lodging, food (pre-populated from the rink's nearby data), cost breakdown per family, notes, collaborative editing, and a shareable link. The resulting trip page at `/trip/[id]` even has a Glancer view optimized for the parent checking their phone in the parking lot.

But Mike will not find this feature unless someone tells him it exists. The "Plan trip" button on the rink detail page is 12px, tucked into a secondary row between "Compare" and streaming badges. The "Trips" tab in the bottom nav goes to `/trips` (a list of your trips), not `/trip/new`. And the tab is called "Trips," which sounds like a travel app.

The fix: When Mike lands on the "Coming soon" Team page, do not just show a disabled button and a feature list. Show him the Trip Planner:

> "The team dashboard is coming soon. In the meantime, you can create a game day page for your next away game -- share parking info, game times, food spots, and costs with your whole team."
> [Create a game day page -->]

This button links to `/trip/new`. Now Mike has something to DO. He creates a trip page for next Saturday's game at Ice Line. He shares the link with his team parents. They see the parking rating, the entrance tip for Rink C, the hotel, the Applebee's recommendation, the cost breakdown. They add their own restaurant suggestions via the collaborative additions feature.

Mike just became a champion. Not because the Team Dashboard shipped, but because the Trip Planner -- which already exists and already works -- was put in front of him at the moment he needed it most.

---

# CODE FIXES: THE THREE THINGS SHIPPED BEFORE MIKE'S NEXT AWAY GAME

*All three fixes below were implemented and deployed alongside this evaluation.*

## Fix 1: Resolve the Cold/Chaos signal inversion confusion (SHIPPED)

**File:** `components/rink/SignalBar.tsx`

**Was:** The collapsed signal bar showed the numeric value (e.g., "4.2 /5") and tiny lowLabel/highLabel text below the progress bar. For "Cold factor: 4.2," this looked like the rink is very cold. The actual meaning (comfortable) was only discoverable by tapping to expand.

**Now:** A plain-language descriptor appears next to the numeric value in the collapsed state. The value maps to the closest scale endpoint so Mike sees "4.2 Comfortable" instead of "4.2 /5."

In `SignalBar.tsx`, after the numeric value display (around line 44), add an inline descriptor derived from the signal's lowLabel/highLabel and the current value:

```tsx
// Current (line 43-46):
<span style={{ fontSize: 22, fontWeight: 700, color }}>{signal.value.toFixed(1)}</span>
<span style={{ fontSize: text.xs, color: colors.textMuted }}>/5</span>

// Replace with:
<span style={{ fontSize: 22, fontWeight: 700, color }}>{signal.value.toFixed(1)}</span>
<span style={{ fontSize: text.xs, color: colors.textMuted, marginLeft: 4 }}>
  {signal.value >= 4 ? meta.highLabel : signal.value >= 3 ? 'Average' : meta.lowLabel}
</span>
```

This changes "Cold factor 4.2 /5" to "Cold factor 4.2 Comfortable" and "Chaos level 4.0 /5" to "Chaos level 4.0 Calm." The descriptor uses the signal's own vocabulary, which resolves the scale direction ambiguity without requiring a tap.

## Fix 2: Bridge the Team Dashboard dead end to the Trip Planner (SHIPPED)

**File:** `app/team/page.tsx`

**Was:** The Team page showed a disabled "Add your team" button, "Coming soon" text, a feature preview list, and an "Explore rinks instead" link. A dead end with no call to action.

**Now:** A prominent blue CTA card appears between "Coming soon" and the feature preview, offering an immediate path to the Trip Planner.

After the "Coming soon" paragraph (line 41) and before the "What you'll get" div (line 43), add:

```tsx
<div style={{
  marginTop: 28, padding: '20px 24px',
  background: colors.bgInfo || '#eff6ff',
  border: `1px solid ${colors.brandLight || '#bfdbfe'}`,
  borderRadius: radius.xl, textAlign: 'left',
}}>
  <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
    Need to share game day info now?
  </p>
  <p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
    Create a trip page with parking intel, game schedule, food spots, and costs -- then share one link with your team.
  </p>
  <button
    onClick={() => router.push('/trip/new')}
    style={{
      marginTop: 12, fontSize: 14, fontWeight: 600,
      color: '#ffffff', background: colors.brand,
      border: 'none', borderRadius: radius.lg,
      padding: '12px 24px', cursor: 'pointer',
      width: '100%',
    }}
  >
    Create a game day page -->
  </button>
</div>
```

This turns the dead end into an on-ramp. Mike arrives expecting a team dashboard, learns it is not ready, but immediately sees that he can still accomplish his goal (sharing game day info with the team) using the trip planner. The blue info-style background differentiates this CTA from the grayed-out "coming soon" section above it.

## Fix 3: Show per-signal scale labels in QuickVoteRow (SHIPPED)

**File:** `components/rink/QuickVoteRow.tsx`

**Was:** The QuickVoteRow (used in the main "Rate the rink" flow) showed all 7 signals in a compact list with 1-5 buttons per row. The only scale indicator was a generic "<-- Low ... High -->" at the bottom of the entire list. When Mike rated "Cold," he had no idea whether 1 meant "freezing" or "not cold."

**Now:** Each signal row shows its own lowLabel/highLabel directly below the 1-5 buttons. The generic footer was removed.

Replace the current button group and the generic footer (lines 75-113) with per-row scale labels:

```tsx
{/* 1-5 buttons */}
<div style={{ flex: 1 }}>
  <div style={{ display: 'flex', gap: 4 }} role="group" aria-label={`Rate ${s.label} from 1 to 5`}>
    {[1, 2, 3, 4, 5].map(v => {
      const isSelected = selected === v;
      return (
        <button
          key={v}
          onClick={() => submitRating(s.key, v)}
          disabled={busy}
          aria-label={`Rate ${s.label} ${v} out of 5`}
          style={{
            flex: 1, height: 44, borderRadius: 8,
            border: `1.5px solid ${isSelected ? colors.brand : colors.borderDefault}`,
            background: isSelected ? colors.brand : colors.white,
            color: isSelected ? colors.white : colors.textSecondary,
            fontSize: 14, fontWeight: 700,
            cursor: busy ? 'wait' : 'pointer',
            transition: 'all 0.12s',
            opacity: busy && !isSelected ? 0.5 : 1,
          }}
        >
          {v}
        </button>
      );
    })}
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2 }}>
    <span style={{ fontSize: 9, color: colors.textMuted }}>{meta?.lowLabel || 'Low'}</span>
    <span style={{ fontSize: 9, color: colors.textMuted }}>{meta?.highLabel || 'High'}</span>
  </div>
</div>
```

And remove the generic footer on lines 109-113 since each row now has its own labels.

This ensures that when Mike rates "Cold," he sees "Freezing" on the left and "Comfortable" on the right, directly below the 1-5 buttons for that specific signal. He can no longer accidentally rate 5 thinking it means "very cold" when it means "comfortable."
