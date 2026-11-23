import { runHealthChecks } from "@/lib/euroleague/health";

// Uvek sveže, nikad iz keša: provera mora da vidi API kakav je sada.
export const dynamic = "force-dynamic";

/**
 * GET /api/health: da li EuroLeague API radi i vraća podatke u očekivanom obliku.
 * 200 ako je sve u redu, 503 ako nešto ne valja. GitHub Actions je posećuje svakog
 * jutra (.github/workflows/health.yml) i šalje email ako odgovor nije 200.
 */
export async function GET() {
  const checks = await runHealthChecks();
  const ok = checks.length > 0 && checks.every((c) => c.ok);
  return Response.json(
    { ok, checkedAt: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 },
  );
}
