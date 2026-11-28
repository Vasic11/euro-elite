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
  /** ISO datum poslednje utakmice u sastavu za ovaj klub (i sa 0 sekundi), za "Out since". */
  lastSquadDate: string | null;
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

/**
 * Box linije sabrane po (igrač, klub); zbirovi samo iz utakmica sa seconds > 0.
 * `date` (ISO datum utakmice) je opcion: bez njega `lastSquadDate` ostaje null.
 */
export function totalsFromLines(
  lines: (BoxLine & { date?: string })[],
): PlayerClubTotals[] {
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
        lastSquadDate: null,
        ...zeroSums(),
      };
      byKey.set(key, t);
    }
    t.squadGames++;
    if (l.date && (t.lastSquadDate === null || l.date > t.lastSquadDate)) {
      t.lastSquadDate = l.date;
    }
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

/** Tim: kada je igrao utakmice sa box score-om i ko je bio u sastavu na poslednjoj. */
export type TeamSquad = {
  teamCode: string;
  /** ISO datumi utakmica sa box score-om, od najstarije; prag za stalnog člana se računa od datuma ugovora. */
  gameDates: string[];
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
  const dateByCode = new Map(games.map((g) => [g.gameCode, g.date]));
  const gameCodes = new Map<string, Set<number>>();
  for (const { gameCode, teamCode } of teamGames) {
    gameCodes.set(teamCode, (gameCodes.get(teamCode) ?? new Set()).add(gameCode));
  }
  const latest = latestGameByTeam(games, new Set(teamGames.map((t) => t.gameCode)));

  return [...new Set([...gameCodes.keys(), ...latest.keys()])].map((teamCode) => {
    const game = latest.get(teamCode);
    return {
      teamCode,
      gameDates: [...(gameCodes.get(teamCode) ?? [])]
        .map((code) => dateByCode.get(code))
        .filter((date) => date !== undefined)
        .sort(),
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

/** Sadašnji klub igrača (njegov poslednji aktivni ugovor) i od kada je tamo (epoch ms). */
export type CurrentClub = { teamCode: string; since: number | null };

/**
 * Igrači koji su "propustili poslednju utakmicu" na način koji nešto znači:
 * nisu bili u sastavu (12 igrača) na poslednjoj utakmici svog SADAŠNJEG kluba,
 * a bili su u sastavu na bar polovini utakmica tog kluba od početka ugovora.
 * - Bivši klub se ne gleda: posle transfera igrača nema u sastavu starog kluba,
 *   ali to nije propuštena utakmica.
 * - Bez praga bi svaki igrač sa kraja klupe (rosteri imaju 17-19 igrača,
 *   sastav 12) bio označen. Prag se računa od datuma ugovora, inače igrač koji
 *   je došao usred sezone nikad ne bi bio "stalni".
 * - Ako klub od dolaska igrača još nije igrao, nema šta da propusti.
 */
export function playersWhoMissedLastGame(
  totals: PlayerClubTotals[],
  squads: TeamSquad[],
  current: ReadonlyMap<string, CurrentClub>,
): Set<string> {
  const byTeam = new Map(squads.map((s) => [s.teamCode, s]));
  const missed = new Set<string>();
  for (const t of totals) {
    const club = current.get(t.playerCode);
    if (club?.teamCode !== t.teamCode) continue;
    const squad = byTeam.get(t.teamCode);
    if (!squad?.lastSquad) continue;

    const since = club.since;
    const teamGames =
      since === null
        ? squad.gameDates.length
        : squad.gameDates.filter((date) => Date.parse(date) >= since).length;
    if (teamGames === 0) continue;

    const regular = t.squadGames >= Math.ceil(teamGames / 2);
    if (regular && !squad.lastSquad.includes(t.playerCode)) missed.add(t.playerCode);
  }
  return missed;
}

/** Koliko uzastopnih utakmica sadašnjeg kluba igrač mora da propusti za "Out since". */
export const OUT_MIN_GAMES = 3;

/**
 * Igrači koji su duže van sastava, sa datumom prve propuštene utakmice (ISO).
 * Pravilo, samo za SADAŠNJI klub (u sastavu = u box score-u, i sa 0 sekundi):
 * 1. bar jednom je bio u sastavu tog kluba (inače ne znamo ništa o njemu);
 * 2. klub je posle toga odigrao ≥ OUT_MIN_GAMES utakmica i ni na jednoj ga nema
 *    (sve posle poslednjeg nastupa, pa su po definiciji uzastopne);
 * 3. do izostanka je bio stalni: u sastavu na ≥ pola utakmica kluba od početka
 *    ugovora do poslednjeg nastupa (isti prag kao `playersWhoMissedLastGame`).
 */
export function playersOutSince(
  totals: PlayerClubTotals[],
  squads: TeamSquad[],
  current: ReadonlyMap<string, CurrentClub>,
): Map<string, string> {
  const byTeam = new Map(squads.map((s) => [s.teamCode, s]));
  const out = new Map<string, string>();
  for (const t of totals) {
    const club = current.get(t.playerCode);
    if (club?.teamCode !== t.teamCode || t.lastSquadDate === null) continue;
    const squad = byTeam.get(t.teamCode);
    if (!squad) continue;

    const since = club.since ?? -Infinity;
    const last = Date.parse(t.lastSquadDate);
    const sinceContract = squad.gameDates.filter((date) => Date.parse(date) >= since);
    const missedGames = sinceContract.filter((date) => Date.parse(date) > last);
    if (missedGames.length < OUT_MIN_GAMES) continue;

    const beforeAbsence = sinceContract.length - missedGames.length;
    if (t.squadGames >= Math.ceil(beforeAbsence / 2))
      out.set(t.playerCode, missedGames[0]);
  }
  return out;
}
