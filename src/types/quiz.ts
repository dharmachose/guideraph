export type QuizCategory = "vanoise" | "technique" | "groupe";

export interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  question: string;
  answers: QuizAnswer[];
  correctAnswerId: string;
  funFact?: string;
}

export interface QuizGameState {
  questionOrder: number[];
  currentQuestionIndex: number;
  scores: Record<string, number>;
  currentPlayerIndex: number;
  isFinished: boolean;
  givenAnswers: Record<number, string>;
}
