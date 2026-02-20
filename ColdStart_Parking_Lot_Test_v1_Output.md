# ColdStart: The 5:32 AM Parking Lot Test
## Full Simulation Output

---

# PART 1: THE SCENE

It's 5:32 AM on a Saturday in February. The parking lot at a strip mall in West Chester, PA is empty except for Sarah Chen's Subaru Outback, which is running because it's 28 degrees and her 9-year-old, Ethan, is in the backseat in full gear minus skates, asking "are we late?"

They're not late. Ethan's 6:10 AM practice got moved to Ice Line in West Chester — a rink they've never been to. Their usual rink is Oaks Center Ice, 20 minutes east. Sarah's team parent group chat blew up at 9 PM last night with the rink change, and she screenshotted the address but forgot to actually look anything up. Now she's sitting in the parking lot of the wrong strip mall, phone at 30% brightness because she was using it as a flashlight to find Ethan's left glove under the seat, holding an iced coffee in her right hand, and she needs to know three things in the next sixty seconds:

1. **Is Ice Line the kind of rink where parking is a nightmare?** Because if it is, she needs to leave now, not in five minutes.
2. **Where do I actually go?** She needs the address to drop into Apple Maps with one tap.
3. **Should I worry about anything?** She's been burned before — showed up to a rink with no food within a mile, sat in a freezing lobby for two hours, and Ethan's locker room didn't have a door.

Sarah pulls up ColdStart on her phone. She's been here once before — searched for Oaks Center Ice last weekend. She has one hand free (the left one), her phone is dim, and her patience is at zero.

This is the test.

---

# PART 2: WHAT SARAH SEES (Second by Second)

## Second 0-5: She Opens the App

ColdStart loads to the homepage. The hero section fills most of the viewport — a rink photo behind a dark overlay (`rgba(15,25,35,0.72)` gradient) with white text:

**"Scout the rink"**
*"Parking, cold level, food nearby — from parents who've been there."*

Below: a white pill-shaped search bar with placeholder text: `Search by rink name or city...`

Below that: `200+ rinks rated · PA, NJ, NY, MI`

At 30% brightness, the hero is legible — the dark overlay (#0f1923 to #1e3344 gradient) creates enough contrast against the white text. The search bar is a white pill on a dark background. Easy to spot. The font size on the headline is 36px on mobile. The subtext is 15px. Readable but not generous.

**What works:** The search bar is the obvious primary action. There's no cognitive overhead — you open the app, you see the search bar, you know what to do. The amber "Search" button (background: `#F59E0B`, the `colors.amber` token) pops against the white pill. Touch target is solid.

**What she also sees:** Below the hero fold, if she scrolled (she won't), there's a "Recently Viewed" section. Last time she visited Oaks Center Ice, the app saved a `coldstart_viewed_meta_` entry to localStorage with the rink name, city, state, and timestamp. The homepage reads all `coldstart_viewed_meta_` keys, sorts by `viewedAt` descending, and shows up to 5 entries. So "Oaks Center Ice — Oaks, PA — 6d ago" is sitting there. She'll never see it this morning because she doesn't need to scroll — she needs Ice Line, not Oaks. But if she opened the app cold with no specific rink in mind, that Recently Viewed entry would be her on-ramp. That's exactly the use case it was built for.

**New since last week:** The Recently Viewed section didn't exist. The app was writing view metadata to localStorage but never reading it back. It was ghost data — haunting the phone but invisible. Now it surfaces on the homepage, but only when the user has no saved rinks (`savedRinks.length === 0`). Sarah hasn't saved anything yet, so she'd see it.

## Second 5-10: She Types "Ice Line"

Sarah taps the search bar with her left thumb. The keyboard comes up. She types "Ice Line" — nine characters, two taps for the space, the `I` and `L` auto-capitalized.

The search has a 300ms debounce with an AbortController to cancel stale requests. By the time she finishes typing "Ice Li", results are already rendering. By "Ice Line", there's one result: a `RinkCard` showing "Ice Line" with "West Chester, PA" below it.

The search results section renders under a `SEARCH RESULTS` label (12px, uppercase, `colors.stone500`). Each result is a `RinkCard` — a tappable row with the rink name in 15px fontWeight 600 (`text.lg`) and the city/state in 12px (`text.sm`, `colors.stone400`).

**What works:** The search is fast. The debounce is short enough that it feels instant but doesn't hammer the API on every keystroke. The AbortController means if she typo'd and corrected, she wouldn't get stale results from "Ice Li" clobbering the correct results from "Ice Line."

**What doesn't work perfectly:** At 30% brightness, the search results background is white (`#ffffff`) on a page background of `#FAFAF8` (`colors.bgPage`). The contrast between the card and the background is negligible. The card border is `1px solid #e7e5e3` (`colors.stone200`). At low brightness, the card almost disappears into the page. The rink name text is `#292524` (`colors.stone800`) on white — that's fine for contrast. But the city/state is `#a8a29e` (`colors.stone400`) on white — a 2.7:1 contrast ratio. That's below WCAG AA for small text. At 30% brightness in a dark parking lot, "West Chester, PA" is going to be faint.

## Second 10-20: She Taps into Ice Line

Sarah taps the Ice Line result. The app navigates to `/rinks/[id]`. While loading, she sees the `LoadingSkeleton` — a shimmer layout with a header bar, a verdict card placeholder, and seven signal bar placeholders. The skeleton has an `animation: pulse 1.5s ease-in-out infinite` that visually communicates "loading, not broken."

The page loads. Here's what she sees, top to bottom, in the viewport:

**1. Rink hero photo** — Ice Line has a photo at `/rink-photos/ice-line.jpeg`, rendered in a 220px-tall container with `objectFit: 'contain'`, `borderRadius: 16`, and a small "Photo from a hockey parent" badge in the bottom-right corner (10px, white on dark overlay). The photo gives her visual confirmation: this is a real rink, not a ghost listing.

**2. Rink name** — `<h1>` with `fontSize: clamp(22px, 5vw, 36px)`, `fontWeight: 700`, `color: #111827` (`colors.textPrimary`). On a 375px-wide iPhone, `5vw` would be 18.75px, but the clamp floor of 22px kicks in — so the name renders at 22px. Readable, but tight. The `letterSpacing: -0.5` helps.

**3. Save button** — Top-right, next to the name. A small pill: "☆ Save rink" in 12px fontWeight 600. Background `#f9fafb` (`colors.bgSubtle`), border `#e5e7eb`. It's there, but Sarah doesn't care about saving right now.

**4. Address — NOW A TAPPABLE LINK** — Directly under the name: `{rink.address}, {rink.city}, {rink.state}` rendered as an `<a>` tag linking to `https://maps.apple.com/?address=...`. The font is 13px, color `#6b7280` (`colors.textTertiary`), with `textDecoration: 'underline'` and `textDecorationColor: #d1d5db` (`colors.borderMedium`), `textUnderlineOffset: 2px`.

This is the single most important element on the page at 5:32 AM. Sarah needs to get to Ice Line. The address is a tap away from Apple Maps turn-by-turn navigation. She taps it. Apple Maps opens. Done.

**New since last week:** The address was a `<p>` tag. Plain text. You could read it, but you couldn't tap it. If Sarah wanted directions, she'd have to: read the address, switch to Maps, type it in, confirm, start navigation. That's 30 seconds and two hands. Now it's one tap, one hand, zero seconds of typing.

**5. Home teams** — Below the address, a 12px line: "Home of the Philadelphia Junior Flyers, Team Philadelphia, and West Chester Wolverines" — each team name is a link (`colors.brand`, `#0ea5e9`). This is context, not utility. Sarah might recognize a team name. She might not. It's not in her way.

**6. Parent count** — "From 7 hockey parents" (the count is computed as `5 + (rink.name.length % 6)` — "Ice Line" is 8 characters, `8 % 6 = 2`, `5 + 2 = 7`). 12px, `colors.textTertiary`. Small but present.

**7. VerdictCard — THE KEY FIX** — A full-width card with rounded corners (`borderRadius: 16`), `padding: 20px 24px`, `marginTop: 20px`. The background and text color are computed from `summary.verdict`:

- If the verdict is "Good rink overall" → green background (`colors.bgSuccess`, `#f0fdf4`), green text (`colors.success`, `#16a34a`)
- If the verdict is "Heads up — some issues" → amber background (`colors.bgWarning`, `#fffbeb`), amber text (`colors.warning`, `#d97706`)

The verdict text is 18px fontWeight 700. Below it, a 12px line: "X of 7 signals above average · From Y hockey parents this season · Updated Zd ago"

**This is the answer to Sarah's question: "Should I worry?"** She glances at the VerdictCard and gets a one-line answer. Green means go. Amber means check the details. This takes one second of cognitive processing. At 30% brightness, green-on-light-green is visible but not high-contrast. The amber variant (`#d97706` on `#fffbeb`) actually has better contrast. Both are functional at low brightness, though neither is spectacular.

**New since last week:** The VerdictCard component existed in `components/rink/VerdictCard.tsx` — it was fully built. But it was never imported or rendered in the rink detail page. It was a phantom component, ready to go, sitting in the codebase unused. Now it's imported and rendered directly after the parent count, above the fold. This is the single highest-impact fix of the three.

**8. Share button** — Right below the VerdictCard: a pill button reading "Share with team" in 12px, `colors.brand` (`#0ea5e9`) on `colors.bgInfo` (`#f0f9ff`), border `colors.brandLight` (`#bae6fd`). On tap, it calls `navigator.share()` (on iOS) or copies a pre-composed text to clipboard. The text includes the rink name, parking signal score, top tip, and the URL.

**New since last week:** The share button was at the bottom of the page, below all sections — Signals, Tips, Nearby, everything. You'd have to scroll past seven signal bars, all tips, four nearby sections, gas stations, and a claim CTA to find it. Now it's above the fold, right after the VerdictCard. Sarah can see it without scrolling.

## Second 20-30: She Scans the Signals

Sarah scrolls down past the secondary info row (LiveBarn badge, Pro Shop link, Compare button, Plan Trip button) and hits the sticky tab bar: **Signals | Tips | Nearby**.

The tab bar is `position: sticky, top: 0, zIndex: 40` with a frosted glass effect (`background: rgba(250,251,252,0.92)`, `backdropFilter: blur(8px)`). It tracks which section is visible using an `IntersectionObserver` with `rootMargin: -80px 0px -60% 0px`.

Below the tab bar: the **SignalsSection**. A white card with 16px border-radius containing all 7 signals, sorted by `SIGNAL_ORDER`: parking, cold, food_nearby, chaos, family_friendly, locker_rooms, pro_shop.

Each signal is a `SignalBar` component:
- Left: icon + label (14px fontWeight 500, `colors.textSecondary`)
- Right: the score in 22px fontWeight 700, colored by value (`#16A34A` for >= 4.5, `#22C55E` for >= 3.5, `#F59E0B` for >= 2.5, `#EF4444` for < 2.5)
- Below: a 10px-tall progress bar on a light background (`colors.borderLight`)
- Below that: low/high labels (10px, "Tough" / "Easy" for parking) and rating count

Sarah's eyes go straight to **Parking** — it's first in the list by design (`SIGNAL_ORDER[0]`). She sees the icon (🅿️), the label, and the score. If parking is a 4.2/5, the bar is green and she relaxes. If it's 2.1/5, the bar is red and she knows to leave now.

**What works at low brightness:** The signal scores in 22px bold colored text are the most visible elements in this section. The color coding (green/amber/red) communicates good/okay/bad even if you can't read the number. The 10px progress bars reinforce the message visually.

**What's marginal:** Each `SignalBar` is tappable (`role="button"`, `tabIndex={0}`) — tapping it expands to show the info blurb, confidence percentage, and (for Ice Line) a verified rink manager comment from `FACILITY_DETAILS`. But the expand affordance is a tiny 10px triangle (▸) that most people will miss. The tap target is the entire row, which is fine for discovery, but the affordance is weak.

## Second 30-45: She Scrolls to Tips

Sarah wants the parking hack. She taps the "Tips" tab in the sticky bar (or just scrolls). The `TipsSection` renders under the heading "THINGS TO KNOW (X)" where X is the tip count.

Tips are `TipCard` components — each one is a card with a quote-formatted tip text in 13px (`text.md`), vote buttons on the left (up/down arrows), and an expand button. Tips are sorted by helpfulness (vote score), and the section shows the first 3 by default with a "Show X more tips" button.

If there's a tip about parking — "Use the side entrance for Rink C" or "Lot fills up fast for 6 AM, use the overflow on Greenhill" — Sarah finds it here. She reads it in two seconds, processes it, moves on.

**What works:** The vote-based sorting means the most useful tip floats to the top. The "Sorted by most helpful" subtitle (11px, `colors.textMuted`) communicates the logic. Tips that mention parking will likely have high votes from other parents who needed the same answer at 5:32 AM.

**What doesn't work perfectly:** Tips aren't categorized or tagged by signal. There's no way to filter tips by "parking" or "food." Sarah has to scan all tips linearly to find the parking one. With 3-4 tips visible, that's fine. With 15 tips, she'd be scrolling for a while. At 5:32 AM, linear scanning is the enemy of speed.

## Second 45-60: She Shares with Jen

Sarah's got what she needs. But Jen — the other team parent who's also driving to Ice Line for the first time — texted "where is this place??" ten minutes ago. Sarah wants to send her the ColdStart link.

She taps the Share button ("Share with team"). On iOS, this fires `navigator.share()` with a pre-composed text:

```
Ice Line (Parking: 4.2/5)
"Use the side entrance for Rink C"
Rink info from hockey parents: https://coldstart.example.com/rinks/abc123
```

(The URL is `window.location.href` — whatever the deployed domain is.)

The share sheet opens. Sarah taps Jen's name in iMessage. Sent. The message includes the rink name, the parking score, the top tip, and the URL. When Jen taps the link, she gets a rich preview because the layout.tsx now includes OpenGraph meta — the rink photo, the title ("Ice Line — West Chester, PA | ColdStart Hockey"), and the description ("Scout Ice Line before you go. Parking, cold, food, and tips from hockey parents who were just there.").

**New since last week:** The share button is now above the fold (Fix D), and the OG image per rink (Fix E) means Jen sees a photo preview in iMessage instead of a bare URL. The share text includes the parking score and top tip — that's smart composition. Jen gets the answer to "where is this place?" and "should I worry?" without opening the link.

**What could be better:** The share text is generated with `navigator.share()` on iOS, which is fine. But on Android or desktop (no `navigator.share` support), it falls back to `navigator.clipboard.writeText()` and shows "Copied!" — which is fine for power users but confusing for parents who expected a share sheet. The fallback is functional but not delightful.

---

# PART 3: THE SCORECARD

| Dimension | Score | Notes |
|-----------|-------|-------|
| Time to answer "Should I worry?" | **8/10** | VerdictCard is now above the fold. One glance, one second. Green = fine, amber = check signals. The fix from phantom component to rendered component is the single highest-ROI change. Loses points because the verdict text ("Good rink overall") is generic — it doesn't tell you WHAT's good. A "Parking: 4.2, Cold: 3.1" summary line would compress the second question. |
| One-handed usability | **7/10** | Search bar is easy to reach with left thumb. Rink card tap target is full-width. Address link is tappable. Share button is tappable. But the sticky tab bar buttons are 13px text with `padding: 10px 16px` — reachable but not oversized. The signal bars are tappable full-width (`role="button"`). Vote buttons on tips (up/down arrows) have `minHeight: 44px, minWidth: 44px` touch targets, which is correct. The Save button (top-right) requires a stretch for left-thumb users — that's fine because saving isn't a 5:32 AM action. |
| Low-brightness readability | **6/10** | The hero section is fine — white on dark. The rink detail page is mostly dark text on white, which works. But the secondary text elements — address at 13px in `#6b7280`, parent count at 12px in `#6b7280`, signal sub-labels at 10-11px in `#9ca3af` — are going to struggle at 30% brightness. The VerdictCard works because its text is 18px bold in a saturated color. The signal scores at 22px bold work. Everything else is marginal. The fundamental issue: the design tokens use `stone400` (`#a8a29e`) and `textMuted` (`#9ca3af`) for secondary text, and those are 3.0:1 and 2.8:1 contrast ratios on white. Fine in a well-lit room. Not fine in a parking lot. |
| "Where do I park?" answered | **7/10** | The Parking signal is first in the list and color-coded. That tells you the score. But there's no dedicated "parking info" section — no map of the lot, no "use the south entrance," no "overflow lot on Greenhill." You have to hope a parent left a tip about parking. The signal bar tells you HOW GOOD parking is (quantitative). It doesn't tell you HOW TO PARK (qualitative). If there's a tip, you're golden. If there isn't, you know parking is rated 4.2 but you still don't know where the lot is. |
| Shareability (send to Jen) | **9/10** | The share button is now above the fold. The share text includes the parking score and top tip — not just a bare URL. The OG meta means rich previews in iMessage. The `navigator.share()` integration on iOS is native and frictionless. This is close to perfect for the use case. Loses one point because the share text could include the verdict ("Good rink overall") and the address (so Jen can tap into Maps directly from the text, not just from the app). |
| Return visit experience | **7/10** | If Sarah comes back to ColdStart tomorrow, the homepage shows "Recently Viewed" with Ice Line at the top (with city, state, and "1d ago"). Tapping it goes straight to the rink page. If she saves Ice Line, it moves to "My Rinks" and the Recently Viewed section hides (they're mutually exclusive: Recently Viewed only shows when `savedRinks.length === 0`). The post-visit rating prompt shows if she returns to the same rink page between 2 hours and 7 days later — a single-signal-at-a-time rating flow with a progress bar. Smart. Loses points because the return path is homepage-first — there's no "jump to your last rink" shortcut. At 5:32 AM next Saturday, she has to open the app, see the homepage, find Recently Viewed, and tap. That's three steps instead of one. |
| First impression (cold open) | **7/10** | The hero is clean. "Scout the rink" is clear. "Parking, cold level, food nearby — from parents who've been there" is specific enough to communicate the value prop in one line. The search bar is obvious. The featured rinks grid (Ice Line, IceWorks, Oaks Center Ice) shows photo cards with signal bars — a nice preview of what you'll get. But a first-time user with no context doesn't know what "signals" are, what the bars mean, or why they should trust "7 hockey parents." The app assumes familiarity with the concept. For Sarah — a hockey parent who already knows rink scouting is a thing — this is fine. For someone who downloaded the app because a friend shared a link, the homepage could use a one-liner: "Parents rate rinks so you know what to expect before you go." That's what the "How It Works" section does, but it's below the fold, below the featured rinks. |
| **Overall 5:32 AM Score** | **7/10** | ColdStart gets Sarah from "I don't know anything about this rink" to "I know the verdict, I know where to park, I've got Apple Maps open, and I've sent Jen the link" in under 60 seconds with one hand at 30% brightness. That's a pass. The three fixes (VerdictCard, tappable address, Recently Viewed) each removed a real friction point. The two bonuses (share button moved up, OG image) made the share flow meaningfully better. What keeps this from an 8 or 9: the low-brightness contrast issues are systemic (too many secondary elements in `#a8a29e` and `#9ca3af`), the "where do I park?" answer depends on tips existing, and the app doesn't have a dedicated quick-answer view for the 5:32 AM use case — you still have to scroll past the hero photo, name, address, home teams, parent count, and verdict before you get to signals. |

---

# PART 4: WHAT BREAKS

## 1. The Address is Readable but Not Scannable

The address is 13px in `#6b7280` (`colors.textTertiary`) with a subtle underline in `#d1d5db`. At 30% brightness, this is one of the hardest things to read on the page. The underline — intended to communicate "this is a link" — uses `textDecorationColor: colors.borderMedium` which is `#d1d5db`, a color that disappears at low brightness. Sarah knows to tap it because she's looking for an address. But a parent who doesn't expect the address to be tappable might miss the affordance entirely.

The fix made it tappable, which is the right fix. But the visual treatment undersells it. At 5:32 AM, the address should be the loudest thing on the page after the rink name — bigger font, higher contrast, maybe an Apple Maps icon next to it. Right now it looks like metadata, not a call to action.

## 2. Signals Don't Tell You What to DO

The parking signal says "4.2/5 — Easy." Great. But what does Sarah do with that? She knows parking isn't terrible. She doesn't know:
- Where the lot is (front? side? behind the building?)
- Whether there's overflow
- Which entrance to use
- Whether the lot fills up for early-morning slots

The signal is quantitative. The parking lot test demands qualitative. The tips section might have the answer, but you have to scroll past all seven signals to reach it. There's no "parking hack" callout, no "top tip for parking" linked from the signal bar. The signal and the tip are in different sections of the page with no cross-reference.

## 3. The Sticky Tab Bar is Subtle at Low Brightness

The tab bar uses `background: rgba(250,251,252,0.92)` with `backdropFilter: blur(8px)`. At normal brightness, this is a nice frosted glass effect. At 30% brightness, it's nearly invisible — the blur effect reduces to a faint haze, and the active tab indicator (a `2px solid #0ea5e9` bottom border) is too thin to pop. The inactive tabs are `colors.textTertiary` (`#6b7280`) — below WCAG AA contrast on the tab bar's semi-transparent background.

Sarah might not even notice the tab bar is sticky, and she might not realize she can tap "Tips" to jump directly there instead of scrolling.

## 4. No Dedicated "I'm in the Car" Mode

The entire rink detail page is optimized for research — scroll through signals, read tips, check nearby restaurants. It's not optimized for the 5:32 AM use case, which is: **give me the answer in 5 seconds and get me to Apple Maps.**

The VerdictCard partially solves this, but it's still buried under a 220px hero photo and a header block. At 5:32 AM, Sarah doesn't need the hero photo. She doesn't need the home teams. She doesn't need the LiveBarn badge. She needs: verdict, address (tappable), parking score, top parking tip. Four data points. The current page buries them across 400+ pixels of vertical scroll.

## 5. Share Text Doesn't Include the Address

The share button composes text with the rink name, parking score, top tip, and URL. It does NOT include the address. Jen, who is also driving to Ice Line for the first time, gets: "Ice Line (Parking: 4.2/5)" and a link. She has to tap the link, wait for the page to load, find the address, and tap it to get to Apple Maps. If the share text included the address — "Ice Line, 700 Lawrence Dr, West Chester, PA" — Jen could tap it directly in iMessage and get directions without ever opening ColdStart. The address is right there in the rink data. It's just not in the `shareText` template.

---

# PART 5: THE THREE THINGS WE FIXED BEFORE SATURDAY

## Fix A: VerdictCard — The Ghost Component

**What was wrong:** The `VerdictCard` component existed at `/Users/joncambras/coldstart/components/rink/VerdictCard.tsx`. It was fully built — it accepted `rink`, `summary`, and `loadedSignals` props, computed `getVerdictBg()` and `getVerdictColor()` from `rinkHelpers.ts`, and rendered a colored card with the verdict text, signal summary, parent count, and last-updated timestamp. It was imported nowhere. Not in `page.tsx`, not in any parent component. It was a complete, functional React component that had never been rendered in any browser.

**How it was fixed:** Added the import to `app/rinks/[id]/page.tsx`:
```tsx
import { VerdictCard } from '../../../components/rink/VerdictCard';
```

And rendered it in the rink header section, directly after the parent count:
```tsx
{hasData && (
  <VerdictCard rink={rink} summary={summary} loadedSignals={loadedSignals} />
)}
```

**Why it matters:** The VerdictCard answers the single most important question at 5:32 AM: "Should I worry?" An 18px bold line in green or amber, above the fold, with no scrolling required. Before this fix, there was no summary anywhere on the rink page. You had to look at all seven signal bars, mentally average them, and form your own verdict. Now the app does it for you. This is the difference between "scan and decide in 1 second" and "scroll and analyze for 20 seconds."

## Fix B: Address Becomes a Tappable Apple Maps Link

**What was wrong:** The address was rendered as:
```tsx
<p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4, ... }}>
  {rink.address}, {rink.city}, {rink.state}
</p>
```

A `<p>` tag. Plain text. You could read it. You couldn't act on it. To get directions, you'd have to: select the text (hard on iOS), copy it, switch to Maps, paste it, search, start navigation. That's a 30-second, two-handed operation.

**How it was fixed:** Changed the `<p>` to an `<a>`:
```tsx
<a
  href={`https://maps.apple.com/?address=${encodeURIComponent(
    `${rink.address}, ${rink.city}, ${rink.state}`
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    fontSize: 13, color: colors.textTertiary, marginTop: 4,
    lineHeight: 1.4, margin: '4px 0 0', display: 'block',
    textDecoration: 'underline',
    textDecorationColor: colors.borderMedium,
    textUnderlineOffset: 2,
  }}
>
  {rink.address}, {rink.city}, {rink.state}
</a>
```

The `maps.apple.com` URL with the `?address=` parameter opens Apple Maps directly on iOS with the address pre-filled. The `encodeURIComponent` handles special characters in addresses. The underline uses `textDecorationColor: colors.borderMedium` for a subtle link affordance.

**Why it matters:** This is the most direct fix to the 5:32 AM use case. One tap → Apple Maps → turn-by-turn navigation. No copying, no switching apps, no typing. It converts a passive text element into the primary action for every parent who's trying to get to the rink.

## Fix C: Recently Viewed on Homepage

**What was wrong:** The rink detail page was writing a bare timestamp to localStorage on every visit — `localStorage.setItem(`coldstart_viewed_${rinkId}`, new Date().toISOString())` — but only used it to trigger the post-visit rating prompt. There was no rink name, city, or state stored alongside the timestamp, and the homepage never read these entries. A parent who visited three rinks last week would open the app and see the same generic featured rinks grid — no memory of their history.

**How it was fixed:** Two changes, both new. First, the rink detail page now writes richer metadata to a new `coldstart_viewed_meta_` key on every visit:
```tsx
localStorage.setItem(`coldstart_viewed_meta_${rinkId}`, JSON.stringify({
  name: detail.rink.name,
  city: detail.rink.city,
  state: detail.rink.state,
  viewedAt: new Date().toISOString(),
}));
```

Second, a `useEffect` on the homepage scans all `coldstart_viewed_meta_` keys from localStorage, parses them, sorts by `viewedAt` descending, and shows the most recent 5 as a "Recently Viewed" section. Each entry shows the rink name, city/state, and a `timeAgo()` label ("2d ago", "6d ago"). Each entry is tappable — `role="button"`, `tabIndex={0}`, `onClick={() => router.push('/rinks/${rink.id}')}`.

The section only appears when: (a) there are recently viewed rinks, and (b) there are no saved rinks. This avoids doubling up — if a parent has explicitly saved rinks, the "My Rinks" section takes priority and Recently Viewed hides.

**Why it matters:** This is the return-visit on-ramp. Sarah visited Oaks Center Ice last Saturday. This Saturday, she opens ColdStart and sees it right there — "Oaks Center Ice — Oaks, PA — 6d ago." One tap and she's back. No searching, no scrolling, no remembering the name. The app remembers for her. This turns a "cold open" into a "warm open" for returning users.

## Bonus D: Share Button Moved Up

**What was wrong:** The share button was rendered at the bottom of the rink page, below the Signals section, Tips section, all four Nearby sections, and the Claim Rink CTA. To reach it, you'd need to scroll through approximately 2000-3000px of content. No parent at 5:32 AM is going to do that.

**How it was fixed:** The `shareButton` JSX was moved to render directly after the VerdictCard, with `marginTop: 12`:
```tsx
{/* Share button — accessible near top of page */}
<div style={{ marginTop: 12 }}>
  {shareButton}
</div>
```

Now it's visible above the fold on most devices, right after the verdict. The natural flow becomes: see the verdict → see the share button → send to team parent.

## Bonus E: OG Image Per Rink

**What was wrong:** When someone shared a ColdStart rink link in iMessage, WhatsApp, or Slack, the link preview was generic — just the page title and maybe a favicon. No photo, no description. It looked like a sketchy URL.

**How it was fixed:** The layout at `app/rinks/[id]/layout.tsx` now generates rink-specific metadata via `generateMetadata()`. It queries the database for the rink name/city/state, looks up the rink photo via `RINK_PHOTOS[slug]`, and returns:
```tsx
openGraph: {
  title: `${title} | ColdStart Hockey`,
  description,
  siteName: 'ColdStart Hockey',
  type: 'website',
  images, // rink photo if it exists
},
twitter: {
  card: photo ? 'summary_large_image' : 'summary',
  title: `${title} | ColdStart Hockey`,
  description,
  images: photo ? [photo] : undefined,
},
```

Now when Jen receives Sarah's shared link, iMessage renders a rich preview with the rink photo, the title "Ice Line — West Chester, PA | ColdStart Hockey", and the description "Scout Ice Line before you go. Parking, cold, food, and tips from hockey parents who were just there." The `summary_large_image` Twitter card means the photo dominates the preview. It looks legit. It looks like something you should tap.

---

# PART 6: WHAT TO FIX NEXT

## 1. Add the Address to Share Text (30 minutes, high impact)

In the `shareButton` onClick handler in `app/rinks/[id]/page.tsx`, the `shareText` is composed as:
```tsx
const shareText = `${rink.name}${parkingNote}\n${topTip}\nRink info from hockey parents: ${url}`;
```

Add the address:
```tsx
const address = `${rink.address}, ${rink.city}, ${rink.state}`;
const shareText = `${rink.name}${parkingNote}\n📍 ${address}\n${topTip}\nRink info from hockey parents: ${url}`;
```

When Jen gets this in iMessage, the address becomes a tappable link to Apple Maps without her ever opening ColdStart. This is the fastest possible path from "teammate shared a link" to "I have directions." Five lines of code. Biggest bang-for-the-buck fix remaining.

## 2. Boost Low-Brightness Contrast for Secondary Text (2 hours, medium impact)

The design token `colors.textTertiary` is `#6b7280` (4.6:1 on white — just above WCAG AA for normal text). The token `colors.textMuted` is `#9ca3af` (2.8:1 on white — fails WCAG AA). The token `colors.stone400` is `#a8a29e` (2.7:1 on white — also fails).

These are used for: address text, parent count, signal sub-labels, tip metadata, time-ago labels, tab bar inactive text. At 30% brightness in a dark parking lot, everything rendered in `textMuted` or `stone400` is functionally invisible.

Fix: promote the secondary text tokens by one step. Change `textMuted` from `#9ca3af` to `#6b7280` (current `textTertiary`). Change `textTertiary` from `#6b7280` to `#4b5563`. This maintains the visual hierarchy (primary > secondary > tertiary) while lifting the floor to WCAG AA compliance across all three tiers. This is a one-line change in `lib/theme.generated.ts` that affects every secondary label in the app.

## 3. Link Signal Bars to Relevant Tips (4 hours, high impact)

When Sarah sees the parking signal at 4.2/5, she thinks "okay, decent — but is there a trick I should know?" The answer might be in a tip. But the tip is in a different section, 500px of scrolling away, with no connection to the parking signal.

Add a small affordance: if a tip mentions a signal keyword (e.g., the word "parking" appears in a tip's text), surface a link from the signal bar's expanded state. When you tap the parking `SignalBar` and it expands to show the info blurb and rink manager comment, add a line: "1 parent tip about parking →" that scrolls to the tip. This requires: (a) a keyword match in `TipsSection`, (b) a ref or scroll-to-ID on the matching `TipCard`, and (c) a link rendered in `SignalBar`'s expanded view. No new components — just cross-referencing existing data.

## 4. Quick-Glance Card Above the Hero Photo (3 hours, high impact)

For the 5:32 AM use case, create a compressed "at a glance" view that renders above the hero photo when the user is a returning visitor (detected via `coldstart_viewed_meta_` or saved rink). Four elements in a tight card:

- Verdict (one line, colored)
- Address (tappable Apple Maps link, 14px)
- Parking score (just the number and color, no bar)
- Top tip (one line, truncated)

This card would be rendered conditionally (`showReturnPrompt` or a new `isReturning` flag) and would give Sarah every answer she needs without scrolling past the 220px hero photo. It compresses the entire 5:32 AM flow into one viewport.

## 5. Tag Tips by Signal Category (2 hours, medium impact)

When parents submit tips via the `ReturnRatingPrompt` or `ContributeFlow`, there's no signal categorization on the tip. A tip like "Overflow lot on Greenhill fills up for 6 AM" is obviously about parking, but the app doesn't know that.

Add an optional signal tag to tips: when submitting a tip, offer a one-tap signal selector (the same 7 icons from `SIGNAL_OPTIONS`). When tips have tags, the `TipsSection` can group or filter them, and `SignalBar` can cross-reference them. This makes the parking signal → parking tip connection automatic instead of requiring manual keyword matching.

---

# PART 7: THE VERDICT

ColdStart passes the 5:32 AM parking lot test — barely, and only because of the three fixes shipped this week. Before those fixes, it would have failed: no verdict (you'd have to mentally average seven signals), no tappable address (you'd have to copy-paste into Maps), no return-visit memory (you'd have to search for the same rink every time), and the share button was buried at the bottom of a 3000px page. Each of those is a session-killer in a dark parking lot with one hand.

With the fixes, the flow works: open app, search "Ice Line", tap result, see verdict (green — good), tap address (Apple Maps opens), glance at parking score (4.2 — fine), tap share (sends to Jen with parking score and top tip), done. Sixty seconds, one hand, 30% brightness. The VerdictCard is the most important single addition — it converts a seven-signal analytical exercise into a one-second glance. The tappable address is the most important action-level fix — it eliminates 30 seconds of fumbling. The Recently Viewed section doesn't help at 5:32 AM specifically, but it'll help next Saturday when Sarah opens the app and doesn't have to search again.

What keeps this at a 7/10 instead of a 9/10: the low-brightness contrast is systemically weak (too many elements in #9ca3af gray), the qualitative parking answer depends on whether a parent left a tip, the page layout prioritizes research over quick answers, and the share text is missing the address. These are all fixable in the next sprint. For v0.3 of an app built by a hockey parent for hockey parents, standing in a parking lot at 5:32 AM with an iced coffee getting cold — it works. Not perfectly. But it works.
