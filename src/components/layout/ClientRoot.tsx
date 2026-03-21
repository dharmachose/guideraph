"use client";
import { PlayerProvider } from "@/lib/player-context";
import { PlayerSelector } from "@/components/layout/PlayerSelector";
import { usePlayer } from "@/lib/player-context";
import type { ReactNode } from "react";

function AppContent({ children }: { children: ReactNode }) {
  const { player, hydrated } = usePlayer();
  // During SSR (hydrated=false): render nothing but let the route exist
  // After hydration: show app only when player is chosen
  if (!hydrated || !player) return null;
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
