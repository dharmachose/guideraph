"use client";
import type { BingoCell } from "@/types/bingo";
import { BingoCellComponent } from "./BingoCell";

interface BingoBoardProps {
  cells: BingoCell[];
  checkedIds: Set<string>;
  winningPositions: Set<number>;
  onCheck: (id: string) => void;
}

export function BingoBoard({
  cells,
  checkedIds,
  winningPositions,
  onCheck,
}: BingoBoardProps) {
  return (
    <div className="grid grid-cols-5 gap-1 w-full">
      {cells.map((cell) => (
        <BingoCellComponent
          key={cell.id}
          cell={cell}
          isChecked={checkedIds.has(cell.id) || Boolean(cell.isFree)}
          isWinning={winningPositions.has(cell.position)}
          onCheck={onCheck}
        />
      ))}
    </div>
  );
}
