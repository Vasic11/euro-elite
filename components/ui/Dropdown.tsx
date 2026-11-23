"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Option<T extends string> = { value: T; label: string };

/**
 * Padajući meni u stilu aplikacije.
 * Svaki Dropdown sam vodi računa o tome da li je otvoren.
 * Zatvara se klikom van menija ili na Escape.
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
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 min-w-[150px] items-center justify-between gap-3 rounded-md border border-line bg-paper px-3.5 text-left text-sm transition-colors hover:border-ink/30"
      >
        <span>
          <span className="text-ink-faint">{label}: </span>
          <span className="font-semibold">{current?.label}</span>
        </span>
        <svg
          viewBox="0 0 12 12"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
            role="listbox"
            aria-label={label}
            className={`absolute top-full z-50 mt-1.5 max-h-72 w-56 overflow-y-auto rounded-md border border-line bg-paper p-1 shadow-lg ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors hover:bg-canvas ${
                      selected ? "font-semibold text-accent-ink" : ""
                    }`}
                  >
                    {option.label}
                    {selected && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
