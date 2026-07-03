-- ============================================================
-- MyGreenPlus Admin Dashboard — tasks + manual drop-off support
-- Run this once in the Supabase SQL Editor.
-- ============================================================

-- 1. Monthly tasks (admin-created goals users complete for a certificate)
-- ------------------------------------------------------------
-- NOTE: app/dashboard/certificates/taskActions.ts and page.tsx already
-- read/write this table — it just didn't exist in the DB yet.
create table if not exists tasks (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  description        text not null default '',
  goal_type          text not null,                 -- 'kg_recycled' | 'drop_off_count' | 'points_earned'
  goal_value         numeric not null,
  material_type      text,                          -- 'plastic' | 'aluminium' | 'glass' | 'paper' | null = any
  reward_cert_level  text,                           -- 'bronze' | 'silver' | 'gold' | 'platinum' | null
  status             text not null default 'active', -- 'active' | 'inactive'
  created_at         timestamptz not null default now()
);

alter table tasks enable row level security;

create index if not exists idx_tasks_status on tasks(status);

-- Admins can fully manage tasks
drop policy if exists "Admins can manage tasks" on tasks;
create policy "Admins can manage tasks"
  on tasks for all
  using (is_admin())
  with check (is_admin());

-- Everyone signed in can see active tasks (needed once the Flutter app
-- reads this table to show users what's available this month)
drop policy if exists "Users can view active tasks" on tasks;
create policy "Users can view active tasks"
  on tasks for select
  using (status = 'active');

-- 2. Tag drop-offs by source, so manual demo entries (no RVM hardware yet)
--    are distinguishable from real QR/RVM scans once those exist.
-- ------------------------------------------------------------
alter table drop_off_history
  add column if not exists source text not null default 'qr_scan';

alter table drop_off_history
  drop constraint if exists drop_off_history_source_check;

alter table drop_off_history
  add constraint drop_off_history_source_check
  check (source in ('qr_scan', 'manual'));

-- ============================================================
-- After running this, the Certificates page's "Tasks" tab and the new
-- "Log Drop-off" button on Drop-offs & RVMs will both work end to end.
-- ============================================================
