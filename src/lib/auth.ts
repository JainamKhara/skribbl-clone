import { supabase } from "./supabase";

// ============================================
// Profile functions (Supabase DB)
// ============================================

export interface Profile {
  id: string;
  username: string;
  avatar_index: number;
  games_played: number;
  games_won: number;
  total_score: number;
  created_at: string;
}

export async function getOrCreateProfile(
  userId: string,
  username: string
): Promise<Profile | null> {
  // Try to get existing profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (existing) return existing as Profile;

  // Create new profile
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      username,
      avatar_index: Math.floor(Math.random() * 12),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create profile:", error.message, error.code, error.details, error.hint);
    return null;
  }
  return created as Profile;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as Profile;
}

// ============================================
// Game result functions (Supabase DB)
// ============================================

export interface GameResult {
  roomId: string;
  totalRounds: number;
  drawTime: number;
  playerCount: number;
  participants: {
    userId: string | null;
    playerName: string;
    score: number;
    rank: number;
    wordsGuessed: number;
  }[];
}

export async function saveGameResult(result: GameResult) {
  // 1. Insert game history
  const { data: game, error: gameError } = await supabase
    .from("game_history")
    .insert({
      room_id: result.roomId,
      total_rounds: result.totalRounds,
      draw_time: result.drawTime,
      player_count: result.playerCount,
    })
    .select("id")
    .single();

  if (gameError || !game) {
    console.error("Failed to save game:", gameError);
    return;
  }

  // 2. Insert participants
  const participants = result.participants.map((p) => ({
    game_id: game.id,
    user_id: p.userId,
    player_name: p.playerName,
    score: p.score,
    rank: p.rank,
    words_guessed: p.wordsGuessed,
  }));

  const { error: partError } = await supabase
    .from("game_participants")
    .insert(participants);

  if (partError) {
    console.error("Failed to save participants:", partError);
    return;
  }

  // 3. Update profiles for authenticated participants
  for (const p of result.participants) {
    if (!p.userId) continue;
    const { data: profile } = await supabase
      .from("profiles")
      .select("games_played, games_won, total_score")
      .eq("id", p.userId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          games_played: profile.games_played + 1,
          games_won: p.rank === 1 ? profile.games_won + 1 : profile.games_won,
          total_score: profile.total_score + p.score,
        })
        .eq("id", p.userId);
    }
  }
}

// ============================================
// Leaderboard functions
// ============================================

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_index: number;
  games_played: number;
  games_won: number;
  total_score: number;
  rank: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_index, games_played, games_won, total_score")
    .gt("games_played", 0)
    .order("total_score", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data || []).map((entry, i) => ({
    ...entry,
    rank: i + 1,
  })) as LeaderboardEntry[];
}

// ============================================
// Game history for a specific user
// ============================================

export interface GameHistoryEntry {
  id: string;
  room_id: string;
  played_at: string;
  total_rounds: number;
  player_count: number;
  score: number;
  rank: number;
}

export async function getUserGameHistory(
  userId: string
): Promise<GameHistoryEntry[]> {
  const { data, error } = await supabase
    .from("game_participants")
    .select(
      `
      score,
      rank,
      game_history:game_id (
        id,
        room_id,
        played_at,
        total_rounds,
        player_count
      )
    `
    )
    .eq("user_id", userId)
    .order("id", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => {
    const game = row.game_history as Record<string, unknown>;
    return {
      id: game.id as string,
      room_id: game.room_id as string,
      played_at: game.played_at as string,
      total_rounds: game.total_rounds as number,
      player_count: game.player_count as number,
      score: row.score as number,
      rank: row.rank as number,
    };
  });
}
