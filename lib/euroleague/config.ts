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

/** "E2026" -> "2026-27", za prikaz na sajtu. */
export const SEASON_LABEL = (() => {
  const year = Number(SEASON_CODE.slice(1));
  return Number.isNaN(year) ? SEASON_CODE : `${year}-${String(year + 1).slice(2)}`;
})();

/** Vremenska zona za prikaz datuma utakmica (server radi u UTC-u). */
export const DISPLAY_TIME_ZONE = "Europe/Belgrade";
