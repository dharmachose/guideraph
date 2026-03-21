"use client";
import { cn } from "@/lib/cn";
import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 bg-alpine-light rounded-2xl p-6 w-full max-w-sm max-h-[90dvh] overflow-y-auto animate-bounce-in",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
