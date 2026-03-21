export interface Player {
  id: string;
  name: string;
  color: string;
  emoji: string;
  colorClass: string;
  textClass: string;
}

export const PLAYERS: Player[] = [
  {
    id: "flix",
    name: "Flix",
    color: "#FF6B6B",
    emoji: "🎿",
    colorClass: "bg-player-flix",
    textClass: "text-player-flix",
  },
  {
    id: "hadri",
    name: "Hadri",
    color: "#4ECDC4",
    emoji: "🏔️",
    colorClass: "bg-player-hadri",
    textClass: "text-player-hadri",
  },
  {
    id: "emili",
    name: "Emilililie",
    color: "#FFE66D",
    emoji: "⛄",
    colorClass: "bg-player-emili",
    textClass: "text-player-emili",
  },
  {
    id: "momo",
    name: "Momo",
    color: "#A8E6CF",
    emoji: "🦌",
    colorClass: "bg-player-momo",
    textClass: "text-player-momo",
  },
  {
    id: "nico",
    name: "Nico",
    color: "#C3B1E1",
    emoji: "🌨️",
    colorClass: "bg-player-nico",
    textClass: "text-player-nico",
  },
  {
    id: "chose",
    name: "Chose",
    color: "#FF8B94",
    emoji: "📱",
    colorClass: "bg-player-chose",
    textClass: "text-player-chose",
  },
  {
    id: "raph",
    name: "Raph",
    color: "#85C1E9",
    emoji: "🗺️",
    colorClass: "bg-player-raph",
    textClass: "text-player-raph",
  },
];

export const PLAYER_MAP = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));
