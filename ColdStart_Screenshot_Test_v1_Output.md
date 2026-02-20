# ColdStart: The Screenshot Parent Test
## Evaluation Output v1

**Evaluator perspective:** Three personas — Lisa (team organizer, iMessages 18 families), Carlos (Facebook group warner, 2,400 members), Jen (casual texter, sends screenshot with no caption).

**Device model:** iPhone 14 (375 x 812 logical px), default iMessage/Facebook compression.

---

## Screenshot Verdict

ColdStart's homepage is screenshot-ready: the dark hero, white "Scout the rink" headline, search pill, and stats line all fit above the fold with visible branding. The rink detail page is where the product breaks down as a screenshot artifact. The highest-value content — signal scores for parking, cold, food — starts at roughly 680px, below the fold on most phones. A default screenshot of a rink page captures the hero photo, rink name, verdict card, and share button, but none of the numeric ratings that make a parent say "we should go here" or "skip this one." The verdict card's near-white backgrounds (#f0fdf4 for good, #fffbeb for heads-up) are indistinguishable at iMessage thumbnail size. Brand attribution disappears if the screenshot crops the sticky nav. ColdStart's viral loop depends on parents screenshotting and forwarding rink pages — and right now the screenshot captures the least actionable slice of the page.

---

## Screenshot Gallery

### Position 1: Homepage — default view (no scroll)

**What's visible:** Dark hero background with rink photo overlay. "Scout the rink" in 36px white text. Subhead: "Parking, cold level, food nearby — from parents who've been there." White search pill with amber "Search" button. Stats line: "200+ rinks rated / 1,400+ parent reports / PA, NJ, NY, MI." ColdStart logo (28px, white, stacked) top-left.

**What's missing:** Nothing critical. Featured rinks grid is below the fold but not needed for the screenshot's purpose.

**Standalone clarity:** 5/5 — A viewer with zero context understands this is a rink-scouting tool for hockey parents. The value prop is in the subhead. The stats line builds credibility.

**Would Lisa send this?** 4/5 — Lisa would send this when first telling her team about ColdStart ("check out this app"). Not useful for sharing a specific rink verdict.

**Brand attribution:** 5/5 — Logo top-left, "ColdStart" implied by the domain when shared, dark background makes the brand mark pop.

---

### Position 2: Rink detail — default view (no scroll, e.g. Ice Line)

**What's visible:** Sticky nav with ColdStart logo (36px). Tab bar (Ratings | Tips | Nearby). Hero photo of the rink (220px height + 16px margin). Rink name in 22-36px bold. Address as a link. "From N hockey parents" line. VerdictCard with "Parents report:" label, verdict text (e.g., "Good rink — parents give it high marks across the board"), rating summary line, and UGC disclaimer. Share button ("Share with team").

**What's missing:** All seven signal bars (parking, cold, food, chaos, family-friendly, locker rooms, pro shop). Badge row (LiveBarn, Compare, Plan trip). Tips section. Nearby section.

**Standalone clarity:** 3/5 — The verdict gives a directional read ("good rink" vs. "heads up"), but there's no numeric evidence. A parent seeing this screenshot can't answer "how's the parking?" or "is it freezing?" The hero photo takes 236px of prime real estate — beautiful but not informative.

**Would Lisa send this?** 3/5 — Lisa wants to say "parking's a 3.2, bring layers, food options are great." This screenshot only says "good rink." She'd need to scroll and take a second screenshot to show the scores.

**Brand attribution:** 4/5 — Logo visible in sticky nav. But if someone crops the screenshot or the nav is hidden, brand disappears until the disclaimer at the bottom of the VerdictCard (now includes coldstarthockey.com after our fix).

---

### Position 3: Rink detail — scrolled to signals (verdict + signal bars visible)

**What's visible:** Top of VerdictCard (may be partially visible or fully visible depending on exact scroll position). All seven signal bars with emoji icons, labels, colored fill bars, numeric values (now showing X.X/5 after fix), and rating counts. Low/high axis labels beneath each bar.

**What's missing:** Hero photo (scrolled past). Rink name may be partially visible or cropped. ColdStart logo in nav may be hidden behind the tab bar or cropped. Tips. Nearby. Share button.

**Standalone clarity:** 4/5 — This is the most information-dense screenshot position. Signal values with /5 denominators are now interpretable without context. Bar colors provide intuitive valence. However, if the rink name is cropped, the viewer doesn't know which rink this is about.

**Would Lisa send this?** 4/5 — This is what Lisa actually wants to send. "Look at the parking score, look at the cold rating." But she has to know to scroll past the hero photo first, and the rink name might be off-screen.

**Brand attribution:** 2/5 — The ColdStart logo is likely cropped or hidden behind the tab bar at this scroll position. No brand element exists in the signal bars area. The VerdictCard disclaimer (if visible) now includes coldstarthockey.com, which helps if the card is in view.

---

### Position 4: Rink detail — scrolled to tips section

**What's visible:** Tips from hockey parents with contributor type labels. Individual parent quotes about the rink experience. "Add a tip" prompt if the user hasn't contributed.

**What's missing:** Verdict, signal scores, rink name (unless the user scrolled carefully), hero photo, brand attribution.

**Standalone clarity:** 2/5 — Tips are useful but anecdotal. Without the rink name and signal scores visible, the screenshot is a collection of quotes about an unnamed rink. No numeric data to anchor the claims.

**Would Lisa send this?** 2/5 — Lisa might screenshot a specific tip that's relevant ("the Zamboni entrance is hard to find"), but tips alone don't make a compelling share artifact.

**Brand attribution:** 1/5 — No ColdStart branding visible in the tips section. Logo is scrolled away. Footer brand is below.

---

### Position 5: RinkCard in search results / featured rinks grid

**What's visible:** Rink name in bold. City, state. Mini signal bars showing top signals (parking first) with short labels, colored fill, and numeric values (now showing X.X/5). First tip preview in italics (2-line clamp). "From N hockey parents" count. "This season" badge if confirmed. Rink photo (180px wide on desktop, full-width on mobile).

**What's missing:** Full verdict text. Detailed signal bars with high/low labels. Tips list. Address. Nearby section.

**Standalone clarity:** 4/5 — The RinkCard is actually a surprisingly good screenshot artifact. It has the rink name, location, signal scores with /5 denominators, a tip preview, and a parent count. It's dense and scannable.

**Would Lisa send this?** 3/5 — Good for "here are the rinks I'm looking at" but Lisa would more likely screenshot the detail page for a specific recommendation. The card is better as a comparison artifact.

**Brand attribution:** 2/5 — No ColdStart branding on the card itself. The page header would need to be visible. If Lisa screenshots just the card, there's no attribution.

---

### Position 6: Share text (not a screenshot — clipboard/Web Share output)

**What's visible (as text):** `{Rink Name} (Parking: X.X/5)` / `{Address}` / `"{First tip}"` (if tips exist) / `Rink info from hockey parents: {URL}`

**What's missing:** Other signal scores (only parking is included). Verdict text. Visual bar colors.

**Standalone clarity:** 4/5 — The share text is well-structured. Parking score with /5 is immediately useful. The tip adds flavor. The URL drives traffic back.

**Would Lisa send this?** 4/5 — Lisa would paste this into iMessage and it works. But she might want to add cold and food scores manually, since only parking is included.

**Brand attribution:** 5/5 — URL is present and includes "hockey parents" language that reinforces the brand even before someone clicks.

---

## Shareability Scorecard

| Dimension | Score (1-5) | Notes |
|-----------|:-----------:|-------|
| Above-the-fold information density | 2 | Hero photo consumes 236px. Verdict is above fold but signals are not. The most shareable data (parking 3.2/5, cold 4.1/5) requires scrolling. |
| Standalone clarity (no context needed) | 3 | Verdict card says "good rink" or "heads up" but doesn't show why. Signal values now have /5 denominators (fixed). A screenshot of just the verdict doesn't answer specific questions. |
| Visual valence (good vs. bad is obvious) | 3 | Verdict text color differs (green vs. amber) but background tints are near-white. Left border stripe now provides a stronger visual signal (fixed). At full size it works; at thumbnail compression, improvement is incremental. |
| Brand attribution survives cropping | 2 | Logo only in sticky nav (36px). If cropped or scrolled, no brand in content zone. VerdictCard disclaimer now includes coldstarthockey.com (fixed). Signal bars area still has no attribution. |
| Thumbnail readability (iMessage preview) | 2 | At iMessage thumbnail size (~200px wide), signal bar values and labels are unreadable. Verdict text is readable. Hero photo dominates. The left border stripe is the strongest surviving visual element. |
| Forwarding motivation ("you need to see this") | 3 | The verdict card provides directional info. But "Good rink — parents give it high marks" doesn't trigger urgency. Specific scores like "Parking: 2.1/5" or "Cold: 4.8/5" would be more compelling — and those are below the fold. |
| Completeness (one screenshot tells the story) | 2 | A single default screenshot cannot tell the full story. It shows the verdict but not the evidence. Two screenshots are needed: one for the verdict, one for the signals. No single screenshot position captures verdict + signals + rink name + brand. |
| Share mechanic discoverability | 4 | Share button is visible above the fold, clearly labeled "Share with team." Web Share API integration is good. The share text is well-formatted with parking score and URL. |
| **Overall** | **2.6** | ColdStart's rink pages are optimized for scrolling exploration, not for screenshot capture. The viral loop's critical artifact — the screenshot a parent sends to 18 families — requires scrolling past a decorative hero photo to reach the actionable data. |

---

## Three Screenshot Killers

### Killer 1: Signal scores are below the fold

**The problem:** On a 375x812 iPhone, the cumulative height of nav (68px) + tab bar (48px) + hero photo (236px) + rink name/address (~80px) + parent count (18px) + VerdictCard (~140px) + share button (~48px) = ~638px. Signal bars start at approximately 680px. A default screenshot (power + volume, no scrolling) captures zero signal scores. The most decision-useful content — "Parking: 3.2/5, Cold: 4.1/5, Food: 4.5/5" — is invisible.

**Why it kills screenshots:** Lisa can't screenshot the parking score without scrolling. When she scrolls to the signals, the rink name and brand may be off-screen. She needs two screenshots to tell the full story, and nobody sends two screenshots in a group chat.

**The fix (applied):** Signal values now display "/5" denominators so that when a parent does scroll and screenshot, the numbers are self-explanatory. *Future fix (not implemented):* A purpose-built share card (see spec below) that composites verdict + top 3 signals + rink name + brand into a single image artifact.

### Killer 2: Verdict card backgrounds are invisible at thumbnail size

**The problem:** VerdictCard background colors — #f0fdf4 (bgSuccess, 97% white) for "Good rink" and #fffbeb (bgWarning, 98% white) for "Heads up" — are functionally identical when compressed to iMessage thumbnail size (~200px wide). The text color differs (green #16a34a vs. amber #d97706) but the dominant visual area (the card background) reads as white in both cases. A parent glancing at a screenshot in a group chat cannot tell at a glance whether this rink is recommended or flagged.

**Why it kills screenshots:** Screenshots are consumed at thumbnail size first. The viewer decides whether to tap-to-expand based on the thumbnail. If good and bad rinks look identical at thumbnail zoom, the screenshot loses its ability to convey valence — the single most important piece of information.

**The fix (applied):** A 3px solid left border in the verdict color (#16a34a green for "Good rink," #d97706 amber for "Heads up," #ea580c orange for "Mixed") creates an unmistakable colored stripe that survives JPEG compression and thumbnail rendering. Green stripe = good. Amber stripe = warning. This is the same pattern used by Slack for message attachments and GitHub for PR status — proven to work at small sizes.

### Killer 3: Brand attribution is absent from the content zone

**The problem:** ColdStart's logo lives in the sticky nav (36px). The tab bar sits at z-index 40 directly below. When a user scrolls to the highest-value content zone (verdict + signals), the logo may be cropped, hidden behind the tab bar, or off-screen entirely. The footer brand text ("Built by hockey parents, for hockey parents") is far below the fold. There is no brand element, URL, or watermark in the mid-page content area where screenshots are most likely to be taken.

**Why it kills screenshots:** When Jen sends a screenshot with no caption, the recipient has no idea where this information came from. They can't find the app or website. The screenshot might as well have come from any review site. ColdStart's viral loop breaks because the screenshot doesn't lead back to ColdStart.

**The fix (applied):** The VerdictCard's UGC disclaimer line — already visible in most screenshot positions — now reads: "Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart. coldstarthockey.com". The URL serves triple duty: (1) legal distancing attribution, (2) brand identification, (3) a typed URL the recipient can manually enter. This is the highest-leverage fix because it places attribution in the content zone that's most likely to be screenshotted.

---

## Share Card Spec (Not Implemented — Future Project)

The ideal solution to all three screenshot killers is a purpose-built share image that composites the highest-value information into a single, optimized artifact. This section specifies what that card should contain.

### Dimensions
- 1200 x 630px (Open Graph / iMessage / Facebook link preview standard)
- Also generate 1080 x 1080px variant for Instagram Stories / general sharing

### Layout (top to bottom)

```
┌─────────────────────────────────────────────┐
│  [ColdStart logo]          coldstarthockey.com│  ← 48px header bar, navy (#0C2340) bg
├─────────────────────────────────────────────┤
│                                              │
│  ICE LINE AT CENTER ICE                      │  ← Rink name, 32px bold white
│  Aston, PA                                   │  ← City/state, 16px, 70% white
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ● Good rink — parents give it        │   │  ← Verdict pill, colored bg
│  │   high marks across the board        │   │     (saturated, not near-white)
│  └──────────────────────────────────────┘   │
│                                              │
│  🅿️ Parking    ████████░░  3.8/5            │  ← Top 3 signals only
│  ❄️ Cold        ██████████  4.5/5            │
│  🍔 Food nearby ███████░░░  3.6/5            │
│                                              │
│  From 47 hockey parents · Updated 3 days ago │  ← Credibility line
│                                              │
├─────────────────────────────────────────────┤
│  "Parking lot fills up fast for 6am games   │  ← Top tip, italic, 14px
│   — arrive 20 min early on weekends."       │
├─────────────────────────────────────────────┤
│  Scan QR or visit coldstarthockey.com        │  ← Footer, navy bg, QR code right
└─────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Dark background (navy #0C2340)** — not white. Dark cards pop in iMessage bubbles (which have a white/light gray background). White-on-dark text is readable at thumbnail size. This also differentiates ColdStart screenshots from generic web page screenshots.

2. **Saturated verdict colors** — not near-white tints. The verdict pill should use saturated backgrounds: green (#16a34a at 30% opacity on dark = visible), amber (#d97706 at 30%), red (#ef4444 at 30%). These must be distinguishable at 200px wide.

3. **Only top 3 signals** — not all 7. Information density matters but so does readability at thumbnail size. Show parking (always first — it's the #1 concern for hockey parents), cold (the signature ColdStart signal), and the signal with the most extreme value (highest or lowest) as a conversation starter.

4. **QR code** — Jen's friend who sees the screenshot in a group chat can't tap a URL in an image. A QR code (small, bottom-right corner) gives them a camera-tap path back to ColdStart.

5. **One tip quote** — provides the human voice that makes this feel like a parent recommendation, not a database lookup.

### Generation Approach

- **Option A: Server-side rendering** — Use `@vercel/og` (Vercel's Open Graph image generation library, built on Satori) to render the card as a PNG/JPEG on an API route. Advantages: works with existing Next.js stack, supports custom fonts, generates on-demand. Disadvantage: adds an API route and rendering latency.

- **Option B: Canvas-based client-side** — Use HTML Canvas to render the card in-browser when the user taps "Share." Advantages: no server cost, instant. Disadvantage: font rendering is less predictable, harder to maintain, doesn't work for link preview unfurling.

- **Recommended: Option A** — Server-side rendering via `@vercel/og` on a route like `/api/og/[rinkId]`. This also enables Open Graph meta tags (`og:image`) so that when someone shares the ColdStart URL on Facebook or iMessage, the link preview automatically shows the share card. This is the highest-leverage approach because it works for both manual screenshots AND link previews.

### Integration Points

1. **Share button** — "Share with team" could offer two options: "Copy link" (current behavior) and "Share as image" (downloads or shares the rendered card).
2. **og:image meta tag** — Set `<meta property="og:image" content="/api/og/{rinkId}" />` on rink detail pages so link previews use the card automatically.
3. **Download button** — Add "Save card" to let parents explicitly save the image to their camera roll for sending in any app.

---

*Evaluation produced by ColdStart Screenshot Parent Test v1. Three code fixes applied: signal denominators (/5), verdict border stripe, brand URL in disclaimer.*
