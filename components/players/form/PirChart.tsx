"use client";

import { useState } from "react";

import type { GameLogEntry } from "@/lib/euroleague/types";

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 32 };
const MAX_BAR = 24;

/** Sivo za starije utakmice (namerno utišano); tačne vrednosti daju tooltip i tabela. */
const MUTED = "#8a8e95";

type Column = { round: number; game: GameLogEntry | null };

/** Zaobljen kraj na vrhu (ili dnu za negativan PIR), ravno na nultoj liniji. */
function barPath(x: number, w: number, y0: number, y1: number) {
  const r = Math.min(4, w / 2, Math.abs(y1 - y0));
  if (y1 < y0) {
    // pozitivan: raste naviše od y0 do y1
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + w - r} Q${x + w},${y1} ${x + w},${y1 + r} V${y0} Z`;
  }
  return `M${x},${y0} V${y1 - r} Q${x},${y1} ${x + r},${y1} H${x + w - r} Q${x + w},${y1} ${x + w},${y1 - r} V${y0} Z`;
}

function niceStep(range: number) {
  const raw = range / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

/**
 * PIR po kolima. Utakmice koje ulaze u formu su neon, starije sive,
 * a kola u kojima igrač nije igrao ostaju prazna sa oznakom "DNP".
 */
export function PirChart({
  games,
  formGameCodes,
  seasonPir,
}: {
  games: GameLogEntry[];
  formGameCodes: Set<number>;
  seasonPir: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const lastRound = Math.max(...games.map((g) => g.round));
  const byRound = new Map(games.map((g) => [g.round, g]));
  const columns: Column[] = Array.from({ length: lastRound }, (_, i) => ({
    round: i + 1,
    game: byRound.get(i + 1) ?? null,
  }));

  // Skala: uvek uključuje 0, a zaokružena je na "lepe" brojeve (0, 10, 20...).
  const values = games.map((g) => g.pir);
  const step = niceStep(
    Math.max(Math.max(...values, seasonPir, 0) - Math.min(...values, 0), 10),
  );
  const yMax = Math.ceil(Math.max(...values, seasonPir, 1) / step) * step;
  const yMin = Math.floor(Math.min(...values, 0) / step) * step;
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + 1e-9; t += step) ticks.push(t);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / columns.length;
  const barW = Math.min(MAX_BAR, band * 0.6);
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * plotH;
  const x = (i: number) => PAD.left + i * band;

  const hoveredCol = hovered != null ? columns[hovered] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="PIR by round"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? "#b8bbc0" : "#ececea"}
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-ink-faint font-display text-[12px]"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Prosek sezone kao referentna linija */}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={y(seasonPir)}
          y2={y(seasonPir)}
          stroke="#000000"
          strokeDasharray="4 4"
          strokeOpacity={0.55}
        />

        {columns.map((col, i) => {
          const cx = x(i) + band / 2;
          const inForm = col.game != null && formGameCodes.has(col.game.gameCode);
          const dim = hovered != null && hovered !== i;
          return (
            <g key={col.round}>
              {col.game ? (
                <path
                  d={barPath(cx - barW / 2, barW, y(0), y(col.game.pir))}
                  fill={inForm ? "var(--color-accent)" : MUTED}
                  opacity={dim ? 0.45 : 1}
                />
              ) : (
                <text
                  x={cx}
                  y={y(0) - 4}
                  textAnchor="middle"
                  className="fill-ink-faint font-display text-[10px]"
                >
                  DNP
                </text>
              )}
              <text
                x={cx}
                y={HEIGHT - 10}
                textAnchor="middle"
                className="fill-ink-faint font-display text-[12px]"
              >
                {col.round}
              </text>
              {/* Nevidljiva meta za hover: cela kolona, šira od same trake. */}
              <rect
                x={x(i)}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={
                  col.game
                    ? `Round ${col.round}: PIR ${col.game.pir} vs ${col.game.opponent.shortName}`
                    : `Round ${col.round}: did not play`
                }
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                className="outline-none"
              />
            </g>
          );
        })}
      </svg>

      {hoveredCol && hovered != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-48 -translate-x-1/2 rounded-md bg-ink p-3 text-xs text-white shadow-xl"
          // Ograničeno na 15–85% širine da tooltip ne izađe van kartice na ivicama.
          style={{
            left: `${Math.min(85, Math.max(15, ((x(hovered) + band / 2) / WIDTH) * 100))}%`,
          }}
        >
          <div className="text-[11px] text-white/60">Round {hoveredCol.round}</div>
          {hoveredCol.game ? (
            <>
              <div className="mt-0.5 font-display text-base font-bold">
                {hoveredCol.game.isHome ? "vs" : "@"} {hoveredCol.game.opponent.shortName}
              </div>
              <div className="text-white/70">
                {hoveredCol.game.won ? "W" : "L"} {hoveredCol.game.teamScore}–
                {hoveredCol.game.opponentScore}
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-white/60">PIR</span>
                <span className="font-display text-base font-bold text-accent">
                  {hoveredCol.game.pir}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">PTS / REB / AST</span>
                <span className="text-white">
                  {hoveredCol.game.points}/{hoveredCol.game.rebounds}/
                  {hoveredCol.game.assists}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-1 text-white/70">Did not play</div>
          )}
        </div>
      )}
    </div>
  );
}
