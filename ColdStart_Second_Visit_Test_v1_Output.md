# ColdStart: The Second-Visit Parent Test — Output

---

## MEGAN'S RETURN VERDICT

I used ColdStart two weeks ago before Hatfield. It was good — I screenshotted the page and sent it to the carpool chat, everyone loved it. Tonight I opened Safari, typed "coldstart" and my browser history auto-completed to coldstarthockey.com. Good start. The homepage loaded and — there it was under "Recently Viewed" — Hatfield Ice World, with a little "2w ago" timestamp. Okay, so it remembered I was here. But that's it. No "welcome back." No "you rated Hatfield." No acknowledgement that I'm the person who wrote the parking tip that's sitting on that rink page right now. I searched for Ice Line and had the page pulled up in maybe eight seconds — faster than last time because I already knew the layout. The signals made sense immediately; I didn't have to relearn anything. I could even feel myself comparing Ice Line's parking 3.8 to Hatfield's 2.0 and thinking "okay, that's better." But none of that was ColdStart helping me — that was just my own memory. The app treated me like a vaguely familiar stranger: it knew my face but not my name. I'll come back a third time because the rink data is genuinely useful and nothing else does this. But ColdStart isn't earning loyalty yet — it's coasting on the fact that the alternative is texting Dave.

---

## THE RETURN JOURNEY

### Scenario 1: The Return

**1.1 Finding ColdStart again**

Megan opens Safari on her iPhone. She doesn't have ColdStart bookmarked. She types "coldstart" into the address bar and — because she visited two weeks ago — Safari's autocomplete offers `coldstarthockey.com` from her history. She taps it. The homepage loads in under five seconds.

This is the happy path. If she'd cleared her browser history, or switched phones, or tried from her laptop, she'd be Googling "coldstart hockey" and hoping the right result appeared. The domain `coldstarthockey.com` is memorable enough that she probably gets it right on the first try from memory, but "coldstart.com" is the more natural guess and that's not this site. The browser history autocomplete is doing the heavy lifting here — it's the single biggest second-visit accelerator ColdStart has, and ColdStart didn't build it.

Total time from "I want to check ColdStart" to homepage loaded: **~6 seconds.** Well under the 15-second friction threshold. Faster than unlocking her phone and finding Dave's number.

**1.2 The homepage re-encounter**

The homepage loads. Hero section: "Scout the rink." Same as last time. Search bar auto-focused. Below the fold, the featured rinks grid shows Ice Line, IceWorks, and Oaks Center Ice — hardcoded, same as two weeks ago. Nothing has changed. No seasonal rotation, no "trending rinks this week," no regional picks based on Megan's apparent location in the Philly suburbs.

Then she scrolls and sees it: **"Recently Viewed"** — Hatfield Ice World, Colmar, PA, with "2w ago" in muted text. It's a small section, just one rink, sitting below the featured grid. But it's there. ColdStart remembers she visited Hatfield.

What's **not** there:
- No "Welcome back, Megan" (she never created an account)
- No "Rinks you've rated" section (she rated Hatfield — that's a deeper engagement than viewing, but the homepage doesn't distinguish)
- No "Your tip is helping parents at Hatfield" notification
- No contribution count ("You've rated 1 rink")
- No indication that she's anything other than someone who happened to load a page two weeks ago

The Recently Viewed section prevents the experience from feeling like a total reset. But the gap between "we noticed you were here" and "we value what you did" is wide. Megan rated three signals and wrote a 140-character tip. She invested something. The homepage acknowledges her pageview but not her contribution. It's the difference between a restaurant remembering you ate there and a restaurant remembering you left a great review.

**Emotional micro-reaction:** A small nod when she sees Recently Viewed. Then a slight flatness — the realization that she's essentially starting over. Not negative enough to leave, but not positive enough to feel pulled in.

**1.3 The account question**

Megan never created an account. ColdStart remembers her via localStorage:
- `coldstart_viewed_meta_hatfield-ice-arena-colmar` — rink name, city, state, viewedAt
- `coldstart_rated_hatfield-ice-arena-colmar` — timestamp of her rating
- `coldstart_rated_rinks` — map of rink IDs she's rated
- `coldstart_tip_vote_*` — any tip votes she cast
- `coldstart_contributor_type` — "visiting_parent"
- `coldstart_vibe` — behavioral profile tracking her as likely a "contributor" archetype

That's a surprising amount of state. But it's invisible to her. None of it surfaces as visible personalization except the Recently Viewed section. Her rating exists in the Supabase database, her tip is on the Hatfield page, but there's no thread connecting "Megan the person" to "Megan the contributor." She's a ghost with a localStorage footprint.

If ColdStart asked her to create an account right now — "Save your ratings across devices — sign up in 10 seconds" — would she? **Probably not yet.** She's here for one thing: look up Saturday's rink. The account prompt would feel like a toll booth on the highway. But if she navigated to Hatfield's page, saw her own tip, saw "You rated this rink," and *then* got a prompt — "Create an account to track your contributions" — the answer might be different. The trigger should follow the dopamine, not precede it.

---

### Scenario 2: The New Rink Search

**2.1 Speed of second search**

Megan taps the search bar (auto-focused on desktop, tap-to-focus on mobile). She types "Ice Line." No autocomplete suggestions appear — ColdStart doesn't offer type-ahead search suggestions. But the search is debounced at 300ms, so results appear almost immediately as she types. By the time she's typed "Ice Li," Ice Line Quad Rinks is showing in the results.

**Time from homepage to Ice Line's rink page: ~8 seconds.** That's faster than her first search two weeks ago (which was probably 12-15 seconds while she learned the UI). The speed improvement is real but it's **her** improvement, not the app's. ColdStart's search is identically fast — there's no "recently searched" suggestion, no "you might be looking for Ice Line (your team plays there Saturday)" intelligence. The search bar doesn't remember "Hatfield" as a previous query.

A subtle missed opportunity: if the search showed "Recently searched: Hatfield Ice World" as ghost text or a chip below the input, it would signal "we remember you" and give Megan a quick path back to her previous rink. Right now the search bar is a blank slate every time.

**2.2 The rink page — second-time reading**

Ice Line's page loads. The layout is identical to Hatfield's: hero image, verdict card, signal bars, tips, nearby section. Megan recognizes the structure instantly. She doesn't need to learn anything new. Her eyes go straight to the signals — parking 3.8, cold, food nearby — because she knows that's where the actionable intel lives.

She reads the page noticeably faster. The first time at Hatfield, she probably spent 20 seconds figuring out what the signal bars meant, what the numbers represented, what "Early — 2 ratings" meant. Now she skips all of that. She goes straight to: parking (3.8 — better than Hatfield's 2.0), cold level (is it freezing?), and food nearby (anything walkable?). She gets her answer in **under 10 seconds.**

The signal direction is consistent: higher number = more of that thing. She internalized this at Hatfield and it transfers perfectly. The only potential confusion is "chaos" — does a high chaos number mean it's chaotic (bad) or that the chaos level is well-managed? The scale labels ("Calm → Madhouse") clarify this, and she probably learned it last time.

Ice Line's page has a few things Hatfield's didn't: a Pro Shop link, LiveBarn streaming badge, and manager-verified notes on parking and locker rooms. These are nice additions but don't disrupt the layout. The page structure is consistent enough that Megan's second-time reading speed is genuinely faster.

**2.3 The comparison instinct**

Megan naturally compares Ice Line to Hatfield. She remembers Hatfield's parking was brutal (she rated it 2, the overall was low). Ice Line's parking is 3.8 — her brain immediately translates: "Okay, better parking than Hatfield. Not great-great, but I won't need to arrive 20 minutes early."

This calibration is happening entirely in Megan's head. ColdStart does nothing to facilitate it. There's no "Compare to Hatfield" button (there was a Compare button until recently, but it was removed because the route didn't exist). There's no "You rated Hatfield parking: 2. Ice Line parking is 3.8." There's no contextual comparison of any kind.

This is one of those features where the absence isn't painful — Megan can hold two numbers in her head — but the presence would be delightful. The second rink she views on ColdStart is inherently more useful than the first because she now has a reference point. ColdStart could make this explicit and it would be a genuine second-visit reward: "Your experience is making ColdStart smarter for you."

---

### Scenario 3: The Contribution Continuity

**3.1 Finding your previous contribution**

Megan navigates to Hatfield's page from the Recently Viewed section on the homepage. The page loads. She looks for her tip.

The tips section shows tips in order. Her tip — "Arrive 20 min early for parking, there's one small lot and street parking fills fast" — is there, attributed to "Visiting parent" with a timestamp. But there's no indicator that it's *her* tip. It looks identical to every other tip on the page. No "Your tip" badge. No highlight. No differentiation.

She also rated parking (2), cold (4), and contributed to the signal averages. But there's no "You rated this rink" callout on the page — wait, actually there is: the contribute button says **"✓ Update ratings"** in green instead of "📊 Rate the rink." That's the only visual indicator that she's been here before as a contributor. It's subtle. Most users would notice the green checkmark but might not consciously register why it's there.

**Does seeing her tip give her satisfaction?** Yes — if she finds it. The tip is in the list, other parents may have voted on it (the score shows), and it exists in the world. But the moment of recognition — "that's mine" — is muted because ColdStart doesn't mark it as hers. It's like seeing your photo in a group collage without your name underneath.

**3.2 Did your contribution matter?**

Megan rated parking 2. Did the overall parking score change? She has no way to tell. She doesn't remember what the score was before she rated. There's no "Your rating moved parking from 3.2 to 3.1" feedback. There's no "X parents have rated since your visit." The contribution went into the average and became invisible.

The contribute button's green "✓ Update ratings" state tells her she contributed. The "From X hockey parents" subtitle might show a slightly higher number. But the *impact* of her specific contribution is undetectable. She dropped a coin in the well. She heard the splash two weeks ago. Looking down now, she can't see it.

The contribution count in the profile dropdown (accessible via hamburger menu, if she were logged in) shows `rinksRated` and `tipsSubmitted`. But Megan isn't logged in, so she can't see this. Even if she were, a count of "1 rink rated" is more depressing than encouraging at this stage.

**Fundamental question: does rating Hatfield give her any reason to rate Ice Line?** The honest answer: marginally. The act of rating was easy and felt good in the moment. But the lack of visible impact means the motivation to rate again comes from altruism ("help the next parent") rather than personal reward ("my contributions are building something I can see"). Altruism is a weaker retention driver than personal utility.

**3.3 The second contribution**

Saturday's game at Ice Line is over. Megan opens ColdStart to rate it. If she navigated to Ice Line's page earlier and is returning 2+ hours later, the **ReturnRatingPrompt** appears automatically — a guided, one-signal-at-a-time flow through all seven signals. This is smart. It's faster than the inline rating, removes decision fatigue, and catches her when the experience is fresh.

The flow is identical to what she'd have experienced if she rated Hatfield this way. Consistency is good — no relearning. She taps through: parking (4), cold (3), food (2), chaos (1), family-friendly (4), lockers (3), pro shop (4). Seven taps, maybe 15 seconds. Then a tip input: "Four sheets so it's confusing at first — check which rink number before you go in." Done.

**Reinforcement:** "Thanks! You rated 7 signal(s). The next family will see your intel." This is good. It's immediate, it quantifies her contribution, and it frames it in terms of impact on other families. But there's no cumulative acknowledgment: "You've now rated 2 rinks" or "You've helped families at 2 rinks this season." The reinforcement is per-action, not per-journey.

**Habit nudge:** None. No "You've rated rinks after your last 2 away games — keep the streak going." No reminder mechanism. No prompt to save Ice Line or come back. The post-contribution moment is the highest-intent moment to lock in a habit, and ColdStart lets it pass without attempting retention.

---

### Scenario 4: The Forward Look

**4.1 The tournament next weekend**

Megan searches for "Whitaker Center" for next weekend's tournament. The search returns no results. ColdStart's database has two Reading-area rinks — Reading Royals Hockey Club and Reading Figure Skating Club — but not Whitaker Center Ice Rink.

This is the "empty shelf" moment. Megan has used ColdStart successfully twice. She's calibrated. She understands the signals. She was about to get value for a third time. And it's not there. The search results page shows a hockey emoji, "No rinks found for 'Whitaker Center,'" and a **RinkRequestForm** — "Don't see your rink? Request it."

She could request it, but the tournament is next weekend. A request won't help her Saturday. She closes the tab.

**How damaging is this?** Moderately. It doesn't erase the value she got from Hatfield and Ice Line. But it breaks the forming habit. The third time was supposed to be the one that made ColdStart automatic — "away game → open ColdStart" as a reflex. Instead, the reflex failed, and Megan's brain files ColdStart as "useful sometimes, not always." That's the difference between a tool and a habit.

**4.2 The team adoption question**

Is Megan ready to recommend ColdStart to her team manager? After two successful uses and one miss: **probably, with a caveat.** She'd say "check ColdStart before away games, they have a lot of rinks but not all of them." That qualified recommendation is weaker than "use ColdStart for every away game" and puts the burden on each parent to check whether their rink is covered.

ColdStart has a "📤 Share with team" button on rink pages that uses native sharing (or clipboard copy). This is well-implemented. But there's no "invite your team" flow, no team setup, no way to say "I'm on the Philly Suburbs 10U Squirt A team and here's our schedule." The Team Dashboard exists as a route (`/team`) but shows a "Coming Soon" placeholder.

Megan would share a specific rink page link, not the homepage. This tells you: the homepage isn't doing its job as an evangelism tool. The rink page is the product. The homepage is just a search bar.

**4.3 The habit formation signals**

After 3 uses in 3 weeks (2 successful, 1 empty), ColdStart is close to becoming routine but hasn't locked in. Ranking the proposed habit-forming features by impact for Megan:

1. **Recently viewed rinks section on homepage** — Already exists. Functional. The minimum that prevents "starting from scratch."
2. **Seeing your contribution count grow** — Small but meaningful. "You've helped families at 2 rinks" creates a tiny sunk cost.
3. **A bookmark/home screen shortcut prompt** — Eliminates the "find ColdStart again" friction entirely. High impact, low effort.
4. **Getting a notification when someone rates a rink you've been to** — Creates a reason to return between games. "3 new ratings at Ice Line since your visit."
5. **Having your team's schedule integrated** — The ultimate lock-in. "Your next away game is at Oaks Center Ice. Here's what parents say."
6. **Seeing the rink page for your next opponent's rink before you even search** — Magical but requires schedule integration.
7. **An email or text reminder before your next away game** — Effective but requires account + schedule data.

**The MINIMUM that turns ColdStart from "a thing I use sometimes" to "the first thing I check":** The combination of (1) recently viewed already existing + (3) a home screen prompt + (2) a visible contribution count. These three together mean: she can find ColdStart instantly (home screen), she sees her history immediately (recently viewed), and she has a small personal stake (contribution count). No backend changes required — all localStorage.

---

### Scenario 5: The Forgetting Curve

**5.1 The 6-week gap**

Season gets busy. Megan doesn't use ColdStart for 6 weeks. She comes back for a playoff game at an unfamiliar rink.

Does she remember how ColdStart works? Yes. The UI is simple enough that the learning curve is essentially zero. Search → rink page → signals → tips. There's nothing to forget.

Does ColdStart remember her? **Probably.** localStorage persists until explicitly cleared. Her recently viewed rinks (Hatfield, Ice Line) are still there. Her rated-rinks flags are intact. The vibe profile tracked her as a "contributor" archetype.

But 6 weeks of browser usage means Safari may have purged localStorage under storage pressure (ITP, storage eviction). If she cleared cookies/data at any point, or if iOS decided ColdStart's localStorage was expendable (7-day cap on script-writable storage for sites without "regular user interaction" in WebKit), everything is gone. Megan becomes a ghost again.

If localStorage survived: the experience is nearly identical to her second visit. Recently Viewed shows Hatfield and Ice Line. She searches for the playoff rink. She's calibrated on the signal system.

If localStorage was purged: she starts from zero. No recently viewed. No rated-rink indicators. No behavioral profile. The homepage shows the same three featured rinks. It's a first visit again. She doesn't know this — she just notices the homepage feels emptier than she remembered.

**5.2 The seasonal boundary**

Season ends. Summer passes. September arrives. New season.

Last season's ratings and tips are in the database — they persist. Megan's tip at Hatfield is still there. The signal averages include her contribution. But ColdStart currently has a **staleness warning** that triggers after 60 days: "⚠️ Last updated over 3 months ago." By September, every rating from last season carries this warning. The data is aging visibly.

Is there a seasonal freshness indicator? Yes — "Confirmed this season" badges appear on rinks with recent ratings. But rinks that haven't been re-rated look stale. This is actually correct behavior — conditions DO change between seasons (new management, renovations, price changes). But it means Megan's contribution from last April now has a yellow warning on it.

Her localStorage is almost certainly gone after a full summer. She's starting from zero on the client side. The database remembers her contribution; her browser does not.

**Does ColdStart maintain a relationship with Megan across seasons?** No. Every September is a first visit — unless she created an account, in which case her profile, contribution count, and Trusted Reviewer progress persist. But without an account, the seasonal boundary is a hard reset. ColdStart loses Megan every summer and has to re-acquire her every fall.

---

### Scenario 6: The Retention Mechanics Audit

**6.1 What ColdStart remembers about returning visitors**

| Storage Key | What It Enables | Impact If Cleared |
|-------------|-----------------|-------------------|
| `coldstart_viewed_meta_{rinkId}` | Recently Viewed section on homepage | Homepage shows no history |
| `coldstart_viewed_{rinkId}` | Post-visit rating prompt timing | Prompt may re-trigger or not trigger |
| `coldstart_rated_rinks` | "✓ Update ratings" green button state | Button reverts to "Rate the rink" |
| `coldstart_rated_{rinkId}` | Prevents re-prompting for rating | May get re-prompted |
| `coldstart_my_rinks` | Saved/favorited rinks on homepage | "My Rinks" section disappears |
| `coldstart_contributor_type` | Visitor vs. local toggle default | Resets to "visiting_parent" |
| `coldstart_tip_vote_{slug}_{idx}` | Tip upvote/downvote state | Votes appear un-cast |
| `coldstart_tip_flag_{slug}_{idx}` | Flag state per tip | Flag button re-enables |
| `coldstart_trips` | All saved trips | Trip history lost entirely |
| `coldstart_trip_draft` | Auto-saved trip in progress | Draft lost |
| `coldstart_vibe` | Behavioral archetype (organizer/scout/etc.) | Archetype resets to unknown |
| `coldstart_place_tips_*` | User-contributed place tips | Local place tips lost |
| `coldstart_place_vote_*` | Place voting state | Place votes reset |
| `coldstart_fan_favs_*` | Fan favorite data | Fan favorites lost |
| `coldstart_claims` | Rink ownership claims | Claims lost |
| `coldstart_rink_requests` | Rink addition requests | Requests lost |
| `coldstart_rating_context` | Context for rating (future use) | Context lost |

**Plus:** NextAuth JWT session cookie (HttpOnly, server-managed) — persists login state.

**Is there ANYTHING that makes a second visit different from a first visit?**

Yes, meaningfully:
- Recently Viewed section appears (if localStorage intact)
- Rated rink buttons show green "✓ Update ratings"
- Post-visit rating prompt triggers on return (2hr–7day window)
- Saved rinks appear in "My Rinks"
- Vibe engine classifies user archetype

But the differentiation is quiet. It's there if you look for it, but ColdStart never *announces* that it recognizes you.

**6.2 What ColdStart SHOULD remember (and implementation difficulty)**

| Data | Current State | Minimum Viable Version | Effort |
|------|--------------|----------------------|--------|
| Recently viewed rinks | ✅ Implemented (localStorage, last 5) | Working today | Done |
| Rinks user contributed to | Partial — `rated_rinks` map exists but isn't surfaced as a section | Add "Rinks you've rated" section on homepage, reading existing localStorage | Small (< 1 day) |
| User's location | Not persisted | Store lat/lng in localStorage on first geolocation grant; use for "Rinks near you" | Small (< 1 day) |
| User's team | Not implemented | Team Dashboard is "Coming Soon" | Large (multi-week) |
| Rating history | Tracked in localStorage (which rinks) but not what values | Surface as "Your ratings" on rink page, reading existing storage keys | Small (< 1 day) |
| Tip history | Not tracked client-side (tips go to DB, no local reference) | Store tip text + rinkId in localStorage on submission; show "Your tip" badge | Small (< 1 day) |

**6.3 The account creation moment**

ColdStart supports Google, Apple, Facebook, and email/password auth. Creating an account unlocks:
- Contribution counts persisted server-side (`rinksRated`, `tipsSubmitted`)
- Profile dropdown with stats
- Progress toward "Trusted Reviewer" badge (10+ rinks)
- Cross-device persistence
- Bot verification bypass for tips

The right moment to prompt account creation is **immediately after the second contribution.** Megan rates Hatfield (contribution #1). Two weeks later, she rates Ice Line (contribution #2). The post-rating success screen should say: "You've rated 2 rinks this season. Create an account to track your contributions and earn Trusted Reviewer status." This is the moment she has enough invested to care about persistence, and enough evidence that she'll use ColdStart again.

The current flow doesn't prompt account creation at this moment. Auth is required for posting tips (with a bot-verification fallback for anonymous users), but signal ratings work without auth. The natural friction point (tip posting) comes at the right time but for the wrong reason — it feels like a gate, not an invitation.

Lightest-weight account: **Sign in with Apple** (one tap, no typing, preserves privacy). Email/password is the highest-friction option and should be last in the list, not first.

**6.4 The re-engagement gap**

Between Megan's first visit and tonight: zero contact from ColdStart. No email, no push, no SMS, no calendar reminder. ColdStart had no way to reach her — she didn't create an account, didn't opt into notifications, didn't provide an email.

If ColdStart had sent: "Your team plays at Ice Line this Saturday. Parents rate parking 3.8 and it runs cold (4.1/5). Here's the full prep →" — Megan would have tapped that link instantly. That's not marketing; that's the exact information she was going to search for anyway, delivered proactively.

**Lightest-weight re-engagement mechanism:** An "Add to Calendar" button on the trip builder that creates an .ics event with a ColdStart link in the notes. No account required. No notification infrastructure. Just a calendar event that says "Away game at Ice Line — ColdStart prep: [link]" that Megan sees when she checks her weekend schedule. The calendar becomes the reminder system.

---

## THE RETENTION SCORECARD

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Rediscovery ease** | 4/5 | Browser history autocomplete does the work. Domain is memorable. One typo ("coldstart.com") away from confusion. No PWA/home-screen prompt to eliminate this friction entirely. |
| **Recognition** | 2/5 | Recently Viewed section exists — that's real. But no "welcome back," no contribution acknowledgment, no personalized greeting. The app knows Megan visited but doesn't know she *contributed.* Feels like being recognized by the building but not by anyone inside it. |
| **Speed improvement** | 4/5 | Second visit genuinely faster — layout is learned, signals are understood, search is quick. But the speed improvement is Megan's learning, not the app's adaptation. Search doesn't remember, homepage doesn't prioritize, no shortcuts for returning users. |
| **Contribution continuity** | 2/5 | Tip exists on Hatfield's page but isn't marked as hers. Rated-rink button turns green (subtle). No "Your Contributions" view. No tip history. She has to navigate to Hatfield and scan the tip list to find her own words. Impact of her rating is invisible. |
| **Impact visibility** | 1/5 | Near zero. No "your rating changed the average." No "X parents saw your tip." No contribution count visible without auth. The act of contributing feels like shouting into fog — you know you made a sound but can't see who heard it. |
| **Calibration benefit** | 3/5 | Real but entirely in Megan's head. Having experienced Hatfield's parking-2.0 makes Ice Line's parking-3.8 meaningful. ColdStart could make this explicit ("better parking than Hatfield, which you rated") but doesn't. The second rink IS more useful because of the first — that's emergent value that ColdStart isn't capturing credit for. |
| **Habit formation** | 2/5 | No nudges, no streaks, no reminders, no "add to home screen." Recently Viewed is the only pull mechanism. Post-contribution reinforcement is per-action, not cumulative. No reason to come back except the next away game — and no mechanism to remind her when that is. |
| **Cross-season persistence** | 1/5 | localStorage will almost certainly be purged over summer. No account means no server-side memory. Staleness warnings correctly flag old data but make last season's contributions feel expired. September is a hard reset without auth. |
| **Account value timing** | 3/5 | Auth exists (Google, Apple, Facebook, email). Profile has contribution counts and Trusted Reviewer badge. But the prompt to create an account isn't timed to the moment of maximum motivation (post-second-contribution). The value proposition ("track your contributions") isn't surfaced at the right moment. |

**Overall: 22/45 (49%)**

---

## THE RETENTION GAP

The single biggest reason Megan might not come back: **her contributions feel like they disappeared.** She rated three signals and wrote a tip at Hatfield. Two weeks later, there is no visible evidence — from her perspective — that any of it mattered. The tip is on the page but isn't marked as hers. The ratings moved an average by a fraction of a point that she can't detect. The homepage says "Recently Viewed" but not "Rinks You've Helped." There's no contribution count, no impact metric, no acknowledgment.

This matters because the contribution is what separates Megan from a passive reader. Passive readers bounce — they get their answer and leave. Contributors have a stake. They come back to see if their contribution helped someone. They come back to see if someone else's contribution matched their experience. They come back because they're building something.

ColdStart's contribution flow is excellent — quick, low-friction, well-designed. But the *aftermath* of contribution is silent. The coin goes in the well, and ColdStart never shows her the wishes it granted.

**Minimum change that closes this gap:** After Megan rates Ice Line (her second rink), show: "You've helped families at 2 rinks this season. [See your contributions →]" — linking to a lightweight profile view that shows her rated rinks and tips, even without an account (using localStorage). This takes her contribution from invisible to visible, from ephemeral to persistent, from altruistic to personally rewarding. It also creates the perfect account-creation prompt: "Create an account to keep your contribution history across devices."

---

## THE HABIT TRIGGER

**The specific interaction:** When Megan opens ColdStart for the third time and searches for next weekend's tournament rink, instead of just showing the rink page, ColdStart shows a **one-line contextual comparison banner** at the top of the rink page:

> "You've been to 2 rinks. Parking here is rated higher than Hatfield (3.8 vs 2.0). Cold level is similar."

**The specific screen:** The rink detail page, above the verdict card.

**The specific moment:** The instant she lands on a new rink page, having previously rated at least one other rink.

**Why this works:** It transforms ColdStart from a reference tool (look up a rink) into a **personal scouting system** (compare this rink to places you've actually been). The second rink page becomes more valuable than the first because Megan's experience is now context. The third becomes more valuable than the second. Each visit makes the next visit better — not because ColdStart has more data, but because *Megan* has more data and ColdStart is helping her use it.

This is the habit trigger because it creates **increasing returns to repeated use.** Most apps get less valuable over time (you've already seen the content). ColdStart with contextual comparison gets *more* valuable over time (each rink you visit calibrates every future rink). That's the dopamine loop: "I wonder how this rink compares to the ones I know." That's the reflex: "Away game → open ColdStart → see how it stacks up."

---

## THE RETENTION ROADMAP

### Tier 1 — This Week (localStorage only, no auth required)

**What to build:**

1. **"Rinks You've Rated" section on homepage** — Read `coldstart_rated_rinks` from localStorage. Show rated rinks in a section above Recently Viewed. Each card shows rink name, when rated, and a "See your ratings →" link. Distinguishes contributors from viewers.

2. **"Your tip" badge on TipCard** — When rendering tips on a rink page, check if the tip text matches any tip stored in a new `coldstart_my_tips` localStorage key (saved at submission time). If match, show a subtle "Your tip" badge next to the contributor type label.

3. **Cumulative contribution counter** — After any rating or tip submission, show: "You've helped families at N rink(s) this season." Store count in localStorage. Display in post-contribution confirmation and on homepage.

4. **Add-to-home-screen prompt** — After second visit (detected via `coldstart_vibe` session count), show a non-intrusive banner: "Add ColdStart to your home screen for instant access before away games." Dismissable, shown once.

**What it enables:** Returning visitors see their history, feel acknowledged, and have a reason to keep building their contribution profile. The home-screen prompt eliminates rediscovery friction.

**Cost to build:** 2–3 days of frontend work. Zero backend changes.

**Expected impact on second-visit return rate:** +15-25%. The contribution visibility alone changes the emotional equation from "I used it once" to "I'm building something here."

### Tier 2 — This Month (lightweight auth, minimal backend)

**What to build:**

1. **Post-second-contribution account prompt** — After the user's second rating (detected via localStorage), show: "You've rated 2 rinks. Create an account to save your scouting history and earn Trusted Reviewer status." One-tap Sign in with Apple/Google. The current auth system already supports this — just needs the trigger.

2. **Contribution profile page** — `/profile` route showing: rinks rated (with dates), tips submitted (with text), total contribution count, progress toward Trusted Reviewer badge (10+ rinks). For logged-in users, this pulls from DB. For anonymous users, this reads from localStorage (with a "Sign in to sync across devices" prompt).

3. **Contextual rink comparison** — On any rink page, if the user has rated other rinks, show a one-line banner: "Parking is rated higher than [Rink You Rated] (3.8 vs 2.0)." Reads from `coldstart_rated_rinks` + API data. The backend already has the signal averages; this just needs a client-side comparison.

4. **"Add to Calendar" on trip builder** — Generate an .ics file download with game date, rink name, address, and a ColdStart link. Zero notification infrastructure — the user's existing calendar becomes the reminder system.

5. **Smart search suggestions** — Show "Recently searched" and "Rinks you've visited" as chips below the search bar. Reads from localStorage. Saves 3–5 seconds on every return visit.

**What it enables:** Account creation at the right moment, visible contribution history, personal rink comparisons, and a passive re-engagement mechanism via calendar. The search suggestions reduce friction on every visit.

**Cost to build:** 2–3 weeks. Account prompt and profile page are the biggest pieces. Comparison banner and calendar export are 1–2 days each.

**Expected impact on second-visit return rate:** +25-40%. Account creation converts anonymous localStorage users into persistent, cross-device users. Calendar integration creates a re-engagement path without any notification infrastructure.

### Tier 3 — This Season (full engagement loop)

**What to build:**

1. **Team integration** — Complete the Team Dashboard. Let a team manager enter their season schedule (opponent, rink, date). ColdStart auto-generates rink prep pages for each away game. Every parent on the team gets the same view. The manager shares one link: "Here's our team on ColdStart." Individual parents contribute ratings after each game, building the team's collective intelligence.

2. **Pre-game notification** — For users with accounts + team schedules, send an email/push 24 hours before each away game: "Tomorrow's game is at [Rink]. Parents rate parking 3.8 and recommend arriving 15 min early. Full prep →" This is the highest-impact re-engagement mechanism because it delivers value at the exact moment of need.

3. **Post-game rating prompt** — Push notification or email after game day: "How was [Rink]? Rate it in 30 seconds to help the next family." Catches parents when the experience is fresh. The current ReturnRatingPrompt does this on-page, but a push extends it to parents who don't revisit.

4. **Seasonal rollover** — At season start, show returning users: "Welcome back for the new season. Your ratings from last year helped X families. Rinks may have changed — re-rate after your first visit to keep data fresh." Acknowledges the cross-season relationship and motivates re-contribution. Flag stale ratings but don't delete them.

5. **PWA with offline caching** — Service worker caches rink pages the user has viewed. On game day at the rink (possibly with bad cell signal in a cold arena), the page loads from cache. Add `manifest.json` for proper "Add to Home Screen" support with app icon and splash screen.

6. **Social proof in contribution** — "Join 47 parents who've rated this rink" on the contribute button. "Your tip was helpful to 12 families" (based on tip upvotes). Show ratings influence: "Your rating of 2 for parking is close to the average of 2.3 — parents agree with you."

**What it enables:** The complete loop — from "I found ColdStart before a game" to "ColdStart reminds me before every game and my contributions help my whole team." Team integration makes ColdStart a team tool, not just a personal one. Pre-game notifications solve the re-engagement gap. PWA solves the "find ColdStart again" problem permanently.

**Cost to build:** 6–10 weeks. Team integration and notification infrastructure are the largest pieces. PWA and seasonal rollover are 1–2 weeks each.

**Expected impact on second-visit return rate:** +50-70%. Team integration alone could drive this — when one parent sets up the team, every parent on the team becomes a ColdStart user. Pre-game notifications convert "I forgot about ColdStart" into "ColdStart reminded me." The seasonal rollover turns one-season users into multi-season users.
