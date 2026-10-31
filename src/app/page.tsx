"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { drawCards, DrawnCard, TarotCard } from "@/lib/tarot-deck";
import SpreadLayout from "@/components/SpreadLayout";
import ReadingPanel from "@/components/ReadingPanel";
import DeckCutRitual from "@/components/DeckCutRitual";

const POSITIONS = ["Pasado", "Presente", "Futuro"];
const SPREAD_NAME = "Pasado · Presente · Futuro";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[] | null>(null);
  const [readingText, setReadingText] = useState("");
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [phase, setPhase] = useState<"idle" | "cutting" | "spread" | "reading">("idle");
  const [stars, setStars] = useState<
    Array<{ id: number; size: number; top: number; left: number; opacity: number; duration: number; delay: number }>
  >([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.1,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
    }));
    setStars(generatedStars);
  }, []);

  const handleStartRitual = useCallback(() => {
    setPhase("cutting");
  }, []);

  const handleDeckReady = useCallback((cutDeck: TarotCard[]) => {
    const cards = drawCards(POSITIONS, cutDeck);
    setDrawnCards(cards);
    setReadingText("");
    setHasError(false);
    setIsLoadingReading(false);
    setPhase("spread");
  }, []);

  const handleSkipRitual = useCallback(() => {
    const cards = drawCards(POSITIONS);
    setDrawnCards(cards);
    setReadingText("");
    setHasError(false);
    setIsLoadingReading(false);
    setPhase("spread");
  }, []);

  const fetchReading = useCallback(
    async (cards: DrawnCard[]) => {
      setIsLoadingReading(true);
      setHasError(false);
      setPhase("reading");

      const payload = {
        tirada: SPREAD_NAME,
        pregunta: question.trim() || null,
        cartas: cards.map((dc) => ({
          posicion: dc.position,
          carta: dc.card.nameFull,
          invertida: dc.isReversed,
          palabrasClave: dc.isReversed ? dc.card.keywordsReversed : dc.card.keywords,
        })),
      };

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 35000);

      try {
        const res = await fetch("/api/lectura", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Error en la respuesta del servidor");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setReadingText((prev) => prev + chunk);
        }

        if (!accumulated.trim()) {
          throw new Error("Respuesta vacía");
        }
      } catch (err) {
        console.error("Error al obtener la lectura:", err);
        setHasError(true);
      } finally {
        clearTimeout(timeoutId);
        setIsLoadingReading(false);
      }
    },
    [question]
  );

  const handleAllFlipped = useCallback(() => {
    if (drawnCards) {
      fetchReading(drawnCards);
    }
  }, [drawnCards, fetchReading]);

  const handleRetry = useCallback(() => {
    if (drawnCards) {
      setReadingText("");
      fetchReading(drawnCards);
    }
  }, [drawnCards, fetchReading]);

  const handleReset = () => {
    setDrawnCards(null);
    setReadingText("");
    setHasError(false);
    setIsLoadingReading(false);
    setPhase("idle");
  };

  return (
    <div className="min-h-screen bg-mystic flex flex-col">
      {/* Starfield background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              width: star.size,
              height: star.size,
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.opacity,
            }}
            animate={{ opacity: [0.1, 0.6, 0.1] }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12 gap-10">
        {/* ── Header ── */}
        <motion.header
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="font-cinzel text-5xl md:text-6xl text-amber-300 tracking-[0.2em] mb-3 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">
            ✦ Tarot ✦
          </h1>
          <p className="text-purple-300/60 text-sm tracking-[0.15em] uppercase font-light">
            Lecturas guiadas por la intuición
          </p>
        </motion.header>

        {/* ── Question input (only in idle) ── */}
        <AnimatePresence>
          {phase === "idle" && (
            <motion.div
              className="w-full max-w-lg flex flex-col gap-5 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-full">
                <label
                  htmlFor="question"
                  className="block text-xs text-purple-300/60 uppercase tracking-widest mb-2 font-cinzel"
                >
                  Tu pregunta{" "}
                  <span className="normal-case text-purple-400/40">(opcional)</span>
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="¿Qué querés explorar hoy? Podés dejarlo en blanco para una lectura general..."
                  maxLength={300}
                  rows={3}
                  className="w-full bg-indigo-950/50 border border-purple-700/40 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:bg-indigo-950/70 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <motion.button
                  onClick={handleStartRitual}
                  className="group relative px-8 py-4 font-cinzel text-sm uppercase tracking-[0.25em] text-amber-300 border border-amber-500/50 rounded-xl overflow-hidden transition-all hover:border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-950/30"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-900/0 via-amber-700/20 to-amber-900/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative">✦ Cortar el mazo y revelar ✦</span>
                </motion.button>

                <button
                  type="button"
                  onClick={handleSkipRitual}
                  className="text-xs text-purple-300/60 hover:text-amber-300 font-cinzel tracking-wider uppercase underline underline-offset-4 transition-colors px-2 py-2"
                >
                  Tirada directa (sin corte)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Corte del Mazo ── */}
        <AnimatePresence>
          {phase === "cutting" && (
            <motion.div
              key="cutting-ritual"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full flex justify-center"
            >
              <DeckCutRitual
                onDeckReady={handleDeckReady}
                onCancel={handleSkipRitual}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Spread ── */}
        <AnimatePresence>
          {drawnCards && (
            <SpreadLayout
              key="spread"
              cards={drawnCards}
              onAllFlipped={handleAllFlipped}
            />
          )}
        </AnimatePresence>

        {/* ── Reading panel ── */}
        {phase !== "idle" && (
          <ReadingPanel
            isLoading={isLoadingReading}
            text={readingText}
            onRetry={handleRetry}
            hasError={hasError}
          />
        )}

        {/* ── Nueva lectura button ── */}
        <AnimatePresence>
          {phase === "reading" && !isLoadingReading && (readingText || hasError) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleReset}
              className="text-xs text-purple-400/50 hover:text-purple-300/70 uppercase tracking-widest font-cinzel underline underline-offset-4 transition-colors mt-2"
            >
              Nueva lectura
            </motion.button>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-6 px-4 text-center border-t border-purple-900/30">
        <p className="text-slate-500/60 text-xs max-w-md mx-auto leading-relaxed">
          Este servicio es para entretenimiento y reflexión personal.
          No reemplaza asesoramiento profesional de ningún tipo.
        </p>
      </footer>
    </div>
  );
}
