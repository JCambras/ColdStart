# ColdStart: Founder User Test v1 — Output

**Eval run:** February 21, 2026
**Persona:** Jon Cambras, founder
**Rinks examined:** Ice Line (West Chester, PA), IceWorks Skating Complex (Aston Township, PA), Oaks Center Ice (Oaks, PA)
**Build:** v0.3 (post-freshness-badge, post-contextual-labels, post-contributions-section)

---

## 1. The Honest Verdict

I'd show this product at the rink. I wouldn't apologize. But I'd steer the demo.

Here's the truth: ColdStart delivers on its core promise better than I expected. A parent searching for Ice Line gets from homepage to parking-cold-food intel in about 2.5 seconds and 2 taps. The 7-signal model is genuinely more useful than Google Maps' single star rating for a hockey parent's Saturday morning decision. The verdict card is immediate, the signals are scannable, and the new contextual labels ("Tighter than most rinks") finally give the numbers weight. That's real. I'm proud of that.

But the product has a liveness problem that I feel in my gut every time I open a rink page. It feels like a well-organized reference document, not a living community. Waze makes you feel like you're part of a swarm — other drivers are reporting right now, the data is breathing. ColdStart feels like someone (me) carefully set this up and walked away. The freshness badge helps — "Updated 3h ago" is a genuine trust signal — but only when data IS fresh. For most rinks, there's no badge, no staleness warning, just... silence. The 7-60 day gap between "fresh enough for a green badge" and "stale enough for an amber warning" is a dead zone where the platform gives you no temporal signal at all. That's where most rinks live, and in that zone, ColdStart feels static.

The other thing that would make me steer the demo: the screenshot. If a parent in the carpool group chat receives a screenshot of a rink page, they see the name, the address, the verdict — but NOT the signal scores. The signals are below the fold. The single most valuable thing ColdStart does (breaking a rink into 7 parent-relevant dimensions) is invisible in the most common sharing behavior. That's not a bug, but it's a missed opportunity that would make me wince if I saw someone screenshot-and-share at a game.

Would I text a friend "check this out"? Yes — with the caveat "it's early but it's already more useful than Google." That's honest. It's not the "holy shit you have to see this" text yet. But it's close enough that I can see the path.

---

## 2. The Founder Scorecard

| Dimension | Score | Why |
|-----------|-------|-----|
| First impression (3-second test) | 4/5 | "Scout the rink" + "Parking, cold level, food nearby — from parents who've been there" communicates purpose instantly. The dark hero with the amber search button is visually confident. Loses a point because the featured rinks grid below the fold takes 600-1000ms to populate (double API call per rink), and on a slow connection you're staring at empty cards. |
| Information density (signal-to-noise) | 4/5 | The 7-signal model is the product's superpower. Parking, cold, food, chaos, family-friendly, lockers, pro shop — that's exactly the checklist in every hockey parent's head. The new contextual labels ("Warmer than most rinks") transform bare numbers into decisions. Loses a point because the expanded signal view shows the info tooltip, the facility detail, AND the rating count — three levels of detail that compete for attention when you really just wanted to know "is parking going to suck." |
| Data trust (do the numbers feel real?) | 3/5 | This is the hardest score. Ice Line's parking at 3.8/5 with 3 ratings — is that enough to trust? The "Early" warning disappears at exactly 3 ratings, which means a parent sees "3 ratings" with no warning badge and might assume 3 is a robust sample. The "Visiting parent" / "Local" badges on tips are smart — they create credibility without requiring names. But "5 ratings" on a signal still reads as "barely anyone has used this." The trust gap isn't the data quality (the numbers are plausible) — it's the data quantity. ColdStart needs to feel like it has a community behind it, and right now it feels like it has a founder and 4 friends. |
| Contribution flow (would you rate twice?) | 4/5 | The return-visit rating prompt is excellent — one signal at a time, 2 taps per signal, auto-advance. I'd rate all 7 in under a minute. The "Your Contributions" section on the homepage (new) makes past ratings visible, which matters psychologically — you contributed, and the product remembers. The "Your tip" badge is a small touch that creates ownership. Loses a point because after I finish rating, the success screen auto-dismisses after 2 seconds. I want a beat to feel good about contributing. And there's no "invite a teammate to rate" CTA after contribution — the obvious viral moment is wasted. |
| Sharing & screenshots (group chat ready?) | 3/5 | The share text is rich — rink name, parking score, address (Apple Maps link), top tip, and URL. That's better than most apps. But the screenshot test fails. The top 600px of a rink page shows: nav, hero photo (220px of visual real estate), rink name, address, verdict card. No signal scores visible. A parent receiving this screenshot in a group chat gets the verdict ("Good rink overall") but not the thing that makes ColdStart valuable ("Parking: 3.8, Cold: 3.0, Food: 3.8"). The share TEXT is great; the share IMAGE is incomplete. Also: no per-rink og:image, so link previews in iMessage show the generic ColdStart hero image, not the specific rink. |
| Liveness (does it feel alive?) | 2/5 | This is where it hurts. Open 3-4 rink pages and you feel like you're browsing a catalog, not participating in a community. There are no real-time signals ("3 parents rated this week"), no activity feed, no "just updated by" attribution. The freshness badge (new) is a genuine improvement — when it appears, it signals life. But it only appears for rinks updated in the last 7 days. The staleness warning only appears after 60 days. Between day 8 and day 59, there's nothing — no temporal context at all. That's where most rinks live, and in that zone, ColdStart is a clock with no second hand. The contribution count ("From 5 hockey parents this season") is static and low. Compare to Waze: "1,247 Wazers nearby." The numbers tell you someone else is here right now. ColdStart's numbers tell you someone was here once. |

**Overall: 20/30**

Honest assessment: strong foundation (4s in first impression, density, and contribution), critical weakness in liveness (2) and moderate gaps in trust (3) and sharing (3). The product works. It doesn't yet feel alive.

---

## 3. Pride & Cringe

**Strong Pride:**

1. **The 7-signal model.** Parking, cold, food, chaos, family-friendly, lockers, pro shop. This IS the hockey parent checklist. No other product breaks a rink into these exact dimensions. Google gives you one star. ColdStart gives you seven answers to seven real questions. This is the product's reason to exist, and it's genuinely good.

2. **"Scout the rink" hero + search.** Three words that communicate exactly what this does. The dark photo background with the amber search pill is visually confident — it looks like a product, not a side project. The auto-focus on desktop and the 300ms debounce search are polished touches.

3. **The return-visit rating prompt.** Detecting that you've been to this rink before and surfacing a one-signal-at-a-time rating flow is exactly the right UX for a tired parent who has 30 seconds to contribute. The 2-tap-per-signal flow respects the user's time. This is how you build a crowdsourced dataset without annoying people.

4. **Contextual signal labels (new).** "Better than most rinks" / "Tighter than most rinks" transforms a meaningless number (3.8/5) into a decision ("parking is above average, I won't stress about it"). Computed from 2,298 rinks of state-level data. This is the Strava insight applied to rinks — and it works.

5. **The Trip Builder's progressive disclosure.** Team name + rink unlocks optional sections. Auto-save draft. Collapsible sections. The Glancer quick-view for shared links (address, next game, parking verdict) is exactly what a carpool parent needs. This feature is quietly excellent.

**Slight Pride:**

6. **Verdict card freshness badge (new).** "Updated 2h ago" in a green pill next to the verdict — immediate trust signal. Simple, effective. Only shows when data is genuinely fresh, so it doesn't lie. The right call.

7. **"Your Contributions" homepage section (new).** Seeing your rated rinks with timestamps creates a feedback loop: I contributed, the product remembers, I'm part of this. The green "Rated" badge is subtle but satisfying.

8. **Manager verified badges.** Ice Line's parking note from "Mike T., Rink Manager" with the blue VERIFIED tag — this is the single most trust-building element on any rink page. When a rink manager confirms or adds context to a parent rating, the data feels real. The problem: only 3 rinks have these.

9. **Share text composition.** `Ice Line (Parking: 3.8/5)\n📍 1 Dutton Mill Rd...\n💡 "Use the side entrance for Rink C"\nRink info from hockey parents: [URL]` — that's a genuinely useful text message. Includes parking (the #1 question), address (as a tappable link), top tip, and the URL. Most apps would just share a bare link.

10. **"Your tip" badge (new).** Small but psychologically important — seeing "Your tip" next to something you wrote creates ownership and makes the platform feel personal.

**Slight Cringe:**

11. **The 220px hero photo.** On mobile, the rink photo consumes 220px of precious above-the-fold real estate. For a parent in a dark car who wants parking and cold info, this is a scenic detour before the data. The photo is nice to have, but it pushes the signals below the fold. **Fix:** Make the photo 140px or collapsible after first visit.

12. **No per-rink og:image for link previews.** When someone shares a rink link in iMessage or Slack, the preview shows the generic ColdStart hero image, not the specific rink. Every share is a missed branding opportunity. **Fix:** Generate og:image per rink with name, verdict, and top 3 signal scores.

13. **"From 5 hockey parents this season."** This is meant to build credibility but it does the opposite at low counts. "5 parents" sounds like a beta test, not a community. **Fix:** Don't show contribution count below 10, or rephrase: "Recently rated by hockey parents" without the number.

14. **The 7-to-60-day freshness dead zone.** Freshness badge disappears after 7 days. Staleness warning doesn't appear until 60 days. In between: nothing. Most rinks live in this zone, and they feel temporally orphaned. **Fix:** Show "Updated [timeAgo]" always (not just < 7 days), just without the green badge. Gray text, no pill. The data always has a timestamp; show it.

**Moderate Cringe:**

15. **Signal scores invisible in screenshots.** The top 600px of a rink page on mobile: nav (40px) + photo (220px) + header (80px) + verdict card (160px) = 500px. Signal scores start at ~520-600px — barely visible or just below the fold. A screenshot shared in a group chat communicates the verdict but not the 7 signals that are ColdStart's differentiator. **Fix:** Add a compact signal summary row (7 small colored dots or mini-bars with values) inside the verdict card, above the fold.

16. **No "invite to rate" after contribution.** You just rated 7 signals in under a minute. You feel good. The success screen shows for 2 seconds and auto-dismisses. No "Share with your team so they can rate too" CTA. No "You're one of 5 parents who rated this rink" social context. The single most viral-ready moment in the product is wasted on a self-closing confirmation. **Fix:** Replace auto-dismiss with a persistent success screen that includes a "Share this rink" button and a stat ("You helped X parents make better decisions").

17. **Tip vote scores are seeded and visible.** First tip: 12 upvotes. Second: 8. Third: 5. These are hardcoded in TipCard.tsx. A founder knows this is fake social proof. A sharp user might notice the pattern. The vote scores should either come from real data or not display a number until real votes exist. **Fix:** Show vote buttons but no score until the tip has received at least 1 real vote.

18. **Search clear button tap target.** The clear/search button in the hero search bar has padding of `8px 20px` — roughly 30px height. On a cold morning with gloved fingers, that's a miss target. iOS recommends 44px minimum. **Fix:** Increase padding to `12px 20px` minimum.

---

## 4. The Three Fixes Before Saturday

### Fix 1: Add a compact signal summary inside the verdict card

**What to change:** Inside VerdictCard, below the verdict text and above the stats line, add a single row showing all 7 signal icons with their values in colored mini-badges. Example: `🅿️ 3.8  ❄️ 3.0  🍔 3.8  🌀 3.4  👨‍👩‍👧 4.3  🚪 2.6  🏒 3.8` — each number colored by its bar color (green/amber/red).

**Why it matters:** This single change fixes the screenshot problem AND the "text Dave" test. A screenshot of the top of a rink page now includes the signal scores — the core value prop. A parent in the group chat can extract parking, cold, and food in 2 seconds from the screenshot alone. And when competing with Dave's text message, ColdStart's answer is now visible in one glance instead of requiring a scroll. This is the highest-impact layout change possible.

**How hard:** Quick fix — 30-45 minutes. The data is already available in VerdictCard via `ensureAllSignals()`. Just needs a flex row with colored badges.

### Fix 2: Show "Updated [timeAgo]" on all rink pages, not just fresh ones

**What to change:** In VerdictCard, always show the `last_updated_at` timestamp as readable text — not just when data is < 7 days old. For fresh data (< 7 days): green pill badge (current behavior). For moderate data (7-60 days): gray text, no pill, just "Updated 12d ago" in the stats line. For stale data (> 60 days): keep the amber warning. The goal: every rink page communicates temporal context. No dead zone.

**Why it matters:** This fixes the liveness problem for the ~80% of rinks in the 7-60 day zone. "Updated 23d ago" in gray text doesn't scream "stale" — but it does say "someone was here recently enough." It makes the platform feel observed and maintained. It also gives parents a calibration point: "this data is from 3 weeks ago, close enough" vs. "this data is from 3 weeks ago, I should rate after today's game to update it." Every temporal signal nudges contribution.

**How hard:** Quick fix — 15 minutes. The `last_updated_at` field and `timeAgo()` function already exist. Just remove the `isFresh` conditional gate and always render the timestamp, varying only the styling.

### Fix 3: Add post-contribution share CTA

**What to change:** In the ReturnRatingPrompt success state (the screen after rating signals), replace the auto-dismissing "Thanks! You rated N signals" with a persistent card that includes: (1) the thank-you message, (2) "You're one of N parents who rated this rink" with the actual count, (3) a "Share this rink with your team" button that triggers the same share flow as the rink page share button, and (4) a "Done" button to dismiss.

**Why it matters:** This is the viral loop. A parent who just contributed is in the highest-engagement state they'll ever be in — they just spent 60 seconds rating a rink they care about. If you ask them to share right now, some percentage will. If you auto-dismiss and move on, 0% will. Every other consumer platform (Yelp, Airbnb, Strava) has a post-contribution share moment. ColdStart doesn't. Adding one turns every contribution into a potential acquisition event.

**How hard:** Half-day. Need to keep the success screen persistent (remove the 2-second auto-dismiss), add the share button (reuse existing share logic from the rink page), and add the contribution count context. Most of the code exists; it's integration work.

---

## 5. The Vision Gap

The single biggest gap between what ColdStart promises and what it delivers is **the absence of other people.** ColdStart's tagline is "from parents who've been there" — it promises a community of hockey parents sharing real-world intel. But when you use the product, you never feel like other parents are here. You see their data (ratings, tips, verdicts) but you never see *them*. There are no names (by design — privacy matters). There are no avatars. There are no "Sarah K. rated this 2 hours ago" notifications. There are no "12 parents checked this rink today" counters. The contribution count says "From 5 hockey parents" but those 5 parents are ghosts — they left data and vanished. Compare to Waze: you see other drivers on the map. You see "reported 3 min ago by Wazer." You feel like you're part of something happening right now. ColdStart has the data layer of a crowdsourced platform but the social layer of a static website. The data is good. The isolation is the problem.

The version that makes me text a friend "check this out" with genuine pride looks like this: you open a rink page and you see "4 parents rated this rink in the last week" in a subtle pulse. You contribute a rating and see "Thanks — you just helped 23 families headed here this weekend." You share a rink link and the recipient sees "Shared by Jon" with a small badge. The data is the same. The numbers are the same. But the product feels inhabited. It feels like walking into a rink lobby where other parents are already talking — not like reading a bulletin board someone pinned up last month. ColdStart has the information architecture right. Now it needs the human heartbeat.
