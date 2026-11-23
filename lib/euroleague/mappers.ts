import type { Club } from "./schemas";
import type { TeamSummary } from "./types";

/** Klub iz API-ja -> naš TeamSummary. Koristi se svuda gde se prikazuje tim. */
export function toTeamSummary(club: Club): TeamSummary {
  return {
    code: club.code,
    name: club.name,
    shortName: club.editorialName ?? club.abbreviatedName ?? club.name,
    crestUrl: club.images?.crest ?? null,
  };
}
