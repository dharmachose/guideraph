"use client";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { BingoGameState } from "@/types/bingo";
import { BINGO_SQUARES } from "@/data/bingo-squares";
import { PLAYERS } from "@/data/players";
import { generateBingoCard, checkBingoWin, getWinningLines } from "@/lib/bingo-utils";

const STORAGE_KEY = "raph-bingo-v1";

function createInitialState(): BingoGameState {
  const cards: BingoGameState["cards"] = {};
  for (const player of PLAYERS) {
    cards[player.id] = generateBingoCard(BINGO_SQUARES, player.id);
  }
  return {
    cards,
    checkedCells: Object.fromEntries(PLAYERS.map((p) => [p.id, []])),
    winners: [],
    startedAt: new Date().toISOString(),
  };
}

export function useBingoGame() {
  const [state, setState] = useLocalStorage<BingoGameState>(
    STORAGE_KEY,
    createInitialState()
  );

  const hasGame = useMemo(
    () => Boolean(state.startedAt),
    [state.startedAt]
  );

  const checkCell = useCallback(
    (playerId: string, cellId: string) => {
      setState((prev) => {
        const current = prev.checkedCells[playerId] ?? [];
        const alreadyChecked = current.includes(cellId);
        const newChecked = alreadyChecked
          ? current.filter((id) => id !== cellId)
          : [...current, cellId];

        const newCheckedCells = { ...prev.checkedCells, [playerId]: newChecked };

        // Check win
        const checkedSet = new Set(newChecked);
        const card = prev.cards[playerId] ?? [];
        const isWinner = checkBingoWin(checkedSet, card);
        const newWinners = isWinner && !prev.winners.includes(playerId)
          ? [...prev.winners, playerId]
          : prev.winners;

        return { ...prev, checkedCells: newCheckedCells, winners: newWinners };
      });
    },
    [setState]
  );

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, [setState]);

  const getCheckedSet = useCallback(
    (playerId: string): Set<string> => {
      return new Set(state.checkedCells[playerId] ?? []);
    },
    [state.checkedCells]
  );

  const getWinLines = useCallback(
    (playerId: string): number[][] => {
      const checkedSet = getCheckedSet(playerId);
      const card = state.cards[playerId] ?? [];
      return getWinningLines(checkedSet, card);
    },
    [state.cards, getCheckedSet]
  );

  return {
    state,
    hasGame,
    checkCell,
    resetGame,
    getCheckedSet,
    getWinLines,
  };
}
