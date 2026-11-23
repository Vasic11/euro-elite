import { notFound } from "next/navigation";

import { PlayerGrid } from "@/components/players/PlayerGrid";
import { getTeam } from "@/lib/euroleague/players";
import type { Player, Position } from "@/lib/euroleague/types";

const POSITION_GROUPS: { position: Position | null; title: string }[] = [
  { position: "Guard", title: "Guards" },
  { position: "Forward", title: "Forwards" },
  { position: "Center", title: "Centers" },
  { position: null, title: "Position not listed" },
];

/** /teams/[code]: roster podeljen po pozicijama, kao na zvaničnom rosteru. */
export default async function TeamRosterPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const team = await getTeam((await params).code);
  if (!team) notFound();

  const basePath = `/teams/${team.code.toLowerCase()}`;
  const byPosition = (position: Position | null): Player[] =>
    team.players
      .filter((p) => p.position === position)
      .toSorted((a, b) => Number(a.jerseyNumber ?? 999) - Number(b.jerseyNumber ?? 999));

  return (
    <div className="space-y-12">
      {POSITION_GROUPS.map(({ position, title }) => {
        const players = byPosition(position);
        if (players.length === 0) return null;
        return (
          <section key={title} className="space-y-5">
            <h2 className="flex items-baseline gap-3 font-display text-3xl font-extrabold uppercase">
              {title}
              <span className="text-xl font-semibold text-ink-faint">
                {players.length}
              </span>
            </h2>
            <PlayerGrid players={players} from={basePath} />
          </section>
        );
      })}
    </div>
  );
}
