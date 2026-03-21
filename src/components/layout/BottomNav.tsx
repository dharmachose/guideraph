"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/pronostics", label: "Pronostics", icon: "🔮", short: "Pronos" },
  { href: "/bingo", label: "Bingo Rando", icon: "🎯", short: "Bingo" },
  { href: "/defis", label: "Défis", icon: "🃏", short: "Défis" },
  { href: "/quiz", label: "Quiz", icon: "🏔️", short: "Quiz" },
  { href: "/ski", label: "Ski", icon: "🎿", short: "Ski" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-alpine-mid/95 backdrop-blur-md border-t border-alpine-light pb-safe">
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors",
                isActive ? "text-glacier" : "text-mist hover:text-snow"
              )}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {tab.short}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-glacier rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
