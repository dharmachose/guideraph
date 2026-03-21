"use client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Player } from "@/data/players";

interface BingoWinModalProps {
  winner: Player | null;
  onClose: () => void;
}

export function BingoWinModal({ winner, onClose }: BingoWinModalProps) {
  if (!winner) return null;

  return (
    <Modal open={!!winner} onClose={onClose}>
      <div className="text-center">
        {/* Snowflakes */}
        <div className="text-4xl mb-3 animate-bounce">❄️</div>
        <h2
          className="font-heading text-5xl tracking-wider mb-1"
          style={{ color: winner.color }}
        >
          BINGO !
        </h2>
        <p className="text-snow text-xl font-heading tracking-wide mb-1">
          {winner.name}
        </p>
        <p className="text-mist text-sm font-accent italic mb-6">
          remporte la gloire éternelle
        </p>
        <div className="text-5xl mb-6">{winner.emoji}</div>
        <Button className="w-full" onClick={onClose}>
          Continuer à jouer
        </Button>
      </div>
    </Modal>
  );
}
