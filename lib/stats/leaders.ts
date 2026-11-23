import type { Player, SeasonAverages } from "@/lib/euroleague/types";

export type LeaderCategory = {
  key: keyof Pick<SeasonAverages, "pir" | "points" | "rebounds" | "assists">;
  label: string;
};

export const LEADER_CATEGORIES: LeaderCategory[] = [
  { key: "pir", label: "PIR" },
  { key: "points", label: "Points" },
  { key: "rebounds", label: "Rebounds" },
  { key: "assists", label: "Assists" },
];

/**
 * Lideri u kategoriji. Uzimamo u obzir samo igrače koji su odigrali bar polovinu
 * utakmica koliko je odigrao najaktivniji igrač; inače bi igrač sa jednom
 * dobrom utakmicom bio "lider" lige.
 */
export function leadersFor(
  players: Player[],
  key: LeaderCategory["key"],
  count = 3,
): Player[] {
  const maxGames = Math.max(0, ...players.map((p) => p.averages?.games ?? 0));
  const minGames = Math.ceil(maxGames / 2);

  return players
    .filter((p) => p.averages && p.averages.games >= minGames)
    .toSorted((a, b) => b.averages![key] - a.averages![key])
    .slice(0, count);
}
