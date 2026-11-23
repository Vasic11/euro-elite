"use client";

import { motion } from "framer-motion";

import type { SeasonAverages } from "@/lib/euroleague/types";

const CENTER = 150;
const MAX_RADIUS = 100;

/**
 * Ose radara, u smeru kazaljke na satu, počevši od vrha.
 * `max` je vrednost koja dodiruje ivicu (elitni nivo u EuroLeague-u).
 */
const AXES = [
  { label: "PPG", max: 25, value: (a: SeasonAverages) => a.points },
  { label: "RPG", max: 10, value: (a: SeasonAverages) => a.rebounds },
  { label: "APG", max: 8, value: (a: SeasonAverages) => a.assists },
  { label: "SPG", max: 2.5, value: (a: SeasonAverages) => a.steals },
  { label: "BPG", max: 2, value: (a: SeasonAverages) => a.blocks },
  { label: "PIR", max: 25, value: (a: SeasonAverages) => a.pir },
] as const;

function point(index: number, radius: number) {
  const angle = (index * 2 * Math.PI) / AXES.length - Math.PI / 2; // -90° = vrh
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

function polygon(radii: number[]) {
  return radii
    .map((r, i) => {
      const { x, y } = point(i, r);
      return `${x},${y}`;
    })
    .join(" ");
}

export function RadarChart({ averages }: { averages: SeasonAverages }) {
  const radii = AXES.map(({ max, value }) => {
    const ratio = Math.min(Math.max(value(averages) / max, 0.15), 1);
    return MAX_RADIUS * ratio;
  });

  return (
    <svg
      viewBox="0 0 300 300"
      className="h-72 w-72 overflow-visible fill-none select-none"
      role="img"
      aria-label={AXES.map((a) => `${a.label} ${a.value(averages).toFixed(1)}`).join(
        ", ",
      )}
    >
      {[25, 50, 75, 100].map((r, i) => (
        <polygon
          key={r}
          points={polygon(AXES.map(() => r))}
          className={i === 3 ? "stroke-ink/25" : "stroke-ink/10"}
        />
      ))}

      {AXES.map((axis, i) => {
        const end = point(i, MAX_RADIUS);
        return (
          <line
            key={axis.label}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            className="stroke-ink/10"
          />
        );
      })}

      <motion.polygon
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 45, damping: 15, delay: 0.1 }}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
        points={polygon(radii)}
        className="fill-accent/20 stroke-accent stroke-[2.5]"
      />

      {/* Labele: pozicija se računa iz ugla, pa ostaju poravnate ako dodamo osu. */}
      {AXES.map((axis, i) => {
        const { x, y } = point(i, MAX_RADIUS + 22);
        const anchor = Math.abs(x - CENTER) < 1 ? "middle" : x > CENTER ? "start" : "end";
        return (
          <text
            key={axis.label}
            x={x}
            y={y + 4}
            textAnchor={anchor}
            className="fill-ink-muted font-display text-[13px] font-semibold"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
