import Link from "next/link";

import { PlayerGrid } from "@/components/players/PlayerGrid";
import { getPlayers, getTeams } from "@/lib/euroleague/players";

const TOP_COUNT = 8;

/**
 * Početna (Scouting Hub). Serverska komponenta: nema "use client", podatke uzima
 * na serveru, a browser dobija gotov HTML, bez JSON-a od 100 KB u bundle-u.
 */
export default async function HomePage() {
  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
  const topPlayers = players.slice(0, TOP_COUNT); // getPlayers je već sortiran po PIR-u

  return (
    <div className="space-y-10">
      <section className="border-euro-border grid grid-cols-1 items-center gap-8 border-b pb-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <span className="text-euro-neon mb-3 block font-mono text-[10px] font-bold tracking-[0.25em]">
            • EUROLEAGUE SCOUTING TERMINAL
          </span>
          <h1 className="text-7xl leading-[0.9] font-black tracking-tighter text-white">
            EURO <br />
            <span className="text-euro-neon">ELITE</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm font-medium text-gray-400">
            The definitive clean scouting platform for European basketball&apos;s premier
            talent.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:col-span-5">
          <HeroStat icon="👥" value={players.length} label="Active players" />
          <HeroStat icon="🏟️" value={teams.length} label="Teams" />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black text-white">Top performers · PIR</h2>
          <Link
            href="/players"
            className="text-euro-neon text-xs font-bold tracking-wider uppercase hover:underline"
          >
            View all players ➔
          </Link>
        </div>
        <PlayerGrid players={topPlayers} />
      </section>
    </div>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div className="border-euro-border bg-euro-card flex items-center gap-4 rounded-2xl border p-5 shadow-xl">
      <div
        className="bg-euro-surface flex h-11 w-11 items-center justify-center rounded-xl border border-gray-800"
        aria-hidden
      >
        {icon}
      </div>
      <div>
        <div className="font-mono text-2xl font-black">{value}</div>
        <div className="mt-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
          {label}
        </div>
      </div>
    </div>
  );
}
