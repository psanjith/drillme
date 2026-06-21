-- DrillMe — run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to run more than once. Until you run it, the related features fail safe:
--   • the debrief summary simply won't be stored/shown
--   • rate limiting is disabled (requests are allowed)

-- 1) Session-level debrief summary (strengths / focus / next steps)
alter table sessions add column if not exists debrief jsonb;

-- 2) Per-user API rate limiting for AI endpoints
create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_lookup
  on rate_limits (user_id, bucket, created_at);

alter table rate_limits enable row level security;

drop policy if exists "own rate limits" on rate_limits;
create policy "own rate limits" on rate_limits
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
