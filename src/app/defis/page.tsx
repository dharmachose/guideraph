"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDefiGame } from "@/hooks/useDefiGame";
import type { DefiCategory } from "@/types/defi";
import { cn } from "@/lib/cn";

const CATEGORY_CONFIG: Record<
  DefiCategory,
  { label: string; icon: string; color: string }
> = {
  piste: { label: "Piste", icon: "🎿", color: "#5EADD4" },
  refuge: { label: "Refuge", icon: "🏠", color: "#C3B1E1" },
  groupe: { label: "Groupe", icon: "👥", color: "#E8804A" },
};

export default function DefisPage() {
  const {
    state,
    currentCard,
    remainingCount,
    isDeckEmpty,
    drawCard,
    reshuffleDeck,
    toggleCategory,
    getRandomTarget,
    history,
  } = useDefiGame();

  const [isFlipped, setIsFlipped] = useState(false);
  const [displayedCard, setDisplayedCard] = useState<ReturnType<typeof drawCard>>(null);
  const [target, setTarget] = useState<ReturnType<typeof getRandomTarget> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showReshuffle, setShowReshuffle] = useState(false);

  function handleDraw() {
    const card = drawCard();
    if (card) {
      setDisplayedCard(card);
      setTarget(card.needsTarget ? getRandomTarget() : null);
      setIsFlipped(false);
      setTimeout(() => setIsFlipped(true), 50);
    }
  }

  return (
    <AppShell>
      <PageHeader
        icon="🃏"
        title="Défis Rando"
        action={
          <button
            onClick={() => setShowHistory(true)}
            className="text-mist hover:text-snow p-2"
          >
            📜
          </button>
        }
      />

      <div className="px-4 py-4 space-y-5">
        {/* Category filters */}
        <div>
          <p className="text-mist text-xs uppercase tracking-wide mb-2">
            Catégories actives
          </p>
          <div className="flex gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [DefiCategory, (typeof CATEGORY_CONFIG)[DefiCategory]][]).map(
              ([cat, config]) => {
                const isActive = state.activeCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: isActive
                        ? config.color + "22"
                        : "#1A2B3C",
                      border: `2px solid ${isActive ? config.color : "transparent"}`,
                      color: isActive ? config.color : "#94A3B8",
                    }}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Card area */}
        <div className="card-flip-container">
          <div
            className={cn(
              "card-flip-inner relative w-full",
              isFlipped && displayedCard ? "flipped" : ""
            )}
            style={{ minHeight: "220px" }}
          >
            {/* Card back */}
            <div className="card-face absolute inset-0">
              <div className="bg-alpine-mid rounded-2xl h-full flex flex-col items-center justify-center p-6 border border-alpine-light min-h-[220px]">
                <div className="text-6xl mb-3">🏔️</div>
                <p className="text-mist text-sm text-center">
                  {isDeckEmpty
                    ? "Le deck est épuisé !"
                    : `${remainingCount} carte${remainingCount > 1 ? "s" : ""} restante${remainingCount > 1 ? "s" : ""}`}
                </p>
                {/* Stacked cards visual */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(5, remainingCount) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-2.5 rounded-sm bg-alpine-light"
                        style={{ opacity: 1 - i * 0.15 }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Card front */}
            <div className="card-face card-face-back absolute inset-0">
              {displayedCard && (
                <div
                  className="bg-alpine-mid rounded-2xl h-full flex flex-col p-5 border min-h-[220px]"
                  style={{
                    borderColor:
                      CATEGORY_CONFIG[displayedCard.category].color + "44",
                  }}
                >
                  {/* Category badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">
                      {CATEGORY_CONFIG[displayedCard.category].icon}
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_CONFIG[displayedCard.category].color + "22",
                        color: CATEGORY_CONFIG[displayedCard.category].color,
                      }}
                    >
                      {CATEGORY_CONFIG[displayedCard.category].label}
                    </span>
                    {target && (
                      <span
                        className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: target.color + "22",
                          color: target.color,
                        }}
                      >
                        {target.emoji} {target.name}
                      </span>
                    )}
                  </div>

                  {/* Card text */}
                  <p className="text-snow font-body text-base leading-relaxed flex-1">
                    {displayedCard.text}
                    {target && (
                      <span style={{ color: target.color }}>
                        {" "}
                        → {target.name}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Draw button */}
        {isDeckEmpty ? (
          <Button
            size="lg"
            className="w-full bg-alpen-glow hover:bg-alpen-light text-alpine-dark"
            onClick={() => setShowReshuffle(true)}
          >
            🔀 Reshuffler le deck
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={handleDraw}>
            🃏 Tirer une carte
          </Button>
        )}

        {/* History preview */}
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(true)}
            className="w-full text-center text-mist text-xs py-2"
          >
            {history.length} carte{history.length > 1 ? "s" : ""} piochée{history.length > 1 ? "s" : ""} • Voir l&apos;historique →
          </button>
        )}
      </div>

      {/* History modal */}
      <Modal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        className="max-h-[80dvh]"
      >
        <h2 className="font-heading text-2xl text-snow mb-4">Historique</h2>
        {history.length === 0 ? (
          <p className="text-mist text-sm">Aucune carte piochée.</p>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[50dvh]">
            {[...history].reverse().map((card, i) => (
              <div
                key={i}
                className="bg-alpine-dark rounded-xl p-3 flex items-start gap-2"
              >
                <span className="text-lg flex-shrink-0">
                  {CATEGORY_CONFIG[card.category].icon}
                </span>
                <p className="text-snow text-xs leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={() => setShowHistory(false)}
        >
          Fermer
        </Button>
      </Modal>

      {/* Reshuffle confirm */}
      <Modal open={showReshuffle} onClose={() => setShowReshuffle(false)}>
        <h2 className="font-heading text-2xl text-snow mb-2">Reshuffler ?</h2>
        <p className="text-mist text-sm mb-6">
          Toutes les cartes seront remélangées et l&apos;historique effacé.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowReshuffle(false)}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 bg-alpen-glow hover:bg-alpen-light text-alpine-dark"
            onClick={() => {
              reshuffleDeck();
              setDisplayedCard(null);
              setIsFlipped(false);
              setShowReshuffle(false);
            }}
          >
            Reshuffler
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
