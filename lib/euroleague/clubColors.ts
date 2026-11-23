/**
 * Primarne boje klubova. API ih ne vraća, pa ih čuvamo sami.
 * Boje su približne (iz dresova i grbova). Ako neka ne odgovara, menja se samo ovde.
 * Ključ je kod kluba iz API-ja (/v2/.../clubs).
 */
const CLUB_COLORS: Record<string, string> = {
  ASV: "#3d434c", // LDLC ASVEL (grafit, kao njihov crno-sivi grb)
  BAR: "#a50044", // FC Barcelona
  BAS: "#213a70", // Baskonia
  BES: "#1a1a1a", // Besiktas
  DUB: "#23314a", // Dubai
  HTA: "#e21c23", // Hapoel Tel Aviv
  IST: "#0a3d8f", // Anadolu Efes
  MAD: "#2c5bb5", // Real Madrid
  MIL: "#d6001c", // Olimpia Milano
  MUN: "#dc052d", // Bayern
  OLY: "#e2001a", // Olympiacos
  PAM: "#eb6608", // Valencia
  PAN: "#00843d", // Panathinaikos
  PAR: "#1a1a1a", // Partizan
  PRS: "#2b2d6e", // Paris
  RED: "#d2122e", // Crvena Zvezda
  TEL: "#ffd100", // Maccabi
  ULK: "#102a5c", // Fenerbahce
  VIR: "#1a1a1a", // Virtus
  ZAL: "#006b3a", // Zalgiris
};

/** Boja kluba; za nepoznat klub vraća narandžastu boju sajta. */
export function clubColor(code: string): string {
  return CLUB_COLORS[code] ?? "#f56e0f";
}
