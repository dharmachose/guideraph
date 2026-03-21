export interface PronosticQuestion {
  id: string;
  text: string;
  subtext?: string;
}

export interface PlayerPronostic {
  questionId: string;
  answer: string; // free text or selected option
}

export interface PronosticGameState {
  playerAnswers: Record<string, PlayerPronostic[]>; // playerId -> answers
  resolvedQuestions: Record<string, string>; // questionId -> correct answer
  isRevealed: boolean;
}
