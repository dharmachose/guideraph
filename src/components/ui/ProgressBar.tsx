import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: string;
}

export function ProgressBar({ value, className, color }: ProgressBarProps) {
  return (
    <div
      className={cn("w-full h-2 rounded-full bg-alpine-light overflow-hidden", className)}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color ?? "#5EADD4",
        }}
      />
    </div>
  );
}
