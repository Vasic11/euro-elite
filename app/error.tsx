"use client"; // Error boundary mora biti klijentska komponenta

/**
 * Hvata greške iz stranica, npr. kad EuroLeague API ne odgovara.
 * U Next 16 se ponovni pokušaj radi preko unstable_retry (stari `reset` ne pribavlja podatke ponovo).
 */
export default function Error({
  unstable_retry,
}: {
  error: Error;
  unstable_retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="font-display text-4xl font-extrabold uppercase">
        Stats didn&apos;t load
      </h1>
      <p className="text-ink-muted mt-3">
        The EuroLeague data service didn&apos;t respond. This is usually temporary.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="bg-accent font-display text-ink mt-6 inline-flex h-12 items-center rounded-md px-6 text-lg font-bold hover:bg-[#ff8128]"
      >
        Try again
      </button>
    </div>
  );
}
