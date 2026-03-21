export type BingoCategory = "trip" | "group" | "mountain" | "refuge";

export interface BingoSquare {
  id: string;
  text: string;
  category: BingoCategory;
  isFree?: boolean;
}

export interface BingoCell extends BingoSquare {
  position: number; // 0-24
}

export interface BingoGameState {
  cards: Record<string, BingoCell[]>;
  checkedCells: Record<string, string[]>; // playerId -> cellId[]
  winners: string[];
  startedAt: string;
}
