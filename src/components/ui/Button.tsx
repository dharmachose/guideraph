import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-body font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
        {
          "bg-glacier text-alpine-dark hover:bg-glacier-light":
            variant === "primary",
          "bg-alpine-light text-snow hover:bg-alpine-mid border border-alpine-light":
            variant === "secondary",
          "text-mist hover:text-snow hover:bg-alpine-light": variant === "ghost",
          "bg-red-700 text-snow hover:bg-red-600": variant === "danger",
        },
        {
          "text-sm px-3 py-2 min-h-[36px]": size === "sm",
          "text-base px-4 py-3 min-h-[44px]": size === "md",
          "text-lg px-6 py-4 min-h-[52px]": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
