-- Run this once in Supabase: SQL Editor > New query > Run
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  description text not null default '',
  start_time time,
  location text not null default '',
  member text not null default '가족' check (member in ('수지','수환','이레','가족')),
  created_at timestamptz not null default now()
);
create index if not exists events_date_idx on events (date);

-- Members changed from 하늘/바다 to 수지/수환/이레 (safe to re-run; old events are carried over)
alter table events drop constraint if exists events_member_check;
update events set member = '수지' where member = '하늘';
update events set member = '수환' where member = '바다';
alter table events add constraint events_member_check check (member in ('수지','수환','이레','가족'));
-- RLS on with no policies: only the server (service role key) can read or write.
alter table events enable row level security;

-- Phase 3: groceries, to-dos, anniversaries
create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists anniversaries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  created_at timestamptz not null default now()
);
alter table grocery_items enable row level security;
alter table todos enable row level security;
alter table anniversaries enable row level security;

-- Phase 4: spending (amounts stored in cents to avoid rounding errors)
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);
create index if not exists expenses_date_idx on expenses (date);
alter table expenses enable row level security;

-- Security: remembers failed passcode tries so guessing is blocked for 15 minutes after 8 misses
create table if not exists login_attempts (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_ip_idx on login_attempts (ip, at);
alter table login_attempts enable row level security;
