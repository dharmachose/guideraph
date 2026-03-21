"use client";
import { cn } from "@/lib/cn";
import type { BingoCell as BingoCellType } from "@/types/bingo";

interface BingoCellProps {
  cell: BingoCellType;
  isChecked: boolean;
  isWinning: boolean;
  onCheck: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  trip: "#5EADD4",
  group: "#E8804A",
  mountain: "#4CAF82",
  refuge: "#C3B1E1",
};

export function BingoCellComponent({
  cell,
  isChecked,
  isWinning,
  onCheck,
}: BingoCellProps) {
  const isFree = cell.isFree;

  return (
    <button
      onClick={() => !isFree && onCheck(cell.id)}
      disabled={isFree}
      className={cn(
        "relative aspect-square flex items-center justify-center rounded-lg p-1 text-center transition-all active:scale-95 overflow-hidden",
        isFree
          ? "bg-glacier/20 cursor-default"
          : isChecked
          ? "bg-alpen-glow/20"
          : "bg-alpine-mid hover:bg-alpine-light",
        isWinning && "ring-2 ring-alpen-glow ring-offset-1 ring-offset-alpine-dark"
      )}
    >
      {/* Category color indicator */}
      {!isFree && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
          style={{ backgroundColor: CATEGORY_COLORS[cell.category] }}
        />
      )}

      {/* Checked stamp overlay */}
      {isChecked && !isFree && (
        <div className="absolute inset-0 flex items-center justify-center animate-stamp">
          <div className="absolute inset-0 bg-alpen-glow/30 rounded-lg" />
          <span className="relative text-2xl transform -rotate-12 z-10">✓</span>
        </div>
      )}

      {/* Cell text */}
      <span
        className={cn(
          "text-[9px] leading-tight font-body relative z-10",
          isFree
            ? "text-glacier font-semibold text-[10px]"
            : isChecked
            ? "text-alpen-light/70 line-through"
            : "text-snow"
        )}
      >
        {cell.text}
      </span>
    </button>
  );
}
