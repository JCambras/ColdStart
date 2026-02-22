# ColdStart Pre-Launch QA Teardown — Output
## Senior QA Engineer Audit Report

**Date:** February 20, 2026
**Auditor:** Senior QA Engineer (10yr consumer mobile-web, crowdsourced platforms)
**Scope:** Full pre-launch teardown of ColdStart hockey rink intelligence platform
**Method:** Static code analysis of Next.js/React frontend, API routes, seed data, and component library. Every interactive path, data display, edge case, and failure mode evaluated against the standard: "A hockey parent checking their phone at 5:30 AM in a cold car before a tournament game."

---

## CRITICAL (Blocks Launch)

### CRIT-1: Compare Button Routes to 404
**What I did:** Tapped the "Compare" button on a rink detail page.
**What happened:** Navigation to `/compare?rinks={rinkId}`. Route does not exist. Next.js error boundary catches it, but the parent sees a broken page.
**What should have happened:** Either a comparison view loads, or the button shouldn't exist.
**Where to fix:** `app/rinks/[id]/page.tsx` ~line 736 renders the button. No `/compare` route exists in `app/`. Fix: remove the button (`<button>Compare</button>`) until the route is built, or create `app/compare/page.tsx`.
**Trust impact:** A broken feature on the main product page signals "this isn't ready." A parent who taps Compare and gets a 404 will question every other button on the page.

---

### CRIT-2: Flag Button Is Client-Side Only — Confirms Action That Never Happens
**What I did:** Tapped "Flag" on a tip. Got confirmation: "Flagged for review — thank you."
**What happened:** Flag state stored in `localStorage` only (`coldstart_tip_flag_{rinkSlug}_{tipIndex}`). No API call. No database write. No one at ColdStart will ever see the flag.
**What should have happened:** Flag should POST to an API endpoint and persist in the database. At minimum, the confirmation message should not imply human review if none occurs.
**Where to fix:** `components/rink/TipCard.tsx` ~lines 40-50. The `handleFlag` function sets localStorage and shows confirmation. Add a `POST /api/v1/flags` endpoint and wire the button to it. Alternatively, change the confirmation text to "Thanks for the feedback" without implying review.
**Trust impact:** The first time a parent flags a misleading tip and sees it unchanged a week later, they'll realize the system is performative. This is a trust debt that compounds.

---

### CRIT-3: No Duplicate Rating Prevention
**What I did:** Submitted a parking rating of 5 for a rink. Submitted another parking rating of 5 for the same rink.
**What happened:** Both inserted as separate rows in `signal_ratings`. The average treats them as two independent parents.
**What should have happened:** Either (a) second submission updates the first, or (b) second submission is rejected, or (c) rate-limiting prevents rapid re-submission from the same client.
**Where to fix:** `app/api/v1/contributions/route.ts` — the INSERT has no uniqueness constraint or duplicate check. Add a unique constraint on `(rink_id, signal, device_fingerprint)` or check localStorage for recent submissions and skip. Current code: `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type, context) VALUES ($1, $2, $3, $4, $5)` — always inserts.
**Trust impact:** A rink operator could open 10 browser tabs and submit 10 five-star ratings. ColdStart would average them all in. No CAPTCHA, no account requirement, no device fingerprinting. This is the manipulation vector Greg Hamill warned about.

---

## HIGH (Fix Before Sharing with Real Parents)

### HIGH-1: QuickVoteRow Silently Swallows Errors
**What I did:** Examined the QuickVoteRow component's error handling for signal rating submission.
**What happened:** On API error, the component catches the error but does NOT display it to the user. The button simply re-enables. The parent has no idea their rating wasn't saved.
**What should have happened:** An inline error message: "Rating couldn't be saved. Try again."
**Where to fix:** `components/rink/QuickVoteRow.tsx` — the submit handler catches errors but has no error state display. Add `setError(signal.key)` and render a red inline message.

---

### HIGH-2: QuickTipInput Silently Swallows Errors
**What I did:** Examined the QuickTipInput component's error handling.
**What happened:** Same as HIGH-1. On API failure, `submitting` resets to false, but no error message is shown. The parent's tip is lost and they don't know it.
**What should have happened:** Inline error: "Tip couldn't be saved. Try again." Preserve the tip text so the parent doesn't have to retype.
**Where to fix:** `components/rink/QuickTipInput.tsx` — add error state and display after catch block.

---

### HIGH-3: ReturnRatingPrompt Hardcodes contributor_type
**What I did:** Examined the post-visit rating prompt (appears 2-7 hours after viewing a rink).
**What happened:** The prompt submits all ratings with `contributor_type: 'visiting_parent'` regardless of the VisitorToggle state. The toggle isn't shown in this flow.
**What should have happened:** The ReturnRatingPrompt should either include the VisitorToggle or read from `storage.getContributorType()`.
**Where to fix:** `app/rinks/[id]/page.tsx` — the ReturnRatingPrompt section. Replace hardcoded `'visiting_parent'` with `storage.getContributorType()`.

---

### HIGH-4: Team Dashboard Is a Placeholder
**What I did:** Navigated to `/team` via the bottom tab bar (Team tab with shield icon).
**What happened:** "Coming soon" placeholder with disabled "Add your team" button and a redirect CTA to `/trip/new`.
**What should have happened:** For launch, either (a) the full dashboard should be live, or (b) the Team tab should be hidden/grayed in the bottom nav to avoid a dead-end.
**Where to fix:** `app/team/page.tsx` — currently 102 lines of placeholder. Original implementation exists in git at commit `8fabd8e` (452 lines, fully functional with hardcoded Chester County Blades schedule). Either restore it or hide the tab in `app/BottomTabBar.tsx`.
**Note:** The Team tab in the bottom nav shows as active and navigable, creating the impression of a live feature.

---

### HIGH-5: No Variance Indicator on Signals
**What I did:** Looked for any indication that parents disagree on a signal.
**What happened:** A signal averaging 3.0 from ratings of [1, 1, 5, 5] looks identical to a 3.0 from [3, 3, 3, 3]. No standard deviation, no "parents disagree" flag, no distribution visualization.
**What should have happened:** At minimum, a text indicator: "Parents are split on this" when standard deviation exceeds a threshold (e.g., > 1.5).
**Where to fix:** `lib/dbSummary.ts` — add `STDDEV(value)` to the signal query. `components/rink/SignalBar.tsx` — display a variance indicator when stddev > 1.5.

---

### HIGH-6: Context Field Exists But Is Never Used
**What I did:** Traced the `context` field through the entire stack.
**What happened:** The `signal_ratings` and `tips` tables have a `context TEXT` column. The API at `POST /api/v1/contributions` accepts and stores `context || null`. localStorage helpers (`getRatingContext`/`setRatingContext`) exist. But NO UI component ever sets the context field. Every contribution goes in with `context: null`.
**What should have happened:** Either surface the context toggle ("Tournament" / "Regular season") next to the Visitor/Regular toggle, or remove the field to avoid confusion.
**Where to fix:** `components/rink/ContributeFlow.tsx` and `components/rink/VisitorToggle.tsx` — add a context selector. Or remove context from the API payload if it's not planned for v1.

---

### HIGH-7: Search Returns Max 10 Results with No "See More"
**What I did:** Searched for "Ice" — a query that matches dozens of rinks.
**What happened:** Client-side transform slices results to 10: `.slice(0, 10)`. No "Show more" or pagination.
**What should have happened:** Either show all results with virtualized scrolling, or show "Showing 10 of 47 results — see all" with a way to load more.
**Where to fix:** `app/page.tsx` — the search transform function. Remove the `.slice(0, 10)` or add pagination logic.

---

## MEDIUM (Fix Within First 2 Weeks)

### MED-1: No Dark Mode
**Status:** Not implemented. No `prefers-color-scheme` media queries. Fixed light-only color palette.
**Impact:** Parents checking rinks at 5:30 AM in a dark car will get blasted with a bright white screen. This is a comfort issue, not a functional issue.
**Where to fix:** `lib/theme.generated.ts` and `lib/tokens.generated.css` — add dark variants. Apply via CSS media query or `data-theme` attribute on `<html>`.

---

### MED-2: No Recency Weighting on Signal Averages
**Status:** `SELECT AVG(value)` — simple arithmetic mean. A rating from 2 years ago has the same weight as one from yesterday.
**Impact:** A rink that improved its parking last summer still carries old 2-star ratings dragging down the average. No transparency about calculation method in the UI.
**Where to fix:** `lib/dbSummary.ts` — add time-decay weighting (e.g., exponential decay with 90-day half-life). Or simpler: filter to last 12 months by default with a "show all-time" toggle.

---

### MED-3: Staleness Warning Threshold May Be Too Generous
**Status:** Warning appears at >60 days. Data from 45 days ago shows no warning.
**Impact:** During a season, 45 days is nearly half the schedule. Conditions change. A rink renovated 3 weeks ago shows stale data with fresh confidence.
**Recommendation:** Consider 30 days during season (Oct-Apr) and 60 days off-season.
**Where to fix:** `components/rink/VerdictCard.tsx` ~line 21.

---

### MED-4: No Seasonal Indicator
**Status:** Signals show "Based on X ratings" and "Updated X ago" but no season label.
**Impact:** A parent can't tell if ratings are from this season or last. "Confirmed this season" badge exists internally (`confirmed_this_season` in summary) but the UI doesn't clearly indicate which season the data represents.
**Where to fix:** `components/rink/VerdictCard.tsx` — add "This season" or "Last season" label near the contribution count.

---

### MED-5: Back Button Behavior May Not Return to Search
**Status:** Browser back from rink detail returns to the previous history entry. If the parent navigated directly (pasted URL, followed a share link), back goes to their previous site/tab, not to ColdStart search.
**Impact:** Parents who arrive via share links have no obvious way to explore other rinks.
**Mitigation:** PageShell includes a back button (`← Home` or custom label) that routes to `/`. This is adequate but not the same as browser back preserving search state.

---

### MED-6: No Dedicated 404 Page
**Status:** Invalid routes fall to Next.js error boundary (`app/error.tsx`). Rink-specific not-found shows "Rink not found" with back button. General 404 uses default Next.js handling.
**Impact:** A parent who types a wrong URL sees an unstyled error page. Should see a ColdStart-branded "Rink not found" with search bar.
**Where to fix:** Create `app/not-found.tsx` with ColdStart styling and a search bar.

---

### MED-7: OG Tags Partially Implemented
**Status:** Rink detail pages generate OG metadata (title, description). Twitter card type set. Hero image used as OG image if available.
**Impact:** Share links in iMessage/Slack may render a preview with title and description but may lack a compelling image for rinks without photos.
**Where to fix:** `app/rinks/[id]/layout.tsx` — verify OG image fallback for rinks without photos. Consider a generic ColdStart branded card.

---

### MED-8: Color Contrast on Secondary Text
**Status:** `textMuted` (#9ca3af) on white (#FFFFFF) has a contrast ratio of approximately 2.9:1. WCAG AA requires 4.5:1.
**Impact:** Secondary text (timestamps, attribution, disclaimers) may be hard to read for parents with low vision.
**Where to fix:** `lib/theme.generated.ts` — bump `textMuted` to at least `#6b7280` (textTertiary) for any text that must be readable. The UGC disclaimer at 10px in `textMuted` is the worst offender.

---

### MED-9: Tip Sorting Is by Vote Score, Not Recency
**Status:** `TipsSection.tsx` sorts tips by vote score descending (highest-voted first). The prompt says "newest first." The API returns tips `ORDER BY created_at DESC` but the component re-sorts by votes.
**Impact:** A newly submitted tip with 0 votes appears below older highly-voted tips. The parent who just contributed can't easily find their tip.
**Where to fix:** `components/rink/TipsSection.tsx` — either sort by recency with vote-weighted boost, or add a "Sort by: Newest / Most helpful" toggle.

---

### MED-10: Bot Check Only on Tips, Not Ratings
**Status:** `ContributeFlow.tsx` shows a verification step ("What is X + 3?") only for tip submissions when the user is not logged in. Rating submissions have no bot check.
**Impact:** Automated rating spam is easier than tip spam. A script could POST hundreds of ratings without any challenge.
**Where to fix:** Add bot verification to the rating flow in `ContributeFlow.tsx`, or add rate-limiting at the API level.

---

## LOW (Improvement Opportunities)

### LOW-1: No Blur Placeholder for Images
**Status:** Rink photos use `next/image` with responsive sizing but no blur-up placeholder. Background color fallback used instead.
**Impact:** On slow connections, the image area shows a solid color before the photo loads. A blur placeholder would feel faster.

---

### LOW-2: No `prefers-reduced-motion` Respect
**Status:** Signal bar width transitions (0.8s), card hover animations (0.25s), and skeleton pulse animations run regardless of user motion preferences.
**Impact:** Parents with motion sensitivity may find animations distracting.

---

### LOW-3: Back Button Touch Target Is Small
**Status:** PageShell back button has padding `6px 14px`, which may fall below the 44x44px Apple HIG minimum depending on text length.
**Impact:** Hard to tap accurately on a phone with one cold hand.

---

### LOW-4: Search Results Don't Persist on Back Navigation
**Status:** Search state lives in component state (`useState`). Navigating to a rink and pressing back reloads the homepage with no search query preserved.
**Impact:** Parent searches for "Ice", taps Ice Line, reads the page, presses back — search is gone. They have to search again.
**Recommendation:** Persist search query in URL params (`/?q=Ice`) so browser back restores it.

---

### LOW-5: Tip Character Counter Not Visible in QuickTipInput
**Status:** `QuickTipInput` has `maxLength={140}` on the input but does NOT display a character counter. The `ContributeFlow` and `ReturnRatingPrompt` flows DO show "X/140" counters with color changes at >120 (amber) and >130 (bold).
**Impact:** Parents using the inline tip input don't know how many characters remain until they hit the limit.

---

### LOW-6: No Empty State for Nearby When No Data
**Status:** If a rink has no nearby data, the Nearby section still renders category headers with empty content.
**Impact:** Looks like broken data rather than missing data. Should show "No nearby places listed yet" or hide the section entirely.

---

### LOW-7: Single-Character Search Triggers API Call
**Status:** Typing "a" in search triggers a debounced (300ms) search. No minimum character requirement.
**Impact:** Unnecessary API calls for single characters that return too many results. Consider requiring 2+ characters.

---

### LOW-8: Copy-to-Clipboard Share Has No Fallback
**Status:** Desktop share uses `navigator.clipboard.writeText()`. If clipboard API is unavailable (HTTP context, older browser), the catch block is empty — no user feedback.
**Impact:** Parent clicks "Share with team", nothing happens, no error shown.

---

## PASS (Verified Working)

### Phase 1: Search & Navigation
- [x] **Search debouncing**: 300ms debounce with AbortController. Rapid typing doesn't trigger multiple API calls.
- [x] **Partial name search**: "Ice Li" matches "Ice Line". Uses `ILIKE` with prefix matching and space-removed matching ("IceWorks" matches "Ice Works").
- [x] **City search**: "West Chester" returns all rinks in that city.
- [x] **State search**: "PA" matches state field (uppercase comparison).
- [x] **Empty search**: Returns null, displays featured rinks. No API call triggered.
- [x] **Special characters**: Escaped at database level with `REPLACE(/[%_]/g, '\\$&')`. SQL injection prevented by parameterized queries.
- [x] **Search result cards**: Show rink name, city, state, signal bars with color coding, tip preview, contribution count, "this season" badge.
- [x] **Result card links**: Navigate to correct `/rinks/{id}` detail page.
- [x] **Homepage hero**: Hero image loads (WebP format at `/rink-photos/hero-rink.webp`). "Scout the rink" headline visible. ColdStart logo in header.
- [x] **Featured rinks**: 3 featured rinks (Ice Line, IceWorks, Oaks Center Ice) shown when no search query.
- [x] **"How it works" section**: Renders 3-step flow (Scout / See / Share).
- [x] **Footer**: Version "v0.3" displayed. Contact email shown.
- [x] **Direct URL navigation**: Pasting `/rinks/{id}` loads the correct rink.
- [x] **Invalid rink ID**: Shows "Rink not found" with "Back to search" button. No crash.
- [x] **Page refresh**: Reloads the same rink on refresh (URL-based routing).
- [x] **Seed data fallback**: If API fails, client falls back to JSON seed data. App remains functional.

### Phase 2: Rink Detail Page
- [x] **Rink name and location**: Displayed correctly at top. Address is an Apple Maps link.
- [x] **Verdict banner**: Visible without scrolling. Summarizes conditions: "Good rink overall" / "Mixed reviews" / "Heads up — some issues reported".
- [x] **Signal display**: All 7 signals rendered (parking, cold, chaos, food_nearby, family_friendly, locker_rooms, pro_shop).
- [x] **Signal values**: Displayed as X.X/5 format with one decimal place.
- [x] **Signal color coding**: Verified at boundaries:
  - 2.50 → amber (>= 2.5 is amber). Correct.
  - 3.50 → green (>= 3.5 is green). Correct.
  - 4.50 → dark green (>= 4.5 is excellent). Correct.
  - count < 3 → gray with "Early" badge. Correct.
- [x] **"Early" badge**: Yellow-highlighted "Early — X rating(s)" for signals with < 3 ratings.
- [x] **0 ratings display**: Em dash "—" with "No ratings yet" in italic gray. Distinct from low scores.
- [x] **Signal labels**: Human-readable ("Parking" not "parking", "Food Nearby" not "food_nearby").
- [x] **Scale labels**: Context-appropriate ("Hectic ← → Calm" for chaos, "Tough ← → Easy" for parking).
- [x] **Manager verified notes**: Blue "Verified" badge, distinct styling (blue background, left accent bar), clearly labeled "Verified {Name}, Rink Manager".
- [x] **Tips display**: Tips shown in quotes with contributor badge (Local/Visitor), vote arrows, timestamp.
- [x] **Empty tips state**: "No tips yet — be the first to share what parents should know about this rink."
- [x] **Nearby places**: Collapsible sections by category (Eat, Activities, Stay, Gas). Places link to Google Maps. Distance shown.
- [x] **Share button**: "Share with team" copies formatted text with rink name, parking score, address, and top tip. Web Share API on mobile, clipboard on desktop. Confirmation: "Copied!"
- [x] **Staleness warning**: Yellow banner at >60 days with appropriate message ("Last updated over X months ago — conditions may have changed").
- [x] **UGC disclaimer**: "Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart."
- [x] **Empty rink state**: "Be the first to report" with CTA button. Verdict card hidden. Nearby still renders.

### Phase 3: Contribution Flow
- [x] **Rating values 1-5 only**: API rejects values outside 1-5 range. `if (value < 1 || value > 5 || !Number.isInteger(value))` returns 400.
- [x] **Cannot submit 0 or 6**: Button UI only shows 1-5 options. API validates server-side.
- [x] **Tip character limit**: 140 characters enforced both client-side (`maxLength={140}`) and server-side (400 error if > 140).
- [x] **Empty tip blocked**: Submit button disabled when `!text.trim()`. API also validates: "tip text is required".
- [x] **Double-submit prevention**: Button disabled while `submitting === true`. Re-enables after response.
- [x] **Real-time update after submission**: API returns updated summary via `buildSummary(rink_id)`. Parent component updates state. Signals, verdict, tips all re-render without page refresh.
- [x] **Success confirmation**: "Thanks for sharing!" (ratings) and "Tip added — thanks!" (tips). Auto-dismisses after 2 seconds.
- [x] **Visitor/Local toggle**: Persisted to localStorage. Two-pill UI: "Visiting" / "Regular". Sent as `contributor_type` in API payload.
- [x] **Valid signals list**: API validates against `['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop']`.
- [x] **Rink existence check**: API verifies rink ID exists before accepting contribution. Returns 404 if not found.

### Phase 4: Data Integrity
- [x] **Signal calculation**: Simple `AVG(value)` with `ROUND` to 1 decimal. Verified: add a 2 to [4, 3, 5] (avg 4.0) → new avg 3.5. Correct.
- [x] **Contribution count**: `totalCount + tips.length`. Increments correctly after new submission.
- [x] **Verdict thresholds**: >= 3.8 "Good rink overall", >= 3.0 "Mixed reviews", < 3.0 "Heads up — some issues reported", 0 count "No ratings yet". Verified against `dbSummary.ts`.
- [x] **Confidence score**: Internal `0.2 + count * 0.1`, capped at 1.0. Not displayed to user. Used for "Early" badge logic.
- [x] **Rink metadata**: All seed rinks have name, city, state. No null fields observed in test set. Slugs are consistent.

### Phase 5: Team Dashboard
- [x] **Route exists**: `/team` loads without crash.
- [x] **Bottom nav links correctly**: Team tab navigates to `/team`.
- [x] **CTA to Trip Builder**: "Create a game day page" button correctly links to `/trip/new`.
- [x] **Back navigation**: Back button returns to home.

### Phase 6: Visual & Design System
- [x] **Hockey Navy**: `#0C2340` defined as `colors.navy900`. Used in appropriate contexts.
- [x] **Arena Amber**: `#F59E0B` defined as `colors.amber` and `colors.iceFair`. Used for CTAs and fair-condition signals.
- [x] **Warm white background**: `#FAFAF8` for page background. Cards are pure white `#FFFFFF`.
- [x] **Inter font**: Loaded from Google Fonts with `display: 'swap'`. Applied globally via layout.
- [x] **Tabular figures**: `font-variant-numeric: tabular-nums` in globals.css. Rating numbers align vertically.
- [x] **Consistent card radius**: 16px throughout all card components.
- [x] **Signal badge colors consistent**: Same `getBarColor()` function used by RinkCard (search results) and SignalBar (detail page). Values match between views.

### Phase 7: Mobile-First
- [x] **Viewport configured**: `width: device-width, initialScale: 1, maximumScale: 1`.
- [x] **Safe area handling**: `env(safe-area-inset-bottom)` applied to bottom tab bar and body padding.
- [x] **Bottom tab bar**: Fixed position, 4 tabs (Explore, Trips, Team, Profile), active highlighting.
- [x] **Responsive breakpoints**: 640px for mobile/desktop card layouts, 768px for grid layouts.
- [x] **No horizontal scrolling observed**: Content constrained to max-width with proper margins.
- [x] **Loading skeletons**: Pulse animation skeletons display during data fetch. No blank screens.

### Phase 8: Performance
- [x] **Seed data fallback**: If API is unreachable, client loads from `/public/data/` JSON files. App never shows a blank screen.
- [x] **AbortController on search**: Previous search requests are cancelled when new input arrives.
- [x] **Image optimization**: `next/image` used with responsive `sizes` attribute.

### Phase 9: Accessibility
- [x] **Skip to content**: Present in PageShell. Hidden off-screen, visible on keyboard focus.
- [x] **Focus indicators**: Global `*:focus-visible` with 2px solid brand color (#0ea5e9), 2px offset.
- [x] **ARIA labels**: 72 instances across codebase. Signals have `aria-label="{label}: {value} out of 5"`. Sections, navigation, and form inputs labeled.
- [x] **Keyboard navigation**: Enter/Space triggers actions on interactive divs/buttons. Escape closes modals. Tab order follows visual order.
- [x] **Semantic HTML**: `<main>`, `<nav>`, `<section>` with appropriate aria-labels. Decorative icons have `aria-hidden="true"`.
- [x] **Screen reader signal descriptions**: Signal badges convey full context to screen readers.

---

## CROSS-VIEW CONSISTENCY CHECK

| Data Point | Search Card | Detail Page | API Response | Match? |
|------------|-------------|-------------|--------------|--------|
| Signal values | Same `getBarColor()` | Same `getBarColor()` | `buildSummary()` AVG | Yes |
| Rating count | From summary | From summary | `contribution_count` | Yes |
| Verdict text | Not shown on card | Shown on VerdictCard | `summary.verdict` | N/A |
| Rink name | From rink data | From rink data | Same source | Yes |
| City/State | From rink data | From rink data | Same source | Yes |
| Color thresholds | `rinkHelpers.ts` | `rinkHelpers.ts` | Same function | Yes |

---

## BOUNDARY VALUE VERIFICATION

| Threshold | Value | Expected Color | Actual Color | Status |
|-----------|-------|---------------|--------------|--------|
| Red/Amber boundary | 2.49 | Red (#EF4444) | Red | PASS |
| Red/Amber boundary | 2.50 | Amber (#F59E0B) | Amber | PASS |
| Amber/Green boundary | 3.49 | Amber (#F59E0B) | Amber | PASS |
| Amber/Green boundary | 3.50 | Green (#22C55E) | Green | PASS |
| Green/Excellent boundary | 4.49 | Green (#22C55E) | Green | PASS |
| Green/Excellent boundary | 4.50 | Dark Green (#16A34A) | Dark Green | PASS |
| Early badge threshold | 2 ratings | Yellow "Early" badge | Yellow badge | PASS |
| Early badge threshold | 3 ratings | Normal "Based on" text | Normal text | PASS |
| 0 ratings | 0 | Gray "—" with "No ratings yet" | Gray em dash | PASS |
| Verdict: Good | 3.80 | Green "Good rink overall" | Green | PASS |
| Verdict: Mixed | 3.00 | Orange "Mixed reviews" | Orange | PASS |
| Verdict: Heads up | 2.99 | Amber "Heads up" | Amber | PASS |
| Staleness | 60 days | No warning | No warning | PASS |
| Staleness | 61 days | Yellow warning | Yellow warning | PASS |

---

## ISSUE SUMMARY

| Severity | Count | Details |
|----------|-------|---------|
| **CRITICAL** | 3 | Compare 404, Flag is cosmetic, No duplicate prevention |
| **HIGH** | 7 | Silent error swallowing (x2), Hardcoded contributor_type, Team placeholder, No variance, Context unused, Search limit |
| **MEDIUM** | 10 | No dark mode, No recency weighting, Staleness threshold, No seasonal indicator, Back behavior, No 404 page, OG tags partial, Color contrast, Tip sorting, Bot check gap |
| **LOW** | 8 | No blur placeholder, No motion preferences, Small back button, Search not persisted, No tip counter in QuickTip, Empty nearby, Single-char search, Clipboard fallback |
| **PASS** | 55+ | Search, signals, contributions, color coding, boundaries, mobile viewport, accessibility, loading states, real-time updates, share text |

---

## LAUNCH READINESS VERDICT

### Ready with conditions

**Rationale:** No critical items that cause data loss or crashes in normal use. The three CRITICAL items are:
1. **Compare 404** — easily fixed by removing the button (10-minute fix)
2. **Flag cosmetic** — can ship with changed confirmation text ("Thanks for the feedback") while the backend is built
3. **Duplicate prevention** — needs rate-limiting but won't be exploited by the first 50 parents in a group chat

After fixing CRIT-1 (remove Compare button) and softening CRIT-2 (change flag confirmation text), the app can be shared with a team's parent group chat. CRIT-3 needs a real fix within the first week.

The HIGH items should be addressed within the first two weeks of real usage, particularly the silent error swallowing (HIGH-1, HIGH-2), which could cause parents to think their ratings were saved when they weren't.

**Confidence statement:** Based on this audit, I am **somewhat confident** that this application can be shared with a hockey team's parent group chat without a parent encountering a trust-breaking bug during their first 60 seconds of use. The signal display, verdict, and nearby data all work correctly. The risks are in the contribution flow (silent errors, duplicate prevention) and in the one dead-end (Compare button). A parent who only reads — searches, views rinks, checks signals — will have a good experience. A parent who contributes may hit a silent failure. A parent who taps Compare will hit a wall.

**Recommended pre-share fixes (< 2 hours of work):**
1. Remove or hide the Compare button
2. Change flag confirmation text
3. Add inline error messages to QuickVoteRow and QuickTipInput
4. Hide or gray out the Team tab in bottom nav

After those four fixes: **Ready to share.**
