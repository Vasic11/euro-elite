"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { formatStat } from "@/lib/euroleague/format";
import type { GameLogEntry } from "@/lib/euroleague/types";
import {
  computeForm,
  DEFAULT_FORM_WINDOW,
  FORM_WINDOWS,
  type FormWindow,
  type Trend,
} from "@/lib/stats/form";

import { StatTile } from "@/components/ui/StatTile";

import { PirChart } from "./PirChart";

const TREND_UI: Record<Trend, { label: string; icon: string; className: string }> = {
  up: { label: "In form", icon: "▲", className: "text-[#1a7f37]" },
  down: { label: "Cold", icon: "▼", className: "text-[#c62828]" },
  steady: { label: "Steady", icon: "●", className: "text-ink-muted" },
};

/**
 * Forma igrača: prekidač 3/5/10, poređenje sa prosekom sezone,
 * grafikon po kolima i tabela poslednjih utakmica.
 */
export function FormSection({
  games,
  seasonPir,
}: {
  games: GameLogEntry[];
  seasonPir: number;
}) {
  const [window, setWindow] = useState<FormWindow>(DEFAULT_FORM_WINDOW);

  const form = useMemo(
    () =>
      computeForm(
        games.map((g) => g.pir),
        window,
        seasonPir,
      ),
    [games, window, seasonPir],
  );
  const recent = useMemo(() => games.slice(-window), [games, window]);
  const formGameCodes = useMemo(() => new Set(recent.map((g) => g.gameCode)), [recent]);

  if (!form) return null;
  const trend = TREND_UI[form.trend];

  return (
    <section className="bg-paper ring-line space-y-8 rounded-lg p-6 ring-1 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold uppercase">Current form</h2>
          <p className="text-ink-muted text-sm">
            PIR in his last games compared with his season average
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Number of games"
          className="bg-canvas flex rounded-md p-1"
        >
          {FORM_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              role="radio"
              aria-checked={w === window}
              onClick={() => setWindow(w)}
              className={`font-display rounded px-3.5 py-1.5 text-base font-semibold transition-colors ${
                w === window
                  ? "bg-paper text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Last {w}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatTile
          label={`Average PIR, last ${form.games}`}
          value={formatStat(form.formPir)}
          accent
        />
        <StatTile label="Season average PIR" value={formatStat(seasonPir)} />
        <div className="border-line flex flex-col-reverse border-t-2 pt-2">
          <dt className="text-ink-muted text-sm">{trend.label} compared with season</dt>
          <dd
            className={`font-display flex items-baseline gap-2 text-5xl leading-none font-bold ${trend.className}`}
          >
            <span className="text-2xl" aria-hidden>
              {trend.icon}
            </span>
            {form.delta >= 0 ? "+" : ""}
            {formatStat(form.delta)}
          </dd>
        </div>
      </dl>

      <div>
        <PirChart games={games} formGameCodes={formGameCodes} seasonPir={seasonPir} />
        <p className="text-ink-muted mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="flex items-center gap-2">
            <span className="bg-accent h-3 w-3 rounded-sm" aria-hidden /> Last {window}{" "}
            games
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#8a8e95]" aria-hidden /> Earlier games
          </span>
          <span className="flex items-center gap-2">
            <span className="border-ink/60 w-4 border-t border-dashed" aria-hidden />{" "}
            Season average {formatStat(seasonPir)}
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Last {window} games</caption>
          <thead className="text-ink-muted text-xs">
            <tr className="border-line border-b">
              <th scope="col" className="py-2 font-semibold">
                Round
              </th>
              <th scope="col" className="py-2 font-semibold">
                Opponent
              </th>
              <th scope="col" className="py-2 font-semibold">
                Result
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Min
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Pts
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Reb
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Ast
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                PIR
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.toReversed().map((g) => (
              <tr key={g.gameCode} className="border-line border-b last:border-0">
                <td className="font-display text-ink-faint py-3 text-base font-semibold">
                  {g.round}
                </td>
                <td className="py-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="text-ink-faint w-5 text-xs font-normal">
                      {g.isHome ? "vs" : "at"}
                    </span>
                    {g.opponent.crestUrl && (
                      <Image
                        src={g.opponent.crestUrl}
                        alt=""
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] object-contain"
                      />
                    )}
                    {g.opponent.shortName}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={`mr-1.5 inline-block w-5 rounded-sm text-center text-xs font-bold ${g.won ? "bg-[#1a7f37] text-white" : "bg-canvas text-ink-muted"}`}
                  >
                    {g.won ? "W" : "L"}
                  </span>
                  {g.teamScore}–{g.opponentScore}
                </td>
                <td className="text-ink-muted py-3 text-right">
                  {Math.round(g.minutes)}
                </td>
                <td className="py-3 text-right">{g.points}</td>
                <td className="py-3 text-right">{g.rebounds}</td>
                <td className="py-3 text-right">{g.assists}</td>
                <td className="font-display py-3 text-right text-lg font-bold">
                  {g.pir}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
