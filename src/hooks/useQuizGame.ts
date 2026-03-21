"use client";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { QuizGameState } from "@/types/quiz";
import { QUIZ_QUESTIONS } from "@/data/quiz-questions";
import { PLAYERS } from "@/data/players";
import { shuffle } from "@/lib/shuffle";

const STORAGE_KEY = "raph-quiz-v1";
const POINTS_CORRECT = 3;

function createInitialState(startPlayerIndex = 0): QuizGameState {
  return {
    questionOrder: shuffle(QUIZ_QUESTIONS.map((_, i) => i)),
    currentQuestionIndex: 0,
    scores: Object.fromEntries(PLAYERS.map((p) => [p.id, 0])),
    currentPlayerIndex: startPlayerIndex,
    isFinished: false,
    givenAnswers: {},
  };
}

export function useQuizGame(startPlayerIndex = 0) {
  const [state, setState] = useLocalStorage<QuizGameState>(
    STORAGE_KEY,
    createInitialState(startPlayerIndex)
  );

  const currentQuestion = useMemo(() => {
    const idx = state.questionOrder[state.currentQuestionIndex];
    return idx !== undefined ? QUIZ_QUESTIONS[idx] : null;
  }, [state.questionOrder, state.currentQuestionIndex]);

  const currentPlayer = PLAYERS[state.currentPlayerIndex];

  const submitAnswer = useCallback(
    (answerId: string) => {
      if (!currentQuestion) return false;

      const isCorrect = answerId === currentQuestion.correctAnswerId;
      const questionIdx = state.currentQuestionIndex;

      setState((prev) => {
        const currentPlayerId = PLAYERS[prev.currentPlayerIndex].id;
        const newScores = { ...prev.scores };
        if (isCorrect) {
          newScores[currentPlayerId] =
            (newScores[currentPlayerId] ?? 0) + POINTS_CORRECT;
        }

        return {
          ...prev,
          scores: newScores,
          givenAnswers: { ...prev.givenAnswers, [questionIdx]: answerId },
        };
      });

      return isCorrect;
    },
    [currentQuestion, state.currentQuestionIndex, setState]
  );

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      const isFinished = nextIndex >= prev.questionOrder.length;
      return {
        ...prev,
        currentQuestionIndex: isFinished ? prev.currentQuestionIndex : nextIndex,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % PLAYERS.length,
        isFinished,
      };
    });
  }, [setState]);

  const resetGame = useCallback(() => {
    setState(createInitialState(startPlayerIndex));
  }, [setState, startPlayerIndex]);

  const sortedScores = useMemo(() => {
    return PLAYERS.map((p) => ({
      player: p,
      score: state.scores[p.id] ?? 0,
    })).sort((a, b) => b.score - a.score);
  }, [state.scores]);

  const progress = {
    current: state.currentQuestionIndex + 1,
    total: state.questionOrder.length,
  };

  const givenAnswer = currentQuestion
    ? state.givenAnswers[state.currentQuestionIndex]
    : undefined;

  return {
    state,
    currentQuestion,
    currentPlayer,
    submitAnswer,
    nextQuestion,
    resetGame,
    sortedScores,
    progress,
    givenAnswer,
  };
}
