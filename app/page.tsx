"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { POSITIONS, NATIONS, Player } from "@/app/players";

// Statički uvoz tvog JSON-a
import playersDataRaw from "./players_image4.json";

type ExtendedPlayer = Player & {
  image?: string;
  weight?: string;
  born?: string;
  contract?: string;
  bio?: string;
  agency?: string;
  agent?: string;
  mpg?: string;
  fg?: string;
  tpt?: string;
  ft?: string;
  stl?: string;
  [key: string]: any; 
};

const initialPlayers = (playersDataRaw as unknown) as ExtendedPlayer[];

const FALLBACK_PLAYER_IMAGE = "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=500&auto=format&fit=crop";

const getCleanTeamName = (teamString: string | undefined): string => {
  if (!teamString) return "Free Agent / Unassigned";
  const teams = teamString.split(";").map(t => t.trim());
  return teams[teams.length - 1] || "Free Agent / Unassigned";
};

const getPlayerNumber = (player: ExtendedPlayer) => {
  if (!player) return "??";
  if (player.number !== undefined && player.number !== null) {
    const cleanNum = player.number.toString().trim();
    if (cleanNum !== "" && cleanNum !== "0" && cleanNum !== "00" && !cleanNum.startsWith("-")) {
      return cleanNum;
    }
  }
  return "??"; 
};

// ================= Sinhronizovan redosled osa u krug sa tekstualnim labelama =================
// 0: PPG (Gore), 1: RPG, 2: APG, 3: SPG (Dolje), 4: BPG, 5: EFF
const getRadarCoordinates = (player: ExtendedPlayer) => {
  const center = 150;
  const maxRadius = 100;
  const maxValues = { ppg: 25, rpg: 10, apg: 8, spg: 2.5, bpg: 2.0, eff: 25 };

  const stats = [
    (Number(player.ppg) || 0) / maxValues.ppg,
    (Number(player.rpg) || 0) / maxValues.rpg,
    (Number(player.apg) || 0) / maxValues.apg,
    (parseFloat(player.stl || player.spg || player.steals || "0")) / maxValues.spg, 
    (Number(player.bpg) || 0) / maxValues.bpg,
    (Number(player.eff) || Number(player.pir) || 0) / maxValues.eff,
  ];

  return stats.map((statPercent, index) => {
    const ratio = Math.min(Math.max(statPercent, 0.15), 1); 
    const radius = maxRadius * ratio;
    const angle = (index * (2 * Math.PI)) / 6 - Math.PI / 2; // -Math.PI / 2 postavlja PPG tačno na vrh
    return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
  }).join(" ");
};

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedPos: string;
  setSelectedPos: (val: string) => void;
  selectedNat: string;
  setSelectedNat: (val: string) => void;
  isPosOpen: boolean;
  setIsPosOpen: (val: boolean) => void;
  isNatOpen: boolean;
  setIsNatOpen: (val: boolean) => void;
}

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedPos,
  setSelectedPos,
  selectedNat,
  setSelectedNat,
  isPosOpen,
  setIsPosOpen,
  isNatOpen,
  setIsNatOpen,
}: FilterBarProps) => (
  <div className="bg-[#11161e] border border-[#1e2530] p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center space-x-2 bg-[#090d12] border border-[#1c232e] px-4 py-2.5 rounded-xl flex-1">
      <span className="text-gray-500 text-sm">🔍</span>
      <input 
        type="text" 
        placeholder="Search player name, team..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-gray-600 font-medium"
      />
    </div>

    <div className="flex items-center gap-2 relative">
      <div className="relative">
        <button onClick={() => { setIsPosOpen(!isPosOpen); setIsNatOpen(false); }} className="bg-[#090d12] border border-[#1c232e] text-gray-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-between min-w-[150px] hover:border-gray-600 transition select-none">
          <span>{selectedPos}</span> <span className="text-[9px] ml-2 text-gray-500">▼</span>
        </button>
        {isPosOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-[#11161e] border border-[#1e2530] rounded-xl shadow-2xl p-1 z-50">
            {POSITIONS.map((pos) => (
              <div key={pos} onClick={() => { setSelectedPos(pos); setIsPosOpen(false); }} className="px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-[#d4f03d] hover:text-black transition">{pos}</div>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button onClick={() => { setIsNatOpen(!isNatOpen); setIsPosOpen(false); }} className="bg-[#090d12] border border-[#1c232e] text-gray-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-between min-w-[150px] hover:border-gray-600 transition select-none">
          <span>{selectedNat}</span> <span className="text-[9px] ml-2 text-gray-500">▼</span>
        </button>
        {isNatOpen && (
          <div className="absolute top-full right-0 mt-2 w-52 max-h-56 overflow-y-auto bg-[#11161e] border border-[#1e2530] rounded-xl shadow-2xl p-1 z-50">
            {NATIONS.map((nat) => (
              <div key={nat} onClick={() => { setSelectedNat(nat); setIsNatOpen(false); }} className="px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-[#d4f03d] hover:text-black transition">{nat}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function Home() {
  const [playersData] = useState<ExtendedPlayer[]>(initialPlayers);
  const [activeTab, setActiveTab] = useState("Scouting Hub");

  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isNatOpen, setIsNatOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState("All Positions");
  const [selectedNat, setSelectedNat] = useState("All Nations");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"pir" | "ppg" | "rpg" | "apg">("pir");
  
  const [activePlayerView, setActivePlayerView] = useState<ExtendedPlayer | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const handleOpenProfile = (player: ExtendedPlayer) => {
    setActivePlayerView(player);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseProfile = () => {
    setActivePlayerView(null);
  };

  const processedPlayers = useMemo(() => {
    return playersData.filter((player) => {
      const cleanTeam = getCleanTeamName(player.team);
      const matchesSearch = 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cleanTeam.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesPosition = false;
      const pPos = player.position ? player.position.toUpperCase() : "";

      if (selectedPos === "All Positions") matchesPosition = true;
      else if (selectedPos === "Guards" || selectedPos === "Point Guard" || selectedPos === "Shooting Guard") matchesPosition = pPos.includes("G");
      else if (selectedPos === "Forwards" || selectedPos === "Small Forward" || selectedPos === "Power Forward") matchesPosition = pPos.includes("F");
      else if (selectedPos === "Centers" || selectedPos === "Center") matchesPosition = pPos === "C";

      const matchesNation = selectedNat === "All Nations" || player.nationality === selectedNat;
      return matchesSearch && matchesPosition && matchesNation;
    }).sort((a, b) => (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0));
  }, [playersData, searchQuery, selectedPos, selectedNat, sortBy]);

  const teamsGrouped = useMemo(() => {
    const groups: { [key: string]: ExtendedPlayer[] } = {};
    
    playersData.forEach(p => {
      const teamKey = getCleanTeamName(p.team);
      if (!groups[teamKey]) groups[teamKey] = [];
      groups[teamKey].push(p);
    });

    return Object.entries(groups).map(([teamName, pList]) => {
      const avgPir = pList.reduce((sum, pl) => sum + (Number(pl.pir) || 0), 0) / pList.length;
      return { teamName, players: pList, avgPir: avgPir.toFixed(1) };
    }).sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [playersData]);

  return (
    <main className="min-h-screen bg-[#090d12] text-white pb-24 overflow-x-hidden antialiased selection:bg-[#d4f03d] selection:text-black">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#090d12]/85 backdrop-blur-md border-b border-[#181f29] px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => { setActiveTab("Scouting Hub"); handleCloseProfile(); }}>
            <span className="text-[#d4f03d] text-lg font-black tracking-widest flex items-center gap-1">
              <span className="text-white">🏀</span> EUROELITE
            </span>
          </div>
          
          <nav className="flex items-center space-x-1 bg-[#11161e] p-1 rounded-xl border border-[#1c232e]">
            {["Scouting Hub", "Players", "Teams"].map((tab) => {
              const isActive = activeTab === tab && !activePlayerView;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); handleCloseProfile(); }}
                  className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive ? "text-black z-10" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-[#d4f03d] rounded-lg -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 33 }}
                    />
                  )}
                  {tab}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activePlayerView ? (
          
          /* ================= DETALJNI PROFIL IGRAČA ================= */
          <motion.div
            key="profile-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="max-w-7xl mx-auto px-8 pt-10"
          >
            <button 
              onClick={handleCloseProfile}
              className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 flex items-center space-x-2 transition cursor-pointer select-none"
            >
              <span>🡨</span> <span>Back to players</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEVA STRANA: SLIKA IGRAČA */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#11161e] border border-[#1e2530] h-[440px] rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
                  <img 
                    src={activePlayerView.image || FALLBACK_PLAYER_IMAGE} 
                    alt={activePlayerView.name} 
                    className="h-full w-full object-cover object-top" 
                  />
                  <span className="absolute bottom-6 left-6 bg-[#d4f03d] text-black font-black text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg z-10">
                    {activePlayerView.position}
                  </span>
                </div>
                
                {/* Meta detalji */}
                <div className="bg-[#11161e] border border-[#1e2530] rounded-2xl p-2.5 space-y-1 shadow-lg font-medium text-xs">
                  <div className="flex justify-between p-3 rounded-xl bg-[#090d12]/40">
                    <span className="text-gray-500">Nationality</span>
                    <span className="font-bold text-white">{activePlayerView.nationality || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#090d12]/40">
                    <span className="text-gray-500">Height</span>
                    <span className="font-bold text-white">{activePlayerView.height || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#090d12]/40">
                    <span className="text-gray-500">Weight</span>
                    <span className="font-bold text-white">{activePlayerView.weight || "101 kg"}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#090d12]/40">
                    <span className="text-gray-500">Born</span>
                    <span className="font-bold text-white">{activePlayerView.born || "1996"}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#090d12]/40">
                    <span className="text-gray-500">Team</span>
                    <span className="font-bold text-[#d4f03d]">{getCleanTeamName(activePlayerView.team)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#090d12]/40">
                    <span className="text-gray-500">Jersey</span>
                    <span className="font-bold text-white">#{getPlayerNumber(activePlayerView)}</span>
                  </div>
                </div>
              </div>

              {/* DESNA STRANA: PODACI */}
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <h1 className="text-6xl font-black tracking-tight text-white leading-none">{activePlayerView.name}</h1>
                  <p className="text-gray-500 text-sm font-bold mt-2 uppercase tracking-widest">{getCleanTeamName(activePlayerView.team)} • #{getPlayerNumber(activePlayerView)}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#11161e] border border-[#1e2530] p-5 rounded-2xl flex flex-col justify-between min-h-[105px]">
                    <div className="text-4xl font-black text-[#d4f03d] font-mono leading-none">{activePlayerView.ppg || "0.0"}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Points</div>
                  </div>
                  <div className="bg-[#11161e] border border-[#1e2530] p-5 rounded-2xl flex flex-col justify-between min-h-[105px]">
                    <div className="text-4xl font-black text-white font-mono leading-none">{activePlayerView.rpg || "0.0"}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Rebounds</div>
                  </div>
                  <div className="bg-[#11161e] border border-[#1e2530] p-5 rounded-2xl flex flex-col justify-between min-h-[105px]">
                    <div className="text-4xl font-black text-white font-mono leading-none">{activePlayerView.apg || "0.0"}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Assists</div>
                  </div>
                  <div className="bg-[#11161e] border border-[#1e2530] p-5 rounded-2xl flex flex-col justify-between min-h-[105px]">
                    <div className="text-4xl font-black text-[#d4f03d] font-mono leading-none">{activePlayerView.pir || activePlayerView.eff || "0.0"}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">PIR</div>
                  </div>
                </div>

                {/* Radar dijagram sa unutrašnjim karticama na dnu */}
                <div className="bg-[#11161e] border border-[#1e2530] p-6 rounded-3xl flex flex-col items-center shadow-xl space-y-6">
                  <div className="w-full text-left">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Performance Radar</span>
                  </div>
                  
                  <svg viewBox="0 0 300 300" className="w-72 h-72 fill-none overflow-visible select-none">
                    {/* 1. Pozadinska mreža */}
                    {[25, 50, 75, 100].map((radius, index) => {
                      const points = Array.from({ length: 6 }).map((_, i) => {
                        const angle = (i * (2 * Math.PI)) / 6 - Math.PI / 2;
                        return `${150 + radius * Math.cos(angle)},${150 + radius * Math.sin(angle)}`;
                      }).join(" ");

                      return (
                        <polygon
                          key={index}
                          points={points}
                          className={index === 3 ? "stroke-gray-700/60 stroke-[1]" : "stroke-gray-800/40 stroke-[1]"}
                        />
                      );
                    })}

                    {/* 2. Središnje linije */}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const angle = (i * (2 * Math.PI)) / 6 - Math.PI / 2;
                      return (
                        <line
                          key={i}
                          x1="150"
                          y1="150"
                          x2={150 + 100 * Math.cos(angle)}
                          y2={150 + 100 * Math.sin(angle)}
                          className="stroke-gray-800/40 stroke-[1]"
                        />
                      );
                    })}
                    
                    {/* 3. Radar Heksagon */}
                    <motion.polygon 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 45, damping: 15, delay: 0.1 }}
                      style={{
                        transformOrigin: "center",
                        transformBox: "fill-box"
                      }}
                      points={getRadarCoordinates(activePlayerView)} 
                      className="stroke-[#d4f03d] stroke-[2.5] fill-[#d4f03d]/10" 
                    />
                    
                    {/* 4. Labele */}
                    <text x="150" y="30" textAnchor="middle" className="fill-slate-400 font-bold text-[11px] font-mono tracking-wider">PPG</text>
                    <text x="260" y="98" textAnchor="start" className="fill-slate-400 font-bold text-[11px] font-mono tracking-wider">RPG</text>
                    <text x="260" y="212" textAnchor="start" className="fill-slate-400 font-bold text-[11px] font-mono tracking-wider">APG</text>
                    <text x="150" y="282" textAnchor="middle" className="fill-slate-400 font-bold text-[11px] font-mono tracking-wider">SPG</text>
                    <text x="40" y="212" textAnchor="end" className="fill-slate-400 font-bold text-[11px] font-mono tracking-wider">BPG</text>
                    <text x="40" y="98" textAnchor="end" className="fill-slate-400 font-bold text-[11px] font-mono tracking-wider">EFF</text>
                  </svg>

                  {/* 5 STATISTIČKIH KARTICA USKLAĐENIH SA TVOJIM JSON-om */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full border-t border-[#1e2530]/60 pt-6">
                    {/* MPG */}
                    <div className="bg-[#090d12]/60 border border-[#1e2530]/50 p-4 rounded-xl flex flex-col justify-between min-h-[80px]">
                      <div className="text-2xl font-black text-white font-mono leading-none">
                        {activePlayerView.mpg || "0.0"}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">MPG</div>
                    </div>

                    {/* FG% */}
                    <div className="bg-[#090d12]/60 border border-[#1e2530]/50 p-4 rounded-xl flex flex-col justify-between min-h-[80px]">
                      <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline">
                        {activePlayerView.fg ? activePlayerView.fg.replace("%", "") : "0.0"}
                        <span className="text-sm text-gray-500 font-normal ml-0.5">%</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">FG%</div>
                    </div>

                    {/* 3PT% */}
                    <div className="bg-[#090d12]/60 border border-[#1e2530]/50 p-4 rounded-xl flex flex-col justify-between min-h-[80px]">
                      <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline">
                        {activePlayerView.tpt ? activePlayerView.tpt.replace("%", "") : "0.0"}
                        <span className="text-sm text-gray-500 font-normal ml-0.5">%</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">3PT%</div>
                    </div>

                    {/* FT% */}
                    <div className="bg-[#090d12]/60 border border-[#1e2530]/50 p-4 rounded-xl flex flex-col justify-between min-h-[80px]">
                      <div className="text-2xl font-black text-white font-mono leading-none flex items-baseline">
                        {activePlayerView.ft ? activePlayerView.ft.replace("%", "") : "0.0"}
                        <span className="text-sm text-gray-500 font-normal ml-0.5">%</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">FT%</div>
                    </div>

                    {/* STL */}
                    <div className="bg-[#090d12]/60 border border-[#1e2530]/50 p-4 rounded-xl flex flex-col justify-between min-h-[80px]">
                      <div className="text-2xl font-black text-white font-mono leading-none">
                        {activePlayerView.stl || "0.0"}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">STL</div>
                    </div>
                  </div>
                </div>

                {/* PLAYER BIO SEKCIJA */}
                <div className="bg-[#11161e] border border-[#1e2530] p-5 rounded-2xl shadow-xl">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-2">
                    Player Bio
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    {activePlayerView.bio || "No biography available for this player."}
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        ) : (
          
          /* ================= GLAVNA TABELA / DASHBOARD ================= */
          <motion.div key={activeTab} className="max-w-7xl mx-auto px-8 pt-10">
            
            {activeTab === "Scouting Hub" && (
              <div className="space-y-10">
                {/* Hero sekcija */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-b border-[#181f29] pb-12">
                  <div className="md:col-span-7">
                    <span className="text-[10px] font-bold text-[#d4f03d] tracking-[0.25em] block mb-3 font-mono">• EUROLEAGUE SCOUTING TERMINAL</span>
                    <h1 className="text-7xl font-black tracking-tighter leading-[0.9] text-white">EURO <br /><span className="text-[#d4f03d]">ELITE</span></h1>
                    <p className="text-gray-400 text-sm max-w-sm mt-5 font-medium">The definitive clean scouting platform for European basketball's premier talent.</p>
                  </div>
                  <div className="md:col-span-5 grid grid-cols-1 gap-4">
                    <div className="bg-[#11161e] border border-[#1e2530] p-5 rounded-2xl flex items-center space-x-4 shadow-xl">
                      <div className="bg-[#1a222f] w-11 h-11 rounded-xl flex items-center justify-center border border-gray-800">👥</div>
                      <div>
                        <div className="text-2xl font-black font-mono">{playersData.length}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">In database</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FILTERI I KARTICE */}
                <div className="space-y-6">
                  <FilterBar 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedPos={selectedPos}
                    setSelectedPos={setSelectedPos}
                    selectedNat={selectedNat}
                    setSelectedNat={setSelectedNat}
                    isPosOpen={isPosOpen}
                    setIsPosOpen={setIsPosOpen}
                    isNatOpen={isNatOpen}
                    setIsNatOpen={setIsNatOpen}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {processedPlayers.map((player) => (
                      <div 
                        key={player.id}
                        onClick={() => handleOpenProfile(player)}
                        className="bg-[#11161e] border border-[#1e2530] rounded-2xl overflow-hidden group shadow-md relative flex flex-col h-[340px] cursor-pointer transition-all duration-300 hover:border-[#d4f03d]/40 hover:shadow-[0_0_30px_rgba(212,240,61,0.04)]"
                      >
                        <div className="h-48 w-full overflow-hidden bg-[#090d12] relative border-b border-[#1c232e]">
                          <img 
                            src={player.image || FALLBACK_PLAYER_IMAGE} 
                            alt={player.name} 
                            className="w-full h-full object-cover object-top transition duration-500 opacity-60 group-hover:opacity-100 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#11161e] to-transparent opacity-60 group-hover:opacity-20 transition duration-300" />
                          
                          <span className="absolute top-3 left-3 bg-[#1a222f]/90 text-[#d4f03d] border border-gray-800 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase font-mono z-10">
                            {player.position}
                          </span>
                          <span className="absolute top-3 right-3 text-[11px] text-white font-bold bg-[#090d12]/90 px-2 py-1 rounded-lg border border-gray-800 z-10">
                            <span className="text-gray-500 text-[9px] mr-1">PIR</span>{player.pir}
                          </span>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between bg-[#11161e]">
                          <div>
                            <h3 className="font-bold text-base text-white group-hover:text-[#d4f03d] transition duration-200 line-clamp-1">{player.name}</h3>
                            <p className="text-gray-500 text-xs font-medium mt-0.5">{getCleanTeamName(player.team)}</p>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-gray-800/60 pt-3 text-xs font-mono">
                            <span className="text-gray-400 font-bold">{player.ppg} <span className="text-[9px] text-gray-600">PPG</span></span>
                            <span className="text-gray-400 font-bold">{player.rpg} <span className="text-[9px] text-gray-600">RPG</span></span>
                            <span className="text-[#d4f03d] opacity-0 group-hover:opacity-100 transition duration-300">➔</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Players" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-[#181f29] pb-5">
                  <h1 className="text-3xl font-black text-white">All Players Database</h1>
                </div>
                <FilterBar 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedPos={selectedPos}
                  setSelectedPos={setSelectedPos}
                  selectedNat={selectedNat}
                  setSelectedNat={setSelectedNat}
                  isPosOpen={isPosOpen}
                  setIsPosOpen={setIsPosOpen}
                  isNatOpen={isNatOpen}
                  setIsNatOpen={setIsNatOpen}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {processedPlayers.map((player) => (
                    <div 
                      key={player.id}
                      onClick={() => handleOpenProfile(player)}
                      className="bg-[#11161e] border border-[#1e2530] rounded-2xl overflow-hidden group shadow-md relative flex flex-col h-[340px] cursor-pointer transition-all duration-300 hover:border-[#d4f03d]/40"
                    >
                      <div className="h-48 w-full overflow-hidden bg-[#090d12] relative border-b border-[#1c232e]">
                        <img 
                          src={player.image || FALLBACK_PLAYER_IMAGE} 
                          alt={player.name} 
                          className="w-full h-full object-cover object-top transition duration-500 opacity-60 group-hover:opacity-100 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#11161e] to-transparent opacity-50 group-hover:opacity-20 transition duration-300" />
                        <span className="absolute top-3 left-3 bg-[#1a222f]/90 text-[#d4f03d] font-bold text-[9px] px-2 py-0.5 rounded-md uppercase font-mono z-10">{player.position}</span>
                        <span className="absolute top-3 right-3 text-[11px] text-white font-bold bg-[#090d12]/90 px-2 py-1 rounded-lg border border-gray-800 z-10"><span className="text-gray-500 text-[9px] mr-1">PIR</span>{player.pir}</span>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col justify-between bg-[#11161e]">
                        <div>
                          <h3 className="font-bold text-base text-white group-hover:text-[#d4f03d] transition duration-200 line-clamp-1">{player.name}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">{getCleanTeamName(player.team)}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-800/60 pt-3 text-xs font-mono">
                          <span className="text-gray-400 font-bold">{player.ppg} <span className="text-[9px] text-gray-600">PPG</span></span>
                          <span className="text-gray-400 font-bold">{player.rpg} <span className="text-[9px] text-gray-600">RPG</span></span>
                          <span className="text-[#d4f03d]">➔</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Teams" && (
              <div className="space-y-6">
                <div className="border-b border-[#181f29] pb-5">
                  <h1 className="text-3xl font-black text-white">Teams Terminal</h1>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {teamsGrouped.map(({ teamName, players: teamPlayers, avgPir }) => {
                    const isExpanded = expandedTeam === teamName;
                    return (
                      <div key={teamName} className="bg-[#11161e] border border-[#1e2530] rounded-2xl overflow-hidden shadow-lg">
                        <div 
                          onClick={() => setExpandedTeam(isExpanded ? null : teamName)}
                          className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-[#1a222f]/40 transition"
                        >
                          <div>
                            <h2 className="text-xl font-black text-white">{teamName}</h2>
                            <p className="text-xs text-gray-500 font-medium mt-1">{teamPlayers.length} Roster Players • <span className="text-gray-400">Avg PIR: {avgPir}</span></p>
                          </div>
                          <span className="text-sm text-gray-400 font-bold">{isExpanded ? "▲" : "▼"}</span>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-[#1e2530]/60 p-4 bg-[#090d12]/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {teamPlayers.map(p => (
                              <div 
                                key={p.id} 
                                onClick={() => handleOpenProfile(p)}
                                className="bg-[#11161e] border border-[#1e2530] p-4 rounded-xl flex items-center justify-between hover:border-[#d4f03d]/30 cursor-pointer transition"
                              >
                                <div>
                                  <div className="font-bold text-sm text-white">{p.name}</div>
                                  <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{p.position} • #{getPlayerNumber(p)}</div>
                                </div>
                                <div className="text-right font-mono">
                                  <div className="text-xs font-bold text-[#d4f03d]">{p.ppg} PPG</div>
                                  <div className="text-[10px] text-gray-500">PIR {p.pir}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}