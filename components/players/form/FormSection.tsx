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

import { PirChart } from "./PirChart";

const TREND_UI: Record<Trend, { label: string; icon: string; className: string }> = {
  up: { label: "In form", icon: "▲", className: "text-euro-neon" },
  down: { label: "Cold", icon: "▼", className: "text-red-400" },
  steady: { label: "Steady", icon: "●", className: "text-gray-400" },
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
    <section className="border-euro-border bg-euro-card space-y-6 rounded-3xl border p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
          Current Form
        </h2>

        <div
          role="radiogroup"
          aria-label="Form window"
          className="border-euro-border-soft bg-euro-bg flex gap-1 rounded-xl border p-1"
        >
          {FORM_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              role="radio"
              aria-checked={w === window}
              onClick={() => setWindow(w)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                w === window
                  ? "bg-euro-neon text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Last {w}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile
          label={`Form PIR · last ${form.games}`}
          value={formatStat(form.formPir)}
          highlight
        />
        <SummaryTile label="Season PIR" value={formatStat(seasonPir)} />
        <div className="border-euro-border bg-euro-bg/60 flex flex-col justify-between rounded-2xl border p-5">
          <div
            className={`flex items-baseline gap-2 font-mono text-3xl font-black ${trend.className}`}
          >
            <span className="text-lg" aria-hidden>
              {trend.icon}
            </span>
            {form.delta >= 0 ? "+" : ""}
            {formatStat(form.delta)}
          </div>
          <div className="font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            {trend.label} vs season
          </div>
        </div>
      </div>

      <div>
        <PirChart games={games} formGameCodes={formGameCodes} seasonPir={seasonPir} />
        <p className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
          <span
            className="bg-euro-neon inline-block h-2.5 w-2.5 rounded-sm"
            aria-hidden
          />{" "}
          In form window
          <span
            className="ml-3 inline-block h-2.5 w-2.5 rounded-sm bg-[#6b7280]"
            aria-hidden
          />{" "}
          Earlier games
          <span
            className="ml-3 inline-block w-4 border-t border-dashed border-gray-400"
            aria-hidden
          />{" "}
          Season avg {formatStat(seasonPir)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
            <tr className="border-euro-border border-b">
              <th className="py-2 font-bold">Rd</th>
              <th className="py-2 font-bold">Opponent</th>
              <th className="py-2 font-bold">Result</th>
              <th className="py-2 text-right font-bold">MIN</th>
              <th className="py-2 text-right font-bold">PTS</th>
              <th className="py-2 text-right font-bold">REB</th>
              <th className="py-2 text-right font-bold">AST</th>
              <th className="py-2 text-right font-bold">PIR</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {recent.toReversed().map((g) => (
              <tr key={g.gameCode} className="border-euro-border/50 border-b">
                <td className="py-2.5 text-gray-500">{g.round}</td>
                <td className="py-2.5">
                  <span className="flex items-center gap-2 font-sans font-bold text-white">
                    <span className="w-4 text-gray-500">{g.isHome ? "vs" : "@"}</span>
                    {g.opponent.crestUrl && (
                      <Image
                        src={g.opponent.crestUrl}
                        alt=""
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] object-contain"
                      />
                    )}
                    {g.opponent.shortName}
                  </span>
                </td>
                <td
                  className={`py-2.5 font-bold ${g.won ? "text-euro-neon" : "text-gray-400"}`}
                >
                  {g.won ? "W" : "L"} {g.teamScore}–{g.opponentScore}
                </td>
                <td className="py-2.5 text-right text-gray-400">
                  {Math.round(g.minutes)}
                </td>
                <td className="py-2.5 text-right text-gray-300">{g.points}</td>
                <td className="py-2.5 text-right text-gray-300">{g.rebounds}</td>
                <td className="py-2.5 text-right text-gray-300">{g.assists}</td>
                <td className="py-2.5 text-right font-bold text-white">{g.pir}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="border-euro-border bg-euro-bg/60 flex flex-col justify-between rounded-2xl border p-5">
      <div
        className={`font-mono text-3xl font-black ${highlight ? "text-euro-neon" : "text-white"}`}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase">
        {label}
      </div>
    </div>
  );
}
