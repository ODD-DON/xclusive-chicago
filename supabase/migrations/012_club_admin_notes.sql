-- Migration: private admin/team notes per club (payout terms, special deals, etc.)
--
-- Deliberately a separate table, not a column on xc_clubs. Several guest-facing
-- pages join club:xc_clubs(*) to render venue info to the public; a column would
-- ride along on every one of those unless every call site remembered to exclude
-- it. A separate table is never touched unless a query deliberately joins it.

create table if not exists public.xc_club_notes (
  club_id uuid primary key references public.xc_clubs(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.xc_club_notes enable row level security;

-- No public policies: only the service role (which bypasses RLS) reads/writes this.
