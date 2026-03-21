import { cn } from "@/lib/cn";

interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
}

export function Badge({ label, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
        !color && "bg-alpine-light text-mist",
        className
      )}
      style={color ? { backgroundColor: color + "33", color } : undefined}
    >
      {label}
    </span>
  );
}
