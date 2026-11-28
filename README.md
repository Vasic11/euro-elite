# EuroElite

Scouting platforma za EuroLeague: živa statistika igrača i timova, profil igrača sa radar dijagramom, a uskoro i forma kroz kola i fantasy predlozi.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zod · Framer Motion · Vitest · Neon Postgres + Drizzle ORM

## Pokretanje

```bash
npm install
cp .env.example .env.local   # opciono: izbor sezone
npm run dev
```

| Skripta                | Šta radi                                               |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | razvojni server                                        |
| `npm run build`        | produkcijski build                                     |
| `npm run lint`         | ESLint                                                 |
| `npm run typecheck`    | TypeScript provera                                     |
| `npm run format`       | Prettier formatiranje                                  |
| `npm test`             | Vitest testovi                                         |
| `npm run db:generate`  | nova SQL migracija iz `lib/db/schema.ts`               |
| `npm run db:migrate`   | primeni migracije na bazu (direktni `DATABASE_URL`)    |
| `npm run db:studio`    | Drizzle Studio: pregled tabela u browseru              |
| `npm run db:last-sync` | poslednjih 5 sync-ova iz `sync_runs` (status, starost) |

## Struktura

```
app/                          rute (svaki folder = URL)
  page.tsx                    /                 Scouting Hub
  players/page.tsx            /players          svi igrači + filteri
  players/[code]/page.tsx     /players/:code    profil igrača
  teams/page.tsx              /teams            svi klubovi
  teams/[code]/layout.tsx                       zaglavlje kluba, naredna utakmica, tabovi (zajedničko za sve tabove)
  teams/[code]/page.tsx       /teams/zal        roster po pozicijama
  teams/[code]/results|schedule|standings       ostali tabovi kao posebne stranice
  standings/page.tsx          /standings        tabela lige i naredno kolo
  template.tsx                                  animacija ulaska svake stranice
  loading.tsx, error.tsx, not-found.tsx

components/
  layout/Navbar.tsx           navigacija (aktivni tab prema URL-u)
  home/                       FeaturedPlayer, SeasonLeaders, ClubStrip
  players/                    PlayerCard, PlayerPanel (foto-ploča),, PlayerGrid, PlayerExplorer, RadarChart, PlayerImage
  players/form/               forma: PlayerForm (server), FormSection, PirChart
  teams/TeamAccordion.tsx
  ui/                         opšte komponente: Dropdown, StatTile

lib/data/                     ono što stranice uvoze (izvor je baza)
  players.ts                  getPlayers(), getPlayer(), getTeams(), getTeam()
  games.ts                    getPlayerGameLog(): utakmice igrača
  standings.ts                getStandings(), getNextRound(), getTeamGames()
  assemble.ts                 čiste funkcije: podaci sezone -> Player, Team, Coach (testovi)
  types.ts                    RosterEntry, SeasonData: oblik nezavisan od izvora

lib/euroleague/               sve što zna za EuroLeague API (koriste ga sync i health)
  config.ts                   URL, sezona, trajanje keša
  client.ts                   jedini fetch ka API-ju (keš + Zod validacija)
  schemas.ts                  Zod šeme: oblik odgovora API-ja
  types.ts                    naši tipovi: Player, Team, SeasonAverages
  mappers.ts                  imena kluba -> TeamSummary (kratka imena)
  format.ts                   formatiranje imena, brojeva, godina

lib/stats/                    proseci, forma, tabela, lideri, detaljne tabele igrača (čiste funkcije, testovi)

lib/db/                       baza (Neon Postgres, Drizzle)
  schema.ts                   tabele: clubs, people, roster_stints, games, player_game_stats, sync_runs
  client.ts                   getDb() preko Neon HTTP drajvera (pooled konekcija)
  queries.ts                  cela sezona kao jedan keširan zapis + sve utakmice jednog igrača (zapis po igraču), tag "db"
  health.ts                   provera: poslednji ok sync mlađi od 36 h
lib/sync/                     sync API -> baza
  rows.ts                     čisto mapiranje API -> red baze i pravila šta se sinhronizuje (testovi)
  run.ts                      runSync(): klubovi, rosteri, raspored, box score-ovi
app/api/cron/sync/route.ts    GET, zaštićen sa CRON_SECRET; poziva ga Vercel Schedules (i ručni workflow)
scripts/last-sync.mjs         npm run db:last-sync
drizzle/                      SQL migracije (generiše ih drizzle-kit, idu u git)
```

**Tok podataka:** EuroLeague API → sync (`lib/sync`, Zod validacija) → Neon baza → `lib/db/queries.ts` (jedan keširan zapis za celu sezonu; detaljne tabele igrača čitaju poseban mali zapis po igraču) → `lib/data` (pretvaranje u naš model) → serverska stranica → klijentske komponente samo za interakciju (filteri, accordion, animacije).

**Pravila:**

- Stranice su serverske komponente i one pribavljaju podatke. `"use client"` stavljamo samo gde treba stanje ili browser API.
- Komponente koriste tipove iz `types.ts`, nikad oblik API-ja direktno.
- Boje i fontovi dolaze iz tokena u `globals.css` (`bg-paper`, `text-accent-ink`, `font-display`...), a ne iz hex vrednosti.
- Narandžasta `accent` je za površine i linije; za narandžasti tekst na beloj koristi se `accent-ink` (AA kontrast).
- Fontovi: Barlow Condensed za naslove, imena i brojeve, Barlow za tekst (npm `@fontsource`, bez Google Fonts poziva).

## Izvor podataka

Zvanični EuroLeague API (`api-live.euroleague.net`). Sajt ga ne čita direktno: sync ga prepisuje u bazu, a stranice čitaju bazu (vidi „Baza i sync“).

| Endpoint                                                      | Sadržaj                                        |
| ------------------------------------------------------------- | ---------------------------------------------- |
| `GET /v2/competitions/E/seasons/{season}/clubs`               | klubovi                                        |
| `GET /v2/competitions/E/seasons/{season}/clubs/{code}/people` | roster kluba (`J` = igrač, `E` = trener)       |
| `GET /v2/competitions/E/seasons/{season}/games`               | raspored i rezultati                           |
| `GET /v3/competitions/E/seasons/{season}/games/{code}/stats`  | box score utakmice (iz njega računamo proseke) |

## Baza i sync

Stranice čitaju bazu. Cela sezona (klubovi, rosteri, raspored, zbirovi po igraču i
klubu izračunati u SQL-u, sastavi timova na poslednjoj utakmici) se čita u jedan
zapis keša (`lib/db/queries.ts`, tag `"db"`), pa ~430 stranica ne šalje svaka svoje
upite. Sirove box linije nisu u tom zapisu (Next ne kešira zapis veći od 2 MB);
forma, game log i tabele statistike čitaju mali zapis po igraču
(`getPlayerGamesFromDb`). Zapis se osvežava na sat, i odmah posle svakog uspešnog sync-a
(`revalidateTag`): sledeći posetilac još dobije staru stranicu, a nova se pravi u pozadini.

- **Šta se čuva:** klubovi, osobe (igrači i treneri), ugovori klub–osoba po
  sezoni (`roster_stints`, odatle istorija transfera), raspored i kompletan box
  score po igraču po utakmici (2FG/3FG/FT, OREB/DREB, AST, STL, TO, BLK za i
  protiv, faulovi napravljeni i dobijeni, +/-, PIR, sekunde). Čuvamo brojeve, a
  procente i proseke računamo (proseci samo iz utakmica sa `seconds > 0`).
- **Kad:** Vercel Schedules (`vercel.json`, beta): uveče svakog sata 18:05–23:05
  UTC i jednom u 04:00 UTC, `GET` sa `Authorization: Bearer $CRON_SECRET`. Na Hobby
  planu svako pokretanje kreće u prozoru od 15 min posle zadatog vremena. Ručno:
  dugme "Run workflow" u `.github/workflows/sync.yml` (secret `CRON_SECRET`).
- **Health:** `/api/health` vraća 503 i kad poslednji `ok` sync nije mlađi od 36 h.
  Iz terminala: `npm run db:last-sync`.
- **Šta radi:** upsert klubova, rostera i rasporeda, pa box score za odigrane
  utakmice koje još nisu u bazi ili su iz poslednja 3 dana. Utakmica koja nije
  odigrana se nikad ne upisuje. Svako pokretanje je zapisano u `sync_runs`.
  Pokretanje dva puta zaredom ne pravi duplikate.
- **Ručno pokretanje (lokalno):** `npm run dev`, pa
  `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/sync`.

## Rad sa Claude Code

`CLAUDE.md`, `.claude/rules/` i `docs/HISTORY.md` opisuju projekat, pravila i odluke, pa svaka nova sesija u terminalu odmah zna kontekst. `.claude/settings.json` određuje šta Claude sme da pokreće bez pitanja (provere), šta uvek pita (`git push`, instalacija paketa) i šta je zabranjeno (čitanje `.env.local`, `push --force`).

## Plan

- [x] Živi podaci iz zvaničnog API-ja
- [x] Prave rute: hub, igrači, profil, timovi
- [x] Forma: PIR po kolima, prozor 3/5/10, poređenje sa sezonom
- [x] Tabela lige, rezultati i raspored po klubu
- [x] Baza + noćna sinhronizacija (istorija, transferi)
- [x] Sajt čita iz baze; češći sync uveče (Vercel Schedules)
- [ ] Fantasy: optimalan tim za zadati budžet

## Forma

Prosek PIR-a u poslednjih N odigranih utakmica (podrazumevano 5) poredi se sa prosekom sezone. Igrač je **In form** ili **Cold** kad je razlika najmanje 15% proseka, a ne manje od 1.5 PIR. Utakmice na kojima nije ulazio u igru se ne računaju.

## Odakle dolaze brojke

- **Roster i treneri** se uzimaju klub po klub. Endpoint za celu sezonu vraća samo jednu stranicu rezultata i preskače igrače.
- **Proseci i forma** se računaju iz box score-a svake odigrane utakmice: zbirove sabira baza, a proseke i procente `lib/stats/aggregate.ts`. Endpoint sa gotovim prosecima izostavlja neke igrače koji su igrali.
- **„Missed last game“**: stalni član sastava svog sadašnjeg kluba (bio u sastavu na bar pola utakmica tog kluba od početka ugovora) koji nije bio u sastavu od 12 igrača na poslednjoj utakmici. Bivši klub se ne gleda: posle transfera igrača nema u sastavu starog kluba, ali to nije propuštena utakmica. Igrači sa kraja klupe se ne označavaju. API ne kaže razlog (povreda, bolest, odluka trenera), pa ne pišemo „povređen“.
- **Boje klubova** API ne vraća; ručno su upisane u `lib/euroleague/clubColors.ts`.

## Kako se stranice prave

Sve stranice, uključujući profil svakog igrača i stranice klubova, prave se **unapred pri build-u** (`generateStaticParams`) i osvežavaju u pozadini na sat vremena (ISR). Posetilac uvek dobija gotovu stranicu; ako osvežavanje ne uspe (npr. baza ne odgovara), ostaje prethodna verzija umesto greške. Zato stranice ne čitaju `searchParams` na serveru: tabovi kluba su posebne putanje, a `?from=` za dugme "Back to…" čita se u browseru (`ContextBackLink`).
