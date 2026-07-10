"use server";

import { sql, initializeDatabase } from "./db";

// Initialize database on first load
let isDbInitialized = false;
async function ensureDbInitialized() {
  if (!isDbInitialized) {
    await initializeDatabase();
    isDbInitialized = true;
  }
}

// ============================================
// Profile functions (Neon DB)
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
  try {
    await ensureDbInitialized();
    
    // Try to get existing profile
    const existing = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;

    let p;
    if (existing && existing.length > 0) {
      p = existing[0];
    } else {
      // Create new profile
      const avatarIndex = Math.floor(Math.random() * 12);
      const created = await sql`
        INSERT INTO profiles (id, username, avatar_index)
        VALUES (${userId}, ${username}, ${avatarIndex})
        RETURNING *
      `;
      if (created && created.length > 0) {
        p = created[0];
      }
    }

    if (p) {
      // Fetch dynamic stats directly from game_participants to ensure 100% correct counts
      const stats = await sql`
        SELECT 
          COUNT(*)::int as games_played,
          COALESCE(SUM(score), 0)::int as total_score,
          COUNT(CASE WHEN rank = 1 THEN 1 END)::int as games_won
        FROM game_participants
        WHERE user_id = ${userId}
      `;
      const s = stats[0] || { games_played: 0, total_score: 0, games_won: 0 };
      
      return {
        id: p.id,
        username: p.username,
        avatar_index: p.avatar_index,
        games_played: s.games_played,
        games_won: s.games_won,
        total_score: s.total_score,
        created_at: p.created_at,
      } as Profile;
    }
    return null;
  } catch (error) {
    console.error("Failed to get or create profile:", error);
    return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    await ensureDbInitialized();
    
    const data = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;
    if (data && data.length > 0) {
      const p = data[0];
      // Fetch dynamic stats directly from game_participants to ensure 100% correct counts
      const stats = await sql`
        SELECT 
          COUNT(*)::int as games_played,
          COALESCE(SUM(score), 0)::int as total_score,
          COUNT(CASE WHEN rank = 1 THEN 1 END)::int as games_won
        FROM game_participants
        WHERE user_id = ${userId}
      `;
      const s = stats[0] || { games_played: 0, total_score: 0, games_won: 0 };

      return {
        id: p.id,
        username: p.username,
        avatar_index: p.avatar_index,
        games_played: s.games_played,
        games_won: s.games_won,
        total_score: s.total_score,
        created_at: p.created_at,
      } as Profile;
    }
    return null;
  } catch (error) {
    console.error("Failed to get profile:", error);
    return null;
  }
}

// ============================================
// Game result functions (Neon DB)
// ============================================

export interface GameResult {
  roomId: string;
  totalRounds: number;
  drawTime: number;
  playerCount: number;
  winnerId: string | null;
  winnerName: string;
  winnerScore: number;
  participants: {
    userId: string | null;
    playerName: string;
    score: number;
    rank: number;
    wordsGuessed: number;
    roundsWon: number;
    isHost: boolean;
  }[];
  rounds: {
    roundNumber: number;
    word: string;
    drawerName: string;
    drawerId: string | null;
    guessers: {
      playerName: string;
      playerId: string | null;
      pointsEarned: number;
      timeToGuess: number;
    }[];
  }[];
}

export async function saveGameResult(result: GameResult) {
  try {
    await ensureDbInitialized();
    // 1. Create or update profiles for authenticated participants to satisfy foreign key constraints first
    for (const p of result.participants) {
      if (!p.userId) continue;
      
      const profiles = await sql`
        SELECT games_played, games_won, total_score FROM profiles WHERE id = ${p.userId}
      `;

      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        const nextGamesPlayed = (profile.games_played || 0) + 1;
        const nextGamesWon = p.rank === 1 ? (profile.games_won || 0) + 1 : (profile.games_won || 0);
        const nextTotalScore = Number(profile.total_score || 0) + p.score;

        await sql`
          UPDATE profiles
          SET games_played = ${nextGamesPlayed},
              games_won = ${nextGamesWon},
              total_score = ${nextTotalScore}
          WHERE id = ${p.userId}
        `;
      } else {
        const gamesWon = p.rank === 1 ? 1 : 0;
        await sql`
          INSERT INTO profiles (id, username, avatar_index, games_played, games_won, total_score)
          VALUES (${p.userId}, ${p.playerName}, ${Math.floor(Math.random() * 12)}, 1, ${gamesWon}, ${p.score})
        `;
      }
    }

    // 2. Insert game history with winner info
    const game = await sql`
      INSERT INTO game_history (room_id, total_rounds, draw_time, player_count, winner_name, winner_score)
      VALUES (${result.roomId}, ${result.totalRounds}, ${result.drawTime}, ${result.playerCount}, ${result.winnerName}, ${result.winnerScore})
      RETURNING id
    `;

    if (!game || game.length === 0) {
      console.error("Failed to save game history");
      return;
    }

    const gameId = game[0].id;

    // 3. Insert participants with additional details
    for (const p of result.participants) {
      await sql`
        INSERT INTO game_participants (game_id, user_id, player_name, score, rank, words_guessed, rounds_won, is_host)
        VALUES (${gameId}, ${p.userId}, ${p.playerName}, ${p.score}, ${p.rank}, ${p.wordsGuessed}, ${p.roundsWon}, ${p.isHost})
      `;
    }

    // 4. Insert round details for comprehensive game history
    for (const round of result.rounds) {
      const roundInsert = await sql`
        INSERT INTO game_rounds (game_id, round_number, word, drawer_name, drawer_id)
        VALUES (${gameId}, ${round.roundNumber}, ${round.word}, ${round.drawerName}, ${round.drawerId})
        RETURNING id
      `;
      
      if (roundInsert && roundInsert.length > 0) {
        const roundId = roundInsert[0].id;
        
        // Insert guessers for this round
        for (const guesser of round.guessers) {
          await sql`
            INSERT INTO round_guessers (round_id, player_name, player_id, points_earned, time_to_guess)
            VALUES (${roundId}, ${guesser.playerName}, ${guesser.playerId}, ${guesser.pointsEarned}, ${guesser.timeToGuess})
          `;
        }
      }
    }
  } catch (error) {
    console.error("Failed to save game result:", error);
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
  try {
    await ensureDbInitialized();
    
    const data = await sql`
      SELECT id, username, avatar_index, games_played, games_won, total_score
      FROM profiles
      WHERE games_played > 0
      ORDER BY total_score DESC
      LIMIT 50
    `;

    return (data || []).map((entry, i) => ({
      id: entry.id,
      username: entry.username,
      avatar_index: entry.avatar_index,
      games_played: entry.games_played,
      games_won: entry.games_won,
      total_score: Number(entry.total_score),
      rank: i + 1,
    })) as LeaderboardEntry[];
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return [];
  }
}

// ============================================
// Game history for a specific user
// ============================================

export interface RoundGuesser {
  playerName: string;
  playerId: string | null;
  pointsEarned: number;
  timeToGuess: number;
}

export interface GameRound {
  id: string;
  roundNumber: number;
  word: string;
  drawerName: string;
  drawerId: string | null;
  guessers: RoundGuesser[];
}

export interface GameHistoryParticipant {
  playerName: string;
  userId: string | null;
  score: number;
  rank: number;
  wordsGuessed: number;
  roundsWon: number;
  isHost: boolean;
}

export interface GameHistoryEntry {
  id: string;
  room_id: string;
  played_at: string;
  total_rounds: number;
  player_count: number;
  draw_time: number;
  score: number;
  rank: number;
  winnerName: string;
  winnerScore: number;
  isWinner: boolean;
  participants: GameHistoryParticipant[];
  rounds: GameRound[];
}

export async function getUserGameHistory(
  userId: string
): Promise<GameHistoryEntry[]> {
  try {
    await ensureDbInitialized();
    const data = await sql`
      SELECT 
        gp.score,
        gp.rank,
        gp.words_guessed,
        gp.rounds_won,
        gp.is_host,
        gh.id as game_id,
        gh.room_id,
        gh.played_at,
        gh.total_rounds,
        gh.player_count,
        gh.draw_time,
        gh.winner_name,
        gh.winner_score
      FROM game_participants gp
      JOIN game_history gh ON gp.game_id = gh.id
      WHERE gp.user_id = ${userId}
      ORDER BY gp.id DESC
      LIMIT 50
    `;

    if (!data || data.length === 0) return [];

    const gameIds = data.map((row) => row.game_id);
    
    // Get all participants for these games
    const participantsData = await sql`
      SELECT game_id, player_name, user_id, score, rank, words_guessed, rounds_won, is_host
      FROM game_participants
      WHERE game_id = ANY(${gameIds})
      ORDER BY rank ASC
    `;

    // Get all rounds for these games
    const roundsData = await sql`
      SELECT 
        gr.id as round_id,
        gr.game_id,
        gr.round_number,
        gr.word,
        gr.drawer_name,
        gr.drawer_id
      FROM game_rounds gr
      WHERE gr.game_id = ANY(${gameIds})
      ORDER BY gr.round_number ASC
    `;

    // Get all guessers for these rounds
    const guessersData = await sql`
      SELECT 
        rg.round_id,
        rg.player_name,
        rg.player_id,
        rg.points_earned,
        rg.time_to_guess
      FROM round_guessers rg
      WHERE rg.round_id = ANY(${roundsData.map(r => r.round_id)})
      ORDER BY rg.points_earned DESC
    `;

    return data.map((row) => {
      const parts = (participantsData || [])
        .filter((p) => p.game_id === row.game_id)
        .map((p) => ({
          playerName: p.player_name as string,
          userId: p.user_id as string | null,
          score: p.score as number,
          rank: p.rank as number,
          wordsGuessed: p.words_guessed as number,
          roundsWon: p.rounds_won as number,
          isHost: p.is_host as boolean,
        }));

      const gameRounds = (roundsData || [])
        .filter((r) => r.game_id === row.game_id)
        .map((r) => {
          const roundGuessers = (guessersData || [])
            .filter((g) => g.round_id === r.round_id)
            .map((g) => ({
              playerName: g.player_name as string,
              playerId: g.player_id as string | null,
              pointsEarned: g.points_earned as number,
              timeToGuess: g.time_to_guess as number,
            }));

          return {
            id: r.round_id as string,
            roundNumber: r.round_number as number,
            word: r.word as string,
            drawerName: r.drawer_name as string,
            drawerId: r.drawer_id as string | null,
            guessers: roundGuessers,
          };
        });

      return {
        id: row.game_id as string,
        room_id: row.room_id as string,
        played_at: row.played_at as string,
        total_rounds: row.total_rounds as number,
        player_count: row.player_count as number,
        draw_time: row.draw_time as number,
        score: row.score as number,
        rank: row.rank as number,
        winnerName: row.winner_name as string,
        winnerScore: row.winner_score as number,
        isWinner: (row.rank as number) === 1,
        participants: parts,
        rounds: gameRounds,
      };
    });
  } catch (error) {
    console.error("Failed to get user game history:", error);
    return [];
  }
}
