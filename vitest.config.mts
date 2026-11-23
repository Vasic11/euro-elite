import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // U ESM-u nema __dirname, pa putanju do korena projekta pravimo iz import.meta.url.
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["**/*.test.ts"], exclude: ["node_modules", ".next"] },
});
