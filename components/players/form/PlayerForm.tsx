import { getPlayerGameLog } from "@/lib/data/games";

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
      <p className="rounded-lg bg-paper p-6 text-sm text-ink-muted ring-1 ring-line">
        Game-by-game stats are unavailable right now. Season averages above are up to
        date.
      </p>
    );
  }

  if (games.length === 0) return null;
  return <FormSection games={games} seasonPir={seasonPir} />;
}

export function PlayerFormSkeleton() {
  return (
    <div
      className="h-[640px] animate-pulse rounded-lg bg-paper ring-1 ring-line"
      aria-label="Loading form"
    />
  );
}
