import type { BingoSquare } from "@/types/bingo";

export const FREE_SQUARE: BingoSquare = {
  id: "free",
  text: "🗺️ Raph est le meilleur guide de Vanoise",
  category: "trip",
  isFree: true,
};

export const BINGO_SQUARES: BingoSquare[] = [
  // --- TRIP (on the slopes) ---
  {
    id: "t1",
    text: "Quelqu'un tombe dans la neige molle et ne peut pas se relever",
    category: "trip",
  },
  {
    id: "t2",
    text: "Raph dit «\u202fc'est juste un peu physique\u202f» avant une montée de 800m",
    category: "trip",
  },
  {
    id: "t3",
    text: "Quelqu'un enlève une couche dans la montée puis la remet dans la descente",
    category: "trip",
  },
  {
    id: "t4",
    text: "Une pause snack tourne à un pique-nique de 30 minutes",
    category: "trip",
  },
  {
    id: "t5",
    text: "Quelqu'un perd une peau de phoque",
    category: "trip",
  },
  {
    id: "t6",
    text: "Le groupe s'arrête pour regarder des bouquetins",
    category: "trip",
  },
  {
    id: "t7",
    text: "Quelqu'un glisse en marchant dans les montées",
    category: "trip",
  },
  {
    id: "t8",
    text: "On entend «\u202fc'est magnifique\u202f» au moins 5 fois en une journée",
    category: "trip",
  },
  {
    id: "t9",
    text: "Quelqu'un arrive au refuge trempé jusqu'aux sous-vêtements",
    category: "trip",
  },
  {
    id: "t10",
    text: "Raph consulte la carte et dit «\u202fon est exactement là où je pensais\u202f»",
    category: "trip",
  },
  {
    id: "t11",
    text: "Quelqu'un prend une photo au lieu de skier",
    category: "trip",
  },
  {
    id: "t12",
    text: "On croise une autre cordée et on fait semblant de ne pas être épuisés",
    category: "trip",
  },
  // --- GROUP ---
  {
    id: "g1",
    text: "Quelqu'un se plaint du poids de son sac dans les 30 premières minutes",
    category: "group",
  },
  {
    id: "g2",
    text: "Quelqu'un demande «\u202fc'est encore loin\u202f?» avant le premier virage",
    category: "group",
  },
  {
    id: "g3",
    text: "Le groupe prend 20 min pour se mettre d'accord sur l'heure du départ",
    category: "group",
  },
  {
    id: "g4",
    text: "Quelqu'un ment sur ses capacités\u202f: «\u202foui oui je skie bien\u202f»",
    category: "group",
  },
  {
    id: "g5",
    text: "Dispute sur qui a pris la dernière barre de céréales",
    category: "group",
  },
  {
    id: "g6",
    text: "Quelqu'un dit qu'il aurait dû faire plus de sport avant",
    category: "group",
  },
  {
    id: "g7",
    text: "Selfie de groupe tenté 3 fois minimum avant validation",
    category: "group",
  },
  {
    id: "g8",
    text: "Quelqu'un essaie d'enseigner une technique à quelqu'un qui n'a pas demandé",
    category: "group",
  },
  // --- MOUNTAIN / NATURE ---
  {
    id: "m1",
    text: "Vue sur le Mont Blanc par temps clair",
    category: "mountain",
  },
  {
    id: "m2",
    text: "Tempête de vent au sommet au pire moment possible",
    category: "mountain",
  },
  {
    id: "m3",
    text: "Rencontre avec des bouquetins (vraiment, pas de loin)",
    category: "mountain",
  },
  {
    id: "m4",
    text: "Coucher de soleil qui rend tout le monde silencieux",
    category: "mountain",
  },
  {
    id: "m5",
    text: "La météo change en 15 minutes comme annoncé par personne",
    category: "mountain",
  },
  // --- REFUGE ---
  {
    id: "r1",
    text: "Quelqu'un ronfle et tout le monde le sait le lendemain",
    category: "refuge",
  },
  {
    id: "r2",
    text: "La douche est soit froide soit bouillante, pas de milieu",
    category: "refuge",
  },
  {
    id: "r3",
    text: "Quelqu'un commande une deuxième assiette de tartiflette",
    category: "refuge",
  },
  {
    id: "r4",
    text: "On joue aux cartes et quelqu'un triche clairement",
    category: "refuge",
  },
  {
    id: "r5",
    text: "Le groupe parle des conditions de neige comme de vrais experts",
    category: "refuge",
  },
  {
    id: "r6",
    text: "On se couche avant 22h et on trouve ça absolument normal",
    category: "refuge",
  },
  {
    id: "r7",
    text: "La bière locale du refuge est jugée «\u202fpas si mauvaise en fait\u202f»",
    category: "refuge",
  },
  {
    id: "r8",
    text: "On raconte la même anecdote de montagne qu'on a déjà racontée",
    category: "refuge",
  },
  {
    id: "r9",
    text: "Quelqu'un sort son téléphone pour mettre de la musique et le groupe vote non",
    category: "refuge",
  },
  {
    id: "r10",
    text: "Quelqu'un feuillette le catalogue Millet et rêve tout haut",
    category: "refuge",
  },
  {
    id: "r11",
    text: "La gardienne du refuge raconte une anecdote de tempête légendaire",
    category: "refuge",
  },
];
