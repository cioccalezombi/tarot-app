"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DrawnCard } from "@/lib/tarot-deck";
import CardFlip from "./CardFlip";

interface SpreadLayoutProps {
  cards: DrawnCard[];
  onAllFlipped: () => void;
}

export default function SpreadLayout({ cards, onAllFlipped }: SpreadLayoutProps) {
  const [flippedCount, setFlippedCount] = useState(0);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    cards.forEach((_, index) => {
      const timer = setTimeout(() => {
        setFlipped((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
        setFlippedCount((prev) => {
          const newCount = prev + 1;
          if (newCount === cards.length) {
            setTimeout(onAllFlipped, 700);
          }
          return newCount;
        });
      }, 900 + index * 700);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualFlip = (index: number) => {
    if (flipped[index]) return;
    setFlipped((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setFlippedCount((prev) => {
      const newCount = prev + 1;
      if (newCount === cards.length) setTimeout(onAllFlipped, 700);
      return newCount;
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* Label con fade-in puro, sin movimiento vertical */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="flex items-center gap-3 mb-1"
      >
        <div className="h-px w-16 opacity-60" style={{ background: "linear-gradient(90deg, transparent, #c9963a)" }} />
        <span className="font-cinzel text-xs tracking-[0.3em] uppercase text-amber-400/80">
          Tirada de Tres Cartas
        </span>
        <div className="h-px w-16 opacity-60" style={{ background: "linear-gradient(270deg, transparent, #c9963a)" }} />
      </motion.div>

      {/* Fila de cartas */}
      <div className="flex flex-wrap gap-6 md:gap-10 justify-center items-start">
        {cards.map((drawn, index) => (
          <motion.div
            key={drawn.card.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.12 }}
          >
            <CardFlip
              card={drawn.card}
              isReversed={drawn.isReversed}
              position={drawn.position}
              isFlipped={flipped[index]}
              onFlip={() => handleManualFlip(index)}
            />
          </motion.div>
        ))}
      </div>

      {flippedCount < cards.length && (
        <motion.p
          className="text-amber-400/40 text-xs italic font-cinzel mt-2"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Las cartas se están revelando...
        </motion.p>
      )}
    </div>
  );
}
