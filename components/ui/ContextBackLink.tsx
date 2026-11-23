"use client";

import { useSearchParams } from "next/navigation";

import { BackLink } from "./BackLink";

/**
 * Dugme za povratak koje zna odakle je korisnik došao (?from=/teams/zal).
 * Čita URL u browseru, pa stranica igrača može da se napravi unapred pri build-u.
 * Prihvatamo samo naše poznate putanje, nikad spoljni URL.
 *
 * @param teamNames kratko ime kluba po kodu (malim slovima), za "Back to Zalgiris"
 */
export function ContextBackLink({ teamNames }: { teamNames: Record<string, string> }) {
  const from = useSearchParams().get("from");

  if (from === "/") return <BackLink href="/" label="Home" />;

  const teamCode = from?.match(/^\/teams\/([a-z]+)$/)?.[1];
  if (teamCode && teamNames[teamCode]) {
    return (
      <BackLink href={`/teams/${teamCode}`} label={`Back to ${teamNames[teamCode]}`} />
    );
  }

  return <BackLink href="/players" label="All players" />;
}
