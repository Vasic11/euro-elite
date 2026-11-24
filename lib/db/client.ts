import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Drizzle over Neon's HTTP driver: one HTTP request per query, no open
 * connections to manage in serverless functions. `db.batch([...])` runs
 * several statements in one transaction.
 *
 * Runtime uses the pooled connection string; migrations (drizzle-kit) use the
 * direct one, see drizzle.config.ts.
 */
function createDb() {
  const url = process.env.DATABASE_URL_POOLED;
  if (!url) throw new Error("DATABASE_URL_POOLED is not set");
  return drizzle({ client: neon(url), schema });
}

let cached: ReturnType<typeof createDb> | undefined;

/** Created lazily so importing this file never fails at build time. */
export function getDb() {
  cached ??= createDb();
  return cached;
}

export type Db = ReturnType<typeof getDb>;
