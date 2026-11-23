/** Prikazuje se odmah dok serverska stranica čeka podatke (Suspense fallback). */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="bg-euro-card h-9 w-64 animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="border-euro-border bg-euro-card h-[340px] animate-pulse rounded-2xl border"
          />
        ))}
      </div>
    </div>
  );
}
