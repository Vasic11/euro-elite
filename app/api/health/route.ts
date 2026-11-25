import { checkSync } from "@/lib/db/health";
import { runHealthChecks } from "@/lib/euroleague/health";

// Uvek sveže, nikad iz keša: provera mora da vidi API i bazu kakvi su sada.
export const dynamic = "force-dynamic";

/**
 * GET /api/health: da li EuroLeague API radi i vraća podatke u očekivanom obliku
 * (od njega zavisi sync) i da li je poslednji uspešan sync u bazu mlađi od 36 h
 * (od baze zavise stranice). 200 ako je sve u redu, 503 ako nešto ne valja.
 * GitHub Actions je posećuje svakog jutra (.github/workflows/health.yml) i šalje
 * email ako odgovor nije 200.
 */
export async function GET() {
  const [apiChecks, syncCheck] = await Promise.all([runHealthChecks(), checkSync()]);
  const checks = [...apiChecks, syncCheck];
  const ok = apiChecks.length > 0 && checks.every((c) => c.ok);
  return Response.json(
    { ok, checkedAt: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 },
  );
}
