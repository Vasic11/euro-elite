import { DISPLAY_TIME_ZONE } from "./config";
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

/**
 * Priprema tekst za pretragu: mala slova, bez kvačica.
 * "đ" nije slovo sa kvačicom u Unicode-u (NFD ga ne razlaže), pa ga menjamo ručno.
 * Ljudi ga kucaju kao "dj" ili "d", pa oba svodimo na "d". Pošto se isto pravilo
 * primenjuje i na ime i na upit, "djordjevic", "dordevic" i "Đorđević" se poklapaju.
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/dj/g, "d");
}

/**
 * Deli ime na ime i prezime za prikaz u stilu "Sasha / VEZENKOV".
 * Prva reč je ime, ostatak prezime ("Nigel Hayes-Davis", "Nando De Colo" -> "De Colo").
 */
export function splitName(name: string): { first: string; last: string } {
  const space = name.indexOf(" ");
  if (space === -1) return { first: "", last: name };
  return { first: name.slice(0, space), last: name.slice(space + 1) };
}

export const POSITION_LABEL: Record<Position, string> = {
  Guard: "Guard",
  Forward: "Forward",
  Center: "Center",
};

const gameDateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});

/** "2026-11-24T18:00:00Z" -> "Tue 24 Nov, 19:00" (beogradsko vreme). */
export function formatGameDate(iso: string): string {
  return gameDateFormat.format(new Date(iso));
}
