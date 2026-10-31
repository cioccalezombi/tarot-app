"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ReadingPanelProps {
  isLoading: boolean;
  text: string;
  onRetry: () => void;
  hasError: boolean;
}

export default function ReadingPanel({ isLoading, text, onRetry, hasError }: ReadingPanelProps) {
  if (!isLoading && !text && !hasError) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="w-full max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Header del panel con ornamentos */}
        <div className="flex items-center gap-3 mb-0">
          {/* Línea izquierda */}
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9963a 80%)" }} />
          {/* Título con bordes */}
          <div
            className="flex items-center gap-2 px-5 py-1.5"
            style={{
              background: "linear-gradient(180deg, #1a0d30 0%, #2a1550 50%, #1a0d30 100%)",
              border: "1px solid rgba(201,150,58,0.7)",
              clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)",
              boxShadow: "0 0 20px rgba(100,40,180,0.3)",
            }}
          >
            <span className="text-amber-400 text-sm">✦</span>
            <span className="font-cinzel text-amber-300 text-xs tracking-[0.35em] uppercase">Tu Lectura</span>
            <span className="text-amber-400 text-sm">✦</span>
          </div>
          {/* Línea derecha */}
          <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, transparent, #c9963a 80%)" }} />
        </div>

        {/* Cuerpo del panel */}
        <div
          className="relative rounded-b-xl p-5 md:p-7 min-h-[180px] flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(180deg, rgba(15,6,40,0.92) 0%, rgba(25,10,55,0.95) 100%)",
            border: "1px solid rgba(201,150,58,0.4)",
            borderTop: "none",
            boxShadow: "0 8px 40px rgba(60,10,120,0.4), inset 0 1px 0 rgba(201,150,58,0.1)",
          }}
        >
          {/* Esquinas ornamentales */}
          <span className="absolute top-2 left-3 text-amber-500/30 text-base">✦</span>
          <span className="absolute top-2 right-3 text-amber-500/30 text-base">✦</span>
          <span className="absolute bottom-2 left-3 text-amber-500/30 text-base">✦</span>
          <span className="absolute bottom-2 right-3 text-amber-500/30 text-base">✦</span>

          {/* Estado de carga */}
          {isLoading && !text && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex gap-3">
                {["✦", "✧", "✦"].map((s, i) => (
                  <motion.span
                    key={i}
                    className="text-amber-300 text-xl"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.35 }}
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
              <p
                className="font-cinzel text-sm italic tracking-wide"
                style={{ color: "rgba(200,160,240,0.7)" }}
              >
                Leyendo las cartas...
              </p>
            </div>
          )}

          {/* Error */}
          {hasError && (
            <div className="flex flex-col items-center gap-4">
              <span className="text-3xl">🌑</span>
              <p className="text-purple-300/70 text-sm text-center font-light max-w-xs">
                Las energías están perturbadas. No se pudo obtener la lectura en este momento.
              </p>
              <button
                onClick={onRetry}
                className="font-cinzel text-xs uppercase tracking-widest text-amber-400 px-5 py-2 rounded-full transition-all hover:text-amber-300"
                style={{
                  border: "1px solid rgba(201,150,58,0.5)",
                  background: "rgba(80,30,30,0.3)",
                }}
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Texto de la lectura */}
          {text && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <p
                className="text-sm md:text-base leading-relaxed whitespace-pre-wrap"
                style={{ color: "rgba(220,205,255,0.92)", fontWeight: 300 }}
              >
                {/* Negrita inline */}
                {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={i} className="text-amber-200 font-semibold">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
              {isLoading && (
                <motion.span
                  className="inline-block text-amber-300 ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  ▌
                </motion.span>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
