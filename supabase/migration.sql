-- ============================================
-- Skribbl Clone: Database Schema (Clerk Auth)
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop old tables if they exist (order matters due to foreign keys)
drop table if exists public.game_participants cascade;
drop table if exists public.game_history cascade;
drop table if exists public.profiles cascade;

-- Also drop the old trigger/function if it exists (from Supabase Auth version)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 1. Profiles table (linked to Clerk user IDs)
create table if not exists public.profiles (
  id text primary key,            -- Clerk user ID (e.g. "user_2x...")
  username text not null,
  avatar_index int default 0,
  games_played int default 0,
  games_won int default 0,
  total_score bigint default 0,
  created_at timestamptz default now()
);

-- 2. Game history table
create table if not exists public.game_history (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  played_at timestamptz default now(),
  total_rounds int not null,
  draw_time int not null,
  player_count int not null
);

-- 3. Game participants table
create table if not exists public.game_participants (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.game_history on delete cascade not null,
  user_id text references public.profiles on delete set null,
  player_name text not null,
  score int default 0,
  rank int default 0,
  words_guessed int default 0
);

-- ============================================
-- Row Level Security
-- ============================================

alter table public.profiles enable row level security;
alter table public.game_history enable row level security;
alter table public.game_participants enable row level security;

-- Allow all operations for now (Clerk handles auth, Supabase is just storage)
create policy "Allow all reads on profiles"
  on public.profiles for select using (true);

create policy "Allow all inserts on profiles"
  on public.profiles for insert with check (true);

create policy "Allow all updates on profiles"
  on public.profiles for update using (true);

create policy "Allow all reads on game_history"
  on public.game_history for select using (true);

create policy "Allow all inserts on game_history"
  on public.game_history for insert with check (true);

create policy "Allow all reads on game_participants"
  on public.game_participants for select using (true);

create policy "Allow all inserts on game_participants"
  on public.game_participants for insert with check (true);
