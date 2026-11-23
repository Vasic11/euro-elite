"use client";

import { motion } from "framer-motion";
import { useId } from "react";

/**
 * Grupa dugmadi gde je uvek tačno jedno izabrano (npr. pozicija, sortiranje).
 * Sve opcije se vide odmah (jedan klik manje nego meni), a beli "jastučić"
 * glatko klizne do izabrane opcije.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  // Svaka grupa ima svoj layoutId, da se jastučići dve grupe ne mešaju.
  const id = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-canvas p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative rounded-full px-3.5 py-1.5 font-display text-base font-semibold transition-colors ${
              selected ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-full bg-paper shadow-[0_1px_3px_rgb(0_0_0/0.15)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
