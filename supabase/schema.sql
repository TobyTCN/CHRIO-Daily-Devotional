-- =====================================================================
-- Chrio Life Daily Devotional — database setup
-- Run this whole file once in Supabase: SQL Editor > New query > Run.
-- It is safe to run again; it will not delete your devotionals.
-- =====================================================================

-- 1. Devotionals: one row per day -------------------------------------
create table if not exists public.devotionals (
  date            date primary key,
  title           text not null default '',
  scripture       text not null default '',
  reference       text not null default '',
  message         text not null,
  prayer          text not null default '',
  declaration     text not null default '',
  further_reading text not null default '',
  author          text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2. Admins: the people allowed to use the dashboard ------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. Helpers -----------------------------------------------------------
-- "Today" in the ministry's time zone. Change 'Africa/Lagos' here AND
-- VITE_TIMEZONE in your environment variables if you ever need to.
create or replace function public.local_today()
returns date language sql stable as $$
  select (now() at time zone 'Africa/Lagos')::date
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

grant execute on function public.local_today() to anon, authenticated;
grant execute on function public.is_admin()   to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists devotionals_touch on public.devotionals;
create trigger devotionals_touch before update on public.devotionals
  for each row execute function public.touch_updated_at();

-- 4. Security rules (Row Level Security) -----------------------------
alter table public.devotionals enable row level security;
alter table public.admins      enable row level security;

grant select on public.devotionals to anon, authenticated;
grant insert, update, delete on public.devotionals to authenticated;
grant select on public.admins to authenticated;

drop policy if exists "Readers see today and earlier" on public.devotionals;
create policy "Readers see today and earlier" on public.devotionals
  for select to anon, authenticated
  using (date <= public.local_today());

drop policy if exists "Admins see everything" on public.devotionals;
create policy "Admins see everything" on public.devotionals
  for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins add" on public.devotionals;
create policy "Admins add" on public.devotionals
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins edit" on public.devotionals;
create policy "Admins edit" on public.devotionals
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins remove" on public.devotionals;
create policy "Admins remove" on public.devotionals
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "Admins see own admin row" on public.admins;
create policy "Admins see own admin row" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- 5. Make yourself an admin (run AFTER creating your user in
--    Authentication > Users). Replace the email, then run just this line:
--
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- =====================================================================
