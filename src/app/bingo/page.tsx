"use client";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BingoBoard } from "@/components/bingo/BingoBoard";
import { BingoWinModal } from "@/components/bingo/BingoWinModal";
import { useBingoGame } from "@/hooks/useBingoGame";
import { PLAYERS, PLAYER_MAP } from "@/data/players";
import { usePlayer } from "@/lib/player-context";
import { checkBingoWin } from "@/lib/bingo-utils";
import { cn } from "@/lib/cn";

export default function BingoPage() {
  const { player } = usePlayer();
  const { state, checkCell, resetGame, getCheckedSet, getWinLines } =
    useBingoGame();
  const [activePlayerId, setActivePlayerId] = useState(player?.id ?? PLAYERS[0].id);
  const [celebratingWinner, setCelebratingWinner] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);


  const activePlayer = PLAYER_MAP[activePlayerId];
  const activeCard = state.cards[activePlayerId] ?? [];
  const checkedSet = getCheckedSet(activePlayerId);
  const winLines = getWinLines(activePlayerId);

  const winningPositions = useMemo(() => {
    return new Set(winLines.flat());
  }, [winLines]);

  const checkedCount = Array.from(checkedSet).length;
  const progress = Math.round((checkedCount / 24) * 100);

  function handleCheck(cellId: string) {
    checkCell(activePlayerId, cellId);
    if ("vibrate" in navigator) navigator.vibrate(50);

    // Check if this creates a win
    const newChecked = checkedSet.has(cellId)
      ? new Set([...checkedSet].filter((id) => id !== cellId))
      : new Set([...checkedSet, cellId]);
    const card = state.cards[activePlayerId] ?? [];
    if (checkBingoWin(newChecked, card) && !state.winners.includes(activePlayerId)) {
      setTimeout(() => setCelebratingWinner(activePlayerId), 300);
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }

  return (
    <AppShell>
      <PageHeader
        icon="🎯"
        title="Bingo Rando"
        action={
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-mist hover:text-snow p-2 text-lg"
          >
            ↺
          </button>
        }
      />

      <div className="px-3 py-3 space-y-3">
        {/* Player selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {PLAYERS.map((p) => {
            const pWinLines = getWinLines(p.id);
            const hasBingo = pWinLines.length > 0;
            return (
              <button
                key={p.id}
                onClick={() => setActivePlayerId(p.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl flex-shrink-0 transition-all relative",
                  activePlayerId === p.id
                    ? "bg-alpine-light"
                    : "bg-alpine-mid"
                )}
                style={{
                  border: `2px solid ${activePlayerId === p.id ? p.color : "transparent"}`,
                }}
              >
                <span className="text-lg leading-none">{p.emoji}</span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: p.color }}
                >
                  {p.name.split(" ")[0]}
                </span>
                {hasBingo && (
                  <span className="absolute -top-1 -right-1 bg-alpen-glow text-[8px] font-bold text-alpine-dark rounded-full w-4 h-4 flex items-center justify-center">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-alpine-light rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: activePlayer.color,
              }}
            />
          </div>
          <span className="text-mist text-xs">{checkedCount}/24</span>
        </div>

        {/* Bingo board */}
        <BingoBoard
          cells={activeCard}
          checkedIds={checkedSet}
          winningPositions={winningPositions}
          onCheck={handleCheck}
        />

        {/* Legend */}
        <div className="flex gap-3 justify-center flex-wrap">
          {[
            { label: "Piste", color: "#5EADD4" },
            { label: "Groupe", color: "#E8804A" },
            { label: "Montagne", color: "#4CAF82" },
            { label: "Refuge", color: "#C3B1E1" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-mist text-[10px]">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Winners */}
        {state.winners.length > 0 && (
          <div className="bg-alpen-glow/10 rounded-xl p-3 border border-alpen-glow/30">
            <p className="text-alpen-light text-xs font-semibold mb-2">
              🏆 BINGO!
            </p>
            <div className="flex gap-2 flex-wrap">
              {state.winners.map((wid) => {
                const wp = PLAYER_MAP[wid];
                return (
                  <span
                    key={wid}
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: wp.color + "22",
                      color: wp.color,
                    }}
                  >
                    {wp.emoji} {wp.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Win modal */}
      <BingoWinModal
        winner={celebratingWinner ? PLAYER_MAP[celebratingWinner] : null}
        onClose={() => setCelebratingWinner(null)}
      />

      {/* Reset confirm */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)}>
        <h2 className="font-heading text-2xl text-snow mb-2">
          Nouvelle partie ?
        </h2>
        <p className="text-mist text-sm mb-6">
          Toutes les cartes seront recréées et les cases cochées effacées.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowResetConfirm(false)}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              resetGame();
              setShowResetConfirm(false);
            }}
          >
            Nouvelle partie
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
