import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // U ESM-u nema __dirname, pa putanju do korena projekta pravimo iz import.meta.url.
      "@": root("."),
      // "server-only" baca grešku van Next.js servera; u testovima ga menjamo praznim modulom.
      "server-only": root("./test/server-only-stub.ts"),
    },
  },
  test: { include: ["**/*.test.ts"], exclude: ["node_modules", ".next"] },
});
