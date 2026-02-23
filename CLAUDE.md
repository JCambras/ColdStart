# ColdStart — Hockey rink ratings from parents who've been there

## What This Is
A Next.js app where hockey parents rate rinks (parking, comfort, food, etc.), drop tips, and plan tournament trips. Crowdsourced signal ratings aggregate into verdicts. Works fully offline via seed data fallback and localStorage — runs with zero config (no database or env vars needed for local dev). Pre-launch stage. Currently deployed on Vercel with ~1000 rinks across PA, NJ, NY, MI.

## Tech Stack
- Next.js 16 (App Router, server + client components), React 19, TypeScript 5.9
- PostgreSQL via `pg` pool (`lib/db.ts`), no ORM
- NextAuth 5 beta (JWT sessions, Credentials + Google/Apple/Facebook providers)
- Web Push (VAPID) for rink update notifications
- Vitest (158 unit tests), Playwright (14 E2E tests across chromium + mobile)
- Inline styles via design tokens (`lib/theme.ts`), no CSS framework. Use `colors`, `text`, `layout` from `lib/theme.ts` for all styling — no CSS files, no Tailwind, no `className`
- Deployed on Vercel with cron (`vercel.json`)

## Commands
```bash
npm run dev              # Dev server (port 3000)
npm run build            # Production build (runs tokens:build first)
npm test                 # Vitest unit tests (158 tests)
npm test -- --run lib/__tests__/verdict.test.ts  # Run a single Vitest file
npm run test:e2e         # Playwright E2E (starts dev server on :3001)
npm run test:e2e:ui      # Playwright interactive UI mode
npm run seed             # Seed PostgreSQL from /data/rinks.json (needs DATABASE_URL)
npm run tokens:build     # Rebuild design tokens → lib/theme.generated.ts
```

## Architecture
- **Server components** handle initial data fetch (homepage featured rinks, state pages). Client components handle all interactivity.
- **API routes** live in `app/api/v1/`. Main ones: `/contributions` (ratings + tips), `/rinks` (search + detail), `/trips`, `/push`.
- **Seed data fallback**: `lib/api.ts` `apiGet()` accepts a `seedPath` option. If the API fails (no DB), it fetches from `/public/data/*.json` and applies a client-side `transform`. The rink detail page uses `buildRinkDetailFromSeed()` for the same purpose.
- **localStorage** (`lib/storage.ts`) caches user prefs, rated rinks, saved rinks, trips, viewed history. All typed accessors, all try/catch wrapped.
- **Venue config** (`lib/venueConfig.ts`) makes signals/verdicts sport-agnostic. Hockey is default; baseball fields use `BASEBALL_CONFIG` with different signals.
- **Rate limiting**: in-memory per-IP store in `lib/rateLimit.ts`, per-route limits.
- **Auth in API routes**: Use `requireAuth()` from `lib/auth.ts` at the top of protected routes. Returns `{ session, user }` or 401.
- **Database tables**: `rinks`, `signals`, `tips`, `contributions`, `users`, `push_subscriptions`, `trips`, `trip_rinks`. All queries use raw SQL via `lib/db.ts` pool.

## Key Concepts
- **Signal**: 1–5 rating for a rink quality (parking, cold, food_nearby, chaos, family_friendly, locker_rooms, pro_shop). Aggregated with avg, count, confidence, stddev.
- **Verdict**: Summary string from average signal value. >=3.8 "Good rink overall", >=3.0 "Mixed reviews", <3.0 "Heads up".
- **Contribution**: A user action — signal rating, tip, or confirm (quick re-validation). Triggers push to rink watchers.
- **Tip**: Free-text advice (280 char max). Has contributor_type, context, flag_count, optional operator_response.
- **Freshness**: `last_updated_at` → fresh (<24h), recent (<7d), stale (>7d). Drives UI color/pulse dot.
- **Vibe**: Behavioral archetype engine (`app/vibe.ts`). Classifies users as organizer/scout/contributor/etc from localStorage events. Not yet active in UI.

## Environment Variables
All optional for local dev (seed data fallback works with zero config).
For full functionality: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
OAuth (optional): `AUTH_GOOGLE_ID/SECRET`, `AUTH_APPLE_ID/SECRET`, `AUTH_FACEBOOK_ID/SECRET`
Push (optional): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
Cron: `CRON_SECRET` (protects `/api/v1/push/game-notifications`)

## Critical Rules
IMPORTANT: The app must work without a database. Every user-facing page has a seed data fallback path. Don't add features that hard-fail when `DATABASE_URL` is missing.

IMPORTANT: `lib/storage.ts` is the single localStorage abstraction. Never call `localStorage` directly — use the typed `storage.*` accessors. All calls are try/catch wrapped for SSR safety.

IMPORTANT: `dbSummary.ts` prefers 12-month rolling data over all-time. Don't change this — it prevents stale historical averages from burying recent seasonal data.

IMPORTANT: Design tokens are generated files. Edit `tokens/*.json`, run `npm run tokens:build`. Never hand-edit `lib/theme.generated.ts` or `lib/tokens.generated.css`.

## Common Patterns
- **Add a new signal**: Add to `SIGNAL_ORDER` in `lib/venueConfig.ts`, add seed data in `/data/signals.json`, add DB column migration.
- **Add an API route**: Create `app/api/v1/<name>/route.ts`, export `GET`/`POST`. Use `requireAuth()` for protected routes. Use `rateLimit()` for public routes.
- **Add a rink page section**: Add a new component in `components/rink/`, import in `app/rinks/[id]/page.tsx` client component. Use `colors`/`text`/`layout` from theme.

## Gotchas
- **Two slug systems**: Legacy hardcoded slugs (`'bww'`, `'ice-line'`, `'proskate'`) in `seedData.ts` vs modern generated slugs (name-city format). Both are used as keys.
- **Rink detail is fully client-rendered**. The `app/rinks/[id]/page.tsx` component does all data fetching in `useEffect`, not in server components. This means it shows a loading skeleton first.

## Testing
- **Unit tests** (`lib/__tests__/`, `components/__tests__/`): `npm test` runs Vitest. 158 tests, jsdom environment.
- **E2E tests** (`e2e/tests/`): `npm run test:e2e` runs Playwright. 7 specs × 2 viewports (chromium + mobile Pixel 5). Tests use seed data fallback — no database needed. Shared fixtures in `e2e/fixtures/` for auth mocking and API interception.
- Vitest config excludes `e2e/` directory. Playwright config excludes `lib/__tests__/`.
