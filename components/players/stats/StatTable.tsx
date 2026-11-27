import type { ReactNode } from "react";

import { formatMinutes, type StatRow } from "@/lib/stats/boxScore";

/** A stat column: `group` puts it under a shared header (2FG, REB, ...). */
type Column = {
  key: string;
  header: string;
  /** Full name for the tooltip and screen readers. */
  title: string;
  group?: string;
  cell: (row: StatRow) => string;
  /** Only in the season table (one row per game makes them pointless). */
  seasonOnly?: boolean;
};

/** Averages with one decimal, totals as whole numbers. */
const num = (row: StatRow, value: number) =>
  row.mode === "averages" ? value.toFixed(1) : String(Math.round(value));
const pct = (value: number | null) => (value == null ? "—" : value.toFixed(1));
const signed = (row: StatRow, value: number) => {
  const text = num(row, value);
  return value > 0 ? `+${text}` : text;
};
const madeAtt = (row: StatRow, made: number, att: number) =>
  `${num(row, made)}-${num(row, att)}`;

const COLUMNS: Column[] = [
  {
    key: "gp",
    header: "GP",
    title: "Games played",
    cell: (r) => String(r.games),
    seasonOnly: true,
  },
  {
    key: "gs",
    header: "GS",
    title: "Games started",
    cell: (r) => String(r.starts),
    seasonOnly: true,
  },
  {
    key: "min",
    header: "MIN",
    title: "Minutes",
    cell: (r) => formatMinutes(r.values.seconds),
  },
  { key: "pts", header: "PTS", title: "Points", cell: (r) => num(r, r.values.points) },
  {
    key: "2ma",
    header: "M-A",
    title: "Two-pointers made-attempted",
    group: "2FG",
    cell: (r) => madeAtt(r, r.values.twoMade, r.values.twoAttempted),
  },
  {
    key: "2p",
    header: "%",
    title: "Two-point percentage",
    group: "2FG",
    cell: (r) => pct(r.twoPct),
  },
  {
    key: "3ma",
    header: "M-A",
    title: "Three-pointers made-attempted",
    group: "3FG",
    cell: (r) => madeAtt(r, r.values.threeMade, r.values.threeAttempted),
  },
  {
    key: "3p",
    header: "%",
    title: "Three-point percentage",
    group: "3FG",
    cell: (r) => pct(r.threePct),
  },
  {
    key: "fma",
    header: "M-A",
    title: "Free throws made-attempted",
    group: "FT",
    cell: (r) => madeAtt(r, r.values.ftMade, r.values.ftAttempted),
  },
  {
    key: "fp",
    header: "%",
    title: "Free throw percentage",
    group: "FT",
    cell: (r) => pct(r.ftPct),
  },
  {
    key: "or",
    header: "OR",
    title: "Offensive rebounds",
    group: "REB",
    cell: (r) => num(r, r.values.offRebounds),
  },
  {
    key: "dr",
    header: "DR",
    title: "Defensive rebounds",
    group: "REB",
    cell: (r) => num(r, r.values.defRebounds),
  },
  {
    key: "tr",
    header: "TR",
    title: "Total rebounds",
    group: "REB",
    cell: (r) => num(r, r.values.rebounds),
  },
  { key: "ast", header: "AST", title: "Assists", cell: (r) => num(r, r.values.assists) },
  { key: "stl", header: "STL", title: "Steals", cell: (r) => num(r, r.values.steals) },
  {
    key: "to",
    header: "TO",
    title: "Turnovers",
    cell: (r) => num(r, r.values.turnovers),
  },
  {
    key: "fv",
    header: "FV",
    title: "Blocks made",
    group: "BLK",
    cell: (r) => num(r, r.values.blocks),
  },
  {
    key: "ag",
    header: "AG",
    title: "Shots blocked by opponents",
    group: "BLK",
    cell: (r) => num(r, r.values.blocksAgainst),
  },
  {
    key: "cm",
    header: "CM",
    title: "Fouls committed",
    group: "FOULS",
    cell: (r) => num(r, r.values.foulsCommitted),
  },
  {
    key: "rv",
    header: "RV",
    title: "Fouls drawn",
    group: "FOULS",
    cell: (r) => num(r, r.values.foulsDrawn),
  },
  {
    key: "pm",
    header: "+/-",
    title: "Plus-minus",
    cell: (r) => signed(r, r.values.plusMinus),
  },
  {
    key: "pir",
    header: "PIR",
    title: "Performance index rating",
    cell: (r) => num(r, r.values.pir),
  },
];

/** Consecutive columns of the same group, or a single column without one. */
type Segment = { group?: string; columns: Column[] };

function segmentsOf(columns: Column[]): Segment[] {
  const segments: Segment[] = [];
  for (const column of columns) {
    const last = segments.at(-1);
    if (column.group && last?.group === column.group) last.columns.push(column);
    else segments.push({ group: column.group, columns: [column] });
  }
  return segments;
}

/** A non-stat column before the stats (e.g. the result in the game log). */
export type ExtraColumn<T> = { header: string; cell: (item: T) => ReactNode };

const STICKY =
  "sticky left-0 z-10 bg-paper shadow-[inset_-1px_0_0_var(--color-line)] group-hover/row:bg-canvas";
const NUM = "px-2 py-2.5 text-right whitespace-nowrap tabular-nums";
const PIR = "bg-accent-soft font-display text-base font-bold";

/**
 * A euroleague.net style stat table: grouped headers (2FG, 3FG, FT, REB, BLK,
 * FOULS), right-aligned tabular numbers, and a sticky first column so the row
 * stays readable while the stats scroll sideways on a phone.
 */
export function StatTable<T>({
  caption,
  items,
  getKey,
  getRow,
  lead,
  extra = [],
  variant,
  emphasize,
}: {
  caption: string;
  items: T[];
  getKey: (item: T) => string;
  getRow: (item: T) => StatRow;
  /** The sticky first column; its cells are row headers. */
  lead: ExtraColumn<T>;
  extra?: ExtraColumn<T>[];
  variant: "season" | "games";
  /** Bold rows, e.g. the total after a transfer. */
  emphasize?: (item: T) => boolean;
}) {
  const columns = COLUMNS.filter((c) => variant === "season" || !c.seasonOnly);
  const segments = segmentsOf(columns);
  // A group starts with a thin line on its left, so the eye can follow it down.
  const groupStart = new Set(
    segments.filter((s) => s.group).map((s) => s.columns[0].key),
  );
  const afterGroup = new Set(
    segments
      .map((s, i) => (segments[i - 1]?.group ? s.columns[0].key : null))
      .filter((k): k is string => k != null),
  );
  const edge = (key: string) =>
    groupStart.has(key) || afterGroup.has(key) ? "border-l border-line" : "";

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col />
          {extra.map((c) => (
            <col key={c.header} />
          ))}
        </colgroup>
        {segments.map((s) =>
          s.group ? (
            <colgroup key={s.columns[0].key} span={s.columns.length} />
          ) : (
            <colgroup key={s.columns[0].key}>
              <col />
            </colgroup>
          ),
        )}

        <thead className="font-display text-[13px] font-semibold text-ink-muted">
          <tr>
            <th
              scope="col"
              rowSpan={2}
              className={`${STICKY} border-b border-line px-3 py-2 text-left align-bottom`}
            >
              {lead.header}
            </th>
            {extra.map((c) => (
              <th
                key={c.header}
                scope="col"
                rowSpan={2}
                className="border-b border-line px-2 py-2 text-left align-bottom"
              >
                {c.header}
              </th>
            ))}
            {segments.map((s) =>
              s.group ? (
                <th
                  key={s.columns[0].key}
                  scope="colgroup"
                  colSpan={s.columns.length}
                  className="border-l border-line px-2 pt-2 text-center text-ink"
                >
                  <span className="block border-b-2 border-accent pb-1">{s.group}</span>
                </th>
              ) : (
                <th
                  key={s.columns[0].key}
                  scope="col"
                  rowSpan={2}
                  className={`border-b border-line px-2 py-2 text-right align-bottom ${edge(s.columns[0].key)} ${
                    s.columns[0].key === "pir" ? "bg-accent-soft text-ink" : ""
                  }`}
                >
                  <abbr title={s.columns[0].title} className="no-underline">
                    {s.columns[0].header}
                  </abbr>
                </th>
              ),
            )}
          </tr>
          <tr>
            {columns
              .filter((c) => c.group)
              .map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`border-b border-line px-2 py-1.5 text-right ${edge(c.key)}`}
                >
                  <abbr title={c.title} className="no-underline">
                    {c.header}
                  </abbr>
                </th>
              ))}
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const row = getRow(item);
            const strong = emphasize?.(item) ?? false;
            return (
              <tr
                key={getKey(item)}
                className={`group/row hover:bg-canvas ${strong ? "font-semibold" : ""}`}
              >
                <th
                  scope="row"
                  className={`${STICKY} border-b border-line px-3 py-2 text-left font-normal ${
                    strong ? "font-semibold" : ""
                  }`}
                >
                  {lead.cell(item)}
                </th>
                {extra.map((c) => (
                  <td
                    key={c.header}
                    className="border-b border-line px-2 py-2.5 whitespace-nowrap"
                  >
                    {c.cell(item)}
                  </td>
                ))}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`border-b border-line ${NUM} ${edge(c.key)} ${
                      c.key === "pir" ? PIR : ""
                    } ${c.key === "min" ? "text-ink-muted" : ""}`}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
