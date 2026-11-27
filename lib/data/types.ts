/**
 * Shapes the data layer works with, independent of where the data comes from
 * (database now, EuroLeague API before). Pages and components still only see
 * the domain types from lib/euroleague/types.ts.
 */
import type { BoxLine, GameBox, ScheduledGame } from "@/lib/stats/aggregate";
import type { DetailedBoxLine, PlayerGameLine } from "@/lib/stats/boxScore";
import type { Position, TeamSummary } from "@/lib/euroleague/types";

export type { BoxLine, DetailedBoxLine, GameBox, PlayerGameLine, ScheduledGame };

/** One contract between a person and a club, already mapped to display values. */
export type RosterEntry = {
  /** "J" player, "E" head coach, "A" assistant, as in the API. */
  role: string;
  active: boolean;
  /** Epoch ms, so the API's zoneless strings and DB timestamps compare the same way. */
  startDate: number | null;
  club: TeamSummary;
  personCode: string;
  /** Already formatted for display ("Nikola Kalinic"). */
  name: string;
  jerseyNumber: string | null;
  position: Position | null;
  country: string | null;
  heightCm: number | null;
  weightKg: number | null;
  /** "1999-09-17T00:00:00", the form the API uses. */
  birthDate: string | null;
  imageUrl: string | null;
};

/** Everything the site is built from. */
export type SeasonData = {
  clubs: TeamSummary[];
  roster: RosterEntry[];
  schedule: ScheduledGame[];
  boxes: GameBox[];
};
