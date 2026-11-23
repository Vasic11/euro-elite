"use client";

import { useEffect, useRef, useState } from "react";

type Option<T extends string> = { value: T; label: string };

/**
 * Padajući meni u stilu aplikacije.
 * Svaki Dropdown sam vodi računa o tome da li je otvoren, pa roditelj ne mora
 * da drži isPosOpen/isNatOpen. Zatvara se klikom van menija ili na Escape.
 */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  align = "left",
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  label: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // Cleanup: uklanjamo listenere kad se meni zatvori ili komponenta nestane.
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="border-euro-border-soft bg-euro-bg flex min-w-[150px] items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-bold text-gray-300 transition select-none hover:border-gray-600"
      >
        <span>{current?.label}</span>
        <span className="ml-2 text-[9px] text-gray-500">▼</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className={`border-euro-border bg-euro-card absolute top-full z-50 mt-2 max-h-64 w-52 overflow-y-auto rounded-xl border p-1 shadow-2xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`hover:bg-euro-neon w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition hover:text-black ${
                  option.value === value ? "text-euro-neon" : ""
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
