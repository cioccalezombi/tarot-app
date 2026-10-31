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
  const [manuallyFlipped, setManuallyFlipped] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  // Auto-flip cards one by one with delay
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    cards.forEach((_, index) => {
      const timer = setTimeout(() => {
        setManuallyFlipped((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
        setFlippedCount((prev) => {
          const newCount = prev + 1;
          if (newCount === cards.length) {
            // Small delay before triggering the reading request
            setTimeout(onAllFlipped, 600);
          }
          return newCount;
        });
      }, 800 + index * 600);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualFlip = (index: number) => {
    if (manuallyFlipped[index]) return; // already flipped
    setManuallyFlipped((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setFlippedCount((prev) => {
      const newCount = prev + 1;
      if (newCount === cards.length) {
        setTimeout(onAllFlipped, 600);
      }
      return newCount;
    });
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Tirada label */}
      <div className="flex items-center gap-3">
        <div className="h-px w-12 bg-amber-500/30" />
        <span className="text-amber-400/60 text-xs uppercase tracking-[0.3em] font-cinzel">
          Tirada de Tres Cartas
        </span>
        <div className="h-px w-12 bg-amber-500/30" />
      </div>

      {/* Cards row */}
      <div className="flex flex-wrap gap-8 justify-center items-start">
        {cards.map((drawn, index) => (
          <motion.div
            key={drawn.card.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.15,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <CardFlip
              card={drawn.card}
              isReversed={drawn.isReversed}
              position={drawn.position}
              isFlipped={manuallyFlipped[index]}
              onFlip={() => handleManualFlip(index)}
            />
          </motion.div>
        ))}
      </div>

      {/* Progress indicator */}
      {flippedCount < cards.length && (
        <motion.p
          className="text-purple-400/50 text-xs italic"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Las cartas se están revelando...
        </motion.p>
      )}
    </motion.div>
  );
}
