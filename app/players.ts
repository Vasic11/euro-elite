export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  nationality: string;
  height: string;
  weight?: string;
  born?: string;
  number: number;
  pir: number;
  ppg: number;
  rpg: number;
  apg: number;
  stl: string;
  bpg: number;
  eff: number;
  mpg: string;
  fg: string;
  tpt: string;
  ft: string;
  bio?: string;
  agency?: string;
  agent?: string;
}

// OVI NIZOVI SU NEDOSTAJALI I ZATO JE URAL GREŠKU:
export const POSITIONS = [
  "All Positions",
  "Guards",
  "Forwards",
  "Centers"
];

export const NATIONS = [
  "All Nations",
  "Serbia",
  "United States",
  "Spain",
  "France",
  "Greece",
  "Lithuania"
];

export const players: Player[] = [
  {
    id: "1",
    name: "Milos Teodosic",
    team: "Crvena Zvezda Meridianbet Belgrade",
    position: "PG",
    nationality: "Serbia",
    height: "196 cm",
    weight: "90 kg",
    born: "1987",
    number: 4,
    pir: 15.4,
    ppg: 10.2,
    rpg: 2.1,
    apg: 5.8,
    stl: "0.9",
    bpg: 0.1,
    eff: 15.4,
    mpg: "22:15",
    fg: "42%",
    tpt: "38%",
    ft: "88%",
    bio: "Milos Teodosic je jedan od najiskusnijih plejmejkera u Evroligi.",
    agency: "BeoBasket",
    agent: "Misko Raznatovic"
  },
  {
    id: "2",
    name: "Kevin Punter",
    team: "FC Barcelona",
    position: "SG",
    nationality: "United States",
    height: "193 cm",
    weight: "81 kg",
    born: "1993",
    number: 0,
    pir: 18.2,
    ppg: 16.5,
    rpg: 2.5,
    apg: 2.8,
    stl: "1.1",
    bpg: 0.2,
    eff: 18.2,
    mpg: "28:30",
    fg: "46%",
    tpt: "41%",
    ft: "92%",
    bio: "Kevin Punter važi za jednog od najboljih poentera na poziciji beka šutera.",
    agency: "Priority Sports",
    agent: "Mark Bartelstein"
  }
];