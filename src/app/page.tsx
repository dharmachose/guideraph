import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MountainSVG } from "@/components/layout/MountainSVG";
import { PlayerBadge } from "@/components/layout/PlayerBadge";
import { PLAYERS } from "@/data/players";

const GAMES = [
  {
    href: "/ski/dva",
    icon: "📡",
    title: "DVA Search",
    description:
      "Glisse ton DVA sur la neige pour localiser tes potes ensevelis. Sauve-les tous le plus vite possible\u202f!",
    accent: "#5EADD4",
    badge: "Mini-jeu",
  },
  {
    href: "/ski/avalanche",
    icon: "🏔️",
    title: "Évite l'Avalanche",
    description:
      "Descente sous pression\u202f: esquive les blocs d'avalanche qui tombent. 3 vies, vitesse croissante.",
    accent: "#E8804A",
    badge: "Mini-jeu",
  },
  {
    href: "/ski/guide",
    icon: "🗺️",
    title: "Suit Raph le Guide",
    description:
      "Raph trace son chemin dans la neige. Mémorise-le, il disparaît, puis reproduis-le\u202f! 3 manches.",
    accent: "#85C1E9",
    badge: "Mini-jeu",
  },
  {
    href: "/ski/crevasse",
    icon: "⚡",
    title: "Crevo-Hop",
    description:
      "Le skieur avance, les crevasses arrivent. TAP pour sauter au bon moment\u202f! Rythme qui s'accélère.",
    accent: "#4CAF82",
    badge: "Mini-jeu",
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col min-h-dvh">
        {/* Hero */}
        <div className="relative overflow-hidden bg-alpine-mid">
          <MountainSVG className="absolute bottom-0 left-0 right-0 w-full opacity-60" />
          <div className="relative z-10 px-6 pt-12 pb-16 text-center">
            <div className="text-5xl mb-2">🗺️</div>
            <h1 className="font-heading text-5xl text-snow tracking-wider leading-none">
              Raph le Guide
            </h1>
            <p className="mt-3 text-mist font-body text-sm">
              Le jeu du crew Vanoise 2025
            </p>
            {/* Player dots */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {PLAYERS.map((p) => (
                <div
                  key={p.id}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-alpine-dark"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {p.emoji}
                </div>
              ))}
            </div>

            {/* Current player badge */}
            <PlayerBadge />
          </div>
        </div>

        {/* Game list */}
        <div className="flex-1 px-4 py-6 space-y-3">
          {GAMES.map((game) => (
            <Link key={game.href} href={game.href} className="block">
              <div className="bg-alpine-mid rounded-2xl p-4 flex gap-4 items-start active:scale-[0.98] transition-transform border border-alpine-light hover:border-glacier/40">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: game.accent + "22" }}
                >
                  {game.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      className="font-heading text-xl leading-none"
                      style={{ color: game.accent }}
                    >
                      {game.title}
                    </h2>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                      style={{
                        backgroundColor: game.accent + "22",
                        color: game.accent,
                      }}
                    >
                      {game.badge}
                    </span>
                  </div>
                  <p className="text-mist text-xs mt-1 leading-relaxed">
                    {game.description}
                  </p>
                </div>
                <svg
                  className="text-mist flex-shrink-0 mt-1"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-mist/50 text-xs pb-6">
          Fait avec ❄️ par Chose • Vanoise 2025
        </p>
      </div>
    </AppShell>
  );
}
