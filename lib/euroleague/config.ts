/**
 * Osnovna podešavanja za EuroLeague API.
 *
 * Kodovi u API-ju:
 *  - takmičenje: "E" = EuroLeague, "U" = EuroCup
 *  - sezona: "E" + godina početka sezone (2026-27 -> "E2026")
 */
export const EUROLEAGUE_API_BASE = "https://api-live.euroleague.net";

export const COMPETITION_CODE = "E";

export const SEASON_CODE = process.env.EUROLEAGUE_SEASON ?? "E2026";

/** Koliko sekundi Next.js keš drži odgovor pre nego što ga osveži (1h). */
export const DEFAULT_REVALIDATE_SECONDS = 60 * 60;
