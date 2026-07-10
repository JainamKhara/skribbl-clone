-- Skribbl Clone Database Schema
-- This file contains the SQL schema for the game

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  avatar_index INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game history table
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

-- Game participants table
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

-- Game rounds table
CREATE TABLE IF NOT EXISTS game_rounds (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES game_history(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  word VARCHAR(255) NOT NULL,
  drawer_name VARCHAR(255) NOT NULL,
  drawer_id VARCHAR(255)
);

-- Round guessers table
CREATE TABLE IF NOT EXISTS round_guessers (
  id SERIAL PRIMARY KEY,
  round_id INTEGER REFERENCES game_rounds(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  player_id VARCHAR(255),
  points_earned INTEGER DEFAULT 0,
  time_to_guess INTEGER DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_history_room_id ON game_history(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_round_guessers_round_id ON round_guessers(round_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Function to initialize the database
CREATE OR REPLACE FUNCTION init_skribbl_db()
RETURNS VOID AS $$
BEGIN
  -- These tables will be created if they don't exist
  -- The IF NOT EXISTS clause handles this automatically
  -- No need for additional logic
END;
$$ LANGUAGE plpgsql;