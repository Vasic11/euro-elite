// npm run db:last-sync: the latest rows of `sync_runs`, to check the sync from
// the terminal. Reads DATABASE_URL_POOLED from .env.local (node --env-file) and
// never prints it.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_POOLED;
if (!url) {
  console.error("DATABASE_URL_POOLED is not set (is it in .env.local?)");
  process.exit(1);
}

/** "2 h 05 min ago" from a timestamp. */
function age(date) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  return h > 0
    ? `${h} h ${String(minutes % 60).padStart(2, "0")} min ago`
    : `${minutes} min ago`;
}

try {
  const rows = await neon(url)`
    select id, started_at, finished_at, status, games_synced, box_scores_failed, error
    from sync_runs order by id desc limit 5`;

  if (rows.length === 0) {
    console.log("sync_runs is empty: no sync has run yet.");
  } else {
    console.table(
      rows.map((r) => ({
        id: r.id,
        started:
          new Date(r.started_at).toISOString().slice(0, 19).replace("T", " ") + " UTC",
        age: age(r.started_at),
        seconds: r.finished_at
          ? ((new Date(r.finished_at) - new Date(r.started_at)) / 1000).toFixed(1)
          : "-",
        status: r.status,
        games: r.games_synced,
        failed: r.box_scores_failed,
        error: r.error ?? "",
      })),
    );
  }
} catch (error) {
  // Driver errors can contain the connection string.
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]"));
  process.exit(1);
}
