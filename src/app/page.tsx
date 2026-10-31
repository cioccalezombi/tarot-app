"use client";

import Image from "next/image";
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

  // Pre-generar posiciones de estrellas en el cliente
  const [stars, setStars] = useState<
    Array<{ id: number; size: number; top: number; left: number; opacity: number; duration: number; delay: number }>
  >([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 55 }).map((_, i) => ({
        id: i,
        size: Math.random() * 2.5 + 0.5,
        top: Math.random() * 100,
        left: Math.random() * 100,
        opacity: Math.random() * 0.6 + 0.1,
        duration: Math.random() * 5 + 3,
        delay: Math.random() * 6,
      }))
    );
  }, []);

  const handleStartRitual = useCallback(() => setPhase("cutting"), []);

  const handleDeckReady = useCallback((cutDeck: TarotCard[]) => {
    const cards = drawCards(POSITIONS, cutDeck);
    setReadingText("");
    setHasError(false);
    setIsLoadingReading(false);
    // Primero salir del ritual (fase "spread" oculta DeckCutRitual),
    // luego mostrar las cartas después de que el exit animation termine.
    setPhase("spread");
    setTimeout(() => setDrawnCards(cards), 550);
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
      const timeoutId = setTimeout(() => abortController.abort(), 40000);

      try {
        const res = await fetch("/api/lectura", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });
        if (!res.ok || !res.body) throw new Error("Error en la respuesta del servidor");

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
        if (!accumulated.trim()) throw new Error("Respuesta vacía");
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
    if (drawnCards) fetchReading(drawnCards);
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
    <div className="relative min-h-screen overflow-x-hidden flex flex-col">
      {/* ── Fondo ilustrado ── */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/bg-tarot.jpg"
          alt="Fondo místico"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Overlay oscuro sobre el fondo para legibilidad */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,4,25,0.55) 0%, rgba(10,4,28,0.65) 50%, rgba(8,4,22,0.75) 100%)",
          }}
        />
      </div>

      {/* ── Estrellas animadas sutiles ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
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
            animate={{ opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3] }}
            transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
          />
        ))}
      </div>

      {/* ── Borde ornamental exterior (marco dorado de toda la página) ── */}
      <div
        className="fixed inset-2 z-[1] pointer-events-none rounded-sm"
        style={{ border: "1px solid rgba(201,150,58,0.35)" }}
      />
      <div
        className="fixed inset-[6px] z-[1] pointer-events-none rounded-sm"
        style={{ border: "1px solid rgba(201,150,58,0.18)" }}
      />

      {/* ── Contenido principal ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-8 pb-6 gap-6 w-full max-w-4xl mx-auto">

        {/* ═══════════ HEADER ═══════════ */}
        <motion.header
          className="text-center w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          {/* Marco del título */}
          <div
            className="inline-block px-8 py-3 relative"
            style={{
              background: "linear-gradient(180deg, rgba(15,6,45,0.85) 0%, rgba(25,10,60,0.90) 100%)",
              border: "1px solid rgba(201,150,58,0.65)",
              boxShadow: "0 0 30px rgba(100,40,200,0.2), inset 0 1px 0 rgba(255,210,80,0.15)",
            }}
          >
            {/* Pequeñas estrellas en las esquinas del marco */}
            <span className="absolute -top-1 -left-1 text-amber-400 text-xs">✦</span>
            <span className="absolute -top-1 -right-1 text-amber-400 text-xs">✦</span>
            <span className="absolute -bottom-1 -left-1 text-amber-400 text-xs">✦</span>
            <span className="absolute -bottom-1 -right-1 text-amber-400 text-xs">✦</span>

            <h1
              className="font-cinzel text-4xl md:text-5xl tracking-[0.18em]"
              style={{
                color: "#f0d080",
                textShadow: "0 0 20px rgba(240,180,60,0.4), 0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              Tarot
            </h1>
            <p
              className="font-cinzel text-[10px] md:text-xs tracking-[0.4em] uppercase mt-1"
              style={{ color: "rgba(220,180,100,0.75)" }}
            >
              Lecturas guiadas por la intuición
            </p>
          </div>
        </motion.header>

        {/* ═══════════ IDLE: Pregunta + Botones ═══════════ */}
        <AnimatePresence>
          {phase === "idle" && (
            <motion.div
              className="w-full max-w-lg flex flex-col gap-4 items-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Input de pregunta */}
              <div className="w-full">
                <label
                  htmlFor="question"
                  className="block font-cinzel text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: "rgba(200,160,100,0.7)" }}
                >
                  Tu pregunta{" "}
                  <span className="normal-case" style={{ color: "rgba(160,120,200,0.5)" }}>
                    (opcional)
                  </span>
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="¿Qué querés explorar hoy? Podés dejarlo en blanco para una lectura general..."
                  maxLength={300}
                  rows={3}
                  className="w-full px-4 py-3 text-sm resize-none focus:outline-none transition-all rounded-lg"
                  style={{
                    background: "rgba(15,6,40,0.75)",
                    border: "1px solid rgba(201,150,58,0.35)",
                    color: "rgba(220,205,255,0.9)",
                    backdropFilter: "blur(8px)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,150,58,0.7)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(201,150,58,0.35)")}
                />
              </div>

              {/* Botón principal */}
              <motion.button
                onClick={handleStartRitual}
                className="font-cinzel text-sm uppercase tracking-[0.25em] relative px-8 py-3 rounded-lg overflow-hidden group"
                style={{
                  background: "linear-gradient(180deg, rgba(80,40,10,0.8) 0%, rgba(120,60,10,0.9) 50%, rgba(70,35,8,0.8) 100%)",
                  border: "1px solid rgba(201,150,58,0.7)",
                  color: "#f0d080",
                  boxShadow: "0 4px 20px rgba(120,60,0,0.4), inset 0 1px 0 rgba(255,210,80,0.2)",
                }}
                whileHover={{ scale: 1.03, boxShadow: "0 6px 28px rgba(180,100,0,0.5)" }}
                whileTap={{ scale: 0.97 }}
              >
                ✦ Cortar el mazo y revelar ✦
              </motion.button>

              <button
                type="button"
                onClick={handleSkipRitual}
                className="font-cinzel text-[11px] uppercase tracking-widest underline underline-offset-4 transition-colors"
                style={{ color: "rgba(160,120,200,0.55)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(201,150,58,0.8)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(160,120,200,0.55)")}
              >
                Tirada directa (sin corte)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ RITUAL DE CORTE ═══════════ */}
        <AnimatePresence>
          {phase === "cutting" && (
            <motion.div
              key="cutting"
              className="w-full flex justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <DeckCutRitual onDeckReady={handleDeckReady} onCancel={handleSkipRitual} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ TIRADA DE CARTAS ═══════════ */}
        <AnimatePresence>
          {drawnCards && (
            <SpreadLayout key="spread" cards={drawnCards} onAllFlipped={handleAllFlipped} />
          )}
        </AnimatePresence>

        {/* ═══════════ PANEL DE LECTURA ═══════════ */}
        {phase !== "idle" && phase !== "cutting" && (
          <ReadingPanel
            isLoading={isLoadingReading}
            text={readingText}
            onRetry={handleRetry}
            hasError={hasError}
          />
        )}

        {/* ═══════════ BOTÓN "NUEVA LECTURA" ═══════════ */}
        <AnimatePresence>
          {phase === "reading" && !isLoadingReading && (readingText || hasError) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleReset}
              className="font-cinzel text-[11px] uppercase tracking-widest underline underline-offset-4 transition-colors"
              style={{ color: "rgba(160,120,200,0.5)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(201,150,58,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(160,120,200,0.5)")}
            >
              Nueva lectura
            </motion.button>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-4 px-4 text-center">
        <p
          className="text-xs max-w-md mx-auto leading-relaxed"
          style={{ color: "rgba(140,120,180,0.45)" }}
        >
          Este servicio es para entretenimiento y reflexión personal.
          No reemplaza asesoramiento profesional de ningún tipo.
        </p>
      </footer>
    </div>
  );
}
