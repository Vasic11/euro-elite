/** Kvadrat sa jednom statistikom (velika vrednost + mala labela). */
export function StatTile({
  label,
  value,
  suffix,
  highlight = false,
  size = "lg",
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
  size?: "lg" | "sm";
}) {
  const big = size === "lg";
  return (
    <div
      className={`border-euro-border flex flex-col justify-between border ${
        big
          ? "bg-euro-card min-h-[105px] rounded-2xl p-5"
          : "bg-euro-bg/60 min-h-[80px] rounded-xl p-4"
      }`}
    >
      <div
        className={`flex items-baseline font-mono leading-none font-black ${big ? "text-4xl" : "text-2xl"} ${
          highlight ? "text-euro-neon" : "text-white"
        }`}
      >
        {value}
        {suffix && (
          <span className="ml-0.5 text-sm font-normal text-gray-500">{suffix}</span>
        )}
      </div>
      <div className="font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase">
        {label}
      </div>
    </div>
  );
}
