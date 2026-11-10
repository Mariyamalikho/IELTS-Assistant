-- ==============================================================================
-- IELTS Assistant Database Schema & Row Level Security (RLS) Policies
-- Execute in Supabase SQL Editor to provision tables, indexes, and security rules.
-- ==============================================================================

-- 1. Vocabulary Table (Spaced Repetition SM-2)
create table if not exists vocabulary (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  word text not null,
  meaning text not null,
  example text,
  synonyms text,
  antonyms text,
  
  -- SM-2 Algorithm fields
  interval integer default 0 not null,
  repetition integer default 0 not null,
  ease_factor numeric default 2.5 not null,
  next_review_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Writing Submissions Table
create table if not exists writing_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  task_type text not null check (task_type in ('task1', 'task2')),
  prompt text not null,
  content text not null,
  word_count integer not null default 0,
  ai_band_estimate numeric(3,1),
  ai_feedback jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Speaking Sessions Table
create table if not exists speaking_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  part text check (part in ('part1', 'part2', 'part3')),
  topic text,
  transcript text,
  ai_band_estimate numeric(3,1),
  ai_feedback jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- Performance Optimization Indexes
-- ==============================================================================
create index if not exists idx_vocabulary_user_id on vocabulary(user_id);
create index if not exists idx_vocabulary_next_review on vocabulary(next_review_date);
create index if not exists idx_writing_submissions_user_created on writing_submissions(user_id, created_at desc);
create index if not exists idx_speaking_sessions_user_created on speaking_sessions(user_id, created_at desc);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- Enforce tenant isolation: users can strictly only view and modify their own data.
-- ==============================================================================
alter table vocabulary enable row level security;
alter table writing_submissions enable row level security;
alter table speaking_sessions enable row level security;

-- Policies for Vocabulary
drop policy if exists "Users can view own vocabulary" on vocabulary;
create policy "Users can view own vocabulary"
  on vocabulary for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own vocabulary" on vocabulary;
create policy "Users can insert own vocabulary"
  on vocabulary for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can update own vocabulary" on vocabulary;
create policy "Users can update own vocabulary"
  on vocabulary for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can delete own vocabulary" on vocabulary;
create policy "Users can delete own vocabulary"
  on vocabulary for delete
  using (auth.uid() = user_id or user_id is null);

-- Policies for Writing Submissions
drop policy if exists "Users can view own writing submissions" on writing_submissions;
create policy "Users can view own writing submissions"
  on writing_submissions for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own writing submissions" on writing_submissions;
create policy "Users can insert own writing submissions"
  on writing_submissions for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can delete own writing submissions" on writing_submissions;
create policy "Users can delete own writing submissions"
  on writing_submissions for delete
  using (auth.uid() = user_id or user_id is null);

-- Policies for Speaking Sessions
drop policy if exists "Users can view own speaking sessions" on speaking_sessions;
create policy "Users can view own speaking sessions"
  on speaking_sessions for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own speaking sessions" on speaking_sessions;
create policy "Users can insert own speaking sessions"
  on speaking_sessions for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can delete own speaking sessions" on speaking_sessions;
create policy "Users can delete own speaking sessions"
  on speaking_sessions for delete
  using (auth.uid() = user_id or user_id is null);
