@AGENTS.md

# Euro Elite: project guide for Claude Code

EuroLeague stats site (players, teams, standings, form) built on the official
EuroLeague API. Live at https://euro-elite.vercel.app, repo `Vasic11/euro-elite`.
Portfolio project of a 3rd-year Software Engineering student (RAF) who wants to
learn through the work.

## How to work with the owner

- Reply in **Serbian, Latin script**. Code, comments, commit messages and the UI
  stay in **English**.
- Explain the *why* briefly when introducing a concept or pattern (he is
  learning), but don't lecture on things already done in this repo.
- He is on **Windows**: PowerShell (no `&&`, give commands one per line) and
  Git Bash. Local path `C:\Users\user\Desktop\euro-elite`.
- Before giving git commands, check the real local state (`git status`,
  `git stash list`, current branch). Never `git stash drop`, `reset --hard`,
  `push --force` or rewrite history without asking first.
- He can paste screenshots (Alt+V on Windows) — use them for UI feedback.

## Workflow rules

- Never commit to `main`. One branch per task (`feat/…`, `fix/…`, `docs/…`),
  then a pull request. Vercel builds a preview per PR; merge triggers deploy.
- Before saying a task is done, run all four checks (same as CI):
  `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`.
  Run `npm run format` after edits (Prettier + Tailwind class sorting).
- For UI work, run `npm run dev` and look at the page (browser tools or ask for
  a screenshot) on desktop and ~390px mobile width.
- Commits: Conventional Commits (`feat(players): …`). On this project keep the
  Claude `Co-Authored-By` trailer. On *other* projects ask how to sign first.
- Small, reviewable PRs. Update `README.md` when structure or data flow changes.

## Security rules

- Secrets live only in `.env.local` (gitignored) and Vercel env settings.
  Never print, read aloud, commit or paste `DATABASE_URL` or any token.
  `.env.example` lists variable names only.
- Validate every external response with Zod (`lib/euroleague/schemas.ts`).
- Code that touches the API or DB is `import "server-only"`.

## Commands

| Command | What |
| --- | --- |
| `npm run dev` | dev server (Turbopack) on :3000 |
| `npm run build` | production build (prerenders ~430 pages, hits the real API) |
| `npm run lint` / `typecheck` / `test` / `format:check` | CI checks |
| `npm run format` | fix formatting |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle migrations (direct `DATABASE_URL`) and table browser |

## Stack (versions matter — Next 16 differs from training data)

Next.js 16.2 App Router + Turbopack, React 19, TypeScript, Tailwind CSS 4
(`@theme` tokens in `app/globals.css`), Zod 4, framer-motion, Vitest, Prettier.
Read `node_modules/next/dist/docs/` before using a Next API you're unsure of.
Next 16 facts already used here: `params`/`searchParams` are Promises,
`unstable_retry` in `error.tsx`, `template.tsx` for page transitions,
`generateStaticParams` in a layout, route handlers not cached by default,
`turbopack.root` set in `next.config.ts` (a stray lockfile in the user's home
folder confused root detection).

## Architecture

```
app/            routes; pages are Server Components that fetch data
components/     UI by feature (players/, teams/, games/, standings/, home/, ui/)
lib/data/       what pages import: players, games, standings; assemble.ts (pure, tested)
lib/euroleague/ everything that knows the EuroLeague API (fetch, schemas); used by sync + health
lib/stats/      pure functions (aggregation, form, standings, leaders) + tests
lib/db/         Drizzle schema (6 tables), getDb(), queries.ts (season read), health.ts
lib/sync/       API → DB: rows.ts (pure mapping + rules, tested), run.ts (runSync)
scripts/        last-sync.mjs (`npm run db:last-sync`)
drizzle/        generated SQL migrations, committed
.github/        ci.yml (checks on every push), health.yml (daily /api/health),
                sync.yml (manual "Run workflow" → /api/cron/sync),
                dependabot.yml (weekly npm + actions)
```

DB sync: Vercel Schedules (`vercel.json` `schedules`, beta: hourly 18:05–23:05
UTC and 04:00 UTC, GET, 15 min jitter on Hobby) → `/api/cron/sync` (Bearer `CRON_SECRET`) →
`runSync()`: upsert clubs, rosters, schedule, then box scores of played games
that are missing or from the last 3 days, each game in one `db.batch`; then
`revalidateTag("db", "max")`.

Data flow: API → sync → Neon → `lib/db/queries.ts` (`getSeasonFromDb`: the
whole season as ONE `unstable_cache` entry, tag `"db"`; stat tables read a
small per-player entry, `getPlayerGamesFromDb`) → `lib/data/*`
(`assemble.ts` builds `Player`/`Team` with `lib/stats`) → server page → client
components only where state/animation is needed. Components never use raw API
or DB shapes. Rendering: ISR, pages revalidate every 1h and right after a sync.
`/api/health` is dynamic: API checks + last `ok` sync < 36 h, returns 200/503.

Details for the API live in `.claude/rules/euroleague-api.md`; UI and design
rules in `.claude/rules/ui.md` (both load automatically for matching files).
Project history, decisions and lessons: `docs/HISTORY.md` — read it when the
reason behind something is unclear.

## Roadmap (agreed order)

1. **Database** (Neon Postgres, Frankfurt, already created; `DATABASE_URL` and
   `DATABASE_URL_POOLED` in `.env.local`) with Drizzle: clubs, players,
   player-club history (transfers), schedule, full box score per player per
   game. Nightly sync (Vercel Cron) from the API; site reads from DB; health
   check keeps working. Branch `feat/database`.
   **PR 1 done** (schema, migration, sync). **PR 2 done** (`feat/db-reads`):
   pages read from DB, health checks the last `ok` sync (< 36 h), evening
   sync via GitHub Actions, `npm run db:last-sync`.
2. Detailed player stat tables like euroleague.net: season totals/averages and
   per game, all box score columns (2FG/3FG/FT made-att-%, OREB/DREB, AST, STL,
   TO, BLK for/against, fouls committed/drawn, PIR, minutes as mm:ss), sticky
   first column on mobile.
3. Live scores (poll every 20–30 s only while a game is in progress).
4. Fantasy corner: next-round projections, best team for a budget
   (knapsack/ILP + captain), transfer tips, schedule difficulty, coaches.
   Prices are not in the official API — find the source first.
5. Hardening: **done in `chore/hardening`:** LF via `.gitattributes`, Next
   16.4.6, Dependabot, security headers (no CSP). Still open: branch protection
   on `main`, CSP, rate limit on `/api/health`. Standings tiebreak is not
   head-to-head yet.

## Which skill or tool to use

Pick the most specific one that fits; check `/skills` and `/plugin` for what is
installed.

- New or reshaped UI, visual direction → a frontend design skill
  (`frontend-design`), together with `.claude/rules/ui.md`.
- Motion, transitions, hover effects → an animation skill if installed
  (`animate`, `emil-design-eng`); otherwise framer-motion with restraint.
- Mobile feel (tap states, 100vh, sticky hover) → `mobile-native` if installed.
- Charts (PIR trend, radar, shooting) → `dataviz` if installed: one axis,
  thin marks, legend for ≥2 series, colors validated.
- Reviewing a PR or diff → `code-review` plugin / `/review`; security-sensitive
  change (DB, cron, env, API route) → also a security review.
- Exploring a lot of code → a subagent, so the main context stays small.
- Database work → read Drizzle and Neon docs first (they change often).
