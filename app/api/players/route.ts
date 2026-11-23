import { NextResponse } from "next/server";

const EUROLEAGUE_INTERNAL_STATS = "https://live.euroleague.net/api/Statistics?gamecode=1&seasoncode=E2024&category=Validation";

export async function GET() {
  try {
    const response = await fetch(EUROLEAGUE_INTERNAL_STATS, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      next: { revalidate: 3600 }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        // --- SUTRA OVDE MAPIRAMO LIVE PODATKE ---
        // return NextResponse.json(mappedLivePlayers);
      }
    }

    // --- LOKALNA BAZA ZA RAZVOJ (Dok ne sredimo žive fajlove) ---
    const euroleagueDatabase = [
      // --- CRVENA ZVEZDA ---
      {
        id: "1", name: "Milos Teodosic", team: "Crvena Zvezda Meridianbet Belgrade", position: "PG",
        nationality: "Serbia", height: "196 cm", number: 4, pir: 15.4, ppg: 10.2, rpg: 2.1, apg: 5.8,
        stl: "0.9", bpg: 0.1, eff: 15.4, mpg: "22:15", fg: "42%", tpt: "38%", ft: "88%", bio: "Iskusni srpski plejmejker i mađioničar sa loptom."
      },
      {
        id: "11", name: "Nemanja Nedovic", team: "Crvena Zvezda Meridianbet Belgrade", position: "SG",
        nationality: "Serbia", height: "191 cm", number: 26, pir: 14.2, ppg: 12.8, rpg: 1.5, apg: 3.2,
        stl: "0.7", bpg: 0.1, eff: 14.2, mpg: "21:40", fg: "46%", tpt: "40%", ft: "89%", bio: "Eksplozivni bek šuter Crvene Zvezde sa sjajnim prodorom."
      },
      {
        id: "12", name: "Joel Bolomboy", team: "Crvena Zvezda Meridianbet Belgrade", position: "C",
        nationality: "Russia", height: "204 cm", number: 18, pir: 16.1, ppg: 10.5, rpg: 6.2, apg: 0.8,
        stl: "0.6", bpg: 1.2, eff: 16.1, mpg: "25:10", fg: "61%", tpt: "25%", ft: "76%", bio: "Snažni centar i stub odbrane crveno-belih."
      },
      // --- PARTIZAN ---
      {
        id: "13", name: "Carlik Jones", team: "Partizan Mozzart Bet Belgrade", position: "PG",
        nationality: "South Sudan", height: "185 cm", number: 0, pir: 15.8, ppg: 13.4, rpg: 2.9, apg: 4.8,
        stl: "1.1", bpg: 0.0, eff: 15.8, mpg: "27:15", fg: "48%", tpt: "36%", ft: "85%", bio: "Glavni organizator igre crno-belih i reprezentativac Južnog Sudana."
      },
      {
        id: "14", name: "Iffe Lundberg", team: "Partizan Mozzart Bet Belgrade", position: "SG",
        nationality: "Denmark", height: "193 cm", number: 1, pir: 12.5, ppg: 10.1, rpg: 2.4, apg: 2.7,
        stl: "0.9", bpg: 0.1, eff: 12.5, mpg: "22:30", fg: "44%", tpt: "37%", ft: "82%", bio: "Smireni bek poznat po pogađanju ključnih šuteva u završnicama."
      },
      {
        id: "15", name: "Tyrique Jones", team: "Partizan Mozzart Bet Belgrade", position: "C",
        nationality: "United States", height: "206 cm", number: 11, pir: 16.4, ppg: 12.0, rpg: 5.8, apg: 1.0,
        stl: "1.2", bpg: 0.8, eff: 16.4, mpg: "23:45", fg: "64%", tpt: "0%", ft: "71%", bio: "Eksplozivni centar Partizana, izuzetno opasan u skoku i pikenrolu."
      },
      // --- BARCELONA ---
      {
        id: "2", name: "Kevin Punter", team: "FC Barcelona", position: "SG",
        nationality: "United States", height: "193 cm", number: 0, pir: 18.2, ppg: 16.5, rpg: 2.5, apg: 2.8,
        stl: "1.1", bpg: 0.2, eff: 18.2, mpg: "28:30", fg: "46%", tpt: "41%", ft: "92%", bio: "Jedan od najubitačnijih poentera u modernoj istoriji takmičenja."
      },
      {
        id: "21", name: "Jan Vesely", team: "FC Barcelona", position: "C",
        nationality: "Czech Republic", height: "213 cm", number: 6, pir: 16.9, ppg: 11.7, rpg: 4.5, apg: 1.4,
        stl: "1.0", bpg: 0.6, eff: 16.9, mpg: "21:50", fg: "58%", tpt: "0%", ft: "81%", bio: "Leteći Čeh, bivši MVP Evrolige i izuzetan defanzivni centar."
      },
      // --- PANATHINAIKOS ---
      {
        id: "3", name: "Kendrick Nunn", team: "Panathinaikos AKTOR Athens", position: "PG",
        nationality: "United States", height: "191 cm", number: 25, pir: 17.5, ppg: 16.0, rpg: 2.7, apg: 3.2,
        stl: "0.9", bpg: 0.1, eff: 17.5, mpg: "27:45", fg: "45%", tpt: "40%", ft: "95%", bio: "Bivša NBA zvezda i nezaustavljivi poenter aktuelnog šampiona Evrope."
      },
      {
        id: "4", name: "Mathias Lessort", team: "Panathinaikos AKTOR Athens", position: "C",
        nationality: "France", height: "206 cm", number: 26, pir: 19.1, ppg: 13.9, rpg: 6.3, apg: 1.4,
        stl: "1.0", bpg: 0.9, eff: 19.1, mpg: "26:10", fg: "62%", tpt: "0%", ft: "68%", bio: "Energetska bomba u reketu i član idealne petorke Evrolige."
      },
      {
        id: "31", name: "Kostas Sloukas", team: "Panathinaikos AKTOR Athens", position: "PG",
        nationality: "Greece", height: "190 cm", number: 10, pir: 15.2, ppg: 11.2, rpg: 1.8, apg: 5.4,
        stl: "0.6", bpg: 0.0, eff: 15.2, mpg: "23:15", fg: "43%", tpt: "39%", ft: "89%", bio: "Prekaljeni grčki plejmejker i višestruki osvajač Evrolige."
      },
      // --- AS MONACO ---
      {
        id: "5", name: "Mike James", team: "AS Monaco", position: "PG",
        nationality: "United States", height: "185 cm", number: 5, pir: 21.3, ppg: 17.9, rpg: 4.1, apg: 5.1,
        stl: "1.2", bpg: 0.0, eff: 21.3, mpg: "31:15", fg: "48%", tpt: "39%", ft: "79%", bio: "Istorijski najbolji strelac Evrolige i nepredvidivi napadački genije."
      },
      // --- REAL MADRID ---
      {
        id: "6", name: "Facundo Campazzo", team: "Real Madrid", position: "PG",
        nationality: "Argentina", height: "181 cm", number: 7, pir: 19.5, ppg: 12.1, rpg: 2.5, apg: 6.8,
        stl: "1.6", bpg: 0.0, eff: 19.5, mpg: "26:20", fg: "45%", tpt: "35%", ft: "90%", bio: "Argentinski mađioničar, motor i srce ekipe Real Madrida."
      },
      {
        id: "61", name: "Walter Tavares", team: "Real Madrid", position: "C",
        nationality: "Cape Verde", height: "220 cm", number: 22, pir: 18.3, ppg: 10.4, rpg: 7.5, apg: 1.2,
        stl: "0.5", bpg: 2.1, eff: 18.3, mpg: "24:10", fg: "67%", tpt: "0%", ft: "72%", bio: "Najdominantniji bloker i defanzivna sila evropske košarke."
      },
      // --- FENERBAHCE ---
      {
        id: "7", name: "Wade Baldwin IV", team: "Fenerbahce Beko Istanbul", position: "SG",
        nationality: "United States", height: "193 cm", number: 4, pir: 16.8, ppg: 14.2, rpg: 2.8, apg: 4.0,
        stl: "1.0", bpg: 0.2, eff: 16.8, mpg: "27:20", fg: "47%", tpt: "35%", ft: "82%", bio: "Fizički moćan bek sa elitnim poludistancom i odbranom."
      },
      {
        id: "71", name: "Nigel Hayes-Davis", team: "Fenerbahce Beko Istanbul", position: "SF",
        nationality: "United States", height: "203 cm", number: 11, pir: 17.2, ppg: 15.5, rpg: 4.8, apg: 1.8,
        stl: "1.1", bpg: 0.2, eff: 17.2, mpg: "30:50", fg: "49%", tpt: "42%", ft: "84%", bio: "Rekorder Evrolige sa 50 ubačenih poena na jednom meču."
      },
      // --- ANADOLU EFES ---
      {
        id: "8", name: "Shane Larkin", team: "Anadolu Efes Istanbul", position: "PG",
        nationality: "United States", height: "182 cm", number: 0, pir: 19.9, ppg: 16.8, rpg: 2.8, apg: 5.1,
        stl: "1.3", bpg: 0.1, eff: 19.9, mpg: "32:10", fg: "45%", tpt: "39%", ft: "90%", bio: "Jedan od najbržih i najtrofejnijih bekova u modernoj eri takmičenja."
      },
      // --- OLYMPIACOS ---
      {
        id: "91", name: "Sasha Vezenkov", team: "Olympiacos Piraeus", position: "PF",
        nationality: "Bulgaria", height: "206 cm", number: 14, pir: 22.1, ppg: 18.2, rpg: 5.5, apg: 1.9,
        stl: "0.9", bpg: 0.2, eff: 22.1, mpg: "28:15", fg: "54%", tpt: "41%", ft: "87%", bio: "Bivši MVP Evrolige poznat po nestvarnom kretanju bez lopte i brzom šutu."
      },
      {
        id: "92", name: "Evan Fournier", team: "Olympiacos Piraeus", position: "SF",
        nationality: "France", height: "198 cm", number: 94, pir: 14.8, ppg: 13.5, rpg: 2.1, apg: 2.4,
        stl: "0.8", bpg: 0.1, eff: 14.8, mpg: "24:30", fg: "44%", tpt: "38%", ft: "83%", bio: "Dugogodišnji NBA veteran koji donosi elitni šut i iskustvo u Pirej."
      }
    ];

    return NextResponse.json(euroleagueDatabase);

  } catch (error: any) {
    console.error("Greška na API ruti:", error.message);
    return NextResponse.json({ error: "Neuspešno učitavanje podataka" }, { status: 500 });
  }
}