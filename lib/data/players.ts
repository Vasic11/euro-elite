import "server-only";

import { cache } from "react";

import type { Player, Team } from "@/lib/euroleague/types";
import type { CareerStint } from "@/lib/stats/career";

import { buildCareer, buildCoaches, buildPlayers, buildTeams } from "./assemble";
import { getSeason } from "./season";

/** All active players, best PIR first. */
export const getPlayers = cache(async (): Promise<Player[]> => {
  return buildPlayers(await getSeason());
});

export async function getPlayer(code: string): Promise<Player | null> {
  const players = await getPlayers();
  return players.find((p) => p.code === code) ?? null;
}

/** This season's clubs of one player, first to current; empty if he had only one. */
export async function getPlayerCareer(code: string): Promise<CareerStint[]> {
  return buildCareer((await getSeason()).roster, code);
}

/** All clubs with players, head coach and record, sorted by name. */
export const getTeams = cache(async (): Promise<Team[]> => {
  const [season, players] = await Promise.all([getSeason(), getPlayers()]);
  return buildTeams(season.clubs, players, buildCoaches(season.roster), season.schedule);
});

export async function getTeam(code: string): Promise<Team | null> {
  const teams = await getTeams();
  return teams.find((t) => t.code.toLowerCase() === code.toLowerCase()) ?? null;
}
