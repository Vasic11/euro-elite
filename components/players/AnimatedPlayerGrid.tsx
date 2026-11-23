"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { Player } from "@/lib/euroleague/types";

import { PlayerCard } from "./PlayerCard";

/**
 * Mreža kartica sa animacijom: kad se promeni filter ili sortiranje, kartice
 * klize na nova mesta (layout animacija), nove se pojavljuju, a uklonjene nestaju.
 * framer-motion sam poštuje "reduce motion" ako je uključen u MotionConfig.
 */
export function AnimatedPlayerGrid({
  players,
  from,
}: {
  players: Player[];
  from?: string;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      <AnimatePresence mode="popLayout" initial={false}>
        {players.map((player, i) => (
          <motion.li
            key={player.code}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 38,
              opacity: { duration: 0.2 },
            }}
          >
            <PlayerCard player={player} priority={i < 4} from={from} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
