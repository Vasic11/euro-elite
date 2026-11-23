import "server-only";

import { computeStandings, nextRound, teamGames } from "@/lib/stats/standings";

import { getSchedule } from "./season";

export async function getStandings() {
  return computeStandings(await getSchedule());
}

export async function getNextRound() {
  return nextRound(await getSchedule());
}

export async function getTeamGames(teamCode: string) {
  return teamGames(teamCode, await getSchedule());
}
