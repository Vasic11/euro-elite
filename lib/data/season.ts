import "server-only";

import { cache } from "react";

import { getSeasonFromDb } from "@/lib/db/queries";

/**
 * The season data every page is built from. React's `cache` keeps it for one
 * render, so all components on a page share one read of the cached entry.
 */
export const getSeason = cache(getSeasonFromDb);
