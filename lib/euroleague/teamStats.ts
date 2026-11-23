import type { Team } from "./types";

/** Prosečan PIR igrača tima koji su igrali; null ako niko nije igrao. */
export function averageTeamPir(team: Team): number | null {
  const played = team.players.filter((p) => p.averages);
  if (played.length === 0) return null;
  return played.reduce((sum, p) => sum + (p.averages?.pir ?? 0), 0) / played.length;
}
