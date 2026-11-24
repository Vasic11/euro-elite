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

export const clubsResponseSchema = z.object({
  data: z.array(clubSchema),
});

export type Club = z.infer<typeof clubSchema>;
export type PersonEntry = z.infer<typeof personEntrySchema>;

/** /v2/.../clubs/{code}/people vraća niz (bez omotača "data"). */
export const clubPeopleResponseSchema = z.array(personEntrySchema);

const scheduleSideSchema = z.object({ club: clubSchema, score: z.number() });

/** Jedna utakmica iz /v2/.../games (raspored i rezultati). */
export const scheduleGameSchema = z.object({
  gameCode: z.number(),
  round: z.number(),
  played: z.boolean(),
  utcDate: z.string(),
  local: scheduleSideSchema,
  road: scheduleSideSchema,
});

export const scheduleResponseSchema = z.object({
  data: z.array(scheduleGameSchema),
});

/** Jedan igrač u box score-u (/v3/.../games/{code}/stats). PIR = valuation. */
const boxScoreStatsSchema = z.object({
  timePlayed: z.number(),
  valuation: z.number(),
  points: z.number(),
  fieldGoalsMade2: z.number(),
  fieldGoalsAttempted2: z.number(),
  fieldGoalsMade3: z.number(),
  fieldGoalsAttempted3: z.number(),
  freeThrowsMade: z.number(),
  freeThrowsAttempted: z.number(),
  totalRebounds: z.number(),
  assistances: z.number(),
  steals: z.number(),
  blocksFavour: z.number(),
  turnovers: z.number(),
  startFive: z.boolean().nullish(),
});

const boxScorePlayerSchema = z.object({
  player: z.object({ person: z.object({ code: z.string() }) }),
  stats: boxScoreStatsSchema,
});

export const boxScoreResponseSchema = z.object({
  local: z.object({ players: z.array(boxScorePlayerSchema) }),
  road: z.object({ players: z.array(boxScorePlayerSchema) }),
});

export type ScheduleGameDto = z.infer<typeof scheduleGameSchema>;
export type BoxScoreDto = z.infer<typeof boxScoreResponseSchema>;

/*
 * Šeme za noćni sync u bazu. Proširuju gornje šeme (`.extend`), a gornje ostaju
 * kakve jesu: ako API izbaci neko od novih polja, pada samo sync (i pokuša opet
 * sledeći put), a sajt koji danas čita API direktno nastavlja da radi.
 *
 * Polja su obavezna tamo gde ih je API vratio u svih 130 box score-ova i 982
 * stavke rostera sezone 2026-27 (provereno 24.11.2026); nullish gde baza i
 * dozvoljava prazno.
 */

/** Poeni po četvrtinama; `extraPeriods` je mapa { "1": 14, "2": 9 } za produžetke. */
const partialsSchema = z
  .object({
    partials1: z.number(),
    partials2: z.number(),
    partials3: z.number(),
    partials4: z.number(),
    extraPeriods: z.record(z.string(), z.number()).nullish(),
  })
  .nullish();

const syncScheduleSideSchema = scheduleSideSchema.extend({ partials: partialsSchema });

export const syncScheduleGameSchema = scheduleGameSchema.extend({
  phaseType: z.object({ code: z.string() }),
  local: syncScheduleSideSchema,
  road: syncScheduleSideSchema,
  venue: z.object({ name: z.string().nullish() }).nullish(),
  audience: z.number().nullish(),
});

export const syncScheduleResponseSchema = z.object({
  data: z.array(syncScheduleGameSchema),
});

export const syncPersonEntrySchema = personEntrySchema.extend({
  /** Kraj ugovora, ili datum odlaska ako je `active: false`. */
  endDate: z.string().nullish(),
});

export const syncClubPeopleResponseSchema = z.array(syncPersonEntrySchema);

const syncBoxScorePlayerSchema = z.object({
  player: z.object({
    // Osoba iz box score-a: sync je upisuje u `people` pre statistike, da spoljni
    // ključ ne pukne za igrača kog nema u rosteru.
    person: personEntrySchema.shape.person,
  }),
  stats: boxScoreStatsSchema.extend({
    dorsal: z.number().nullish(),
    offensiveRebounds: z.number(),
    defensiveRebounds: z.number(),
    blocksAgainst: z.number(),
    /** Pravopis iz API-ja ("Commited"). */
    foulsCommited: z.number(),
    foulsReceived: z.number(),
    plusMinus: z.number(),
  }),
});

const syncBoxScoreSideSchema = z.object({ players: z.array(syncBoxScorePlayerSchema) });

export const syncBoxScoreResponseSchema = z.object({
  local: syncBoxScoreSideSchema,
  road: syncBoxScoreSideSchema,
});

export type SyncScheduleGameDto = z.infer<typeof syncScheduleGameSchema>;
export type SyncPersonEntryDto = z.infer<typeof syncPersonEntrySchema>;
export type SyncBoxScoreDto = z.infer<typeof syncBoxScoreResponseSchema>;
