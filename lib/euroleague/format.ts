import type { Position } from "./types";

/**
 * API vraća imena kao "PREZIME, IME" velikim slovima.
 * Pretvaramo u "Ime Prezime": "DE COLO, NANDO" -> "Nando De Colo".
 */
export function formatPersonName(raw: string): string {
  const [last, first] = raw.split(",").map((part) => part.trim());
  const full = first ? `${first} ${last}` : last;
  return full
    .toLowerCase()
    .replace(
      /(^|[\s\-'’.])(\p{L})/gu,
      (_, sep: string, ch: string) => sep + ch.toUpperCase(),
    );
}

/** Prosek sa jednom decimalom: 12.3456 -> "12.3". */
export function formatStat(value: number | undefined | null): string {
  return value == null ? "—" : value.toFixed(1);
}

export const POSITION_SHORT: Record<Position, string> = {
  Guard: "G",
  Forward: "F",
  Center: "C",
};

/** Godine na osnovu datuma rođenja ("1999-09-17T00:00:00"). */
export function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const hadBirthday =
    now.getMonth() > born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate());
  if (!hadBirthday) age--;
  return age;
}

/** Uklanja kvačice i velika slova, da "petrusev" nađe "Petrušev". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
