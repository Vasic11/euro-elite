"use client";

import { MotionConfig } from "framer-motion";
import { useDeferredValue, useMemo, useState } from "react";

import { normalizeForSearch } from "@/lib/euroleague/format";
import type { Player, Position } from "@/lib/euroleague/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { Segmented } from "@/components/ui/Segmented";

import { AnimatedPlayerGrid } from "./AnimatedPlayerGrid";

type SortKey = "pir" | "points" | "rebounds" | "assists" | "steals" | "blocks";

/** Koliko kartica prikazujemo odjednom; "Show more" dodaje još toliko. */
const PAGE_SIZE = 24;

const POSITION_OPTIONS: { value: Position | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Guard", label: "Guards" },
  { value: "Forward", label: "Forwards" },
  { value: "Center", label: "Centers" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "pir", label: "PIR" },
  { value: "points", label: "PTS" },
  { value: "rebounds", label: "REB" },
  { value: "assists", label: "AST" },
  { value: "steals", label: "STL" },
  { value: "blocks", label: "BLK" },
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

  // Broj prikazanih kartica se vraća na PAGE_SIZE čim se promeni filter.
  // Umesto useEffect-a pamtimo za koji filter važi limit (nema dodatnog renderovanja).
  const filterKey = `${deferredQuery}|${position}|${nation}|${sort}`;
  const [paging, setPaging] = useState({ key: filterKey, limit: PAGE_SIZE });
  const limit = paging.key === filterKey ? paging.limit : PAGE_SIZE;
  const shown = visible.slice(0, limit);

  return (
    <div className="space-y-5">
      {/* Jedna zaobljena traka: pretraga, pa filteri koji se vide odmah */}
      <div className="flex flex-col gap-2 rounded-3xl bg-paper p-2 ring-1 ring-line lg:flex-row lg:items-center">
        <label className="flex h-10 shrink-0 items-center gap-2.5 rounded-full bg-canvas px-4 transition-shadow focus-within:ring-2 focus-within:ring-accent lg:flex-1">
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

        {/* Na užim ekranima filteri prelaze u novi red (vodoravni skrol bi odsekao meni za državu) */}
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
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
          <Segmented
            label="Sort by"
            value={sort}
            options={SORT_OPTIONS}
            onChange={setSort}
          />
        </div>
      </div>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? "player" : "players"}
      </p>

      {visible.length > 0 ? (
        <>
          <MotionConfig reducedMotion="user">
            <AnimatedPlayerGrid players={shown} from="/players" />
          </MotionConfig>
          {visible.length > shown.length && (
            <button
              type="button"
              onClick={() => setPaging({ key: filterKey, limit: limit + PAGE_SIZE })}
              className="mx-auto flex h-12 items-center gap-2 rounded-full bg-paper px-6 font-display text-lg font-bold ring-1 ring-line transition-colors hover:bg-ink hover:text-white hover:ring-ink"
            >
              Show more
              <span className="font-semibold text-ink-faint">
                {shown.length} of {visible.length}
              </span>
            </button>
          )}
        </>
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
