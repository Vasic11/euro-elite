---
paths:
  - "lib/**"
  - "app/api/**"
---

# EuroLeague API: what we learned

Base `https://api-live.euroleague.net`, no API key. Competition `E`, season
from `SEASON_CODE` in `lib/euroleague/config.ts` (env `EUROLEAGUE_SEASON`,
default `E2026` = 2026-27). All calls go through `euroleagueFetch(path, schema,
{ query, revalidate })` in `client.ts`; never call `fetch` on the API elsewhere.

## Endpoints we use

| Endpoint                                                | Shape             | Notes                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/v2/competitions/E/seasons/{s}/clubs`                  | `{ data, total }` | 20 clubs                                                                                                                                                                                                                                                                           |
| `/v2/competitions/E/seasons/{s}/clubs/{code}/people`    | array             | `type` `J` = player, `E` = coach; a player can appear more than once — keep the entry with the latest `startDate` (`latestActive`)                                                                                                                                                 |
| `/v2/competitions/E/seasons/{s}/games`                  | `{ data }`        | **newest first**; `local`/`road` with `club` and `score`, `played`, `utcDate`, `round`, `gameCode`                                                                                                                                                                                 |
| `/v3/competitions/E/seasons/{s}/games/{gameCode}/stats` | box score         | `local.players` / `road.players`; `player.person.code`; `timePlayed` in **seconds**; `valuation` = PIR; `fieldGoalsMade2/Attempted2`, `fieldGoalsMade3/Attempted3`, `freeThrowsMade/Attempted`, `totalRebounds`, `assistances`, `steals`, `blocksFavour`, `turnovers`, `startFive` |

## Do not use

- Season-wide `/v2/.../people`: paginated and silently misses players
  (e.g. Tubelis at Žalgiris was missing). Use per-club rosters.
- `/v3/.../statistics/players/traditional`: omits players. We compute season
  averages ourselves from box scores (`lib/stats/aggregate.ts`), percentages
  from totals, not averages of percentages.

## Conventions

- Only the sync (`lib/sync/run.ts`, `revalidate: 0`) and `/api/health` call
  the API; pages read the database. Fetch box scores with `mapLimit(…, 8)`; a
  failed box score is skipped (sync status `partial`), not fatal.
- "Latest game" means max `utcDate`, never array index.
- `missedLastGame` only looks at the player's current club (latest active
  stint, `latestActive`), never a former one, and only flags regulars: in the
  squad for ≥ half of that club's games since his contract `startDate`
  (otherwise every bench player, or nobody signed mid-season, gets flagged).
- `outSince` (`playersOutSince`): current club only; he was in its squad at
  least once, the club then played ≥ `OUT_MIN_GAMES` (3) boxed games without
  him, and before that he was in the squad for ≥ half of its games since his
  contract `startDate`. The date is the first missed game. It replaces
  `missedLastGame` (one badge, not both). Never in the new club's squad → no badge.
- Career timeline (`careerStints`): player stints by `startDate`, same-club
  stints merged, shown only with ≥ 2 clubs. Contract dates are zoneless and
  stored as UTC, so they are displayed in UTC (`formatStintDate`), not Belgrade.
- Short display names come from `SHORT_NAMES` in `mappers.ts` (RED =
  "Crvena Zvezda", not "Crvena"); full name plus table rank in game rows.
- Dates are shown in `Europe/Belgrade` (`formatGameDate`).
- Search normalization: `đ`/`dj` → `d` (`normalizeForSearch`).
- Pure logic goes in `lib/stats/` with a `*.test.ts` next to it.
- Never change a Zod schema to `.passthrough()`/`any` to silence an error —
  find what the API actually returns.
