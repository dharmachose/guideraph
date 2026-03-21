import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ elevated, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        elevated ? "bg-alpine-light" : "bg-alpine-mid",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
