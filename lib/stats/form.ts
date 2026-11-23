/**
 * Forma igrača: čiste funkcije bez React-a i API-ja, pa su lake za testiranje.
 */

export const FORM_WINDOWS = [3, 5, 10] as const;
export type FormWindow = (typeof FORM_WINDOWS)[number];
export const DEFAULT_FORM_WINDOW: FormWindow = 5;

export type Trend = "up" | "down" | "steady";

export type FormSummary = {
  /** Koliko je utakmica zaista ušlo u prosek (može biti manje od prozora na početku sezone). */
  games: number;
  /** Prosečan PIR u poslednjih N utakmica. */
  formPir: number;
  /** Razlika u odnosu na prosek sezone (pozitivno = bolje od proseka). */
  delta: number;
  trend: Trend;
};

/**
 * Prag za "u formi" / "van forme": razlika od bar 15% proseka sezone,
 * a najmanje 1.5 PIR. Apsolutni minimum sprečava da igrač sa prosekom 2
 * bude "u formi" zbog jedne utakmice sa PIR 3.
 */
const RELATIVE_THRESHOLD = 0.15;
const MIN_ABSOLUTE_THRESHOLD = 1.5;

export function trendFor(delta: number, seasonPir: number): Trend {
  const threshold = Math.max(
    Math.abs(seasonPir) * RELATIVE_THRESHOLD,
    MIN_ABSOLUTE_THRESHOLD,
  );
  if (delta >= threshold) return "up";
  if (delta <= -threshold) return "down";
  return "steady";
}

/**
 * @param pirByGame PIR po odigranoj utakmici, hronološki (najstarija prva)
 * @param window koliko poslednjih utakmica uzimamo
 * @param seasonPir prosek PIR-a za celu sezonu
 */
export function computeForm(
  pirByGame: number[],
  window: number,
  seasonPir: number,
): FormSummary | null {
  if (pirByGame.length === 0) return null;
  const recent = pirByGame.slice(-window);
  const formPir = recent.reduce((sum, pir) => sum + pir, 0) / recent.length;
  const delta = formPir - seasonPir;
  return { games: recent.length, formPir, delta, trend: trendFor(delta, seasonPir) };
}
