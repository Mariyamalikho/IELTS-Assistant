-- Execute this in your Supabase SQL Editor

-- 1. Create the Vocabulary table for Anki-style spaced repetition
create table vocabulary (
  id uuid default gen_random_uuid() primary key,
  word text not null,
  meaning text not null,
  example text,
  
  -- SM-2 Algorithm fields
  interval integer default 0,
  repetition integer default 0,
  ease_factor numeric default 2.5,
  next_review_date timestamp with time zone default timezone('utc'::text, now()),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Allow public access (since no auth is used for this single-user prototype)
alter table vocabulary disable row level security;
