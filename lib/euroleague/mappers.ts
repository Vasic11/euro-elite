import type { Club } from "./schemas";
import type { TeamSummary } from "./types";

/**
 * Kratka imena klubova za kartice i uske prikaze. API-jevo "editorialName" je
 * ponekad previše skraćeno ("Crvena", "Real", "Barca"), pa ga za poznate klubove
 * zamenjujemo. Za klub koji nije na listi koristi se ime iz API-ja.
 */
const SHORT_NAMES: Record<string, string> = {
  ASV: "ASVEL",
  BAR: "Barcelona",
  BAS: "Baskonia",
  BES: "Besiktas",
  DUB: "Dubai",
  HTA: "Hapoel Tel Aviv",
  IST: "Anadolu Efes",
  MAD: "Real Madrid",
  MIL: "Olimpia Milano",
  MUN: "Bayern Munich",
  OLY: "Olympiacos",
  PAM: "Valencia",
  PAN: "Panathinaikos",
  PAR: "Partizan",
  PRS: "Paris",
  RED: "Crvena Zvezda",
  TEL: "Maccabi Tel Aviv",
  ULK: "Fenerbahce",
  VIR: "Virtus Bologna",
  ZAL: "Zalgiris",
};

/** Klub iz API-ja -> naš TeamSummary. Koristi se svuda gde se prikazuje tim. */
export function toTeamSummary(club: Club): TeamSummary {
  return {
    code: club.code,
    name: club.name,
    shortName:
      SHORT_NAMES[club.code] ?? club.editorialName ?? club.abbreviatedName ?? club.name,
    crestUrl: club.images?.crest ?? null,
  };
}
