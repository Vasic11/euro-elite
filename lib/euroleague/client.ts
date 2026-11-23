import "server-only";

import type { z } from "zod";

import { DEFAULT_REVALIDATE_SECONDS, EUROLEAGUE_API_BASE } from "./config";

export class EuroleagueApiError extends Error {
  constructor(
    message: string,
    readonly path: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EuroleagueApiError";
  }
}

type FetchOptions = {
  query?: Record<string, string | number>;
  revalidate?: number;
};

/**
 * Jedino mesto u aplikaciji koje šalje zahteve EuroLeague API-ju.
 *
 * 1. Sklapa URL i query parametre.
 * 2. Koristi Next.js keš (`next.revalidate`), pa API ne zovemo pri svakom učitavanju.
 * 3. Proverava odgovor Zod šemom i vraća tačno tipizovane podatke.
 *
 * `server-only` garantuje da se ovaj fajl nikad ne nađe u kodu koji ide u browser.
 */
export async function euroleagueFetch<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  { query, revalidate = DEFAULT_REVALIDATE_SECONDS }: FetchOptions = {},
): Promise<z.infer<TSchema>> {
  const url = new URL(path, EUROLEAGUE_API_BASE);
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new EuroleagueApiError(
      `EuroLeague API je vratio ${res.status}`,
      path,
      res.status,
    );
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    // U logu servera se vidi tačno koje polje se ne poklapa sa šemom.
    console.error(
      `Neočekivan oblik odgovora za ${path}`,
      parsed.error.issues.slice(0, 5),
    );
    throw new EuroleagueApiError("Neočekivan oblik odgovora API-ja", path);
  }
  return parsed.data;
}
