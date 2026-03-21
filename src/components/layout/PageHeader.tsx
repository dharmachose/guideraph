"use client";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  icon?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  icon,
  backHref,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-alpine-dark/90 backdrop-blur-md border-b border-alpine-mid",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
        {backHref && (
          <Link
            href={backHref}
            className="text-mist hover:text-snow transition-colors w-9 h-9 flex items-center justify-center rounded-xl hover:bg-alpine-light"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M5 12l7 7M5 12l7-7" />
            </svg>
          </Link>
        )}
        {icon && <span className="text-2xl">{icon}</span>}
        <h1 className="font-heading text-2xl text-snow tracking-wide flex-1">
          {title}
        </h1>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    </header>
  );
}
