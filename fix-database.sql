-- ============================================================================
-- COMPREHENSIVE DATABASE FIX SCRIPT FOR SKRIBBL CLONE
-- Run this in your Neon PostgreSQL database to fix all issues
-- ============================================================================

-- Step 1: Check current schema
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('game_history', 'game_participants')
ORDER BY table_name, ordinal_position;

-- Step 2: Alter game_history to use UUID if it's using SERIAL
-- This preserves existing data
DO $$
BEGIN
  -- Check if game_history.id is SERIAL (INTEGER)
  PERFORM column_name 
  FROM information_schema.columns 
  WHERE table_name = 'game_history' AND column_name = 'id' 
    AND data_type IN ('integer', 'bigint', 'smallint');
  
  IF FOUND THEN
    -- Change from SERIAL to VARCHAR(UUID)
    EXECUTE 'ALTER TABLE game_history ALTER COLUMN id TYPE VARCHAR(255)';
    RAISE NOTICE 'Changed game_history.id from INTEGER to VARCHAR';
  END IF;
END $$;

-- Step 3: Alter game_participants.game_id to VARCHAR to match game_history.id
DO $$
BEGIN
  -- Check current type of game_participants.game_id
  PERFORM data_type 
  FROM information_schema.columns 
  WHERE table_name = 'game_participants' AND column_name = 'game_id';
  
  IF NOT FOUND THEN
    -- Column doesn't exist, add it as VARCHAR
    EXECUTE 'ALTER TABLE game_participants ADD COLUMN game_id VARCHAR(255)';
    RAISE NOTICE 'Added game_participants.game_id as VARCHAR';
  ELSIF (SELECT data_type FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'game_id') IN ('integer', 'bigint', 'smallint') THEN
    -- Change from INTEGER to VARCHAR
    EXECUTE 'ALTER TABLE game_participants ALTER COLUMN game_id TYPE VARCHAR(255)';
    RAISE NOTICE 'Changed game_participants.game_id from INTEGER to VARCHAR';
  END IF;
END $$;

-- Step 4: Create missing tables with VARCHAR foreign keys
CREATE TABLE IF NOT EXISTS game_rounds (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(255) REFERENCES game_history(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  word VARCHAR(255) NOT NULL,
  drawer_name VARCHAR(255) NOT NULL,
  drawer_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS round_guessers (
  id SERIAL PRIMARY KEY,
  round_id INTEGER REFERENCES game_rounds(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  player_id VARCHAR(255),
  points_earned INTEGER DEFAULT 0,
  time_to_guess INTEGER DEFAULT 0
);

-- Step 5: Add missing columns to existing tables
ALTER TABLE game_history 
  ADD COLUMN IF NOT EXISTS winner_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS winner_score INTEGER DEFAULT 0;

ALTER TABLE game_participants 
  ADD COLUMN IF NOT EXISTS words_guessed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rounds_won INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT false;

-- Step 6: Add foreign key constraints (with error handling)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE game_participants ADD CONSTRAINT fk_game_participants_game_id FOREIGN KEY (game_id) REFERENCES game_history(id) ON DELETE CASCADE';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint fk_game_participants_game_id already exists';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE game_participants ADD CONSTRAINT fk_game_participants_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint fk_game_participants_user_id already exists';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE game_rounds ADD CONSTRAINT fk_game_rounds_game_id FOREIGN KEY (game_id) REFERENCES game_history(id) ON DELETE CASCADE';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint fk_game_rounds_game_id already exists';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE round_guessers ADD CONSTRAINT fk_round_guessers_round_id FOREIGN KEY (round_id) REFERENCES game_rounds(id) ON DELETE CASCADE';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint fk_round_guessers_round_id already exists';
END $$;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_history_room_id ON game_history(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_round_guessers_round_id ON round_guessers(round_id);

-- Step 8: Verify everything
SELECT 
  'Tables:' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('game_history', 'game_participants', 'game_rounds', 'round_guessers')
ORDER BY table_name, ordinal_position;
