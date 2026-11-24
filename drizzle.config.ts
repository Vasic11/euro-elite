import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local on its own. Node 22 can load it without
// the dotenv package; on CI or Vercel the file does not exist and the variables
// come from the environment.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: use the environment as is
}

// Migrations use the direct (non-pooled) connection, as Neon recommends.
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
