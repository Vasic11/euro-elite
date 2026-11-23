import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-xl font-black text-white">Not found</h1>
      <p className="text-sm text-gray-400">
        This player or page doesn&apos;t exist this season.
      </p>
      <Link
        href="/players"
        className="text-euro-neon text-xs font-bold tracking-wider uppercase hover:underline"
      >
        Back to players
      </Link>
    </div>
  );
}
