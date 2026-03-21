import type { BingoCell, BingoSquare } from "@/types/bingo";
import { shuffle } from "./shuffle";
import { FREE_SQUARE } from "@/data/bingo-squares";

export function generateBingoCard(
  squares: BingoSquare[],
  _playerId: string
): BingoCell[] {
  const pool = squares.filter((s) => !s.isFree);
  const shuffled = shuffle(pool).slice(0, 24);

  const cells: BingoCell[] = [];

  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      // Center = free square
      cells.push({ ...FREE_SQUARE, position: 12 });
    } else {
      const idx = i < 12 ? i : i - 1;
      cells.push({ ...shuffled[idx], position: i });
    }
  }

  return cells;
}

export function checkBingoWin(
  checkedIds: Set<string>,
  cells: BingoCell[]
): boolean {
  return getWinningLines(checkedIds, cells).length > 0;
}

export function getWinningLines(
  checkedIds: Set<string>,
  cells: BingoCell[]
): number[][] {
  const size = 5;
  const winning: number[][] = [];

  const isChecked = (pos: number) => {
    const cell = cells[pos];
    return cell && (checkedIds.has(cell.id) || cell.isFree);
  };

  // Rows
  for (let r = 0; r < size; r++) {
    const row = Array.from({ length: size }, (_, c) => r * size + c);
    if (row.every(isChecked)) winning.push(row);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = Array.from({ length: size }, (_, r) => r * size + c);
    if (col.every(isChecked)) winning.push(col);
  }

  // Diagonals
  const diag1 = [0, 6, 12, 18, 24];
  const diag2 = [4, 8, 12, 16, 20];
  if (diag1.every(isChecked)) winning.push(diag1);
  if (diag2.every(isChecked)) winning.push(diag2);

  return winning;
}
