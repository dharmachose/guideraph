export type DefiCategory = "piste" | "refuge" | "groupe";

export interface Defi {
  id: string;
  text: string;
  category: DefiCategory;
  needsTarget: boolean;
}

export interface DefiGameState {
  deckOrder: number[];
  drawnCount: number;
  drawnHistory: number[];
  activeCategories: DefiCategory[];
}
