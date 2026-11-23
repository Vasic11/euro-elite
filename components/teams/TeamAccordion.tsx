"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { formatStat, POSITION_SHORT } from "@/lib/euroleague/format";
import type { Team } from "@/lib/euroleague/types";

function averagePir(team: Team) {
  const played = team.players.filter((p) => p.averages);
  if (played.length === 0) return null;
  return played.reduce((sum, p) => sum + (p.averages?.pir ?? 0), 0) / played.length;
}

export function TeamAccordion({ teams }: { teams: Team[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4">
      {teams.map((team) => {
        const isOpen = expanded === team.code;
        return (
          <section
            key={team.code}
            className="border-euro-border bg-euro-card overflow-hidden rounded-2xl border shadow-lg"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setExpanded(isOpen ? null : team.code)}
              className="hover:bg-euro-surface/40 flex w-full items-center justify-between gap-4 p-5 text-left transition select-none"
            >
              <div className="flex items-center gap-4">
                {team.crestUrl && (
                  <Image
                    src={team.crestUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                )}
                <div>
                  <h2 className="text-xl font-black text-white">{team.name}</h2>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {team.players.length} Roster Players •{" "}
                    <span className="text-gray-400">
                      Avg PIR: {formatStat(averagePir(team))}
                    </span>
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-400">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <ul className="border-euro-border/60 bg-euro-bg/30 grid grid-cols-1 gap-4 border-t p-4 sm:grid-cols-2 md:grid-cols-3">
                {team.players.map((p) => (
                  <li key={p.code}>
                    <Link
                      href={`/players/${p.code}`}
                      className="border-euro-border bg-euro-card hover:border-euro-neon/30 flex items-center justify-between rounded-xl border p-4 transition"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{p.name}</div>
                        <div className="mt-0.5 text-[10px] font-bold text-gray-500 uppercase">
                          {p.position ? POSITION_SHORT[p.position] : "—"}
                          {p.jerseyNumber && ` • #${p.jerseyNumber}`}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-euro-neon text-xs font-bold">
                          {formatStat(p.averages?.points)} PPG
                        </div>
                        <div className="text-[10px] text-gray-500">
                          PIR {formatStat(p.averages?.pir)}
                        </div>
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
