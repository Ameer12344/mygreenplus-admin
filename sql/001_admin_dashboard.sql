-- ============================================================
-- MyGreenPlus Admin Dashboard — schema migration
-- Run this once in the Supabase SQL Editor.
-- ============================================================

-- 1. Admin flag on app_users
-- ------------------------------------------------------------
alter table app_users
  add column if not exists is_admin boolean not null default false;

-- 2. Helper: is the currently-authenticated user an admin?
-- ------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from app_users where auth_id = auth.uid()),
    false
  );
$$;

-- 3. Problem reports (from the app's "Report Issue" flow)
-- ------------------------------------------------------------
create table if not exists problem_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references app_users(id) on delete cascade,
  category      text not null default 'other',  -- 'rvm_fault' | 'app_bug' | 'reward_issue' | 'other'
  title         text not null,
  description   text not null default '',
  rvm_id        uuid references rvm_machines(id) on delete set null,
  status        text not null default 'open',   -- 'open' | 'in_progress' | 'resolved'
  admin_notes   text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

alter table problem_reports enable row level security;

create index if not exists idx_problem_reports_status on problem_reports(status);
create index if not exists idx_problem_reports_user on problem_reports(user_id);

drop policy if exists "Users can insert their own reports" on problem_reports;
create policy "Users can insert their own reports"
  on problem_reports for insert
  with check (user_id in (select id from app_users where auth_id = auth.uid()));

drop policy if exists "Users can view their own reports" on problem_reports;
create policy "Users can view their own reports"
  on problem_reports for select
  using (user_id in (select id from app_users where auth_id = auth.uid()));

drop policy if exists "Admins can view all reports" on problem_reports;
create policy "Admins can view all reports"
  on problem_reports for select
  using (is_admin());

drop policy if exists "Admins can update reports" on problem_reports;
create policy "Admins can update reports"
  on problem_reports for update
  using (is_admin());

-- 4. Certificates (issued by admins to recognise recycling milestones)
-- ------------------------------------------------------------
create table if not exists certificates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references app_users(id) on delete cascade,
  title         text not null,                  -- e.g. '2026 Certificates'
  subtitle      text not null default '',        -- e.g. 'Q1 · Eco Contributor'
  year          text not null,
  accent_color  text not null default '#2E7D32', -- hex, mirrors the app's Certificate.accentColor
  issued_by     uuid references app_users(id) on delete set null,
  issued_at     timestamptz not null default now()
);

alter table certificates enable row level security;

create index if not exists idx_certificates_user on certificates(user_id);

drop policy if exists "Users can view their own certificates" on certificates;
create policy "Users can view their own certificates"
  on certificates for select
  using (user_id in (select id from app_users where auth_id = auth.uid()));

drop policy if exists "Admins can manage all certificates" on certificates;
create policy "Admins can manage all certificates"
  on certificates for all
  using (is_admin())
  with check (is_admin());

-- 5. Admin read/write access to existing tables
-- ------------------------------------------------------------
-- app_users
drop policy if exists "Admins can view all users" on app_users;
create policy "Admins can view all users"
  on app_users for select
  using (is_admin());

drop policy if exists "Admins can update all users" on app_users;
create policy "Admins can update all users"
  on app_users for update
  using (is_admin());

-- drop_off_history
drop policy if exists "Admins can view all drop-offs" on drop_off_history;
create policy "Admins can view all drop-offs"
  on drop_off_history for select
  using (is_admin());

-- rvm_machines
drop policy if exists "Admins can manage RVM machines" on rvm_machines;
create policy "Admins can manage RVM machines"
  on rvm_machines for all
  using (is_admin())
  with check (is_admin());

-- rewards
drop policy if exists "Admins can manage rewards" on rewards;
create policy "Admins can manage rewards"
  on rewards for all
  using (is_admin())
  with check (is_admin());

-- reward_claims
drop policy if exists "Admins can view all claims" on reward_claims;
create policy "Admins can view all claims"
  on reward_claims for select
  using (is_admin());

-- ============================================================
-- After running this: set yourself as an admin, e.g.
--   update app_users set is_admin = true where auth_id = '<your-auth-uuid>';
-- ============================================================
