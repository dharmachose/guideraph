"use client";
import { usePlayer } from "@/lib/player-context";

export function PlayerBadge() {
  const { player, openSelector } = usePlayer();

  if (!player) return null;

  return (
    <button
      onClick={openSelector}
      className="mt-4 flex items-center gap-2 px-4 py-2 rounded-2xl border mx-auto active:scale-95 transition-transform"
      style={{
        borderColor: player.color + "55",
        backgroundColor: player.color + "18",
      }}
    >
      <span className="text-xl">{player.emoji}</span>
      <div className="text-left">
        <p className="text-xs text-mist leading-none">Tu joues en tant que</p>
        <p className="font-heading text-lg leading-none mt-0.5" style={{ color: player.color }}>
          {player.name}
        </p>
      </div>
      <svg
        className="ml-1 opacity-50"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
      </svg>
    </button>
  );
}
