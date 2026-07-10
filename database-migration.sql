-- Skribbl Clone Database Migration Script
-- Run this in your Neon PostgreSQL database to ensure all tables and columns exist
-- This script is idempotent - it can be run multiple times safely

-- ============================================
-- 1. Create profiles table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  avatar_index INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to profiles (if they don't exist)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS avatar_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 2. Create game_history table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS game_history (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) NOT NULL,
  total_rounds INTEGER NOT NULL,
  draw_time INTEGER NOT NULL,
  player_count INTEGER NOT NULL,
  winner_name VARCHAR(255),
  winner_score INTEGER DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to game_history
ALTER TABLE game_history 
  ADD COLUMN IF NOT EXISTS room_id VARCHAR(255) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS draw_time INTEGER NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS player_count INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS winner_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS winner_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 3. Create game_participants table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS game_participants (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES game_history(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
  player_name VARCHAR(255) NOT NULL,
  score INTEGER DEFAULT 0,
  rank INTEGER NOT NULL,
  words_guessed INTEGER DEFAULT 0,
  rounds_won INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT false
);

-- Add missing columns to game_participants
ALTER TABLE game_participants 
  ADD COLUMN IF NOT EXISTS game_id INTEGER,
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS player_name VARCHAR(255) NOT NULL DEFAULT 'Player',
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS words_guessed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rounds_won INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT false;

-- Add foreign key constraints for game_participants (ignore if they already exist)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE game_participants ADD CONSTRAINT fk_game_participants_game_id FOREIGN KEY (game_id) REFERENCES game_history(id) ON DELETE CASCADE';
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, do nothing
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE game_participants ADD CONSTRAINT fk_game_participants_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL';
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, do nothing
END $$;

-- ============================================
-- 4. Create game_rounds table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS game_rounds (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES game_history(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  word VARCHAR(255) NOT NULL,
  drawer_name VARCHAR(255) NOT NULL,
  drawer_id VARCHAR(255)
);

-- Add missing columns to game_rounds
ALTER TABLE game_rounds 
  ADD COLUMN IF NOT EXISTS game_id INTEGER,
  ADD COLUMN IF NOT EXISTS round_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS word VARCHAR(255) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS drawer_name VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS drawer_id VARCHAR(255);

-- Add foreign key constraint for game_rounds
DO $$
BEGIN
  EXECUTE 'ALTER TABLE game_rounds ADD CONSTRAINT fk_game_rounds_game_id FOREIGN KEY (game_id) REFERENCES game_history(id) ON DELETE CASCADE';
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, do nothing
END $$;

-- ============================================
-- 5. Create round_guessers table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS round_guessers (
  id SERIAL PRIMARY KEY,
  round_id INTEGER REFERENCES game_rounds(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  player_id VARCHAR(255),
  points_earned INTEGER DEFAULT 0,
  time_to_guess INTEGER DEFAULT 0
);

-- Add missing columns to round_guessers
ALTER TABLE round_guessers 
  ADD COLUMN IF NOT EXISTS round_id INTEGER,
  ADD COLUMN IF NOT EXISTS player_name VARCHAR(255) NOT NULL DEFAULT 'Player',
  ADD COLUMN IF NOT EXISTS player_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_to_guess INTEGER DEFAULT 0;

-- Add foreign key constraint for round_guessers
DO $$
BEGIN
  EXECUTE 'ALTER TABLE round_guessers ADD CONSTRAINT fk_round_guessers_round_id FOREIGN KEY (round_id) REFERENCES game_rounds(id) ON DELETE CASCADE';
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, do nothing
END $$;

-- ============================================
-- 6. Create indexes for performance (if they don't exist)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_history_room_id ON game_history(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_round_guessers_round_id ON round_guessers(round_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- ============================================
-- 7. Add comments for documentation
-- ============================================
COMMENT ON TABLE profiles IS 'Stores user profile information from Clerk authentication';
COMMENT ON TABLE game_history IS 'Stores overall game information including room details and winner';
COMMENT ON TABLE game_participants IS 'Stores participant information for each game including scores and ranks';
COMMENT ON TABLE game_rounds IS 'Stores information about each round in a game including the word and drawer';
COMMENT ON TABLE round_guessers IS 'Stores information about players who guessed correctly in each round';

-- ============================================
-- 8. Verify the schema
-- ============================================
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
UNION ALL
SELECT 
  'game_history' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_history'
UNION ALL
SELECT 
  'game_participants' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_participants'
UNION ALL
SELECT 
  'game_rounds' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_rounds'
UNION ALL
SELECT 
  'round_guessers' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'round_guessers'
ORDER BY table_name, ordinal_position;