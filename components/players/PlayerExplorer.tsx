"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { normalizeForSearch } from "@/lib/euroleague/format";
import type { Player, Position } from "@/lib/euroleague/types";
import { Dropdown } from "@/components/ui/Dropdown";

import { PlayerGrid } from "./PlayerGrid";

type SortKey = "pir" | "points" | "rebounds" | "assists";

const POSITION_OPTIONS: { value: Position | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Guard", label: "Guards" },
  { value: "Forward", label: "Forwards" },
  { value: "Center", label: "Centers" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "pir", label: "PIR" },
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
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
      { value: "all", label: "All" },
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex h-11 flex-1 items-center gap-2.5 rounded-md border border-line bg-paper px-3.5 focus-within:border-ink/40">
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 shrink-0 text-ink-faint"
            aria-hidden
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <input
            type="search"
            placeholder="Search by player or team"
            aria-label="Search players"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
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

      <p className="text-sm text-ink-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? "player" : "players"}
      </p>

      {visible.length > 0 ? (
        <PlayerGrid players={visible} priorityCount={4} />
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-paper py-16 text-center">
          <p className="font-display text-xl font-bold">No players match these filters</p>
          <p className="mt-1 text-sm text-ink-muted">
            Try a different name or clear a filter.
          </p>
        </div>
      )}
    </div>
  );
}
