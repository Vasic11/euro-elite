# EuroElite

Scouting platforma za EuroLeague: živa statistika igrača i timova, profil igrača sa radar dijagramom, a uskoro i forma kroz kola i fantasy predlozi.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zod · Framer Motion

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
  teams/page.tsx              /teams            timovi
  loading.tsx, error.tsx, not-found.tsx

components/
  layout/Navbar.tsx           navigacija (aktivni tab prema URL-u)
  players/                    PlayerCard, PlayerGrid, PlayerExplorer, RadarChart, PlayerImage
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
- Boje dolaze iz tokena u `globals.css` (`bg-euro-card`, `text-euro-neon`...), a ne iz hex vrednosti.

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
