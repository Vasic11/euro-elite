# EuroElite

Scouting platforma za EuroLeague: živa statistika igrača i timova, profil igrača sa radar dijagramom, a uskoro i forma kroz kola i fantasy predlozi.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zod · Framer Motion · Vitest

## Pokretanje

```bash
npm install
cp .env.example .env.local   # opciono: izbor sezone
npm run dev
```

| Skripta             | Šta radi              |
| ------------------- | --------------------- |
| `npm run dev`       | razvojni server       |
| `npm run build`     | produkcijski build    |
| `npm run lint`      | ESLint                |
| `npm run typecheck` | TypeScript provera    |
| `npm run format`    | Prettier formatiranje |
| `npm test`          | Vitest testovi        |

## Struktura

```
app/                          rute (svaki folder = URL)
  page.tsx                    /                 Scouting Hub
  players/page.tsx            /players          svi igrači + filteri
  players/[code]/page.tsx     /players/:code    profil igrača
  teams/page.tsx              /teams            svi klubovi
  teams/[code]/page.tsx       /teams/zal        klub: trener, učinak, igrači po pozicijama
  loading.tsx, error.tsx, not-found.tsx

components/
  layout/Navbar.tsx           navigacija (aktivni tab prema URL-u)
  home/                       FeaturedPlayer, SeasonLeaders, ClubStrip
  players/                    PlayerCard, PlayerPanel (foto-ploča),, PlayerGrid, PlayerExplorer, RadarChart, PlayerImage
  players/form/               forma: PlayerForm (server), FormSection, PirChart
  teams/TeamAccordion.tsx
  ui/                         opšte komponente: Dropdown, StatTile

lib/euroleague/               sve što zna za EuroLeague API
  config.ts                   URL, sezona, trajanje keša
  client.ts                   jedini fetch ka API-ju (keš + Zod validacija)
  schemas.ts                  Zod šeme: oblik odgovora API-ja
  types.ts                    naši tipovi: Player, Team, SeasonAverages
  players.ts                  getPlayers(), getPlayer(), getTeams()
  games.ts                    getPlayerGameLog(): utakmice igrača
  mappers.ts                  klub iz API-ja -> TeamSummary

lib/stats/form.ts             forma (čiste funkcije, pokrivene testovima)
  format.ts                   formatiranje imena, brojeva, godina
```

**Tok podataka:** EuroLeague API → `client.ts` (validacija) → `players.ts` (pretvaranje u naš model) → serverska stranica → klijentske komponente samo za interakciju (filteri, accordion, animacije).

**Pravila:**

- Stranice su serverske komponente i one pribavljaju podatke. `"use client"` stavljamo samo gde treba stanje ili browser API.
- Komponente koriste tipove iz `types.ts`, nikad oblik API-ja direktno.
- Boje i fontovi dolaze iz tokena u `globals.css` (`bg-paper`, `text-accent-ink`, `font-display`...), a ne iz hex vrednosti.
- Narandžasta `accent` je za površine i linije; za narandžasti tekst na beloj koristi se `accent-ink` (AA kontrast).
- Fontovi: Barlow Condensed za naslove, imena i brojeve, Barlow za tekst (npm `@fontsource`, bez Google Fonts poziva).

## Izvor podataka

Zvanični EuroLeague API (`api-live.euroleague.net`). Odgovori se keširaju 1h, pa se novo kolo ili transfer na sajtu pojavi najkasnije za sat vremena.

| Endpoint                                                | Sadržaj                      |
| ------------------------------------------------------- | ---------------------------- |
| `GET /v2/competitions/E/seasons/{season}/people`        | roster (`type: "J"` = igrač) |
| `GET /v2/competitions/E/seasons/{season}/clubs`         | klubovi                      |
| `GET /v2/competitions/E/seasons/{season}/games`         | raspored i rezultati         |
| `GET /v3/competitions/E/statistics/players/traditional` | prosek igrača za sezonu      |

## Plan

- [x] Živi podaci iz zvaničnog API-ja
- [x] Prave rute: hub, igrači, profil, timovi
- [x] Forma: PIR po kolima, prozor 3/5/10, poređenje sa sezonom
- [ ] Baza + noćna sinhronizacija (istorija, transferi)
- [ ] Fantasy: optimalan tim za zadati budžet

## Forma

Prosek PIR-a u poslednjih N odigranih utakmica (podrazumevano 5) poredi se sa prosekom sezone. Igrač je **In form** ili **Cold** kad je razlika najmanje 15% proseka, a ne manje od 1.5 PIR. Utakmice na kojima nije ulazio u igru se ne računaju.

## Odakle dolaze brojke

- **Roster i treneri** se uzimaju klub po klub. Endpoint za celu sezonu vraća samo jednu stranicu rezultata i preskače igrače.
- **Proseci i forma** se računaju iz box score-a svake odigrane utakmice (`lib/stats/aggregate.ts`). Endpoint sa gotovim prosecima izostavlja neke igrače koji su igrali.
- **„Missed last game“**: stalni član sastava (bio u sastavu na bar pola utakmica tima) koji nije bio u sastavu od 12 igrača na poslednjoj utakmici. Igrači sa kraja klupe se ne označavaju. API ne kaže razlog (povreda, bolest, odluka trenera), pa ne pišemo „povređen“.
- **Boje klubova** API ne vraća; ručno su upisane u `lib/euroleague/clubColors.ts`.
