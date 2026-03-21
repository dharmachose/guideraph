"use client";
import { PLAYERS } from "@/data/players";
import { usePlayer } from "@/lib/player-context";
import { cn } from "@/lib/cn";

export function PlayerSelector() {
  const { player, setPlayer, isSelecting, hydrated, closeSelector } = usePlayer();

  if (!hydrated || !isSelecting) return null;

  const isChangeMode = !!player; // already selected once = "change" mode

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-alpine-dark overflow-y-auto">
      {/* Header */}
      <div className="flex-none px-6 pt-safe pt-8 pb-6 text-center">
        <p className="text-glacier font-heading text-5xl tracking-wider">
          T'es qui ?
        </p>
        <p className="text-mist text-sm mt-2">
          {isChangeMode
            ? "Choisis ton personnage pour ce séjour"
            : "Choisis ton perso pour tout le séjour"}
        </p>
      </div>

      {/* Players grid */}
      <div className="flex-1 px-4 pb-4 grid grid-cols-2 gap-3">
        {PLAYERS.map((p) => {
          const isRaph = p.id === "raph";
          const isSelected = player?.id === p.id;

          return (
            <button
              key={p.id}
              onClick={() => setPlayer(p)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-6 px-4 transition-all active:scale-95",
                isSelected
                  ? "border-current bg-current/10 scale-105"
                  : "border-alpine-light bg-alpine-mid hover:border-current hover:bg-current/5",
                isRaph && "col-span-2"
              )}
              style={{ color: p.color }}
            >
              {isRaph && (
                <span className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-widest text-glacier/70">
                  Guide
                </span>
              )}

              {/* Avatar circle */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
                style={{ backgroundColor: p.color + "22", borderColor: p.color }}
              >
                {p.emoji}
              </div>

              <span className="font-heading text-2xl tracking-wide" style={{ color: p.color }}>
                {p.name}
              </span>

              {isSelected && (
                <span className="text-[11px] font-semibold text-glacier uppercase tracking-widest">
                  C'est toi ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cancel if already has a player */}
      {isChangeMode && (
        <div className="flex-none px-6 pb-safe pb-6 pt-2">
          <button
            onClick={closeSelector}
            className="w-full py-3 rounded-2xl bg-alpine-mid text-mist text-sm font-semibold active:scale-95"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
