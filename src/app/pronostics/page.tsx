"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { usePronosticsGame } from "@/hooks/usePronosticsGame";
import { PLAYERS } from "@/data/players";
import { PRONOSTIC_QUESTIONS } from "@/data/pronostics";

export default function PronosticsPage() {
  const { state, setAnswer, getAnswer, resolveQuestion, toggleReveal, resetGame } =
    usePronosticsGame();
  const [activePlayerId, setActivePlayerId] = useState(PLAYERS[0].id);
  const [resolveModal, setResolveModal] = useState<string | null>(null);
  const [resolveValue, setResolveValue] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const activePlayer = PLAYERS.find((p) => p.id === activePlayerId)!;

  return (
    <AppShell>
      <PageHeader
        icon="🔮"
        title="Pronostics"
        action={
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-mist hover:text-snow p-2"
          >
            ↺
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Player selector */}
        <div>
          <p className="text-mist text-xs uppercase tracking-wide mb-2">
            Joueur actif
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {PLAYERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlayerId(p.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  backgroundColor:
                    activePlayerId === p.id ? p.color + "33" : "#1A2B3C",
                  border: `2px solid ${activePlayerId === p.id ? p.color : "transparent"}`,
                  color: activePlayerId === p.id ? p.color : "#94A3B8",
                }}
              >
                <span>{p.emoji}</span>
                <span className="text-sm font-semibold">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={toggleReveal}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              state.isRevealed
                ? "bg-alpen-glow text-alpine-dark"
                : "bg-alpine-mid text-mist"
            }`}
          >
            {state.isRevealed ? "🔓 Mode révélation" : "🔒 Mode saisie"}
          </button>
        </div>

        {state.isRevealed && (
          <div className="bg-alpine-mid rounded-xl p-3 border border-alpen-glow/30">
            <p className="text-alpen-light text-sm">
              🏔️ Mode refuge actif — cliquez sur une question pour saisir la
              vraie réponse et comparer avec les pronostics !
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-3">
          {PRONOSTIC_QUESTIONS.map((q, i) => {
            const playerAnswer = getAnswer(activePlayer.id, q.id);
            const resolved = state.resolvedQuestions[q.id];
            const allAnswers = PLAYERS.map((p) => ({
              player: p,
              answer: getAnswer(p.id, q.id),
            })).filter((a) => a.answer);

            return (
              <div key={q.id} className="bg-alpine-mid rounded-xl overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-glacier text-xs font-bold bg-glacier/10 rounded-lg w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-snow text-sm font-medium">{q.text}</p>
                      {q.subtext && (
                        <p className="text-mist text-xs mt-0.5 italic font-accent">
                          {q.subtext}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answer input (when not revealed) */}
                  {!state.isRevealed && (
                    <div className="mt-2 ml-8">
                      <input
                        type="text"
                        value={playerAnswer}
                        onChange={(e) =>
                          setAnswer(activePlayer.id, q.id, e.target.value)
                        }
                        placeholder="Ta réponse..."
                        className="w-full bg-alpine-light rounded-lg px-3 py-2 text-sm text-snow placeholder-mist/50 outline-none focus:ring-2 focus:ring-glacier/50"
                        style={{ borderLeft: `3px solid ${activePlayer.color}` }}
                      />
                    </div>
                  )}

                  {/* Revealed mode - show all answers */}
                  {state.isRevealed && (
                    <div className="mt-2 ml-8 space-y-1.5">
                      {allAnswers.length === 0 ? (
                        <p className="text-mist/50 text-xs italic">
                          Personne n&apos;a répondu
                        </p>
                      ) : (
                        allAnswers.map(({ player, answer }) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-alpine-dark flex-shrink-0"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.name[0]}
                            </div>
                            <span style={{ color: player.color }}>{player.name}</span>
                            <span className="text-mist">→</span>
                            <span className="text-snow">{answer}</span>
                            {resolved && (
                              <span className="ml-auto">
                                {answer.toLowerCase().trim() ===
                                resolved.toLowerCase().trim()
                                  ? "✅"
                                  : "❌"}
                              </span>
                            )}
                          </div>
                        ))
                      )}

                      {/* Resolved answer */}
                      {resolved ? (
                        <div className="mt-2 bg-summit/10 rounded-lg p-2 flex items-center gap-2">
                          <span className="text-summit text-xs font-bold">
                            Vraie réponse :
                          </span>
                          <span className="text-snow text-xs">{resolved}</span>
                          <button
                            onClick={() => {
                              setResolveValue(resolved);
                              setResolveModal(q.id);
                            }}
                            className="ml-auto text-mist text-xs"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setResolveValue("");
                            setResolveModal(q.id);
                          }}
                          className="mt-1 text-xs text-glacier underline"
                        >
                          + Saisir la vraie réponse
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolve modal */}
      <Modal open={resolveModal !== null} onClose={() => setResolveModal(null)}>
        <h2 className="font-heading text-2xl text-snow mb-1">
          Vraie réponse
        </h2>
        {resolveModal && (
          <p className="text-mist text-sm mb-4">
            {PRONOSTIC_QUESTIONS.find((q) => q.id === resolveModal)?.text}
          </p>
        )}
        <input
          type="text"
          value={resolveValue}
          onChange={(e) => setResolveValue(e.target.value)}
          placeholder="La vraie réponse..."
          className="w-full bg-alpine-dark rounded-xl px-4 py-3 text-snow placeholder-mist/50 outline-none focus:ring-2 focus:ring-summit/50 mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setResolveModal(null)}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 bg-summit hover:bg-summit/80 text-alpine-dark"
            onClick={() => {
              if (resolveModal && resolveValue.trim()) {
                resolveQuestion(resolveModal, resolveValue.trim());
              }
              setResolveModal(null);
            }}
          >
            Confirmer
          </Button>
        </div>
      </Modal>

      {/* Reset confirm modal */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)}>
        <h2 className="font-heading text-2xl text-snow mb-2">Tout effacer\u202f?</h2>
        <p className="text-mist text-sm mb-6">
          Tous les pronostics et réponses seront perdus.
        </p>
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
              setShowResetConfirm(false);
            }}
          >
            Effacer
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
