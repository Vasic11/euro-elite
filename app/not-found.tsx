import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="font-display text-4xl font-extrabold uppercase">Player not found</h1>
      <p className="mt-3 text-ink-muted">
        There&apos;s no player with this link on a EuroLeague roster this season.
      </p>
      <Link
        href="/players"
        className="mt-6 inline-flex h-12 items-center rounded-md bg-accent px-6 font-display text-lg font-bold text-ink hover:bg-[#ff8128]"
      >
        Browse players
      </Link>
    </div>
  );
}
