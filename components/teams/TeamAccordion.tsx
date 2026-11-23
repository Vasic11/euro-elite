"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { clubColor } from "@/lib/euroleague/clubColors";
import { formatStat, POSITION_LABEL } from "@/lib/euroleague/format";
import type { Team } from "@/lib/euroleague/types";

function averagePir(team: Team) {
  const played = team.players.filter((p) => p.averages);
  if (played.length === 0) return null;
  return played.reduce((sum, p) => sum + (p.averages?.pir ?? 0), 0) / played.length;
}

/**
 * @param initialExpanded klub koji je otvoren na početku. Dolazi iz URL-a (/teams?team=ZAL),
 *   pa ga server zna odmah i nema treptanja posle učitavanja.
 */
export function TeamAccordion({
  teams,
  initialExpanded = null,
}: {
  teams: Team[];
  initialExpanded?: string | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(initialExpanded);

  return (
    <div className="space-y-3">
      {teams.map((team) => {
        const isOpen = expanded === team.code;
        const panelId = `roster-${team.code}`;
        return (
          <section
            key={team.code}
            id={team.code}
            className="scroll-mt-24 overflow-hidden rounded-lg border-l-4 bg-paper ring-1 ring-line"
            style={{ borderLeftColor: clubColor(team.code) }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setExpanded(isOpen ? null : team.code)}
              className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-canvas/60 sm:p-5"
            >
              {team.crestUrl ? (
                <Image
                  src={team.crestUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <span className="h-12 w-12" />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-2xl leading-tight font-bold">
                  {team.name}
                </h2>
                <p className="text-sm text-ink-muted">
                  {team.players.length} players, average PIR{" "}
                  {formatStat(averagePir(team))}
                </p>
              </div>
              <svg
                viewBox="0 0 12 12"
                className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <path
                  d="M2 4l4 4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>

            {isOpen && (
              <ul
                id={panelId}
                className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-3"
              >
                {team.players.map((p) => (
                  <li key={p.code} className="bg-paper">
                    <Link
                      href={`/players/${p.code}`}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-accent-soft/50"
                    >
                      <span className="w-8 font-display text-2xl font-bold text-ink-faint">
                        {p.jerseyNumber ?? ""}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold group-hover:text-accent-ink">
                          {p.name}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {p.position ? POSITION_LABEL[p.position] : "Position unknown"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-xl leading-none font-bold">
                          {formatStat(p.averages?.pir)}
                        </div>
                        <div className="text-xs text-ink-faint">PIR</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
