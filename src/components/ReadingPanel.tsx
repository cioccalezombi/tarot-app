"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ReadingPanelProps {
  isLoading: boolean;
  text: string;
  onRetry: () => void;
  hasError: boolean;
}

export default function ReadingPanel({
  isLoading,
  text,
  onRetry,
  hasError,
}: ReadingPanelProps) {
  if (!isLoading && !text && !hasError) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="w-full max-w-2xl mx-auto mt-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30" />
          <span className="text-amber-400/60 text-xs uppercase tracking-[0.3em] font-cinzel">
            Tu Lectura
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30" />
        </div>

        <div className="relative rounded-2xl border border-purple-700/30 bg-gradient-to-b from-slate-900/80 to-indigo-950/80 backdrop-blur-sm p-6 shadow-xl shadow-purple-950/30">
          {/* Decorative corner elements */}
          <span className="absolute top-3 left-3 text-amber-400/20 text-lg">✦</span>
          <span className="absolute top-3 right-3 text-amber-400/20 text-lg">✦</span>
          <span className="absolute bottom-3 left-3 text-amber-400/20 text-lg">✦</span>
          <span className="absolute bottom-3 right-3 text-amber-400/20 text-lg">✦</span>

          {/* Loading state */}
          {isLoading && !text && (
            <div className="flex flex-col items-center gap-4 py-8">
              <motion.div
                className="flex gap-2"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {["✦", "✧", "✦"].map((star, i) => (
                  <motion.span
                    key={i}
                    className="text-amber-300 text-xl"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  >
                    {star}
                  </motion.span>
                ))}
              </motion.div>
              <p className="text-purple-300/60 text-sm italic font-light tracking-wide">
                Leyendo las cartas...
              </p>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="flex flex-col items-center gap-4 py-6">
              <span className="text-3xl">🌑</span>
              <p className="text-purple-300/70 text-sm text-center">
                Las energías están perturbadas. No se pudo obtener la lectura en este momento.
              </p>
              <button
                onClick={onRetry}
                className="px-4 py-2 text-xs font-cinzel tracking-widest text-amber-400 border border-amber-500/40 rounded-lg hover:bg-amber-500/10 transition-colors"
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {/* Streaming text */}
          {text && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-invert prose-sm max-w-none"
            >
              <FormattedText text={text} />
              {isLoading && (
                <motion.span
                  className="inline-block ml-1 text-amber-300"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
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

function FormattedText({ text }: { text: string }) {
  // Process basic **bold** markdown
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-slate-200/90 leading-relaxed text-sm whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-amber-300 font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
