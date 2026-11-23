"use client";

import Image from "next/image";
import Link from "next/link";
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
  // Tabela podrazumevano pokazuje samo utakmice iz forme; na klik celu sezonu.
  const [showAll, setShowAll] = useState(false);
  const rows = (showAll ? games : recent).toReversed();

  if (!form) return null;
  const trend = TREND_UI[form.trend];

  return (
    <section className="space-y-8 rounded-lg bg-paper p-6 ring-1 ring-line sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold uppercase">Current form</h2>
          <p className="text-sm text-ink-muted">
            PIR in his last games compared with his season average
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Number of games"
          className="flex rounded-md bg-canvas p-1"
        >
          {FORM_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              role="radio"
              aria-checked={w === window}
              onClick={() => setWindow(w)}
              className={`rounded px-3.5 py-1.5 font-display text-base font-semibold transition-colors ${
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
        <div className="flex flex-col-reverse border-t-2 border-line pt-2">
          <dt className="text-sm text-ink-muted">{trend.label} compared with season</dt>
          <dd
            className={`flex items-baseline gap-2 font-display text-5xl leading-none font-bold ${trend.className}`}
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
        <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-accent" aria-hidden /> Last {window}{" "}
            games
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#8a8e95]" aria-hidden /> Earlier games
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 border-t border-dashed border-ink/60" aria-hidden />{" "}
            Season average {formatStat(seasonPir)}
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">
            {showAll ? "All games this season" : `Last ${window} games`}
          </caption>
          <thead className="text-xs text-ink-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pl-3 font-semibold">
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
            {rows.map((g) => (
              <tr
                key={g.gameCode}
                // Kad je prikazana cela sezona, utakmice iz forme imaju narandžastu liniju sa leve strane.
                className={`border-b border-line last:border-0 ${
                  showAll && formGameCodes.has(g.gameCode)
                    ? "shadow-[inset_3px_0_0_var(--color-accent)]"
                    : ""
                }`}
              >
                <td className="py-3 pl-3 font-display text-base font-semibold text-ink-faint">
                  {g.round}
                </td>
                <td className="py-3">
                  <Link
                    href={`/teams/${g.opponent.code.toLowerCase()}`}
                    className="group/opp inline-flex items-center gap-2 font-semibold hover:text-accent-ink"
                  >
                    <span className="w-5 text-xs font-normal text-ink-faint">
                      {g.isHome ? "vs" : "at"}
                    </span>
                    {g.opponent.crestUrl && (
                      <Image
                        src={g.opponent.crestUrl}
                        alt=""
                        width={44}
                        height={44}
                        className="h-[22px] w-[22px] object-contain"
                      />
                    )}
                    <span className="group-hover/opp:underline">
                      {g.opponent.shortName}
                    </span>
                  </Link>
                </td>
                <td className="py-3">
                  <span
                    className={`mr-1.5 inline-block w-5 rounded-sm text-center text-xs font-bold ${g.won ? "bg-[#1a7f37] text-white" : "bg-[#c62828] text-white"}`}
                  >
                    {g.won ? "W" : "L"}
                  </span>
                  {g.teamScore}–{g.opponentScore}
                </td>
                <td className="py-3 text-right text-ink-muted">
                  {Math.round(g.minutes)}
                </td>
                <td className="py-3 text-right">{g.points}</td>
                <td className="py-3 text-right">{g.rebounds}</td>
                <td className="py-3 text-right">{g.assists}</td>
                <td className="py-3 text-right font-display text-lg font-bold">
                  {g.pir}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {games.length > recent.length && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mx-auto flex h-11 items-center gap-2 rounded-full bg-canvas px-5 font-display text-lg font-bold transition-colors hover:bg-ink hover:text-white"
        >
          {showAll
            ? `Show last ${window} games`
            : `Show all ${games.length} games this season`}
          <svg
            viewBox="0 0 12 12"
            className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      )}
    </section>
  );
}
