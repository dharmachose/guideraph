import { supabase } from "./supabase";

export interface DvaScore {
  id?: string;
  player_id: string;
  player_name: string;
  player_emoji: string;
  score: number;
  found_count: number;
  elapsed_seconds: number;
  created_at?: string;
}

export async function submitDvaScore(entry: Omit<DvaScore, "id" | "created_at">): Promise<void> {
  if (!supabase) return;
  await supabase.from("dva_scores").insert(entry);
}

export async function fetchDvaLeaderboard(): Promise<DvaScore[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("dva_scores")
    .select("*")
    .order("score", { ascending: false })
    .order("elapsed_seconds", { ascending: true })
    .limit(10);
  return (data as DvaScore[]) ?? [];
}
