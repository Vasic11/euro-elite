"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Segmented } from "@/components/ui/Segmented";
import type { TeamSummary } from "@/lib/euroleague/types";
import type { StatMode, StatRow } from "@/lib/stats/boxScore";

import { StatTable } from "./StatTable";

export type SeasonItem = { team: TeamSummary | null; row: StatRow };

const MODES: { value: StatMode; label: string }[] = [
  { value: "averages", label: "Averages" },
  { value: "totals", label: "Totals" },
];

/**
 * Season stats with an Averages / Totals switch. Both versions are computed
 * on the server; the only client state is which one is shown.
 */
export function SeasonStatsTable({
  seasonLabel,
  rows,
}: {
  seasonLabel: string;
  rows: Record<StatMode, SeasonItem[]>;
}) {
  const [mode, setMode] = useState<StatMode>("averages");
  const items = rows[mode];
  const games = items.at(-1)?.row.games ?? 0;

  return (
    <section className="space-y-5 rounded-lg bg-paper p-6 ring-1 ring-line sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold uppercase">Statistics</h2>
          <p className="text-sm text-ink-muted">
            {seasonLabel} season, {mode === "averages" ? "per game" : "totals"}, {games}{" "}
            {games === 1 ? "game" : "games"} played
          </p>
        </div>
        <Segmented label="Show" value={mode} options={MODES} onChange={setMode} />
      </div>

      <div className="-mx-6 sm:mx-0">
        <StatTable
          caption={`${seasonLabel} season ${mode === "averages" ? "averages per game" : "totals"}`}
          items={items}
          getKey={(i) => i.team?.code ?? "total"}
          getRow={(i) => i.row}
          variant="season"
          emphasize={(i) => i.team == null}
          lead={{
            header: "Club",
            cell: (i) =>
              i.team ? (
                <Link
                  href={`/teams/${i.team.code.toLowerCase()}`}
                  className="flex items-center gap-2 font-semibold hover:text-accent-ink hover:underline"
                >
                  {i.team.crestUrl && (
                    <Image
                      src={i.team.crestUrl}
                      alt=""
                      width={44}
                      height={44}
                      className="h-[22px] w-[22px] object-contain"
                    />
                  )}
                  {i.team.shortName}
                </Link>
              ) : (
                "Total"
              ),
          }}
        />
      </div>
    </section>
  );
}
