import type { TeamSummary } from "@/lib/euroleague/types";

import type { ScheduledGame } from "./aggregate";

export type StandingRow = {
  team: TeamSummary;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Poslednjih 5 rezultata, od najstarijeg ka najnovijem. */
  lastFive: ("W" | "L")[];
};

/**
 * Tabela iz odigranih utakmica. Redosled: više pobeda, pa bolja koš-razlika, pa više postignutih poena.
 * Napomena: zvanična EuroLeague tabela kod istog broja pobeda prvo gleda međusobne
 * utakmice; to ovde (još) ne računamo, pa se redosled izjednačenih timova može razlikovati.
 */
export function computeStandings(games: ScheduledGame[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  const row = (team: TeamSummary) => {
    const existing = rows.get(team.code);
    if (existing) return existing;
    const created: StandingRow = {
      team,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      lastFive: [],
    };
    rows.set(team.code, created);
    return created;
  };

  // Svi timovi iz rasporeda ulaze u tabelu, i oni koji još nisu igrali.
  for (const g of games) {
    row(g.home);
    row(g.away);
  }

  const played = games
    .filter((g) => g.played)
    .toSorted((a, b) => a.date.localeCompare(b.date));
  for (const g of played) {
    const home = row(g.home);
    const away = row(g.away);
    const homeWon = g.homeScore > g.awayScore;
    home.played++;
    away.played++;
    home.pointsFor += g.homeScore;
    home.pointsAgainst += g.awayScore;
    away.pointsFor += g.awayScore;
    away.pointsAgainst += g.homeScore;
    if (homeWon) {
      home.wins++;
      away.losses++;
    } else {
      away.wins++;
      home.losses++;
    }
    home.lastFive = [...home.lastFive, homeWon ? ("W" as const) : ("L" as const)].slice(
      -5,
    );
    away.lastFive = [...away.lastFive, homeWon ? ("L" as const) : ("W" as const)].slice(
      -5,
    );
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst) ||
      b.pointsFor - a.pointsFor ||
      a.team.shortName.localeCompare(b.team.shortName),
  );
}

/** Utakmice jednog tima: odigrane (najnovije prve) i naredne (najbliže prve). */
export function teamGames(teamCode: string, games: ScheduledGame[]) {
  const mine = games.filter((g) => g.home.code === teamCode || g.away.code === teamCode);
  return {
    results: mine
      .filter((g) => g.played)
      .toSorted((a, b) => b.date.localeCompare(a.date)),
    upcoming: mine
      .filter((g) => !g.played)
      .toSorted((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Sve utakmice prvog kola koje još nije odigrano (ili se trenutno igra). */
export function nextRound(games: ScheduledGame[]): ScheduledGame[] {
  const upcoming = games.filter((g) => !g.played);
  if (upcoming.length === 0) return [];
  const round = Math.min(...upcoming.map((g) => g.round));
  return games
    .filter((g) => g.round === round)
    .toSorted((a, b) => a.date.localeCompare(b.date));
}
