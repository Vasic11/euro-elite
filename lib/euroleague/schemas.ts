import { z } from "zod";

/**
 * Zod šeme opisuju oblik odgovora EuroLeague API-ja.
 *
 * Zašto ne samo TypeScript tipovi? Tipovi postoje samo dok se kod kompajlira.
 * Odgovor sa spoljnog API-ja stiže tek u toku rada aplikacije i može da se promeni
 * bez najave. Zod proverava podatke u trenutku kad stignu, pa ako se nešto promeni,
 * dobijemo jasnu grešku na jednom mestu umesto `undefined` duboko u UI-ju.
 *
 * Šeme navode samo polja koja koristimo. Ostala polja Zod podrazumevano odbacuje.
 */

const imagesSchema = z.record(z.string(), z.string()).nullish();

export const clubSchema = z.object({
  code: z.string(),
  name: z.string(),
  abbreviatedName: z.string().nullish(),
  editorialName: z.string().nullish(),
  tvCode: z.string().nullish(),
  images: imagesSchema,
});

const countrySchema = z
  .object({
    code: z.string(),
    name: z.string(),
  })
  .nullish();

/** Jedan red iz /v2/.../people: osoba vezana za klub (igrač, trener, lekar...). */
export const personEntrySchema = z.object({
  /** "J" = igrač, "E" = trener, "A" = pomoćni trener, ostalo = osoblje */
  type: z.string(),
  active: z.boolean(),
  /** Datum kad je igrač došao u klub: ako ima više aktivnih zapisa, važi najnoviji. */
  startDate: z.string().nullish(),
  dorsal: z.string().nullish(),
  /** 1 = Guard, 2 = Forward, 3 = Center */
  position: z.number().nullish(),
  positionName: z.string().nullish(),
  lastTeam: z.string().nullish(),
  images: imagesSchema,
  person: z.object({
    code: z.string(),
    name: z.string(),
    jerseyName: z.string().nullish(),
    country: countrySchema,
    height: z.number().nullish(),
    weight: z.number().nullish(),
    birthDate: z.string().nullish(),
  }),
  club: clubSchema,
});

export const peopleResponseSchema = z.object({
  data: z.array(personEntrySchema),
  /** Koliko zapisa ukupno postoji. Ako je data kraći od ovoga, API je vratio samo jednu stranicu. */
  total: z.number(),
});

/** Jedan red iz /v3/.../statistics/players/traditional (prosek po utakmici). */
export const playerStatsSchema = z.object({
  player: z.object({
    code: z.string(),
    name: z.string(),
    imageUrl: z.string().nullish(),
    // Kod igrača koji su menjali klub u toku sezone, ovo polje sadrži oba kluba
    // ("BAS;PAR"). Zato tim uzimamo iz rostera, a ne odavde.
    team: z.object({
      code: z.string(),
      name: z.string(),
    }),
  }),
  gamesPlayed: z.number(),
  minutesPlayed: z.number(),
  pointsScored: z.number(),
  twoPointersMade: z.number(),
  twoPointersAttempted: z.number(),
  threePointersMade: z.number(),
  threePointersAttempted: z.number(),
  freeThrowsMade: z.number(),
  freeThrowsAttempted: z.number(),
  totalRebounds: z.number(),
  assists: z.number(),
  steals: z.number(),
  blocks: z.number(),
  turnovers: z.number(),
  pir: z.number(),
});

export const playerStatsResponseSchema = z.object({
  total: z.number(),
  players: z.array(playerStatsSchema),
});

export const clubsResponseSchema = z.object({
  data: z.array(clubSchema),
});

export type Club = z.infer<typeof clubSchema>;
export type PersonEntry = z.infer<typeof personEntrySchema>;
export type PlayerStats = z.infer<typeof playerStatsSchema>;

/** Jedna utakmica iz /v2/.../people/{code}/stats. PIR se u API-ju zove `valuation`. */
export const playerGameSchema = z.object({
  game: z.object({
    gameCode: z.number(),
    round: z.number(),
    utcDate: z.string(),
    local: z.object({ club: clubSchema, score: z.number() }),
    road: z.object({ club: clubSchema, score: z.number() }),
  }),
  stats: z.object({
    /** sekunde na terenu */
    timePlayed: z.number(),
    valuation: z.number(),
    points: z.number(),
    totalRebounds: z.number(),
    assistances: z.number(),
    steals: z.number(),
    blocksFavour: z.number(),
    turnovers: z.number(),
    startFive: z.boolean().nullish(),
  }),
  /** Klub za koji je igrač igrao TU utakmicu (bitno posle transfera). */
  playerClubCode: z.string(),
});

export const playerGamesResponseSchema = z.object({
  games: z.array(playerGameSchema),
});

export type PlayerGame = z.infer<typeof playerGameSchema>;
