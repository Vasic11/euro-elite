"use client";

import { motion } from "framer-motion";

/**
 * template.tsx se, za razliku od layout.tsx, pravi iznova pri svakoj navigaciji.
 * Zato je pravo mesto za kratku animaciju ulaska stranice: sadržaj se pojavi
 * blagim prelazom umesto da se samo zameni.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
