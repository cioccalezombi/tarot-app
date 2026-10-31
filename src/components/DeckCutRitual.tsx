"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TarotCard,
  DECK,
  shuffleDeck,
  cortesValidos,
  cortesAlAzar,
  cortarMazo,
  juntarMontones,
  MIN_CARDS_PER_PILE,
} from "@/lib/tarot-deck";

interface DeckCutRitualProps {
  onDeckReady: (deck: TarotCard[]) => void;
  onCancel?: () => void;
}

type RitualPhase = "intro" | "cutting" | "ordering" | "joining";

export default function DeckCutRitual({ onDeckReady, onCancel }: DeckCutRitualProps) {
  const [deck, setDeck] = useState<TarotCard[]>(() => shuffleDeck(DECK));
  const [isShuffled, setIsShuffled] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [phase, setPhase] = useState<RitualPhase>("intro");
  const [pilesCount, setPilesCount] = useState<number>(3);
  const [cuts, setCuts] = useState<number[]>([]);
  const [hint, setHint] = useState<number | null>(null);
  const [piles, setPiles] = useState<TarotCard[][]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const stackRef = useRef<HTMLDivElement>(null);
  const sliverRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intro animation: el mazo cae de frente y pasa a estar de canto
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("cutting");
      setStatusMessage("Tocá el mazo en los puntos donde quieras cortar.");
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  // Actualizar mensaje de estado según cortes y montones
  useEffect(() => {
    if (phase !== "cutting") return;
    if (pilesCount === 1) {
      setStatusMessage("Con 1 montón el mazo no se corta. Podés continuar directamente.");
      return;
    }
    const needed = pilesCount - 1;
    const remaining = needed - cuts.length;
    if (remaining > 0) {
      setStatusMessage(
        `Elegí ${remaining === 1 ? "1 punto de corte" : `${remaining} puntos de corte`} tocando el mazo.`
      );
    } else {
      setStatusMessage("¡Cortes listos! Apretá 'Cortar' o tocá un corte para removerlo.");
    }
  }, [phase, pilesCount, cuts]);

  // Barajar
  const handleShuffle = () => {
    if (phase !== "cutting" || isShuffling) return;
    setIsShuffling(true);
    setCuts([]);
    setHint(null);
    setStatusMessage("Mezclando las cartas y renovando energías…");

    setTimeout(() => {
      setDeck(shuffleDeck(deck));
      setIsShuffled(true);
      setIsShuffling(false);
      setStatusMessage("Mazo barajado. Marcá los puntos de corte.");
    }, 850);
  };

  // Cambiar número de montones (1, 2 o 3)
  const handlePilesCountChange = (n: number) => {
    setPilesCount(n);
    setCuts([]);
    setHint(null);
  };

  // Corte al azar
  const handleRandomCut = () => {
    if (pilesCount <= 1) return;
    const rand = cortesAlAzar(deck.length, pilesCount, MIN_CARDS_PER_PILE);
    setCuts(rand);
    setHint(null);
  };

  // Calcular índice de corte a partir de coordenada Y
  const boundaryFromY = useCallback(
    (clientY: number): number | null => {
      if (!stackRef.current) return null;
      let bestIdx: number | null = null;
      let minDistance = Infinity;

      for (let b = MIN_CARDS_PER_PILE; b <= deck.length - MIN_CARDS_PER_PILE; b++) {
        const topEl = sliverRefs.current[b - 1];
        const bottomEl = sliverRefs.current[b];
        if (!topEl || !bottomEl) continue;
        const topRect = topEl.getBoundingClientRect();
        const bottomRect = bottomEl.getBoundingClientRect();
        const midY = (topRect.bottom + bottomRect.top) / 2;
        const dist = Math.abs(clientY - midY);
        if (dist < minDistance) {
          minDistance = dist;
          bestIdx = b;
        }
      }
      return bestIdx;
    },
    [deck.length]
  );

  const toggleCut = (b: number | null) => {
    if (b === null || phase !== "cutting" || isShuffling) return;

    if (cuts.includes(b)) {
      setCuts(cuts.filter((c) => c !== b));
    } else {
      if (cuts.length >= pilesCount - 1) {
        if (pilesCount === 1) return;
        setStatusMessage("Ya marcaste todos los cortes requeridos. Tocá uno existente para quitarlo.");
        return;
      }
      const candidate = [...cuts, b].sort((x, y) => x - y);
      if (!cortesValidos(candidate, deck.length, MIN_CARDS_PER_PILE)) {
        setStatusMessage(`Cada montón debe tener al menos ${MIN_CARDS_PER_PILE} cartas.`);
        return;
      }
      setCuts(candidate);
    }
  };

  // Confirmar corte y pasar a ordenar los montones
  const handleExecuteCut = () => {
    if (pilesCount === 1) {
      onDeckReady(deck);
      return;
    }
    const createdPiles = cortarMazo(deck, cuts);
    setPiles(createdPiles);
    setOrder([]);
    setPhase("ordering");
    setStatusMessage(
      "Tocá los montones en el orden en que querés apilarlos. El primero que elijas quedará arriba."
    );
  };

  // Selección de montones para apilar
  const handleSelectPile = (index: number) => {
    if (phase !== "ordering" || order.includes(index)) return;
    const newOrder = [...order, index];

    // Si queda solo 1 montón sin elegir, se asigna automáticamente al final
    if (newOrder.length === piles.length - 1) {
      const remainingIdx = piles.findIndex((_, k) => !newOrder.includes(k));
      newOrder.push(remainingIdx);
    }

    setOrder(newOrder);

    if (newOrder.length >= piles.length) {
      // Todos los montones ordenados -> unirlos
      setPhase("joining");
      setStatusMessage("Reuniendo el mazo según tu intención…");
      setTimeout(() => {
        const finalDeck = juntarMontones(piles, newOrder);
        setDeck(finalDeck);
        onDeckReady(finalDeck);
      }, 700);
    } else {
      setStatusMessage(`Elegí el siguiente montón (${newOrder.length + 1} de ${piles.length}).`);
    }
  };

  // Cálculo de segmentos para colores de las rebanadas
  const effectiveCuts = (() => {
    if (hint === null || cuts.includes(hint) || cuts.length >= pilesCount - 1) return cuts;
    const candidate = [...cuts, hint].sort((a, b) => a - b);
    return cortesValidos(candidate, deck.length, MIN_CARDS_PER_PILE) ? candidate : cuts;
  })();

  const labels = (() => {
    const points = [0, ...effectiveCuts, deck.length];
    const res: Array<{ count: number; startIdx: number; endIdx: number }> = [];
    for (let k = 0; k < points.length - 1; k++) {
      res.push({
        count: points[k + 1] - points[k],
        startIdx: points[k],
        endIdx: points[k + 1] - 1,
      });
    }
    return res;
  })();

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      {/* ── Subtítulo de la fase ── */}
      <div className="flex items-center gap-3">
        <div className="h-px w-10 bg-amber-500/40" />
        <span className="text-amber-400/80 text-xs uppercase tracking-[0.25em] font-cinzel">
          Ritual de Barajado y Corte
        </span>
        <div className="h-px w-10 bg-amber-500/40" />
      </div>

      {/* ── Mesa interactiva ── */}
      <div className="w-full min-h-[360px] flex items-center justify-center p-4 relative rounded-2xl border border-purple-800/30 bg-gradient-to-b from-indigo-950/40 via-purple-950/20 to-slate-950/60 backdrop-blur-md shadow-2xl shadow-purple-950/40 overflow-hidden">
        {/* Esquinas místicas */}
        <span className="absolute top-3 left-3 text-amber-400/20 text-sm">✦</span>
        <span className="absolute top-3 right-3 text-amber-400/20 text-sm">✦</span>
        <span className="absolute bottom-3 left-3 text-amber-400/20 text-sm">✦</span>
        <span className="absolute bottom-3 right-3 text-amber-400/20 text-sm">✦</span>

        {/* ── ESCENA: Mazo de canto / Corte ── */}
        {(phase === "intro" || phase === "cutting") && (
          <div className="relative flex items-end justify-center min-h-[300px] w-full py-4">
            <div className="relative w-44 flex items-end justify-center perspective-[900px] mr-24">
              {/* Carta de frente que cae durante la intro */}
              {phase === "intro" && (
                <div
                  className="absolute inset-0 w-full h-[280px] rounded-xl border border-amber-400/60 bg-indigo-950 z-20 pointer-events-none shadow-2xl shadow-amber-500/20"
                  style={{
                    transformOrigin: "50% 100%",
                    animation: "tarotIntroFall 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards",
                    backgroundImage: `
                      radial-gradient(circle at 50% 50%, transparent 0 28px, rgba(245, 158, 11, 0.4) 28px 29px, transparent 30px),
                      repeating-linear-gradient(45deg, rgba(201, 163, 91, 0.15) 0 8px, transparent 8px 16px)
                    `,
                  }}
                >
                  <div className="absolute inset-2 border border-amber-400/30 rounded-lg flex items-center justify-center">
                    <span className="text-3xl text-amber-400/80">✦</span>
                  </div>
                </div>
              )}

              {/* El mazo de canto (78 slivers) */}
              <div
                ref={stackRef}
                tabIndex={0}
                role="group"
                aria-label="Mazo de tarot de costado. Tocá para cortar."
                className={`relative w-full cursor-crosshair select-none touch-none transition-all duration-300 ${
                  isShuffling ? "animate-pulse" : ""
                }`}
                onPointerDown={(e) => {
                  if (phase !== "cutting" || isShuffling) return;
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  setHint(boundaryFromY(e.clientY));
                }}
                onPointerMove={(e) => {
                  if (phase !== "cutting" || isShuffling) return;
                  setHint(boundaryFromY(e.clientY));
                }}
                onPointerUp={(e) => {
                  if (phase !== "cutting" || isShuffling) return;
                  const b = boundaryFromY(e.clientY);
                  toggleCut(b);
                  if (e.pointerType !== "mouse") setHint(null);
                }}
                onPointerLeave={() => {
                  if (!stackRef.current?.matches(":focus-visible")) setHint(null);
                }}
              >
                {deck.map((_, i) => {
                  const b = i + 1;
                  const segment = effectiveCuts.filter((c) => c <= i).length % 3;
                  const isCut = cuts.includes(b);
                  const isHinted = hint === b;

                  // Colores temáticos para cada montón resultante
                  const segBg =
                    segment === 0
                      ? "bg-purple-900/90 border-b border-amber-400/30"
                      : segment === 1
                      ? "bg-indigo-800/90 border-b border-amber-400/40"
                      : "bg-slate-800/90 border-b border-amber-400/30";

                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        sliverRefs.current[i] = el;
                      }}
                      className={`relative w-full h-[3.5px] transition-all duration-150 ${segBg} ${
                        i === 0 ? "rounded-t-[3px]" : ""
                      } ${i === deck.length - 1 ? "rounded-b-[3px]" : ""} ${
                        isCut ? "mb-3" : ""
                      } ${isShuffling ? (i % 2 === 0 ? "translate-x-2" : "-translate-x-2") : ""}`}
                    >
                      {/* Línea de corte confirmada */}
                      {isCut && (
                        <div className="absolute left-[-16px] right-[-16px] top-[calc(100%+5px)] border-t-2 border-dashed border-amber-400 z-10 animate-pulse pointer-events-none" />
                      )}
                      {/* Línea guía (hover / puntero) */}
                      {isHinted && !isCut && effectiveCuts.includes(b) && (
                        <div className="absolute left-[-14px] right-[-14px] top-full h-[2px] bg-amber-200 shadow-[0_0_8px_#fde68a] z-10 pointer-events-none" />
                      )}
                    </div>
                  );
                })}

                {/* Etiquetas flotantes a la derecha indicando la cantidad de cartas */}
                <div className="absolute left-[calc(100%+18px)] top-0 bottom-0 pointer-events-none">
                  {labels.map((item, idx) => {
                    const topEl = sliverRefs.current[item.startIdx];
                    const bottomEl = sliverRefs.current[item.endIdx];
                    const mid =
                      topEl && bottomEl
                        ? (topEl.offsetTop + bottomEl.offsetTop + bottomEl.offsetHeight) / 2
                        : idx * 80 + 30;

                    return (
                      <div
                        key={idx}
                        className="absolute whitespace-nowrap text-xs text-amber-300 font-cinzel tracking-wider bg-indigo-950/80 px-2 py-0.5 rounded border border-amber-500/30 backdrop-blur-sm -translate-y-1/2 shadow-md"
                        style={{ top: `${mid}px` }}
                      >
                        {item.count} cartas
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ESCENA: Montones separados para elegir orden ── */}
        {(phase === "ordering" || phase === "joining") && (
          <div className="w-full flex items-end justify-center gap-6 py-6 flex-wrap">
            {piles.map((pile, idx) => {
              const orderIdx = order.indexOf(idx);
              const isTaken = orderIdx !== -1;
              const badgeNum = isTaken ? orderIdx + 1 : null;

              return (
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPile(idx)}
                  disabled={isTaken || phase === "joining"}
                  className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${
                    isTaken
                      ? "opacity-50 cursor-default"
                      : "cursor-pointer hover:scale-105 active:scale-95"
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: phase === "joining" ? 0 : isTaken ? 0.6 : 1,
                    scale: phase === "joining" ? 0.9 : 1,
                    y: 0,
                  }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  {/* Badge de orden (1°, 2°, 3°) */}
                  {badgeNum && (
                    <span className="absolute -top-3 -right-2 z-20 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-cinzel font-bold text-xs flex items-center justify-center shadow-lg shadow-amber-500/40">
                      {badgeNum}º
                    </span>
                  )}

                  {/* Conteo de cartas */}
                  <span className="text-xs font-cinzel text-amber-300 tracking-wider">
                    {pile.length} cartas
                  </span>

                  {/* Columna de slivers apilados */}
                  <div
                    className={`w-28 rounded-lg overflow-hidden border border-purple-600/40 shadow-xl transition-all ${
                      !isTaken
                        ? "group-hover:border-amber-400/80 group-hover:shadow-amber-500/20"
                        : ""
                    }`}
                  >
                    {pile.map((_, sIdx) => {
                      const segColor =
                        idx === 0
                          ? "bg-purple-900 border-b border-purple-700/40"
                          : idx === 1
                          ? "bg-indigo-900 border-b border-indigo-700/40"
                          : "bg-slate-800 border-b border-slate-700/40";
                      return <div key={sIdx} className={`w-full h-[3.5px] ${segColor}`} />;
                    })}
                  </div>

                  <span className="text-[11px] text-purple-300/60 uppercase tracking-widest font-cinzel mt-1">
                    {isTaken ? `Pila #${badgeNum}` : "Tocar para apilar"}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Mensaje de estado ── */}
      <p className="min-h-[2.5rem] text-center text-sm md:text-base text-purple-200/90 font-light max-w-md px-2 flex items-center justify-center">
        {statusMessage}
      </p>

      {/* ── Controles ── */}
      {phase === "cutting" && (
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {/* Botón Barajar */}
          <button
            type="button"
            onClick={handleShuffle}
            disabled={isShuffling}
            className="px-4 py-2 text-xs uppercase tracking-widest font-cinzel text-purple-200 border border-purple-600/50 rounded-full hover:bg-purple-900/30 transition-all disabled:opacity-40"
          >
            ✦ Barajar
          </button>

          {/* Selector de montones: 1, 2 o 3 */}
          <div className="inline-flex rounded-full border border-amber-500/40 p-0.5 bg-indigo-950/40">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handlePilesCountChange(n)}
                disabled={isShuffling}
                className={`px-3 py-1 text-xs font-cinzel rounded-full transition-all ${
                  pilesCount === n
                    ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                    : "text-amber-200/70 hover:text-amber-100"
                }`}
              >
                {n} {n === 1 ? "montón" : "montones"}
              </button>
            ))}
          </div>

          {/* Botón Al azar */}
          {pilesCount > 1 && (
            <button
              type="button"
              onClick={handleRandomCut}
              disabled={isShuffling}
              className="px-4 py-2 text-xs uppercase tracking-widest font-cinzel text-purple-200 border border-purple-600/50 rounded-full hover:bg-purple-900/30 transition-all disabled:opacity-40"
            >
              Al azar
            </button>
          )}

          {/* Botón Confirmar Corte */}
          <button
            type="button"
            onClick={handleExecuteCut}
            disabled={
              isShuffling ||
              (pilesCount > 1 && cuts.length < pilesCount - 1)
            }
            className="px-6 py-2 text-xs uppercase tracking-[0.2em] font-cinzel text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 font-bold rounded-full hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            {pilesCount === 1 ? "Continuar con la tirada ✦" : "Cortar ✦"}
          </button>

          {/* Botón Saltear / Cancelar ritual */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-purple-400/50 hover:text-purple-300 underline underline-offset-4 font-cinzel transition-colors ml-2"
            >
              Saltear corte
            </button>
          )}
        </div>
      )}

      {/* Animación CSS para la caída frontal */}
      <style jsx global>{`
        @keyframes tarotIntroFall {
          0% {
            transform: rotateX(0deg);
            opacity: 1;
          }
          85% {
            transform: rotateX(78deg);
            opacity: 1;
          }
          100% {
            transform: rotateX(90deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
