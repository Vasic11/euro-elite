/** Prikazuje se odmah dok serverska stranica čeka podatke (Suspense fallback). */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 h-14 w-64 animate-pulse rounded bg-line" />
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="aspect-[4/5.6] animate-pulse rounded-lg bg-paper ring-1 ring-line"
          />
        ))}
      </div>
    </div>
  );
}
