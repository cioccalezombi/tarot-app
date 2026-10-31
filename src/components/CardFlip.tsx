"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
  const keywords = isReversed ? card.keywordsReversed : card.keywords;

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Position banner — ribbon estilo pergamino */}
      <div className="relative flex items-center justify-center mb-2 z-10">
        {/* Ribbon wings */}
        <div
          className="absolute left-0 top-0 h-full w-3"
          style={{
            background: "linear-gradient(135deg, #5a3a0a 0%, #c9963a 50%, #5a3a0a 100%)",
            clipPath: "polygon(100% 0%, 100% 100%, 0% 80%, 0% 20%)",
          }}
        />
        <div
          className="absolute right-0 top-0 h-full w-3"
          style={{
            background: "linear-gradient(225deg, #5a3a0a 0%, #c9963a 50%, #5a3a0a 100%)",
            clipPath: "polygon(0% 0%, 0% 100%, 100% 80%, 100% 20%)",
          }}
        />
        <div
          className="px-6 py-1 font-cinzel text-xs tracking-[0.25em] uppercase text-amber-100 relative"
          style={{
            background: "linear-gradient(180deg, #8b5e1a 0%, #c9963a 40%, #a87020 70%, #6b4510 100%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,100,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)",
            border: "1px solid #8b6020",
            minWidth: "120px",
            textAlign: "center",
          }}
        >
          {position}
        </div>
      </div>

      {/* Card wrapper */}
      <div
        className="relative cursor-pointer select-none"
        style={{ width: "130px", height: "215px", perspective: "1200px" }}
        onClick={onFlip}
        role="button"
        aria-label={isFlipped ? `Carta: ${card.name}` : "Carta boca abajo. Clic para revelar."}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onFlip()}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* ── Dorso ── */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Image
              src="/card-back.jpg"
              alt="Dorso de carta"
              fill
              className="object-cover rounded-xl"
              sizes="130px"
            />
            {/* Sutil brillo en hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(255,210,80,0.12), transparent 70%)" }} />
          </div>

          {/* ── Frente de la carta ── */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div
              className={`w-full h-full flex flex-col items-center justify-between p-2 ${isReversed ? "rotate-180" : ""}`}
              style={{
                background: "linear-gradient(160deg, #1a0f3a 0%, #2d1555 40%, #1a0f35 100%)",
                border: "2px solid rgba(201,150,58,0.7)",
                borderRadius: "12px",
              }}
            >
              {/* Marco interior ornamental */}
              <div className="absolute inset-[6px] rounded-lg pointer-events-none"
                style={{ border: "1px solid rgba(201,150,58,0.35)" }} />

              {/* Número / palo */}
              <span className="text-amber-400/80 text-[9px] font-cinzel tracking-widest pt-1 z-10">
                {card.suit === "arcanos-mayores" ? card.number : card.suit.replace("-", " ")}
              </span>

              {/* Símbolo central */}
              <div className="flex-1 flex items-center justify-center z-10">
                <SuitSymbol suit={card.suit} />
              </div>

              {/* Nombre */}
              <div className="text-center z-10 pb-1">
                <p className="text-amber-100 text-[10px] font-cinzel leading-tight text-center">
                  {card.name}
                </p>
                {isReversed && (
                  <p className="text-purple-400 text-[8px] mt-0.5 tracking-wider">INVERTIDA</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Glow exterior cuando está revelada */}
        {isFlipped && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: "0 0 24px rgba(201,150,58,0.3), 0 0 60px rgba(120,50,200,0.2)" }}
          />
        )}
      </div>

      {/* Keywords — píldoras debajo */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 6 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-wrap gap-1 justify-center mt-3"
        style={{ maxWidth: "148px" }}
      >
        {keywords.slice(0, 3).map((kw) => (
          <span
            key={kw}
            className="text-[9px] font-cinzel tracking-wide text-amber-200/80 px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(60,20,90,0.7)",
              border: "1px solid rgba(160,100,220,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            {kw.replace(/-/g, " ")}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function SuitSymbol({ suit }: { suit: string }) {
  const symbols: Record<string, { symbol: string; color: string }> = {
    "arcanos-mayores": { symbol: "☽", color: "text-amber-300" },
    bastos:            { symbol: "🌿", color: "text-emerald-400" },
    copas:             { symbol: "🏺", color: "text-blue-400" },
    espadas:           { symbol: "⚔", color: "text-slate-300" },
    oros:              { symbol: "◈", color: "text-amber-400" },
  };
  const { symbol, color } = symbols[suit] ?? { symbol: "✦", color: "text-amber-300" };
  return (
    <span className={`text-4xl ${color}`} style={{ filter: "drop-shadow(0 0 8px currentColor)" }}>
      {symbol}
    </span>
  );
}
