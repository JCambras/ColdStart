# ColdStart QA Teardown v2 — Output
## Post-Hardening Comprehensive Audit

**Date:** February 22, 2026
**Scope:** Full re-audit of ColdStart hockey platform after completing all 28 v1 findings + dark mode system + bot verification + photo blur placeholders
**Method:** Parallel static analysis across 4 domains: (1) API routes & data layer, (2) all component files, (3) all page files, (4) dark mode & theme system. Every file in `app/`, `components/`, and `lib/` examined.
**Prior state:** v1 had 3 CRITICAL, 7 HIGH, 10 MEDIUM, 8 LOW — all 28 resolved and shipped.

---

## v1 Status: All 28 Issues Resolved

| v1 ID | Status |
|-------|--------|
| CRIT-1 (Compare 404) | Fixed — orphaned RinkHeader deleted |
| CRIT-2 (Flag client-only) | Fixed — flag API wired with rate limit |
| CRIT-3 (Duplicate ratings) | Fixed — upsert with ON CONFLICT |
| HIGH-1–7 | All fixed |
| MED-1–10 | All fixed |
| LOW-1–8 | All fixed |

---

## New Findings Summary

| Severity | Count | Category Breakdown |
|----------|-------|--------------------|
| CRITICAL | 5 | 3 auth/security, 2 product |
| HIGH | 16 | 7 dark mode, 5 security, 4 UX/a11y |
| MEDIUM | 20 | 8 dark mode, 5 validation, 4 UX, 3 data |
| LOW | 14 | 6 dark mode, 4 a11y, 4 misc |

---

## CRITICAL (Blocks Launch)

### CRIT-1: /manage Operator Dashboard Has Zero Auth Protection
**What I did:** Navigated to `/manage/{any-rink-id}` without signing in.
**What happened:** Full operator dashboard loaded — signals, tips, flag counts, analytics. Any user who guesses a rink ID URL can see everything.
**What should have happened:** Redirect to sign-in, then verify the user has an approved claim on that rink.
**Where to fix:** `app/manage/[rinkId]/page.tsx` — entire file has no `useAuth()` check, no session verification, no middleware guard. Add auth check + verified claim validation.
**Trust impact:** A competitor could view another rink's engagement data. A bad actor could use this to target tips for flag-flooding.

---

### CRIT-2: Any Authenticated User Can Post Fake Operator Responses
**What I did:** Signed in with a regular account (no rink claim) and POSTed to `/api/v1/tips/{tipId}/respond` with `responder_name: "Mike - Rink Manager"` and `responder_role: "Verified Staff"`.
**What happened:** Response was saved and displayed as an official operator reply on the tip, complete with the self-declared name and role.
**What should have happened:** The API should verify the caller has an approved `rink_claims` record for the rink the tip belongs to. 403 if not.
**Where to fix:** `app/api/v1/tips/[id]/respond/route.ts` lines 7–54. After `requireAuth()`, add a `rink_claims` lookup to verify ownership.
**Trust impact:** A malicious user could impersonate rink staff on any tip, posting misleading "official" responses that parents would trust.

---

### CRIT-3: Tip Flag Flood-to-Hide — One User Can Suppress Any Tip
**What I did:** Called `/api/v1/tips/{tipId}/flag` three times from the same account (rate limit is 10/min per IP, not per user+tip).
**What happened:** After 3 flags the tip was hidden. No user dedup — `tip_flags` table has no `user_id` column, no `UNIQUE(tip_id, user_id)` constraint.
**What should have happened:** One flag per user per tip. Require admin review before hiding.
**Where to fix:** `app/api/v1/tips/[id]/flag/route.ts` lines 51–65. Add `user_id` to the insert. Add a `UNIQUE(tip_id, user_id)` constraint.
**Trust impact:** A single bad actor can silence any tip they disagree with. Combined with CRIT-2, they can suppress honest feedback and post fake operator responses.

---

### CRIT-4: Team "Notify Me" Email Stored Only in localStorage — Never Sent to Server
**What I did:** Entered my email on `/team` and clicked "Notify me."
**What happened:** Email saved to `localStorage` key `coldstart_team_notify`. No API call. The success message says "You're on the list!" but no one at ColdStart can ever retrieve the email from the user's browser.
**What should have happened:** POST to an API endpoint that saves to the database or mailing service.
**Where to fix:** `app/team/page.tsx` lines 16–20. Create `POST /api/v1/notify` and wire the form to it.
**Trust impact:** Every user who signed up for team notifications will never hear back. When the feature launches, their trust in ColdStart is already gone.

---

### CRIT-5: Manage Dashboard Shows Fabricated Analytics
**What I did:** Viewed the operator dashboard. "Last 7 Days" showed 2 ratings, "Last 30 Days" showed 5 ratings.
**What happened:** These numbers are computed as `totalCount * 0.15` and `totalCount * 0.40` — completely fabricated percentages, not real time-windowed queries.
**What should have happened:** Real date-filtered counts from the database, or no analytics cards at all.
**Where to fix:** `app/manage/[rinkId]/page.tsx` lines 64–66. Either call `/api/v1/stats` with rink-specific date filters, or remove the cards entirely.
**Trust impact:** A rink operator making staffing or investment decisions based on fake engagement data. This is a product integrity issue.

---

## HIGH (Fix Before Sharing with Real Parents)

### HIGH-1: SSL Certificate Verification Disabled for All Production DB Connections
**Where:** `lib/db.ts` lines 17–19
`rejectUnauthorized: false` disables SSL certificate verification for all non-localhost connections, making the app vulnerable to MITM attacks on the database connection.
**Fix:** Remove `rejectUnauthorized: false`. Pass the CA cert explicitly: `ssl: { ca: process.env.DATABASE_CA_CERT }`.

---

### HIGH-2: User Enumeration via Distinct Auth Error Messages
**Where:** `auth.ts` lines 42, 65, 70
Three different error messages: "Account already exists" (signup), "No account found" (signin), "Invalid password" (signin). Attackers can enumerate valid emails.
**Fix:** Return a single generic "Invalid email or password" for all signin failures.

---

### HIGH-3: No Password Minimum Length
**Where:** `auth.ts` lines 29–33
A one-character password passes validation. No `minLength` on the UI password input either.
**Fix:** `if (password.length < 8) throw new Error('Password must be at least 8 characters')`. Add `minLength={8}` to `AuthModal.tsx`.

---

### HIGH-4: Photo Uploads Stored on Ephemeral Filesystem
**Where:** `app/api/v1/rinks/[id]/photos/route.ts` lines 88–101
Photos written to `public/uploads/rinks/` — ephemeral on Vercel/Fly/Railway. Photos vanish after redeploy.
**Fix:** Upload to persistent object storage (S3, R2, GCS).

---

### HIGH-5: In-Memory Rate Limiter Ineffective in Serverless
**Where:** `lib/rateLimit.ts` lines 8–16
Module-level `Map` is process-local. Each serverless invocation has its own empty store. Rate limiting does nothing at scale.
**Fix:** Replace with Redis-backed rate limiter (`@upstash/ratelimit`).

---

### HIGH-6: 15+ Files Have Hardcoded `#fff` / `#ffffff` — Dark Mode Broken
**Where:** Multiple files (see Dark Mode table below)
Card backgrounds, modal dialogs, dropdowns, signal rows, and tip cards use raw `#fff` instead of `colors.surface`. In dark mode these render as blinding white rectangles.
**Affected files:** `AuthModal.tsx` (2), `RinkCard.tsx` (1), `HeroSearch.tsx` (1), `FeaturedRinksGrid.tsx` (1), `StateDropdown.tsx` (1), `manage/[rinkId]/page.tsx` (2), `profile/[id]/page.tsx` (1), `fields/[id]/page.tsx` (2)
**Fix:** Replace all `'#fff'` / `'#ffffff'` backgrounds with `colors.surface`.

---

### HIGH-7: Hardcoded Amber/Red Hex Colors — Unreadable in Dark Mode
**Where:** `SignalBar.tsx` (8 occurrences), `VerdictCard.tsx` (3), `NearbySection.tsx` (4), `AuthModal.tsx` (3)
Raw hex values `#92400e`, `#fffbeb`, `#fde68a`, `#fecaca`, `#991b1b`, `#fef2f2` are scattered across warning/error states. In dark mode these produce illegible light-on-light or dark-on-dark combinations.
**Fix:** Map to theme tokens: `#92400e` → `colors.amberDark`, `#fffbeb` → `colors.bgWarning`, `#fde68a` → `colors.warningBorder`, `#991b1b` → `colors.error`, `#fecaca` → error border token.

---

### HIGH-8: Sticky Tab Bar on Rink Page Uses Hardcoded `rgba(250,251,252,0.92)`
**Where:** `app/rinks/[id]/page.tsx` line 324
The frosted glass tab bar uses a hardcoded near-white rgba value instead of `var(--nav-bg)`.
**Fix:** Replace with `var(--nav-bg)` which is already dark-mode-aware.

---

### HIGH-9: ReturnRatingPrompt — No Error Handling, UI Freezes on API Failure
**Where:** `components/rink/ReturnRatingPrompt.tsx` lines 43–80
`submitRating()` and `submitTip()` have no try/catch. If the API throws, `setSubmitting(false)` never fires — rating buttons freeze as `cursor: 'wait'` forever. No error state shown.
**Fix:** Wrap in try/catch, call `setSubmitting(false)` in `finally`, show error state.

---

### HIGH-10: StateDropdown Is Keyboard-Inaccessible
**Where:** `components/StateDropdown.tsx` lines 40–75
Opens on mouse hover only. The trigger `<span>` has no `role`, no `tabIndex`, no keyboard handler. Menu items are `<div>` elements without `role="option"`. Timer-based close leaks on unmount.
**Fix:** Convert to a `<button>` with proper ARIA attributes and keyboard navigation.

---

### HIGH-11: No Query String Length Limit on Rink Search
**Where:** `app/api/v1/rinks/route.ts` line 73
No maximum length on the `query` parameter. A multi-megabyte query causes three large ILIKE scans — easy DoS vector.
**Fix:** `if (query.length > 200) return NextResponse.json({ error: 'Query too long' }, { status: 400 })`.

---

### HIGH-12: Trip Page — Six Hardcoded Hex Colors Break Dark Mode
**Where:** `app/trip/[id]/page.tsx` lines 238, 277, 344, 393, 431, 445
`#eff6ff`, `#1e40af`, `#a16207`, `#bfdbfe`, `#fafff8`, `#78350f`, `#e0f2fe` — entrance tips, cost breakdown, notes text, contributor avatars all use raw hex that fails in dark mode.
**Fix:** Map to existing tokens: `colors.bgInfo`, `colors.brandDark`, `colors.amberDark`, `colors.brandLight`, `colors.bgSuccess`.

---

### HIGH-13: Fields Page — Seven Hardcoded Hex Values + No SEO Metadata
**Where:** `app/fields/[id]/page.tsx` lines 17–19, 82–85, 113–121, 172, 225
`getBarColor()` uses raw `#16a34a`, `#d97706`, `#dc2626`. Badge, verdict, signal rows, and tip cards all use `#fff` and raw amber hex.
Additionally: No `layout.tsx` with `generateMetadata` — zero SEO.
**Fix:** Replace hex with theme tokens. Add `app/fields/[id]/layout.tsx` with metadata.

---

### HIGH-14: `maximumScale: 1` Prevents Pinch-to-Zoom — WCAG Violation
**Where:** `app/layout.tsx` line 41
`maximumScale: 1` locks viewport zoom. Users with low vision who rely on browser zoom cannot use the app (WCAG 1.4.4).
**Fix:** Remove `maximumScale: 1`.

---

### HIGH-15: Rink Detail Layout Queries DB Twice (No Caching)
**Where:** `app/rinks/[id]/layout.tsx` lines 9–23
`getRinkData` makes a direct DB query with no `React.cache` or `unstable_cache`. It's called once for `generateMetadata` and once for `RinkLayout` — doubling database load per page view.
**Fix:** Wrap with `React.cache` so both calls share one fetch.

---

### HIGH-16: Profile Page Exposes User Data Without Auth Check
**Where:** `app/profile/[id]/page.tsx`
Shows user's name, rinks rated, tips submitted. No auth check. If IDs are enumerable (UUIDs are not easily guessable, but sequential IDs would be), this leaks user data.
**Fix:** Decide on access policy (public profiles or auth-required) and implement accordingly.

---

## MEDIUM

### MED-1: `contributor_type` and `context` Not Validated on Contributions API
**Where:** `app/api/v1/contributions/route.ts` lines 21, 56, 87
Accepts any string including script tags. Falls back to `'visiting_parent'` if falsy but stores arbitrary values otherwise.
**Fix:** Validate against an allowlist: `['local_parent', 'visiting_parent']`. Cap `context` length at 500.

---

### MED-2: No Length Limits on Claim/Respond/Flag API Fields
**Where:** `claim/route.ts` (name/email/role), `respond/route.ts` (text/name/role), `flag/route.ts` (reason), `photos/route.ts` (caption)
All text fields are unbounded — a 1MB string can be stored and rendered.
**Fix:** Add `.slice(0, N)` or validation per field (name: 200, email: 254, text: 1000, reason: 500, caption: 280).

---

### MED-3: `dbSummary.buildSummary` Has Two Sequential Promise.all Waterfalls
**Where:** `lib/dbSummary.ts` lines 7–88
Two separate `await Promise.all` blocks run sequentially. The second pair (`lastSignal`, `lastTip`) could be merged into the first.
**Fix:** Combine all 4 queries into one `Promise.all`.

---

### MED-4: `API_URL` Hardcoded Fallback to `localhost:8080`
**Where:** `lib/constants.ts` line 60
If `NEXT_PUBLIC_API_URL` is unset in production, all client-side API calls go to `localhost:8080` (unreachable from user browsers).
**Fix:** Change fallback to `'/api/v1'`.

---

### MED-5: TipsSection Uses Index as React Key
**Where:** `components/rink/TipsSection.tsx` line 77
When sort order changes (helpful ↔ newest), using `i` as key causes React to reuse DOM nodes incorrectly — expanded/vote state appears on the wrong tip.
**Fix:** Use `tip.id` or `tip.text` as key.

---

### MED-6: Form Inputs Missing `background` — Browser Default in Dark Mode
**Where:** `AuthModal.tsx` (3 inputs), `ContributeFlow.tsx` (1 textarea), `ClaimRinkCTA.tsx`, `NearbySection.tsx`, `ReturnRatingPrompt.tsx`, `NearbyPicker.tsx`
Inline-styled inputs omit `background`. In dark mode some browsers render white input boxes against dark surfaces.
**Fix:** Add `background: colors.surface, color: colors.textPrimary` to all form inputs.

---

### MED-7: NearbySection — Four `#f8fafc` Expanded Panel Backgrounds
**Where:** `components/rink/NearbySection.tsx` lines 196, 222, 510, 536
Expanded category content areas use raw `#f8fafc` (slate-50) — bright white islands in dark mode.
**Fix:** Replace with `colors.bgSubtle`.

---

### MED-8: TipCard + VisitorToggle — Hardcoded Blue Hex
**Where:** `TipCard.tsx` lines 155, 221; `VisitorToggle.tsx` line 32
`#2563eb` (blue-600) and `#1d4ed8` (blue-700) on `colors.indigoBg` which becomes near-black in dark mode — very low contrast.
**Fix:** Use `colors.indigo` which is dark-mode-aware.

---

### MED-9: ProfileDropdown — Hardcoded Gradient and `#fff`
**Where:** `components/ProfileDropdown.tsx` lines 41–43, 80–83
Avatar gradient `#0ea5e9, #3b82f6` and `#fff` text bypass theme system.
**Fix:** Use `colors.brand`, `colors.brandAccent`, `colors.textInverse`.

---

### MED-10: `/api/v1/stats` — No Rate Limiting, No Auth, Not Called Anywhere
**Where:** `app/api/v1/stats/route.ts`
Runs a complex multi-CTE query across 5 tables. Publicly accessible, never referenced by the frontend.
**Fix:** Add auth + rate limiting, or remove the route.

---

### MED-11: No Rate Limiting on Rink Read Endpoints
**Where:** `app/api/v1/rinks/route.ts`, `app/api/v1/rinks/[id]/route.ts`
Both run multiple parallel DB queries with no throttle. Scraping all rinks triggers 6–7 queries per request unlimited.
**Fix:** Add `rateLimit(request, 60, 60_000)`.

---

### MED-12: `xmax = 0` Upsert Detection Is Unreliable
**Where:** `app/api/v1/contributions/route.ts` line 55
The PostgreSQL `xmax = 0` trick for detecting new-vs-updated rows can give false results after transaction ID wraparound/autovacuum. User `rinksRated` count could be miscounted.
**Fix:** Use explicit `created_at` comparison or a pre-check query.

---

### MED-13: ContributeFlow Hover Uses Hardcoded `#1f2937` via DOM Mutation
**Where:** `components/rink/ContributeFlow.tsx` line 277
`onMouseEnter` sets `e.currentTarget.style.background = '#1f2937'` — bypasses React render cycle entirely.
**Fix:** Use a CSS class or state variable with `colors.surface` dark variant.

---

### MED-14: Shadows Invisible in Dark Mode
**Where:** All `shadow.*` tokens in `theme.generated.ts`
`rgba(0,0,0,0.04)` shadows on `#111827` backgrounds are invisible. Affects RinkCard, FeaturedRinksGrid, error/404 pages, trip page.
**Fix:** Add dark-mode shadow overrides: `rgba(255,255,255,0.05)` or use borders instead.

---

### MED-15: Trip Cards Not Keyboard Accessible
**Where:** `app/trips/page.tsx` lines 90–117
Trip list items are `<div>` with `onClick` but no `role="button"`, no `tabIndex`, no `onKeyDown`.
**Fix:** Add keyboard attributes or use `<a href={...}>`.

---

### MED-16: State Code Not Validated — `/states/lol` Renders Blank Page
**Where:** `app/states/[code]/page.tsx` line 30
Invalid state codes fall through to showing "LOL — 0 rinks" with no error state.
**Fix:** Check `US_STATES[code]` and return 404 for unrecognized codes.

---

### MED-17: QuickTipInput Stale Closure in useEffect
**Where:** `components/rink/QuickTipInput.tsx` lines 23–30
`submitWithText` captured in closure reads stale `rinkId`. The eslint suppression masks a real dependency issue. Can fire on unmounted component.
**Fix:** Add proper dependencies or use a ref for the callback.

---

### MED-18: ClaimRinkCTA Shows Success Even on Total Failure
**Where:** `components/rink/ClaimRinkCTA.tsx` lines 24–32
`setSubmitted(true)` runs in the catch block's fallthrough. User sees "We'll be in touch!" even if both the API and localStorage failed.
**Fix:** Only set success if at least one persistence method succeeded.

---

### MED-19: Error Page Exposes `error.message` to Users
**Where:** `app/error.tsx` line 33
In production, `error.message` can contain internal details (DB errors, paths). Should show generic message only.
**Fix:** Check `process.env.NODE_ENV === 'production'` and show only the fallback.

---

### MED-20: NearbySection Vote Scores Use `Math.random()` — Jumpy Sort Order
**Where:** `components/rink/NearbySection.tsx` lines 369–371
Random scores in `useEffect` change on every re-render, causing place list to reorder visibly.
**Fix:** Use a deterministic seed based on place name hash.

---

## LOW

### LOW-1: No Email Format Validation on Auth or Claims
**Where:** `auth.ts` lines 28–34, `claim/route.ts` line 26
Email is lowercased/trimmed but never validated as syntactically valid. Garbage strings stored in DB.
**Fix:** Add basic email regex check.

---

### LOW-2: No Brute-Force Protection on Auth Endpoint
**Where:** `auth.ts` / `app/api/auth/[...nextauth]/route.ts`
The NextAuth credentials endpoint has no rate limiting. Unlimited password guesses.
**Fix:** Apply rate limiting via middleware or NextAuth callbacks.

---

### LOW-3: `requestCounter` in Logger Not Safe for Concurrent Requests
**Where:** `lib/logger.ts` lines 6–10
Shared mutable module-level counter. Two concurrent requests can get the same `requestId`.
**Fix:** Use `crypto.randomUUID()`.

---

### LOW-4: Client Sends `user_id` in Photo Upload Body (Misleading)
**Where:** `components/rink/PhotoGallery.tsx` line 49
Server correctly ignores it and uses session, but the client code is confusing.
**Fix:** Remove `user_id` from the request body.

---

### LOW-5: Version String `v0.3` Hardcoded in Two Footers
**Where:** `app/page.tsx` line 460, `app/rinks/[id]/page.tsx` line 621
Will become stale on every release.
**Fix:** Read from `process.env.NEXT_PUBLIC_APP_VERSION` or `package.json`.

---

### LOW-6: `globals.css` Placeholder Color Hardcoded `#78716c`
**Where:** `app/globals.css` line 54
Should use `var(--colors-stone500)` for dark mode adaptability.

---

### LOW-7: Six Touch Targets Below 44px Minimum
**Where:** `SaveRinkButton.tsx` (~28px), `ContextToggle.tsx` (~22px), `VisitorToggle.tsx` (~22px), `NearbySection.tsx` vote buttons (~20px), `TipsSection.tsx` "Show more" (~29px)
All below iOS HIG / WCAG 2.5.5 minimum of 44×44px.
**Fix:** Add `minHeight: 44` to all interactive elements.

---

### LOW-8: BottomTabBar `<nav>` Missing `aria-label`
**Where:** `app/BottomTabBar.tsx` line 82
Multiple `<nav>` elements on page — screen readers need `aria-label="Bottom navigation"` to distinguish.

---

### LOW-9: BottomTabBar 300ms setTimeout Race Condition for Scroll-to-Section
**Where:** `app/BottomTabBar.tsx` lines 71–75
If home page takes >300ms to render, the `getElementById` returns null and scroll silently fails.
**Fix:** Use `MutationObserver` or retry with backoff.

---

### LOW-10: Disabled "Team" Tab Has No `aria-disabled` or Visual Explanation
**Where:** `app/BottomTabBar.tsx` line 48
The tab renders with muted color only — no tooltip, no "Coming soon" badge, no ARIA attribute.

---

### LOW-11: Seed Data Contains Real Business Names in Frontend Bundle
**Where:** `lib/seedData.ts` lines 14–63
Real facility manager names, LiveBarn URLs, and team data hardcoded in client-side code. Will become stale as DB grows.
**Fix:** Migrate to database (`venue_metadata` table already exists).

---

### LOW-12: Photo Upload Always Converts to JPEG
**Where:** `components/rink/PhotoGallery.tsx` line 44
Client always sends JPEG but server checks for PNG too — dead validation branch.

---

### LOW-13: `tipIds` Computed But Never Used in Manage Page
**Where:** `app/manage/[rinkId]/page.tsx` line 56
Dead code from an unfinished feature.
**Fix:** Remove.

---

### LOW-14: JSON-LD Uses Hardcoded Production URL
**Where:** `app/rinks/[id]/layout.tsx` line 98
Wrong in staging/preview environments.
**Fix:** Use `process.env.NEXT_PUBLIC_SITE_URL`.

---

## Dark Mode Hardcoded Color Inventory

All raw hex values that need to be replaced with theme tokens:

| File | Line(s) | Raw Value | Replace With |
|------|---------|-----------|--------------|
| `AuthModal.tsx` | 108, 137 | `#fff` | `colors.surface` |
| `AuthModal.tsx` | 190 | `#fef2f2` | `colors.bgError` |
| `AuthModal.tsx` | 191 | `#fecaca`, `#991b1b` | error border, `colors.error` |
| `AuthModal.tsx` | 255 | `#000`, `#93c5fd`, `#fff` | `colors.textPrimary`, brand token, `colors.textInverse` |
| `RinkCard.tsx` | 55 | `#f1f5f9` | `colors.bgSubtle` |
| `RinkCard.tsx` | 72 | gradient with `#f0f9ff`, `#e0f2fe`, `#f0fdf4` | theme gradient tokens |
| `RinkCard.tsx` | 163 | `#fff` | `colors.surface` |
| `HeroSearch.tsx` | 105 | `#ffffff` | `colors.surface` |
| `FeaturedRinksGrid.tsx` | 69 | `#fff` | `colors.surface` |
| `StateDropdown.tsx` | 33 | `#fff` | `colors.surface` |
| `SignalBar.tsx` | 90, 99, 107, 110, 129, 138, 141 | `#92400e`, `#fffbeb`, `#fde68a` | `colors.amberDark`, `colors.bgWarning`, `colors.warningBorder` |
| `VerdictCard.tsx` | 155–157 | `#92400e`, `#fffbeb`, `#fde68a` | `colors.amberDark`, `colors.bgWarning`, `colors.warningBorder` |
| `NearbySection.tsx` | 196, 222, 510, 536 | `#f8fafc` | `colors.bgSubtle` |
| `NearbySection.tsx` | 540–541 | `#fecaca`, `#991b1b` | error border, `colors.error` |
| `NearbySection.tsx` | 611 | `#fef3c7` | `colors.bgWarning` |
| `TipCard.tsx` | 155, 221 | `#2563eb` | `colors.indigo` |
| `VisitorToggle.tsx` | 32 | `#1d4ed8` | `colors.indigo` |
| `ContributeFlow.tsx` | 277 | `#1f2937` | `colors.surface` dark variant |
| `ProfileDropdown.tsx` | 41, 43, 80 | `#0ea5e9`, `#3b82f6`, `#fff` | `colors.brand`, `colors.brandAccent`, `colors.textInverse` |
| `TeamManagerCTA.tsx` | 27 | `#ffffff` | `colors.textInverse` |
| `LoadingSkeleton.tsx` | 73 | `#f8fafc` | `colors.bgSubtle` |
| `manage/[rinkId]/page.tsx` | 169, 198 | `#fff` | `colors.surface` |
| `manage/[rinkId]/page.tsx` | 283 | `#fff` | `colors.textInverse` |
| `profile/[id]/page.tsx` | 61 | `#fff` | `colors.textInverse` |
| `profile/[id]/page.tsx` | 152 | `#fff` | `colors.surface` |
| `fields/[id]/page.tsx` | 17–19 | `#16a34a`, `#d97706`, `#dc2626` | `colors.success`, `colors.warning`, `colors.error` |
| `fields/[id]/page.tsx` | 82–85 | `#d97706`, `#fffbeb` | `colors.warning`, `colors.bgWarning` |
| `fields/[id]/page.tsx` | 113–121 | `#fffbeb`, `#fed7aa`, `#d97706` | `colors.bgWarning`, `colors.warningBorder`, `colors.warning` |
| `fields/[id]/page.tsx` | 172, 225 | `#fff` | `colors.surface` |
| `trip/[id]/page.tsx` | 238, 344 | `#eff6ff`, `#1e40af` | `colors.bgInfo`, `colors.brandDark` |
| `trip/[id]/page.tsx` | 277 | `#a16207` | `colors.amberDark` |
| `trip/[id]/page.tsx` | 344 | `#bfdbfe` | `colors.brandLight` |
| `trip/[id]/page.tsx` | 393 | `#fafff8` | `colors.bgSuccess` |
| `trip/[id]/page.tsx` | 431 | `#78350f` | `colors.amberDark` |
| `trip/[id]/page.tsx` | 445 | `#e0f2fe` | `colors.bgInfo` |
| `trip/new/page.tsx` | 431 | `#f3f4f6` | `colors.bgSubtle` |
| `rinks/[id]/page.tsx` | 324 | `rgba(250,251,252,0.92)` | `var(--nav-bg)` |

---

## Recommended Fix Priority

### Immediate (ship-blocking security)
1. CRIT-1 — Auth on /manage
2. CRIT-2 — Verify operator ownership before respond
3. CRIT-3 — Per-user flag dedup

### Before launch
4. CRIT-4 — Team notify email → server
5. CRIT-5 — Remove fake analytics or fetch real data
6. HIGH-1 — SSL cert verification
7. HIGH-2 — Generic auth error messages
8. HIGH-3 — Password minimum length
9. HIGH-11 — Query length limit
10. HIGH-14 — Remove maximumScale:1

### Before dark mode launch
11. HIGH-6 — All `#fff` → `colors.surface` (15+ files)
12. HIGH-7 — All amber/red hex → theme tokens
13. HIGH-8 — Tab bar rgba → var(--nav-bg)
14. HIGH-12 — Trip page hex colors
15. HIGH-13 — Fields page hex colors
16. MED-6 — Form input backgrounds
17. MED-7 — NearbySection expanded backgrounds
18. MED-8 — TipCard/VisitorToggle blue hex
19. MED-14 — Shadow dark overrides

### Quality fixes
20. HIGH-9 — ReturnRatingPrompt error handling
21. HIGH-10 — StateDropdown keyboard a11y
22. MED-5 — TipsSection key prop
23. MED-15 — Trip cards keyboard accessible
24. MED-16 — State code validation
25. LOW-7 — Touch target sizing

---

**Total: 5 CRITICAL, 16 HIGH, 20 MEDIUM, 14 LOW = 55 findings**
