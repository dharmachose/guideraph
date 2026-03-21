"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useQuizGame } from "@/hooks/useQuizGame";
import { cn } from "@/lib/cn";

const CATEGORY_LABELS: Record<string, string> = {
  vanoise: "🏔️ Vanoise",
  technique: "⛏️ Technique",
  groupe: "👥 Groupe",
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

const PODIUM_COMMENTS = [
  "👑 Roi de la montagne !",
  "🥈 Pas mal pour un débutant",
  "🥉 Médaille de bronze, c'est déjà ça",
  "😅 Au moins t'as essayé",
  "🛷 La luge c'est bien aussi",
  "☕ Championne des tisanes au refuge",
  "🛏️ A dormi pendant les questions",
];

export default function QuizPage() {
  const {
    state,
    currentQuestion,
    currentPlayer,
    submitAnswer,
    nextQuestion,
    resetGame,
    sortedScores,
    progress,
    givenAnswer,
  } = useQuizGame();

  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  function handleAnswer(answerId: string) {
    if (localAnswer !== null) return;
    const correct = submitAnswer(answerId);
    setLocalAnswer(answerId);
    setIsCorrect(correct);
    if ("vibrate" in navigator) navigator.vibrate(correct ? [50, 30, 50] : [100]);
  }

  function handleNext() {
    setLocalAnswer(null);
    setIsCorrect(null);
    nextQuestion();
  }

  if (!gameStarted) {
    return (
      <AppShell>
        <PageHeader icon="🏔️" title="Quiz Montagne" />
        <div className="px-4 py-8 flex flex-col items-center text-center gap-6">
          <div className="text-6xl">🎯</div>
          <div>
            <h2 className="font-heading text-3xl text-snow mb-2">
              Prêts pour le quiz ?
            </h2>
            <p className="text-mist text-sm leading-relaxed">
              {QUIZ_QUESTIONS_COUNT} questions sur la Vanoise, la technique
              montagne, et le groupe. +3 points par bonne réponse. Tour par
              tour.
            </p>
          </div>
          <div className="w-full space-y-2">
            <p className="text-mist text-xs uppercase tracking-wide">
              Ordre de passage
            </p>
            {sortedScores.map(({ player }, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-alpine-mid rounded-xl px-4 py-2"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-alpine-dark"
                  style={{ backgroundColor: player.color }}
                >
                  {i + 1}
                </div>
                <span className="text-snow text-sm">{player.name}</span>
                <span className="ml-auto text-lg">{player.emoji}</span>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={() => setGameStarted(true)}>
            C&apos;est parti ! 🏔️
          </Button>
        </div>
      </AppShell>
    );
  }

  if (state.isFinished) {
    return (
      <AppShell>
        <PageHeader icon="🏆" title="Résultats" />
        <div className="px-4 py-6 space-y-4">
          <h2 className="font-heading text-4xl text-snow text-center">
            Quiz Terminé !
          </h2>

          {/* Podium */}
          <div className="space-y-2">
            {sortedScores.map(({ player, score }, i) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3",
                  i === 0 ? "bg-alpen-glow/20 border border-alpen-glow/40" : "bg-alpine-mid"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-heading text-lg",
                    i === 0 ? "bg-alpen-glow text-alpine-dark" : "bg-alpine-light text-mist"
                  )}
                >
                  {i + 1}
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-alpine-dark flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name[0]}
                </div>
                <div className="flex-1">
                  <span className="text-snow font-semibold text-sm">
                    {player.name}
                  </span>
                  <p className="text-mist text-[10px]">
                    {PODIUM_COMMENTS[Math.min(i, PODIUM_COMMENTS.length - 1)]}
                  </p>
                </div>
                <span
                  className="font-heading text-2xl"
                  style={{ color: i === 0 ? "#E8804A" : "#94A3B8" }}
                >
                  {score}
                </span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              resetGame();
              setGameStarted(false);
            }}
          >
            Rejouer 🎯
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        icon="🏔️"
        title="Quiz Montagne"
        action={
          <button
            onClick={() => setShowScores(true)}
            className="text-mist hover:text-snow p-2"
          >
            🏅
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <ProgressBar
            value={(progress.current / progress.total) * 100}
            className="flex-1"
          />
          <span className="text-mist text-xs whitespace-nowrap">
            {progress.current}/{progress.total}
          </span>
        </div>

        {/* Current player banner */}
        {currentPlayer && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: currentPlayer.color + "22" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: currentPlayer.color + "33" }}
            >
              {currentPlayer.emoji}
            </div>
            <div>
              <p className="text-mist text-[10px] uppercase tracking-wide">
                Au tour de
              </p>
              <p
                className="font-heading text-xl leading-none"
                style={{ color: currentPlayer.color }}
              >
                {currentPlayer.name}
              </p>
            </div>
          </div>
        )}

        {/* Question */}
        {currentQuestion && (
          <div className="bg-alpine-mid rounded-2xl p-4 space-y-4">
            {/* Category badge */}
            <span className="text-xs font-semibold text-mist">
              {CATEGORY_LABELS[currentQuestion.category]}
            </span>

            <p className="text-snow font-body text-base leading-relaxed font-medium">
              {currentQuestion.question}
            </p>

            {/* Answers */}
            <div className="space-y-2">
              {currentQuestion.answers.map((answer, i) => {
                const isSelected = localAnswer === answer.id;
                const isCorrectAnswer =
                  answer.id === currentQuestion.correctAnswerId;
                const showResult = localAnswer !== null;

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(answer.id)}
                    disabled={localAnswer !== null}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98]",
                      !showResult && "bg-alpine-light hover:bg-alpine-mid border border-alpine-light hover:border-glacier/40",
                      showResult && isCorrectAnswer && "bg-summit/20 border border-summit",
                      showResult && isSelected && !isCorrectAnswer && "bg-red-700/20 border border-red-700",
                      showResult && !isSelected && !isCorrectAnswer && "bg-alpine-mid border border-transparent opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                        !showResult && "bg-alpine-dark text-mist",
                        showResult && isCorrectAnswer && "bg-summit text-alpine-dark",
                        showResult && isSelected && !isCorrectAnswer && "bg-red-700 text-snow",
                        showResult && !isSelected && !isCorrectAnswer && "bg-alpine-dark text-mist"
                      )}
                    >
                      {showResult && isCorrectAnswer
                        ? "✓"
                        : showResult && isSelected && !isCorrectAnswer
                        ? "✗"
                        : OPTION_LETTERS[i]}
                    </span>
                    <span className="text-snow text-sm">{answer.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Result + funfact */}
            {localAnswer !== null && (
              <div className="animate-card-reveal">
                {isCorrect ? (
                  <div className="bg-summit/10 rounded-xl p-3">
                    <p className="text-summit font-semibold text-sm mb-1">
                      ✓ Correct ! +3 points
                    </p>
                    {currentQuestion.funFact && (
                      <p className="text-mist text-xs font-accent italic">
                        {currentQuestion.funFact}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-700/10 rounded-xl p-3">
                    <p className="text-red-400 font-semibold text-sm mb-1">
                      ✗ Raté !
                    </p>
                    {currentQuestion.funFact && (
                      <p className="text-mist text-xs font-accent italic">
                        {currentQuestion.funFact}
                      </p>
                    )}
                  </div>
                )}
                <Button className="w-full mt-3" onClick={handleNext}>
                  Question suivante →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scores modal */}
      <Modal open={showScores} onClose={() => setShowScores(false)}>
        <h2 className="font-heading text-2xl text-snow mb-4">Scores</h2>
        <div className="space-y-2">
          {sortedScores.map(({ player, score }, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 bg-alpine-dark rounded-xl px-3 py-2"
            >
              <span className="text-mist text-sm w-5 text-right">{i + 1}</span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-alpine-dark"
                style={{ backgroundColor: player.color }}
              >
                {player.name[0]}
              </div>
              <span className="text-snow text-sm flex-1">{player.name}</span>
              <span
                className="font-heading text-xl"
                style={{ color: player.color }}
              >
                {score}
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={() => setShowScores(false)}
        >
          Fermer
        </Button>
      </Modal>

      {/* Reset confirm */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)}>
        <h2 className="font-heading text-2xl text-snow mb-2">
          Recommencer ?
        </h2>
        <p className="text-mist text-sm mb-6">Tous les scores seront remis à zéro.</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowResetConfirm(false)}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              resetGame();
              setLocalAnswer(null);
              setIsCorrect(null);
              setShowResetConfirm(false);
              setGameStarted(false);
            }}
          >
            Recommencer
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}

const QUIZ_QUESTIONS_COUNT = 30;
