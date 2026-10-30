-- Run this once in Supabase Dashboard > SQL Editor.
create table if not exists public.leads (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Keep direct browser access disabled. The Express backend uses the secret
-- service-role key on the server only; never expose that key in VITE_ variables.
alter table public.leads enable row level security;

create table if not exists public.user_accounts (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.user_accounts enable row level security;
