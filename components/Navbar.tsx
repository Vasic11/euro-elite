import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-[#0b0f14] border-b border-[#1e2530] px-8 py-4 flex justify-between items-center">
      {/* Logo na levoj strani */}
      <div className="flex items-center space-x-2">
        <div className="bg-[#d4f03d] text-black font-black px-2 py-1 rounded text-lg">
          ⚡
        </div>
        <span className="text-white font-black text-xl tracking-wider">
          EURO<span className="text-[#d4f03d]">ELITE</span>
        </span>
      </div>

      {/* Tri glavne stranice na desnoj strani */}
      <div className="flex space-x-6 items-center text-sm font-medium text-gray-400">
        <Link href="/" className="bg-[#13181f] border border-[#1e2530] text-[#d4f03d] px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg">
          <span>🔍</span>
          <span>Scouting Hub</span>
        </Link>
        
        <Link href="/players" className="hover:text-white transition duration-200 flex items-center space-x-1">
          <span>👥</span>
          <span>Players</span>
        </Link>

        <Link href="/agencies" className="hover:text-white transition duration-200 flex items-center space-x-1">
          <span>🏢</span>
          <span>Agencies</span>
        </Link>
      </div>
    </nav>
  );
}