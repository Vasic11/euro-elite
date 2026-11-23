import { getPlayerGameLog } from "@/lib/euroleague/games";

import { FormSection } from "./FormSection";

/**
 * Asinhrona serverska komponenta: sama pribavlja utakmice igrača.
 * Na stranici je umotana u <Suspense>, pa se ostatak profila prikaže odmah,
 * a ova sekcija "doteče" kad stignu podaci (streaming).
 */
export async function PlayerForm({
  code,
  seasonPir,
}: {
  code: string;
  seasonPir: number;
}) {
  let games;
  try {
    games = await getPlayerGameLog(code);
  } catch {
    // Ako ovaj endpoint ne radi, ne rušimo ceo profil, samo ovu sekciju.
    return (
      <p className="border-euro-border bg-euro-card rounded-2xl border p-6 text-sm text-gray-400">
        Game log is unavailable right now.
      </p>
    );
  }

  if (games.length === 0) return null;
  return <FormSection games={games} seasonPir={seasonPir} />;
}

export function PlayerFormSkeleton() {
  return (
    <div
      className="border-euro-border bg-euro-card h-[560px] animate-pulse rounded-3xl border"
      aria-label="Loading form"
    />
  );
}
