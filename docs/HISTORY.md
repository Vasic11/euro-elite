# Project history, decisions and lessons

Short log of why things are the way they are. Newest decisions at the bottom
of each section.

## What exists (Nov 2026)

- Home: featured player, club strip, season leaders (6 categories, min games =
  half of max), next round with ranks, compact standings top 10, top performers.
- `/players`: explorer with search, position/sort segmented controls, nation
  dropdown, 24 per page. `/players/[code]`: photo panel in club colors, radar,
  shooting, form (last 3/5/10 games, trend threshold 15% and ≥1.5), PIR chart,
  full-season game log with opponent links.
- `/teams`, `/teams/[code]` with tabs as real routes: roster by position with
  coach and missed-last-game badges, results, schedule, standings.
- `/standings`: full table (wins → point diff → points for).
- `/api/health` + daily GitHub Action; CI on every push; 35 Vitest tests.
- Deployed on Vercel Hobby (free), ~430 prerendered pages, ISR 1h.

## Decisions

- **Data source:** only the official EuroLeague API; the old "agency" mock
  data was removed.
- **Rosters per club**, not the season `/people` endpoint (it missed players).
- **Averages computed from box scores**, not the v3 traditional stats endpoint.
- **Form windows 3/5/10** instead of a single 5-game window.
- **Prerender all player and team pages** (`generateStaticParams`) after
  Vercel showed "Stats didn't load" on dynamic renders; `?from=` moved to the
  client so pages stay static.
- **Hosting:** Vercel Hobby + Neon Postgres (free tiers). DB created, not yet used.
- **Commit attribution:** Claude stays as co-author on this project only.
- **Database (Nov 2026, `feat/database`):** Drizzle **0.45 stable** (npm
  `latest`), not the 1.0 RC. Neon HTTP driver (`drizzle-orm/neon-http`) with
  `db.batch` for atomic writes; migrations via `drizzle-kit generate` +
  `migrate` on the direct `DATABASE_URL`, runtime on `DATABASE_URL_POOLED`.
  Natural keys from the API (club/person code, season + game code). Neon runs
  Postgres 18.
- **Sync:** Vercel **Cron** (`vercel.json`), not the newer Schedules (still
  beta). Hobby allows once a day with ±59 min precision, so evening results
  will come from a GitHub Action (hourly 18–23 UTC) in the next PR; the 04:00
  cron stays as a fallback. First full sync: ~10 s.
- **Sync has its own Zod schemas** (`sync*` in `schemas.ts`, built with
  `.extend`), so new required fields can only break the sync, never the live
  site that still reads the API directly.

## Lessons (avoid repeating)

- Telling the owner to `git stash drop` lost work once (recovered with
  `git stash store`). Check local git state before any git instruction.
- PowerShell rejects `&&` — one command per line.
- Prettier reformats Tailwind classes and line breaks; after string-replace
  edits, re-read the file to confirm the edit landed.
- Health check once picked the oldest game because the schedule is newest
  first — always select by `utcDate`.
- `@types/node` had to be 22 for Vitest; Vitest config is `.mts` (ESM).
- Stale CSS in dev came from a stray `package-lock.json` in the user's home
  folder → fixed with `turbopack.root`.
- Postgres rejects `INSERT … ON CONFLICT DO UPDATE` that hits the same key
  twice in one statement; a transferred player is in two rosters. Dedupe rows
  before every upsert (`uniqueBy` in `lib/sync/rows.ts`).
- Two `NULL`s are distinct in a Postgres unique key by default; the roster
  stint key needs `NULLS NOT DISTINCT` or null start dates duplicate on every sync.
- Roster `startDate`/`endDate` have no time zone; we store them as UTC.
- `player_game_stats` keeps 0-second rows (squad membership), so every average
  must filter `seconds > 0` — go through `rowToBoxLine` + `averagesFromLines`.
