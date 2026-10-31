"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TarotCard } from "@/lib/tarot-deck";

interface CardFlipProps {
  card: TarotCard;
  isReversed: boolean;
  position: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function CardFlip({
  card,
  isReversed,
  position,
  isFlipped,
  onFlip,
}: CardFlipProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Position label */}
      <span className="text-xs uppercase tracking-widest text-amber-400/70 font-cinzel">
        {position}
      </span>

      {/* Card wrapper */}
      <div
        className="relative cursor-pointer select-none"
        style={{ width: "120px", height: "200px", perspective: "1000px" }}
        onClick={onFlip}
        role="button"
        aria-label={`Carta: ${card.name}`}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onFlip()}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* ── Back face ── */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 border border-amber-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
              {/* Decorative border */}
              <div className="absolute inset-2 rounded-lg border border-amber-500/20" />
              <div className="absolute inset-3 rounded-lg border border-amber-500/10" />
              {/* Stars pattern */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute text-amber-300 text-xs"
                    style={{
                      top: `${Math.sin(i * 30 * (Math.PI / 180)) * 35 + 45}%`,
                      left: `${Math.cos(i * 30 * (Math.PI / 180)) * 35 + 45}%`,
                      fontSize: i % 3 === 0 ? "8px" : "5px",
                    }}
                  >
                    ✦
                  </span>
                ))}
              </div>
              {/* Central symbol */}
              <span className="text-amber-300 text-4xl z-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                ✦
              </span>
            </div>
          </div>

          {/* ── Front face ── */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div
              className={`w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-amber-400/50 rounded-xl flex flex-col items-center justify-center gap-2 p-3 shadow-lg shadow-amber-900/20 ${
                isReversed ? "rotate-180" : ""
              }`}
            >
              {/* Card number */}
              <span className="text-amber-400/60 text-xs font-cinzel tracking-widest">
                {card.suit === "arcanos-mayores" ? card.number : card.suit.toUpperCase()}
              </span>

              {/* Card symbol */}
              <div className="flex-1 flex items-center justify-center">
                <SuitSymbol suit={card.suit} />
              </div>

              {/* Card name */}
              <div className="text-center">
                <p className="text-amber-100 text-xs font-cinzel leading-tight text-center">
                  {card.name}
                </p>
                {isReversed && (
                  <p className="text-purple-400 text-[9px] mt-1 tracking-wider">
                    INVERTIDA
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Glow effect on hover */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                boxShadow: "0 0 20px rgba(251, 191, 36, 0.15)",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Keywords (shown after flip) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-wrap gap-1 justify-center max-w-[140px]"
          >
            {(isReversed ? card.keywordsReversed : card.keywords)
              .slice(0, 3)
              .map((kw) => (
                <span
                  key={kw}
                  className="text-[9px] text-purple-300/70 bg-purple-900/30 px-1.5 py-0.5 rounded-full border border-purple-700/30"
                >
                  {kw.replace(/-/g, " ")}
                </span>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuitSymbol({ suit }: { suit: string }) {
  const symbols: Record<string, { symbol: string; color: string }> = {
    "arcanos-mayores": { symbol: "☽", color: "text-amber-300" },
    bastos: { symbol: "🌿", color: "text-emerald-400" },
    copas: { symbol: "🏺", color: "text-blue-400" },
    espadas: { symbol: "⚔", color: "text-slate-300" },
    oros: { symbol: "◈", color: "text-amber-400" },
  };
  const { symbol, color } = symbols[suit] ?? { symbol: "✦", color: "text-amber-300" };
  return (
    <span className={`text-3xl ${color} drop-shadow-[0_0_6px_currentColor]`}>
      {symbol}
    </span>
  );
}
