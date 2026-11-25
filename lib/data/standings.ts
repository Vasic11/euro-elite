import "server-only";

import { computeStandings, nextRound, teamGames } from "@/lib/stats/standings";

import { getSeason } from "./season";

export async function getStandings() {
  return computeStandings((await getSeason()).schedule);
}

export async function getNextRound() {
  return nextRound((await getSeason()).schedule);
}

export async function getTeamGames(teamCode: string) {
  return teamGames(teamCode, (await getSeason()).schedule);
}
