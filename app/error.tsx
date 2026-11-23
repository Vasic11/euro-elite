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
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-xl font-black text-white">
        Couldn&apos;t load EuroLeague data
      </h1>
      <p className="text-sm text-gray-400">
        The EuroLeague API isn&apos;t responding right now. Try again in a moment.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="bg-euro-neon rounded-xl px-5 py-2.5 text-xs font-black text-black uppercase hover:brightness-110"
      >
        Try again
      </button>
    </div>
  );
}
