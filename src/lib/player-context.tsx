"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { PLAYERS, type Player } from "@/data/players";

const LS_KEY = "guideraph:player";

interface PlayerCtx {
  player: Player | null;
  setPlayer: (p: Player) => void;
  isSelecting: boolean;
  openSelector: () => void;
  closeSelector: () => void;
}

const Ctx = createContext<PlayerCtx>({
  player: null,
  setPlayer: () => {},
  isSelecting: false,
  openSelector: () => {},
  closeSelector: () => {},
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayerState] = useState<Player | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    const found = PLAYERS.find((p) => p.id === saved) ?? null;
    setPlayerState(found);
    setIsSelecting(!found);
    setHydrated(true);
  }, []);

  const setPlayer = useCallback((p: Player) => {
    localStorage.setItem(LS_KEY, p.id);
    setPlayerState(p);
    setIsSelecting(false);
  }, []);

  const openSelector = useCallback(() => setIsSelecting(true), []);
  const closeSelector = useCallback(() => setIsSelecting(false), []);

  if (!hydrated) return null;

  return (
    <Ctx.Provider value={{ player, setPlayer, isSelecting, openSelector, closeSelector }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  return useContext(Ctx);
}
