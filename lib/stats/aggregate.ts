/**
 * Računanje statistike iz box score-ova. Čiste funkcije: ne znaju ništa o API-ju
 * ni o React-u, pa su lake za testiranje i kasnije za noćnu sinhronizaciju u bazu.
 */
import type { GameLogEntry, SeasonAverages, TeamSummary } from "@/lib/euroleague/types";

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

/** Prosek po utakmici. Računaju se samo utakmice na kojima je igrač ušao u igru. */
export function averagesFromLines(lines: BoxLine[]): SeasonAverages | null {
  const played = lines.filter((l) => l.seconds > 0);
  if (played.length === 0) return null;

  const sum = (pick: (l: BoxLine) => number) =>
    played.reduce((total, l) => total + pick(l), 0);
  const avg = (pick: (l: BoxLine) => number) => sum(pick) / played.length;

  return {
    games: played.length,
    minutes: avg((l) => l.seconds) / 60,
    points: avg((l) => l.points),
    rebounds: avg((l) => l.rebounds),
    assists: avg((l) => l.assists),
    steals: avg((l) => l.steals),
    blocks: avg((l) => l.blocks),
    turnovers: avg((l) => l.turnovers),
    pir: avg((l) => l.pir),
    // Procenti iz ukupnih pogodaka, ne prosek procenata (inače 1/1 i 0/10 daju 50%).
    fieldGoalPct: percent(
      sum((l) => l.twoMade + l.threeMade),
      sum((l) => l.twoAttempted + l.threeAttempted),
    ),
    threePointPct: percent(
      sum((l) => l.threeMade),
      sum((l) => l.threeAttempted),
    ),
    freeThrowPct: percent(
      sum((l) => l.ftMade),
      sum((l) => l.ftAttempted),
    ),
  };
}

/** Svi redovi box score-a grupisani po igraču. */
export function linesByPlayer(boxes: GameBox[]): Map<string, BoxLine[]> {
  const byPlayer = new Map<string, BoxLine[]>();
  for (const box of boxes) {
    for (const line of box.lines) {
      const list = byPlayer.get(line.playerCode) ?? [];
      list.push(line);
      byPlayer.set(line.playerCode, list);
    }
  }
  return byPlayer;
}

/** Utakmice jednog igrača iz ugla njegovog tima, od prvog ka poslednjem kolu. */
export function gameLogFor(
  playerCode: string,
  games: ScheduledGame[],
  boxes: GameBox[],
): GameLogEntry[] {
  const gamesByCode = new Map(games.map((g) => [g.gameCode, g]));
  const log: GameLogEntry[] = [];

  for (const box of boxes) {
    const line = box.lines.find((l) => l.playerCode === playerCode);
    const game = gamesByCode.get(box.gameCode);
    if (!line || !game || line.seconds === 0) continue;

    const isHome = game.home.code === line.teamCode;
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;
    log.push({
      gameCode: game.gameCode,
      round: game.round,
      date: game.date,
      opponent: isHome ? game.away : game.home,
      isHome,
      teamScore,
      opponentScore,
      won: teamScore > opponentScore,
      started: line.started,
      minutes: line.seconds / 60,
      points: line.points,
      rebounds: line.rebounds,
      assists: line.assists,
      steals: line.steals,
      blocks: line.blocks,
      turnovers: line.turnovers,
      pir: line.pir,
    });
  }
  return log.sort((a, b) => a.round - b.round);
}

/**
 * Sastav (12 igrača) svakog tima na njegovoj poslednjoj odigranoj utakmici.
 * Igrač iz rostera koga nema u tom sastavu je propustio poslednju utakmicu
 * (povreda, bolest ili odluka trenera; API ne kaže razlog).
 */
export function lastGameSquads(
  games: ScheduledGame[],
  boxes: GameBox[],
): Map<string, Set<string>> {
  const boxByCode = new Map(boxes.map((b) => [b.gameCode, b]));
  const latestByTeam = new Map<string, ScheduledGame>();

  for (const game of games) {
    if (!game.played || !boxByCode.has(game.gameCode)) continue;
    for (const team of [game.home.code, game.away.code]) {
      const current = latestByTeam.get(team);
      if (!current || game.date > current.date) latestByTeam.set(team, game);
    }
  }

  const squads = new Map<string, Set<string>>();
  for (const [team, game] of latestByTeam) {
    const lines = boxByCode.get(game.gameCode)!.lines.filter((l) => l.teamCode === team);
    squads.set(team, new Set(lines.map((l) => l.playerCode)));
  }
  return squads;
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
  games: ScheduledGame[],
  boxes: GameBox[],
): Set<string> {
  const squads = lastGameSquads(games, boxes);

  // Koliko utakmica (sa box score-om) je svaki tim odigrao i koliko puta je igrač bio u sastavu.
  const teamGames = new Map<string, number>();
  const appearances = new Map<string, { team: string; count: number }>();
  for (const box of boxes) {
    const teamsInGame = new Set(box.lines.map((l) => l.teamCode));
    for (const team of teamsInGame) teamGames.set(team, (teamGames.get(team) ?? 0) + 1);
    for (const line of box.lines) {
      const key = `${line.teamCode}:${line.playerCode}`;
      const current = appearances.get(key) ?? { team: line.teamCode, count: 0 };
      current.count++;
      appearances.set(key, current);
    }
  }

  const missed = new Set<string>();
  for (const [key, { team, count }] of appearances) {
    const playerCode = key.slice(team.length + 1);
    const squad = squads.get(team);
    const regular = count >= Math.ceil((teamGames.get(team) ?? 0) / 2);
    if (squad && regular && !squad.has(playerCode)) missed.add(playerCode);
  }
  return missed;
}
