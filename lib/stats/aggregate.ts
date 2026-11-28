/**
 * Računanje statistike iz box score-ova. Čiste funkcije: ne znaju ništa o API-ju
 * ni o React-u, pa su lake za testiranje i kasnije za noćnu sinhronizaciju u bazu.
 */
import type { SeasonAverages, TeamSummary } from "@/lib/euroleague/types";

/** Utakmica iz rasporeda. */
export type ScheduledGame = {
  gameCode: number;
  round: number;
  date: string;
  played: boolean;
  home: TeamSummary;
  away: TeamSummary;
  homeScore: number;
  awayScore: number;
};

/** Jedan red box score-a: igrač koji je bio u sastavu (12 igrača po timu). */
export type BoxLine = {
  playerCode: string;
  teamCode: string;
  started: boolean;
  seconds: number;
  points: number;
  twoMade: number;
  twoAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  pir: number;
};

export type GameBox = { gameCode: number; lines: BoxLine[] };

const percent = (made: number, attempted: number) =>
  attempted > 0 ? (made / attempted) * 100 : 0;

/**
 * Zbirovi jednog igrača za jedan klub (posle transfera igrač ima dva reda).
 * Ovo je ono što sezonski keš čuva umesto sirovih box linija: raste sa brojem
 * igrača, ne sa brojem utakmica. Baza računa iste zbirove u SQL-u
 * (`loadTotals` u lib/db/queries.ts); `totalsFromLines` je ista stvar u JS-u.
 */
export type PlayerClubTotals = {
  playerCode: string;
  teamCode: string;
  /** Utakmice u sastavu (12 igrača), i one sa 0 sekundi. */
  squadGames: number;
  /** Utakmice na kojima je ušao u igru (seconds > 0); zbirovi ispod su samo za njih. */
  games: number;
  seconds: number;
  points: number;
  twoMade: number;
  twoAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  pir: number;
};

/** Polja koja se sabiraju (sve osim šifara i broja utakmica). */
const SUMMED = [
  "seconds",
  "points",
  "twoMade",
  "twoAttempted",
  "threeMade",
  "threeAttempted",
  "ftMade",
  "ftAttempted",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "turnovers",
  "pir",
] as const satisfies readonly (keyof BoxLine & keyof PlayerClubTotals)[];

type Sums = Record<(typeof SUMMED)[number], number>;

const zeroSums = (): Sums => Object.fromEntries(SUMMED.map((k) => [k, 0])) as Sums;

/** Box linije sabrane po (igrač, klub); zbirovi samo iz utakmica sa seconds > 0. */
export function totalsFromLines(lines: BoxLine[]): PlayerClubTotals[] {
  const byKey = new Map<string, PlayerClubTotals>();
  for (const l of lines) {
    const key = `${l.teamCode}:${l.playerCode}`;
    let t = byKey.get(key);
    if (!t) {
      t = {
        playerCode: l.playerCode,
        teamCode: l.teamCode,
        squadGames: 0,
        games: 0,
        ...zeroSums(),
      };
      byKey.set(key, t);
    }
    t.squadGames++;
    if (l.seconds <= 0) continue;
    t.games++;
    for (const k of SUMMED) t[k] += l[k];
  }
  return [...byKey.values()];
}

/**
 * Prosek po utakmici iz zbirova jednog igrača (svi njegovi klubovi zajedno).
 * Računaju se samo utakmice na kojima je igrač ušao u igru.
 */
export function averagesFromTotals(totals: PlayerClubTotals[]): SeasonAverages | null {
  const games = totals.reduce((n, t) => n + t.games, 0);
  if (games === 0) return null;

  const sums = zeroSums();
  for (const t of totals) for (const k of SUMMED) sums[k] += t[k];
  const avg = (k: keyof Sums) => sums[k] / games;

  return {
    games,
    minutes: avg("seconds") / 60,
    points: avg("points"),
    rebounds: avg("rebounds"),
    assists: avg("assists"),
    steals: avg("steals"),
    blocks: avg("blocks"),
    turnovers: avg("turnovers"),
    pir: avg("pir"),
    // Procenti iz ukupnih pogodaka, ne prosek procenata (inače 1/1 i 0/10 daju 50%).
    fieldGoalPct: percent(
      sums.twoMade + sums.threeMade,
      sums.twoAttempted + sums.threeAttempted,
    ),
    threePointPct: percent(sums.threeMade, sums.threeAttempted),
    freeThrowPct: percent(sums.ftMade, sums.ftAttempted),
  };
}

/** Prosek po utakmici iz box linija jednog igrača (isti put kao iz baze). */
export function averagesFromLines(lines: BoxLine[]): SeasonAverages | null {
  return averagesFromTotals(totalsFromLines(lines));
}

/** Tim: koliko utakmica sa box score-om ima i ko je bio u sastavu na poslednjoj. */
export type TeamSquad = {
  teamCode: string;
  games: number;
  /** Null kada tim još nema odigranu utakmicu sa box score-om. */
  lastSquad: string[] | null;
};

/**
 * Poslednja odigrana utakmica svakog tima, od utakmica koje imaju box score.
 * "Poslednja" po datumu, nikad po indeksu (raspored stiže od najnovije).
 */
export function latestGameByTeam(
  games: ScheduledGame[],
  boxedGameCodes: ReadonlySet<number>,
): Map<string, ScheduledGame> {
  const latestByTeam = new Map<string, ScheduledGame>();
  for (const game of games) {
    if (!game.played || !boxedGameCodes.has(game.gameCode)) continue;
    for (const team of [game.home.code, game.away.code]) {
      const current = latestByTeam.get(team);
      if (!current || game.date > current.date) latestByTeam.set(team, game);
    }
  }
  return latestByTeam;
}

/** Jedan igrač u sastavu jednog tima na jednoj utakmici. */
export type SquadEntry = { gameCode: number; teamCode: string; playerCode: string };

/**
 * `TeamSquad` za svaki tim. Baza ne šalje sve linije: `teamGames` su parovi
 * (utakmica, tim) sa box score-om, a `lastGameLines` sastavi bar sa poslednjih
 * utakmica (višak se ignoriše). Isto pravilo za bazu i za `teamSquads`.
 */
export function squadsFrom(
  games: ScheduledGame[],
  teamGames: Omit<SquadEntry, "playerCode">[],
  lastGameLines: SquadEntry[],
): TeamSquad[] {
  const counts = new Map<string, Set<number>>();
  for (const { gameCode, teamCode } of teamGames) {
    counts.set(teamCode, (counts.get(teamCode) ?? new Set()).add(gameCode));
  }
  const latest = latestGameByTeam(games, new Set(teamGames.map((t) => t.gameCode)));

  return [...new Set([...counts.keys(), ...latest.keys()])].map((teamCode) => {
    const game = latest.get(teamCode);
    return {
      teamCode,
      games: counts.get(teamCode)?.size ?? 0,
      lastSquad: game
        ? lastGameLines
            .filter((l) => l.gameCode === game.gameCode && l.teamCode === teamCode)
            .map((l) => l.playerCode)
        : null,
    };
  });
}

/** `TeamSquad` za svaki tim iz celih box score-ova. */
export function teamSquads(games: ScheduledGame[], boxes: GameBox[]): TeamSquad[] {
  const lines = boxes.flatMap((b) =>
    b.lines.map((l) => ({
      gameCode: b.gameCode,
      teamCode: l.teamCode,
      playerCode: l.playerCode,
    })),
  );
  return squadsFrom(games, lines, lines);
}

/** Pobede i porazi tima iz odigranih utakmica. */
export function teamRecord(
  teamCode: string,
  games: ScheduledGame[],
): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  for (const g of games) {
    if (!g.played) continue;
    const isHome = g.home.code === teamCode;
    if (!isHome && g.away.code !== teamCode) continue;
    const won = isHome ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
    if (won) wins++;
    else losses++;
  }
  return { wins, losses };
}

/**
 * Igrači koji su "propustili poslednju utakmicu" na način koji nešto znači:
 * nisu bili u sastavu (12 igrača) na poslednjoj utakmici tima, a bili su u sastavu
 * na bar polovini utakmica tima. Bez ovog drugog uslova bi svaki igrač sa kraja
 * klupe (rosteri imaju 17-19 igrača, sastav 12) bio označen.
 */
export function playersWhoMissedLastGame(
  totals: PlayerClubTotals[],
  squads: TeamSquad[],
): Set<string> {
  const byTeam = new Map(squads.map((s) => [s.teamCode, s]));
  const missed = new Set<string>();
  for (const t of totals) {
    const squad = byTeam.get(t.teamCode);
    if (!squad?.lastSquad) continue;
    const regular = t.squadGames >= Math.ceil(squad.games / 2);
    if (regular && !squad.lastSquad.includes(t.playerCode)) missed.add(t.playerCode);
  }
  return missed;
}
