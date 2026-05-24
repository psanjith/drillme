-- DrillMe Database Schema
-- Run this in the Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  experience_level text default 'mid',
  target_companies text[] default '{}',
  weekly_goal integer default 3,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Questions bank
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  type text not null check (type in ('technical', 'behavioural', 'system_design')),
  topic text not null,
  difficulty text not null check (difficulty in ('junior', 'mid', 'senior', 'staff')),
  companies text[] default '{}',
  frequency integer default 50,
  source text default 'ai_generated',
  optimal_framework jsonb,
  follow_up_questions text[] default '{}'
);

alter table questions enable row level security;
create policy "Questions are public" on questions for select using (true);

-- Sessions table
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade not null,
  job_description text,
  company text,
  role_level text default 'mid',
  interview_type text default 'mixed',
  panel_config jsonb default '{"panellists": ["hiring_manager", "senior_engineer", "peer_engineer"]}',
  duration_minutes integer default 35,
  status text default 'setup',
  overall_score integer,
  readiness_delta integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table sessions enable row level security;
create policy "Users can CRUD own sessions" on sessions for all using (auth.uid() = user_id);

-- Session questions
create table if not exists session_questions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions on delete cascade not null,
  question_bank_id uuid references questions,
  question_text text not null,
  source text default 'ai_generated',
  panellist_persona text not null,
  question_type text not null,
  topic text,
  order_index integer default 0,
  user_answer_transcript text,
  help_requested boolean default false,
  scores jsonb,
  feedback jsonb,
  follow_ups jsonb,
  created_at timestamptz default now()
);

alter table session_questions enable row level security;
create policy "Users can CRUD own session questions" on session_questions
  for all using (
    exists (
      select 1 from sessions where sessions.id = session_questions.session_id and sessions.user_id = auth.uid()
    )
  );

-- Weakness profile
create table if not exists weakness_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade not null,
  tag text not null,
  category text not null check (category in ('technical', 'behavioural', 'communication', 'process')),
  severity integer default 3,
  occurrence_count integer default 0,
  last_seen_at timestamptz default now(),
  trend text default 'stable',
  created_at timestamptz default now(),
  unique (user_id, tag)
);

alter table weakness_profile enable row level security;
create policy "Users can CRUD own weakness profile" on weakness_profile for all using (auth.uid() = user_id);

-- Speaking sessions
create table if not exists speaking_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade not null,
  session_type text not null,
  prompt_text text,
  transcript text,
  duration_seconds integer,
  scores jsonb,
  filler_word_count integer,
  filler_words_detected jsonb,
  confidence_flags text[],
  feedback text,
  created_at timestamptz default now()
);

alter table speaking_sessions enable row level security;
create policy "Users can CRUD own speaking sessions" on speaking_sessions for all using (auth.uid() = user_id);

-- Speaking profile
create table if not exists speaking_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade not null,
  metric text not null,
  current_score numeric default 0,
  trend text default 'stable',
  session_count integer default 0,
  last_seen_at timestamptz default now(),
  unique (user_id, metric)
);

alter table speaking_profile enable row level security;
create policy "Users can CRUD own speaking profile" on speaking_profile for all using (auth.uid() = user_id);

-- Useful indexes
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_session_questions_session_id on session_questions(session_id);
create index if not exists idx_weakness_profile_user_id on weakness_profile(user_id);
create index if not exists idx_weakness_profile_severity on weakness_profile(severity desc);
create index if not exists idx_speaking_sessions_user_id on speaking_sessions(user_id);
create index if not exists idx_questions_type on questions(type);
create index if not exists idx_questions_difficulty on questions(difficulty);
