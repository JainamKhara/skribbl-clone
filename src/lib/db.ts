import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing");
}

export const sql = neon(process.env.DATABASE_URL);

// Initialize database schema - using individual SQL calls to avoid Neon multi-statement limit
export async function initializeDatabase() {
  try {
    // Create tables individually
    await sql(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        avatar_index INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS game_history (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR(255) NOT NULL,
        total_rounds INTEGER NOT NULL,
        draw_time INTEGER NOT NULL,
        player_count INTEGER NOT NULL,
        winner_name VARCHAR(255),
        winner_score INTEGER DEFAULT 0,
        played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS game_participants (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(255) REFERENCES game_history(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
        player_name VARCHAR(255) NOT NULL,
        score INTEGER DEFAULT 0,
        rank INTEGER NOT NULL,
        words_guessed INTEGER DEFAULT 0,
        rounds_won INTEGER DEFAULT 0,
        is_host BOOLEAN DEFAULT false
      )
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS game_rounds (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(255) REFERENCES game_history(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        word VARCHAR(255) NOT NULL,
        drawer_name VARCHAR(255) NOT NULL,
        drawer_id VARCHAR(255)
      )
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS round_guessers (
        id SERIAL PRIMARY KEY,
        round_id INTEGER REFERENCES game_rounds(id) ON DELETE CASCADE,
        player_name VARCHAR(255) NOT NULL,
        player_id VARCHAR(255),
        points_earned INTEGER DEFAULT 0,
        time_to_guess INTEGER DEFAULT 0
      )
    `);

    // Add missing columns individually
    await sql(`
      ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS avatar_index INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    await sql(`
      ALTER TABLE game_history 
        ADD COLUMN IF NOT EXISTS room_id VARCHAR(255) NOT NULL DEFAULT 'UNKNOWN',
        ADD COLUMN IF NOT EXISTS total_rounds INTEGER NOT NULL DEFAULT 3,
        ADD COLUMN IF NOT EXISTS draw_time INTEGER NOT NULL DEFAULT 80,
        ADD COLUMN IF NOT EXISTS player_count INTEGER NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS winner_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS winner_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    await sql(`
      ALTER TABLE game_participants 
        ADD COLUMN IF NOT EXISTS game_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS player_name VARCHAR(255) NOT NULL DEFAULT 'Player',
        ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS rank INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS words_guessed INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS rounds_won INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT false
    `);

    await sql(`
      ALTER TABLE game_rounds 
        ADD COLUMN IF NOT EXISTS game_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS round_number INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS word VARCHAR(255) NOT NULL DEFAULT 'unknown',
        ADD COLUMN IF NOT EXISTS drawer_name VARCHAR(255) NOT NULL DEFAULT 'Unknown',
        ADD COLUMN IF NOT EXISTS drawer_id VARCHAR(255)
    `);

    await sql(`
      ALTER TABLE round_guessers 
        ADD COLUMN IF NOT EXISTS round_id INTEGER,
        ADD COLUMN IF NOT EXISTS player_name VARCHAR(255) NOT NULL DEFAULT 'Player',
        ADD COLUMN IF NOT EXISTS player_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS time_to_guess INTEGER DEFAULT 0
    `);

    // Add foreign key constraints (may fail if already exist)
    try {
      await sql(`ALTER TABLE game_participants ADD CONSTRAINT fk_game_participants_game_id FOREIGN KEY (game_id) REFERENCES game_history(id) ON DELETE CASCADE`);
    } catch (e) {}
    
    try {
      await sql(`ALTER TABLE game_participants ADD CONSTRAINT fk_game_participants_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL`);
    } catch (e) {}
    
    try {
      await sql(`ALTER TABLE game_rounds ADD CONSTRAINT fk_game_rounds_game_id FOREIGN KEY (game_id) REFERENCES game_history(id) ON DELETE CASCADE`);
    } catch (e) {}
    
    try {
      await sql(`ALTER TABLE round_guessers ADD CONSTRAINT fk_round_guessers_round_id FOREIGN KEY (round_id) REFERENCES game_rounds(id) ON DELETE CASCADE`);
    } catch (e) {}

    // Create indexes individually
    await sql(`CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_game_history_room_id ON game_history(room_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_round_guessers_round_id ON round_guessers(round_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id)`);
    
    console.log("Database schema initialized successfully");
  } catch (error) {
    const errorStr = String(error).toLowerCase();
    if (!errorStr.includes('already exists') && 
        !errorStr.includes('column') && 
        !errorStr.includes('constraint')) {
      console.error("Error initializing database:", error);
    } else {
      console.log("Database update: Some elements already exist (normal)");
    }
  }
}