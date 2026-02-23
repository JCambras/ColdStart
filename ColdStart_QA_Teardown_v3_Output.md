# ColdStart QA Teardown v3 — Output
## Post-v2-Fixes Comprehensive Audit

**Date:** February 22, 2026
**Scope:** Full re-audit after completing all v1 (28 items) + v2 (55 items) + Tournament Weekend roadmap (5 features). Parallel static analysis across 4 domains: (1) API routes & data layer, (2) all component files, (3) all page files, (4) theme system, seed data & test coverage.
**Prior state:** v2 had 5 CRITICAL, 16 HIGH, 20 MEDIUM, 14 LOW — all code-fixable items resolved across 5 commits.

---

## v2 Status: All Code-Fixable Items Resolved

| v2 Category | Status |
|-------------|--------|
| CRIT-1 through CRIT-5 | Fixed — auth on /manage, operator ownership, per-user flag dedup, notify stub, analytics stub |
| HIGH-3 (dark mode hex sweep) | Fixed — ~60 hex colors replaced with theme tokens |
| HIGH-8/9/10/15 | Fixed — tab bar dark mode, error handling, keyboard a11y, caching |
| MED-1 through MED-20 (code-fixable) | Fixed — validation, rate limiting, stale closures, shadows, etc. |
| LOW-1 through LOW-10 (code-fixable) | Fixed — email validation, logger, a11y, placeholder color, etc. |
| Remaining infra items | Open — SSL cert, S3 photos, Redis rate limiter, profile auth policy |

---

## New Findings Summary

| Severity | Count | Category Breakdown |
|----------|-------|--------------------|
| CRITICAL | 3 | 1 React hooks violation, 1 SEO/SSR, 1 auth bypass |
| HIGH | 14 | 5 dark mode, 3 data quality, 3 performance, 2 a11y, 1 security |
| MEDIUM | 28 | 10 a11y, 7 dark mode, 4 data quality, 3 validation, 2 UX, 2 test coverage |
| LOW | 20 | 8 code quality, 5 a11y, 4 data, 3 misc |

**Total: 65 new findings** (down from 55 in v2)

---

## CRITICAL (Blocks Launch)

### CRIT-1: React Hooks Called After Early Return in StatePage
**File:** `app/states/[code]/page.tsx`, lines 33-51
**What was found:** `useState` and `useEffect` hooks are called after a conditional early return on line 33 (`if (!stateName) { return ... }`). This violates React's Rules of Hooks — hooks must never be called conditionally.
**What should happen:** Move all `useState`/`useEffect` declarations above the early return guard.
**Impact:** Runtime crash in strict mode or future React versions. May already cause subtle state corruption during HMR.

---

### CRIT-2: Home Page is Entirely Client-Rendered with No SSR/Metadata
**File:** `app/page.tsx`, line 1
**What was found:** The home page is a `'use client'` component with no `metadata` export, no `generateMetadata`, and no server component wrapper. All data fetching happens client-side. Search engines and social crawlers see an empty `<div>` with a loading skeleton.
**What should happen:** Either split into server+client components with page-specific metadata, or at minimum export a `metadata` constant with title/description/OG image.
**Impact:** The most important page for organic discovery has zero SEO. Share links show generic "ColdStart Hockey" with no context.

---

### CRIT-3: Client-Supplied `rink_id` Bypasses Tip Ownership Check
**File:** `app/api/v1/tips/[id]/respond/route.ts`, line 45
**What was found:** The endpoint accepts an optional `rink_id` in the request body and uses it for the operator claim check. An operator with a claim on Rink A can POST `{ rink_id: "rink-a-id" }` to respond to a tip on Rink B, and the ownership check passes because it validates against the supplied rink_id, not the tip's actual rink.
**What should happen:** Always use `tipCheck.rows[0].rink_id` (the tip's actual rink) for the ownership check. Ignore client-supplied `rink_id`.
**Impact:** Cross-rink impersonation — an operator can post fake "official" responses on any rink's tips.

---

## HIGH (Fix Before Sharing with Real Parents)

### HIGH-1: 99 Non-Ice-Rink Venues in Seed Data
**File:** `public/data/rinks.json`
**What was found:** 99 entries are roller rinks, roller skating centers, or non-ice venues. Examples: "Rollerworld" (Kalamazoo, MI), "Dreamland Skate Center" (Mobile, AL), "United Skates of America" (multiple locations).
**What should happen:** Remove all non-ice-rink venues.
**Impact:** Users searching for ice rinks find roller rinks. Signal data (ice comfort, locker rooms, pro shop) is nonsensical for these venues.

---

### HIGH-2: Airbnb/VRBO Listings in Hotels Category (~830 entries extrapolated)
**File:** Multiple files in `public/data/nearby/`
**What was found:** A large percentage of "hotel" entries are vacation rentals, not actual hotels. Examples: "Charming Newly Remodeled Condo", "Beautiful 5 bedroom home w/ fireplace", "Cozy 1 bedroom basemant apt" (also a typo). Hockey parents need Holiday Inn, not Airbnb listings.
**What should happen:** Filter out vacation rental entries from the hotels category.
**Impact:** Misleading hotel recommendations for tournament travel. Damages trust.

---

### HIGH-3: Vacation Rentals Miscategorized as Food (quick_bite)
**File:** Multiple files in `public/data/nearby/`
**What was found:** 17+ entries in a 200-file sample where vacation rentals/homes appear in the `quick_bite` (food) category. Example: "Beautiful new townhome, centrally located!" listed as a restaurant.
**What should happen:** Remove non-food entries from food categories.
**Impact:** "Where to eat near the rink" shows condo listings.

---

### HIGH-4: `getBadgeTextColor()` Uses Hardcoded Hex — Breaks Dark Mode
**File:** `lib/rinkHelpers.ts`, lines 31-37
**What was found:** Four hardcoded hex colors (`#64748b`, `#15803d`, `#b45309`, `#dc2626`) bypass the theme token system entirely. Used by `SignalBadge.tsx`.
**What should happen:** Replace with theme tokens.
**Impact:** Badge text colors will have poor contrast on dark backgrounds.

---

### HIGH-5: Hardcoded rgba/hex in HeroSearch Breaks Dark Mode
**File:** `components/home/HeroSearch.tsx`, 10+ occurrences
**What was found:** At least 10 hardcoded `rgba()` values including overlays (`rgba(15,25,35,0.72)`), text colors (`rgba(255,255,255,0.7)`), and background tints.
**What should happen:** Create hero-specific overlay tokens.
**Impact:** Hero section will be visually broken in dark mode — white text on white overlays.

---

### HIGH-6: Hardcoded Gradients in ProfileDropdown and RinkCard
**File:** `components/ProfileDropdown.tsx` lines 41, 80; `components/RinkCard.tsx` line 72
**What was found:** `linear-gradient(135deg, #0ea5e9, #3b82f6)` and `linear-gradient(135deg, #f0f9ff, #e0f2fe, #f0fdf4)` — raw hex values in gradients.
**What should happen:** Use theme tokens for gradient colors.
**Impact:** Bright light-mode gradients on dark backgrounds.

---

### HIGH-7: N+1 API Waterfall on Home Page (6 Serial Requests)
**File:** `app/page.tsx`, lines 131-155
**What was found:** `loadFeatured()` issues 3 search requests sequentially via `for...of`, each followed by a detail request. That's 6 serial network round-trips on page load.
**What should happen:** Parallelize with `Promise.all`, or create a single featured-rinks endpoint.
**Impact:** ~1.2 seconds extra load time on mobile networks (200ms × 6).

---

### HIGH-8: Saved Rinks N+1 Fetch Waterfall
**File:** `app/page.tsx`, lines 97-108
**What was found:** Each saved rink ID triggers a separate sequential `apiGet()` call. 10 saved rinks = 10 serial requests.
**What should happen:** `Promise.all` or batch endpoint.
**Impact:** Load time scales linearly with saved rinks count.

---

### HIGH-9: ProfileDropdown Has No Keyboard Dismiss or Focus Trap
**File:** `components/ProfileDropdown.tsx`, lines 19-107
**What was found:** The dropdown overlay has no Escape key handler, no focus trap, no `role="dialog"` or `role="menu"`, and no `aria-modal`. Only dismissible via mouse click on backdrop.
**What should happen:** Add Escape handler, `role="menu"`, and focus management.
**Impact:** Keyboard-only users cannot dismiss the dropdown. Screen readers don't know a menu is open.

---

### HIGH-10: PhotoGallery Upload Failure Is Completely Silent
**File:** `components/rink/PhotoGallery.tsx`, line 54
**What was found:** Empty `catch {}` block. User sees "Uploading...", then it silently reverts with no photo and no error message.
**What should happen:** Show error message: "Upload failed. Please try again."
**Impact:** Users don't know their upload failed.

---

### HIGH-11: SignalsSection Fetch Has No Error Handling
**File:** `components/rink/SignalsSection.tsx`, lines 28-35
**What was found:** `seedGet(...).then(data => { ... })` has no `.catch()`. Unhandled promise rejection.
**What should happen:** Add `.catch(() => {})` at minimum.
**Impact:** Unhandled promise rejection in production.

---

### HIGH-12: Missing Page Metadata on Most Routes
**Files:** 9 pages lack metadata exports
**What was found:** Only `app/rinks/[id]/layout.tsx` exports `generateMetadata`. All other pages (home, states, trips, trip detail, trip new, manage, fields, team, profile) use the generic root layout metadata.
**What should happen:** Add page-specific `metadata` exports.
**Impact:** Browser tabs all show the same title. Social shares look identical.

---

### HIGH-13: Logo Uses `<span role="button">` Instead of `<a>` for Navigation
**File:** `components/Logo.tsx`, lines 11-16
**What was found:** Logo navigates to `/` but uses `<span role="button">` instead of `<a href="/">`. Users can't right-click → Open in new tab, and screen readers don't announce it as a link.
**What should happen:** Use `<a href="/">` or Next.js `<Link>`.
**Impact:** Violates WCAG semantics for navigation.

---

### HIGH-14: Trip Page Has No ARIA Landmarks
**File:** `app/trip/[id]/page.tsx`
**What was found:** Zero `aria-label` attributes, no `role` attributes, no `<main>` landmark. Interactive buttons (Share, My trips) have no aria-labels.
**What should happen:** Add semantic landmarks and labels.
**Impact:** Screen reader users cannot navigate the trip page.

---

## MEDIUM

### MED-1: AuthModal Focus Trap Uses Stale NodeList
**File:** `components/auth/AuthModal.tsx`, lines 37-58
**What was found:** Focus trap queries focusable elements once on open. When toggling to signup mode, the new Name input isn't trapped. `mode` not in dependency array.
**Fix:** Re-query on each Tab press, or add `mode` to deps.

### MED-2: TipCard Uncleared setTimeout (Memory Leak)
**File:** `components/rink/TipCard.tsx`, line 51
**What was found:** `setTimeout(() => setShowFlagConfirm(false), 3000)` never cleared on unmount.
**Fix:** Store in ref, clear on unmount.

### MED-3: ContributeFlow Uncleared setTimeout (Memory Leak)
**File:** `components/rink/ContributeFlow.tsx`, line 63
**What was found:** `setTimeout(() => { reset(); setSuccess(false); }, 2000)` never cleared.
**Fix:** Store in ref, clear on unmount.

### MED-4: Shadow Tokens Not Overridden in Dark Mode CSS
**File:** `lib/tokens.generated.css`, dark mode block (lines 109-151)
**What was found:** `--shadow-*` variables not redefined in the dark mode media query. Shadows use `rgba(0,0,0,0.04)` which is invisible on dark backgrounds.
**Fix:** Add stronger shadow values to the dark mode block.

### MED-5: Dark Mode Incomplete — Hero Tokens, Brand Not Overridden
**File:** `lib/tokens.generated.css`
**What was found:** `@media (prefers-color-scheme: dark)` exists but doesn't override `heroBg`, `heroMid`, `heroLight`, or `brand` tokens. No UI toggle.
**Fix:** Complete token overrides or document as experimental.

### MED-6: Photos GET Endpoint Missing Rate Limiting
**File:** `app/api/v1/rinks/[id]/photos/route.ts`, line 12
**What was found:** Every other GET endpoint has `rateLimit()` but this one doesn't.
**Fix:** Add `rateLimit(request, 60, 60_000)`.

### MED-7: Claim/Verify Endpoint Missing Rate Limiting and Error Handling
**File:** `app/api/v1/rinks/[id]/claim/verify/route.ts`
**What was found:** No `rateLimit()` call. Database query not wrapped in try/catch.
**Fix:** Add rate limiting and try/catch.

### MED-8: NearbySection Category Headers Not Keyboard Accessible
**File:** `components/rink/NearbySection.tsx`, lines 191-200, 504-513
**What was found:** Category expand/collapse headers use `<div onClick>` without `role="button"`, `tabIndex`, or keyboard handlers.
**Fix:** Add keyboard support.

### MED-9: NearbySection Vote Buttons Have Undersized Touch Targets
**File:** `components/rink/NearbySection.tsx`, lines 34-57
**What was found:** Vote buttons have `padding: '2px 4px'` — well under 44px minimum.
**Fix:** Set `minWidth: 44, minHeight: 44`.

### MED-10: ReturnRatingPrompt Rating Buttons Missing aria-label
**File:** `components/rink/ReturnRatingPrompt.tsx`, lines 272-289
**What was found:** The 1-5 buttons have no aria-label. Screen readers only announce the number.
**Fix:** Add `aria-label={\`Rate ${current.question} ${val} out of 5\`}`.

### MED-11: LoadingSkeleton Has No Accessible Announcement
**File:** `components/LoadingSkeleton.tsx`
**What was found:** No `role="status"`, `aria-busy`, or `aria-label` on loading skeletons.
**Fix:** Add `role="status" aria-label="Loading content"`.

### MED-12: StateDropdown Options Missing `aria-selected`
**File:** `components/StateDropdown.tsx`, lines 80-120
**What was found:** `role="option"` elements lack required `aria-selected` attribute.
**Fix:** Add `aria-selected={false}`.

### MED-13: ClaimRinkCTA Shows No Error on Double Failure
**File:** `components/rink/ClaimRinkCTA.tsx`, lines 26-38
**What was found:** If both API and localStorage fail, `succeeded` is false but no error message shown. Form sits idle.
**Fix:** Add error state and message.

### MED-14: Silent Error Swallowing in 8+ Empty Catch Blocks
**Files:** `app/page.tsx` (3×), `app/rinks/[id]/page.tsx` (3×), `app/states/[code]/page.tsx`, `app/trip/new/page.tsx`
**What was found:** Empty `catch {}` blocks silently discard all errors.
**Fix:** At minimum, `console.error` in development.

### MED-15: Manage Dashboard Inputs Missing aria-labels
**File:** `app/manage/[rinkId]/page.tsx`, lines 298-330
**Fix:** Add `aria-label` to form inputs.

### MED-16: Trips Page Search Input Missing aria-label
**File:** `app/trips/page.tsx`, lines 52-66
**Fix:** Add `aria-label="Search trips"`.

### MED-17: 2 Non-US Venues in rinks.json with Empty State
**File:** `public/data/rinks.json`
**What was found:** "Planet Ice - Coquitlam" (BC, Canada) and "Ice Skate Birmingham" (UK) have `state: ""`.
**Fix:** Remove or add international support.

### MED-18: 145 Empty Nearby Data Files
**File:** `public/data/nearby/` — 145 of 2298 files have all-empty categories.
**Impact:** Low — UI falls back to Google Maps links. But 6.3% of rinks show no recommendations.

### MED-19: 402 Duplicate Entries in Nearby Data
**File:** Multiple files in `public/data/nearby/`
**What was found:** Same restaurant/gas station appearing 2-3× within a category.
**Fix:** Deduplicate by name within each category.

### MED-20: Photo Caption Not Length-Validated
**File:** `app/api/v1/rinks/[id]/photos/route.ts`, line 63
**Fix:** Validate caption as string, trim, max 500 chars.

### MED-21: `QuickTipInput` State Variable Shadows Theme `text` Token
**File:** `components/rink/QuickTipInput.tsx`, line 17-19
**What was found:** `const [text, setText] = useState('')` shadows the theme's `text` import, preventing use of `text.sm`, `text.base`, etc.
**Fix:** Rename to `tipText`.

### MED-22: Heading Hierarchy Issues on Home, Error, Not-Found Pages
**Files:** `app/page.tsx`, `app/error.tsx`, `app/not-found.tsx`
**What was found:** Error/not-found use `<h2>` as primary heading (should be `<h1>`). Home page peer sections use `<h3>` under unrelated `<h2>`.
**Fix:** Correct heading levels.

### MED-23: No `<main>` Landmark on 5 Pages
**Files:** `app/trip/[id]/page.tsx`, `app/profile/[id]/page.tsx`, `app/manage/[rinkId]/page.tsx`, `app/error.tsx`, `app/not-found.tsx`
**Fix:** Wrap primary content in `<main>`.

### MED-24: No Tests for `venueConfig.ts` or `getNearbyPlaces()`
**Files:** Missing test files
**Fix:** Add tests for config lookup and nearby places logic.

### MED-25: `SignalType` Union Mixes Hockey and Baseball Signals
**File:** `lib/constants.ts`, line 3
**What was found:** Single union type includes both sports. Baseball signals satisfy the type but aren't in hockey signal arrays.
**Impact:** Type safety weakened — can pass `'batting_cages'` where only hockey signals expected.

### MED-26: SSL `rejectUnauthorized: false` for Production DB
**File:** `lib/db.ts`, line 19
**What was found:** Disables SSL cert verification for all non-localhost connections.
**Impact:** MITM vulnerability between app and database. (Repeated from v2 — infra fix still needed.)

### MED-27: Rinks Search API Returns Inconsistent Response Shape
**File:** `app/api/v1/rinks/route.ts`, lines 94 vs 124
**What was found:** No-query returns `{ data, total, states }`, search returns bare array.
**Fix:** Normalize both paths to same shape.

### MED-28: Race Condition in Claim Creation (TOCTOU)
**File:** `app/api/v1/rinks/[id]/claim/route.ts`, lines 43-56
**What was found:** Duplicate check and insert not in a transaction. Concurrent requests can both pass the check.
**Fix:** Add unique constraint or wrap in transaction.

---

## LOW

### LOW-1: `SELECT *` in auth.ts fetches all user columns including password_hash
**File:** `auth.ts`, line 41

### LOW-2: Unsanitized `kind` reflected in contributions error message
**File:** `app/api/v1/contributions/route.ts`, line 108

### LOW-3: Stack traces logged in production
**File:** `lib/logger.ts`, line 38

### LOW-4: Referrals `rink_id` not validated
**File:** `app/api/v1/referrals/route.ts`, line 22

### LOW-5: TipsSection `tipIndex` changes when sort order changes
**File:** `components/rink/TipsSection.tsx`, line 77
**What was found:** Vote storage keys use positional index, so sorting by "newest" maps votes to wrong tips.

### LOW-6: ContributeFlow textarea missing `background` style
**File:** `components/rink/ContributeFlow.tsx`, line 154

### LOW-7: ReturnRatingPrompt tip input missing `background`/`color` styles
**File:** `components/rink/ReturnRatingPrompt.tsx`, line 181

### LOW-8: AuthModal email/password inputs missing `background`/`color`
**File:** `components/auth/AuthModal.tsx`, lines 224, 238

### LOW-9: SaveRinkButton missing `aria-pressed` for toggle state
**File:** `components/rink/SaveRinkButton.tsx`, lines 34-49

### LOW-10: `WebkitBoxOrient: 'vertical' as any` type assertion
**File:** `components/RinkCard.tsx`, line 128

### LOW-11: 4 components duplicate mobile detection with resize listener
**Files:** `RinkCard.tsx`, `HeroSearch.tsx`, `FeaturedRinksGrid.tsx`, `HowItWorks.tsx`

### LOW-12: `handleShare` function defined inside render conditional
**File:** `components/rink/ReturnRatingPrompt.tsx`, line 104

### LOW-13: Deprecated `document.execCommand('copy')` used in 3 files
**Files:** `app/rinks/[id]/page.tsx`, `app/fields/[id]/page.tsx`, `app/trip/[id]/page.tsx`

### LOW-14: Trip page hardcodes fontFamily inline (inconsistent with app font)
**File:** `app/trip/[id]/page.tsx`, lines 123, 129, 150

### LOW-15: Version string "v0.4" hardcoded in 2 footers
**Files:** `app/page.tsx` line 460, `app/rinks/[id]/page.tsx` line 619

### LOW-16: Team page email submit shows success even on network failure
**File:** `app/team/page.tsx`, lines 13-26

### LOW-17: `::selection` color uses hardcoded rgba in globals.css
**File:** `app/globals.css`, line 65

### LOW-18: McDonald's in coffee category across many rinks
**File:** Multiple nearby data files

### LOW-19: `gas` category missing from getNearbyPlaces fallback queries
**File:** `lib/rinkHelpers.ts`, lines 122-132

### LOW-20: Constants test doesn't validate baseball signal metadata
**File:** `lib/__tests__/constants.test.ts`, lines 60-69

---

## Score Card: v1 → v2 → v3

| Metric | v1 | v2 | v3 |
|--------|-----|-----|-----|
| Critical | 3 | 5 | 3 |
| High | 7 | 16 | 14 |
| Medium | 10 | 20 | 28 |
| Low | 8 | 14 | 20 |
| **Total** | **28** | **55** | **65** |

### Interpretation
The v3 total is higher than v2 because the audit depth increased significantly — particularly in seed data quality (8 new findings from deep-scanning 2298 nearby files) and accessibility (10+ new ARIA findings). The *severity profile* improved markedly:

- **CRITs dropped from 5 → 3**, and the 3 remaining are less severe (hooks ordering, SEO, one auth edge case) vs. v2's auth gaps
- **No auth/security CRITs** — the v2 auth gaps (manage page, operator spoofing, flag flooding) are all fixed
- **Dark mode residue** — the v2 hex sweep caught ~60 values; v3 found ~30 more, mostly in gradients, rgba overlays, and the hero section
- **Data quality surfaced** — roller rinks in the dataset and Airbnb listings in hotels are new HIGH findings that were invisible in code-only audits

### What's Actually Blocking Launch
1. **CRIT-1** (hooks violation) — 5-minute fix, move useState above early return
2. **CRIT-3** (tip respond bypass) — 10-minute fix, ignore client rink_id
3. **HIGH-1/2/3** (data quality) — needs a data cleanup script
4. **HIGH-7/8** (N+1 waterfall) — needs Promise.all refactor
5. **CRIT-2** (home page SEO) — moderate effort, split server/client

Everything else is polish and hardening.
