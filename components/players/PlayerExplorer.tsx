"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { normalizeForSearch } from "@/lib/euroleague/format";
import type { Player, Position } from "@/lib/euroleague/types";
import { Dropdown } from "@/components/ui/Dropdown";

import { PlayerGrid } from "./PlayerGrid";

type SortKey = "pir" | "points" | "rebounds" | "assists";

const POSITION_OPTIONS: { value: Position | "all"; label: string }[] = [
  { value: "all", label: "All Positions" },
  { value: "Guard", label: "Guards" },
  { value: "Forward", label: "Forwards" },
  { value: "Center", label: "Centers" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "pir", label: "Sort: PIR" },
  { value: "points", label: "Sort: Points" },
  { value: "rebounds", label: "Sort: Rebounds" },
  { value: "assists", label: "Sort: Assists" },
];

/**
 * Pretraga i filteri. Sve radi u browseru, nad podacima koje je serverska
 * stranica već dobila. Svaka promena filtera je trenutna, bez novog zahteva.
 */
export function PlayerExplorer({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<Position | "all">("all");
  const [nation, setNation] = useState("all");
  const [sort, setSort] = useState<SortKey>("pir");

  // Kucanje ostaje glatko: input se ažurira odmah, a filtriranje kad React stigne.
  const deferredQuery = useDeferredValue(query);

  // Lista država se pravi iz podataka, ne ručno. Nova država se pojavi sama.
  const nationOptions = useMemo(() => {
    const countries = new Set(players.flatMap((p) => (p.country ? [p.country] : [])));
    return [
      { value: "all", label: "All Nations" },
      ...[...countries].sort().map((c) => ({ value: c, label: c })),
    ];
  }, [players]);

  const visible = useMemo(() => {
    const q = normalizeForSearch(deferredQuery.trim());
    return players
      .filter(
        (p) =>
          (position === "all" || p.position === position) &&
          (nation === "all" || p.country === nation) &&
          (q === "" ||
            normalizeForSearch(p.name).includes(q) ||
            normalizeForSearch(p.team.name).includes(q)),
      )
      .toSorted((a, b) => (b.averages?.[sort] ?? -1) - (a.averages?.[sort] ?? -1));
  }, [players, deferredQuery, position, nation, sort]);

  return (
    <div className="space-y-6">
      <div className="border-euro-border bg-euro-card flex flex-col justify-between gap-3 rounded-2xl border p-3 shadow-lg md:flex-row md:items-center">
        <label className="border-euro-border-soft bg-euro-bg flex flex-1 items-center gap-2 rounded-xl border px-4 py-2.5">
          <span className="text-sm text-gray-500" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            placeholder="Search player name, team..."
            aria-label="Search players"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-none bg-transparent text-xs font-medium text-white placeholder-gray-600 outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            label="Position"
            value={position}
            options={POSITION_OPTIONS}
            onChange={setPosition}
          />
          <Dropdown
            label="Nation"
            value={nation}
            options={nationOptions}
            onChange={setNation}
          />
          <Dropdown
            label="Sort"
            value={sort}
            options={SORT_OPTIONS}
            onChange={setSort}
            align="right"
          />
        </div>
      </div>

      <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
        {visible.length} {visible.length === 1 ? "player" : "players"}
      </p>

      {visible.length > 0 ? (
        <PlayerGrid players={visible} />
      ) : (
        <p className="py-16 text-center text-sm text-gray-500">
          No players match these filters.
        </p>
      )}
    </div>
  );
}
