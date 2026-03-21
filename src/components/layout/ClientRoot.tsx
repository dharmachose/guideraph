"use client";
import { PlayerProvider } from "@/lib/player-context";
import { PlayerSelector } from "@/components/layout/PlayerSelector";
import { usePlayer } from "@/lib/player-context";
import type { ReactNode } from "react";

function AppContent({ children }: { children: ReactNode }) {
  const { player } = usePlayer();
  // Block the entire app until a player is chosen
  if (!player) return null;
  return <>{children}</>;
}

export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <PlayerSelector />
      <AppContent>{children}</AppContent>
    </PlayerProvider>
  );
}
