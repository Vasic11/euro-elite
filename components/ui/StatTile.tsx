/** Jedna statistika: velika vrednost i labela ispod. */
export function StatTile({
  label,
  value,
  suffix,
  accent = false,
  size = "lg",
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
  size?: "lg" | "sm";
}) {
  const big = size === "lg";
  return (
    <div
      className={`flex flex-col-reverse ${big ? "border-t-2 pt-2" : "border-t pt-2"} ${accent ? "border-accent" : "border-line"}`}
    >
      <dt className={`${big ? "text-sm" : "text-xs"} text-ink-muted`}>{label}</dt>
      <dd
        className={`font-display leading-none font-bold ${big ? "text-5xl" : "text-3xl"} ${accent ? "text-accent-ink" : ""}`}
      >
        {value}
        {suffix && (
          <span className="text-ink-faint ml-0.5 text-lg font-semibold">{suffix}</span>
        )}
      </dd>
    </div>
  );
}
