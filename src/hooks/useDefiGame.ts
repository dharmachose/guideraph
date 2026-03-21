"use client";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { DefiGameState, DefiCategory } from "@/types/defi";
import { DEFIS } from "@/data/defis";
import { shuffle } from "@/lib/shuffle";
import { PLAYERS } from "@/data/players";

const STORAGE_KEY = "raph-defis-v1";
const ALL_CATEGORIES: DefiCategory[] = ["piste", "refuge", "groupe"];

function createInitialState(): DefiGameState {
  const indices = DEFIS.map((_, i) => i);
  return {
    deckOrder: shuffle(indices),
    drawnCount: 0,
    drawnHistory: [],
    activeCategories: ALL_CATEGORIES,
  };
}

export function useDefiGame() {
  const [state, setState] = useLocalStorage<DefiGameState>(
    STORAGE_KEY,
    createInitialState()
  );

  const filteredDeck = useMemo(() => {
    return state.deckOrder.filter((idx) =>
      state.activeCategories.includes(DEFIS[idx].category)
    );
  }, [state.deckOrder, state.activeCategories]);

  const currentCard = useMemo(() => {
    const idx = filteredDeck[state.drawnCount - 1];
    return idx !== undefined ? DEFIS[idx] : null;
  }, [filteredDeck, state.drawnCount]);

  const remainingCount = Math.max(0, filteredDeck.length - state.drawnCount);
  const isDeckEmpty = remainingCount === 0;

  const drawCard = useCallback(() => {
    if (isDeckEmpty) return null;

    const nextIdx = filteredDeck[state.drawnCount];
    setState((prev) => ({
      ...prev,
      drawnCount: prev.drawnCount + 1,
      drawnHistory: [...prev.drawnHistory, nextIdx],
    }));
    return DEFIS[nextIdx];
  }, [isDeckEmpty, filteredDeck, state.drawnCount, setState]);

  const reshuffleDeck = useCallback(() => {
    setState(createInitialState());
  }, [setState]);

  const toggleCategory = useCallback(
    (category: DefiCategory) => {
      setState((prev) => {
        const active = prev.activeCategories;
        const newActive = active.includes(category)
          ? active.filter((c) => c !== category)
          : [...active, category];
        // Must keep at least one
        if (newActive.length === 0) return prev;
        return { ...prev, activeCategories: newActive, drawnCount: 0 };
      });
    },
    [setState]
  );

  const getRandomTarget = useCallback(() => {
    return PLAYERS[Math.floor(Math.random() * PLAYERS.length)];
  }, []);

  const history = useMemo(
    () => state.drawnHistory.map((idx) => DEFIS[idx]).filter(Boolean),
    [state.drawnHistory]
  );

  return {
    state,
    currentCard,
    remainingCount,
    isDeckEmpty,
    drawCard,
    reshuffleDeck,
    toggleCategory,
    getRandomTarget,
    history,
  };
}
