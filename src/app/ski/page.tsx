"use client";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";

const SKI_GAMES = [
  {
    href: "/ski/dva",
    icon: "📡",
    title: "DVA Search",
    desc: "Localise tes potes ensevelis sous la neige",
    color: "#5EADD4",
  },
  {
    href: "/ski/avalanche",
    icon: "🏔️",
    title: "Évite l'Avalanche",
    desc: "Descente sous pression, esquive les blocs",
    color: "#E8804A",
  },
  {
    href: "/ski/guide",
    icon: "🗺️",
    title: "Suit Raph",
    desc: "Mémorise le chemin du guide et reproduis-le",
    color: "#85C1E9",
  },
  {
    href: "/ski/crevasse",
    icon: "⚡",
    title: "Crevo-Hop",
    desc: "Saute les crevasses au bon moment",
    color: "#4CAF82",
  },
];

export default function SkiPage() {
  return (
    <AppShell>
      <PageHeader icon="🎿" title="Ski avec Raph" />
      <div className="px-4 py-6">
        <p className="text-mist text-sm text-center mb-6">
          4 mini-jeux thématiques Vanoise
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SKI_GAMES.map((game) => (
            <Link key={game.href} href={game.href} className="block">
              <div
                className="rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.96] transition-transform border border-alpine-light"
                style={{ backgroundColor: game.color + "18" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: game.color + "30" }}
                >
                  {game.icon}
                </div>
                <div>
                  <h2
                    className="font-heading text-lg leading-none"
                    style={{ color: game.color }}
                  >
                    {game.title}
                  </h2>
                  <p className="text-mist text-xs mt-1 leading-snug">
                    {game.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
