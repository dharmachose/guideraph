"use client";
import { PlayerProvider } from "@/lib/player-context";
import { PlayerSelector } from "@/components/layout/PlayerSelector";
import type { ReactNode } from "react";

export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <PlayerSelector />
      {children}
    </PlayerProvider>
  );
}
