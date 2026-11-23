/**
 * Domenski tipovi: ono što ostatak aplikacije koristi.
 *
 * Namerno su odvojeni od Zod šema (oblik API-ja). UI ne zna kako izgleda odgovor
 * EuroLeague API-ja, pa ako se API promeni, menjamo samo lib/euroleague.
 * Ovaj fajl nema "server-only", pa ga mogu uvoziti i klijentske komponente.
 */

export type Position = "Guard" | "Forward" | "Center";

/** Prosek po utakmici u sezoni. Procenti su 0-100. */
export type SeasonAverages = {
  games: number;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  pir: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
};

export type TeamSummary = {
  code: string;
  name: string;
  shortName: string;
  crestUrl: string | null;
};

export type Player = {
  code: string;
  name: string;
  jerseyNumber: string | null;
  position: Position | null;
  country: string | null;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string | null;
  imageUrl: string | null;
  team: TeamSummary;
  /** null ako igrač još nije igrao ove sezone. */
  averages: SeasonAverages | null;
  /**
   * true ako je igrač stalni član sastava (bio na bar pola utakmica), a nije bio u
   * sastavu na poslednjoj utakmici svog tima. API ne kaže razlog: povreda, bolest
   * ili odluka trenera.
   */
  missedLastGame: boolean;
};

export type Coach = {
  code: string;
  name: string;
  imageUrl: string | null;
};

export type Team = TeamSummary & {
  players: Player[];
  coach: Coach | null;
  wins: number;
  losses: number;
};

/** Jedna odigrana utakmica igrača, iz ugla njegovog tima. */
export type GameLogEntry = {
  gameCode: number;
  round: number;
  date: string;
  opponent: TeamSummary;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  won: boolean;
  started: boolean;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  pir: number;
};
