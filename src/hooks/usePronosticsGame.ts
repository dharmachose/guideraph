"use client";
import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { PronosticGameState } from "@/types/pronostics";

const STORAGE_KEY = "raph-pronostics-v1";

function createInitialState(): PronosticGameState {
  return {
    playerAnswers: {},
    resolvedQuestions: {},
    isRevealed: false,
  };
}

export function usePronosticsGame() {
  const [state, setState] = useLocalStorage<PronosticGameState>(
    STORAGE_KEY,
    createInitialState()
  );

  const setAnswer = useCallback(
    (playerId: string, questionId: string, answer: string) => {
      setState((prev) => {
        const existing = prev.playerAnswers[playerId] ?? [];
        const updated = existing.filter((a) => a.questionId !== questionId);
        updated.push({ questionId, answer });
        return {
          ...prev,
          playerAnswers: { ...prev.playerAnswers, [playerId]: updated },
        };
      });
    },
    [setState]
  );

  const getAnswer = useCallback(
    (playerId: string, questionId: string): string => {
      const answers = state.playerAnswers[playerId] ?? [];
      return answers.find((a) => a.questionId === questionId)?.answer ?? "";
    },
    [state.playerAnswers]
  );

  const resolveQuestion = useCallback(
    (questionId: string, correctAnswer: string) => {
      setState((prev) => ({
        ...prev,
        resolvedQuestions: {
          ...prev.resolvedQuestions,
          [questionId]: correctAnswer,
        },
      }));
    },
    [setState]
  );

  const toggleReveal = useCallback(() => {
    setState((prev) => ({ ...prev, isRevealed: !prev.isRevealed }));
  }, [setState]);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, [setState]);

  return {
    state,
    setAnswer,
    getAnswer,
    resolveQuestion,
    toggleReveal,
    resetGame,
  };
}
