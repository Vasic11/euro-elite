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
- **Hosting:** Vercel Hobby + Neon Postgres (free tiers).
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
- **Pages read the database (Nov 2026, `feat/db-reads`).** Only the source of
  four primitives changed (clubs, roster, schedule, box scores →
  `SeasonData`); `lib/stats` and the domain types stayed, so numbers match by
  construction. Before the swap a temporary dev-only route diffed API vs DB:
  0 differences across 380 games, 3254 box lines, 344 players, 20 teams and
  the standings. The page-facing modules moved to `lib/data/` (they no longer
  "know the API"); `lib/euroleague` is now only used by the sync and health.
- **One cache entry for the whole season** (`unstable_cache`, tag `"db"`),
  same idea as the old single box-score entry: ~430 pages, one Neon read.
  `runSync()` calls `revalidateTag("db", "max")` (Next 16 needs the second
  argument): stale-while-revalidate, so no visitor waits on the DB.
- **Players with equal PIR sort by name.** Before, ties kept the API's input
  order, which differs from the DB's; now the order is deterministic.
- **Evening sync via GitHub Actions** (`sync.yml`, hourly 18:05–23:05 UTC,
  `concurrency: sync`); `:05` because GitHub delays jobs on the full hour most.
  `/api/health` also fails when the last `ok` sync is older than 36 h.
- **Sync moved to Vercel Schedules (Nov 2026, `chore/hardening`).** GitHub
  Actions ran only ~1 of 6 evening syncs per night, so scheduled runs moved to
  `schedules` in `vercel.json` (beta; Hobby allows every 15 min, always with a
  15 min jitter): `5 18-23 * * *` and `0 4 * * *`, `requestMethod: "GET"`
  (path targets default to POST). `crons` was removed in the same change,
  otherwise the route runs twice. `sync.yml` is now manual only.
- **Hardening (same PR):** `.gitattributes` forces LF, Next 16.4.6 for the
  `npm audit --omit=dev` advisories, weekly Dependabot (minor/patch grouped),
  security headers in `next.config.ts` (no CSP yet).

## Known risks

- **The season cache entry outgrows Next's 2 MB limit mid-season** (measured
  27 Nov 2026, `feat/stat-tables`). `unstable_cache` stores its result as a
  fetch-cache entry, and Next refuses to cache an entry whose
  `JSON.stringify` is over 2 MB (`server/lib/incremental-cache`): in
  production it only logs a warning, so every render would silently query
  Neon; in dev it throws. The body is a JSON string inside JSON, so quotes
  count twice. Measured: 1.30 MB after 140 games (0.41 MB without box scores,
  ~6.7 KB per game, ~24 lines per game). The season has 38 rounds (380 RS
  games) + up to ~30 play-in/playoff/Final Four games, so ~3.0 MB at the end;
  the limit is crossed around game 249 (round ~25, early 2027). The new
  box-score fields from `feat/stat-tables` are **not** added to this entry
  (they would make it ~4.1 MB); the stat tables read a separate per-player
  cache instead.
- **Proposed fix (own PR, before round ~22):** keep box-score lines out of
  the season entry. Compute per-player season aggregates in SQL
  (`GROUP BY person_code, club_code` with `seconds > 0` for averages, plus
  squad appearances and last-game squads for `missedLastGame`) and cache that
  instead of raw lines; pages that need lines (form, game log) use the
  per-player cache. The entry then stays ~0.5 MB all season. A compact
  encoding (arrays instead of objects) would only delay the problem.

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
- The league corrects box scores hours after a game (game 134: two players'
  PIR changed after the 04:22 sync). When comparing sources, fetch the API
  with `revalidate: 0`; the local dev fetch cache can be days old.
- `revalidateTag(tag, "max")` serves the stale entry on the first request
  after a sync and refreshes in the background — a check right after a sync
  needs a second request to see new data.
- `core.autocrlf=true` + Prettier (LF) makes untouched files show as modified;
  `git add -A` normalizes them away, then check `git diff --cached --stat`.
