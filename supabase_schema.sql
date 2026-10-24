-- ملاعب السرغيني: مخطط أولي لقاعدة بيانات Supabase
-- راجع سياسات RLS والصلاحيات قبل استخدام قاعدة البيانات في الإنتاج.

create extension if not exists pgcrypto;

create table if not exists public.pitches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('ملعب السرغيني 1','ملعب السرغيني 2')),
  is_active boolean not null default true,
  hourly_price numeric(10,2),
  created_at timestamptz not null default now()
);

insert into public.pitches(name) values ('ملعب السرغيني 1'),('ملعب السرغيني 2')
on conflict (name) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'player' check (role in ('admin','captain','player','member')),
  membership_status text not null default 'none' check (membership_status in ('none','pending','active','expired','rejected')),
  membership_expires_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  captain_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_players (
  team_id uuid references public.teams(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  jersey_number integer,
  created_at timestamptz not null default now(),
  primary key(team_id, player_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches(id),
  team_id uuid references public.teams(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  team_name text not null,
  captain_name text not null,
  contact_phone text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  players_expected integer not null default 10 check(players_expected > 0),
  status text not null default 'pending' check(status in ('pending','confirmed','cancelled','completed','rejected')),
  priority_type text not null default 'regular' check(priority_type in ('member','regular')),
  notes text,
  created_at timestamptz not null default now(),
  check(ends_at > starts_at)
);

create table if not exists public.booking_players (
  booking_id uuid references public.bookings(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  attendance text not null default 'invited' check(attendance in ('invited','confirmed','declined','present','absent')),
  primary key(booking_id, player_id)
);

create table if not exists public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  requested_type text not null default 'player',
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bookings_pitch_start_idx on public.bookings(pitch_id, starts_at);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists profiles_membership_idx on public.profiles(membership_status);

-- مهم:
-- 1) فعّل RLS على كل الجداول قبل الإنتاج.
-- 2) لا تنشئ سياسة تسمح للجمهور بقراءة أرقام الهواتف أو تعديل الحجوزات.
-- 3) منع تداخل الحجوزات يجب تنفيذه بقيد قاعدة بيانات (exclusion constraint)
--    أو دالة حجز آمنة داخل معاملة، وليس بالواجهة وحدها.
-- 4) أضف سياسات منفصلة للإدارة، وقائد الفريق، واللاعب، والمنخرط بعد تحديد تدفق المصادقة.
