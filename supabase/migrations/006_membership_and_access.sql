-- Migration: member profiles + access requests (Xclusive Access system)
--
-- Repositions the guest flow around capturing a member profile before
-- redirecting to a venue's external RSVP/ticketing system, rather than
-- linking straight out. See the "brand/access overhaul" plan for context.

create table if not exists public.xc_members (
  id uuid primary key default gen_random_uuid(),
  app_id text default 'xclusive_chicago',
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  sms_consent boolean default false,
  email_consent boolean default false,
  source text,
  member_status text default 'new',
  created_at timestamptz default now(),
  unique (app_id, phone)
);

alter table public.xc_members enable row level security;

create table if not exists public.xc_access_requests (
  id uuid primary key default gen_random_uuid(),
  app_id text default 'xclusive_chicago',
  member_id uuid references public.xc_members(id) on delete cascade,
  event_id uuid references public.xc_events(id) on delete cascade,
  guest_count integer default 1,
  status text default 'pending' check (status in ('pending', 'approved', 'waitlisted', 'denied')),
  access_code text unique not null,
  requested_at timestamptz default now(),
  approved_at timestamptz,
  rsvp_completed_at timestamptz
);

alter table public.xc_access_requests enable row level security;

create index if not exists idx_access_requests_event on public.xc_access_requests(event_id);
create index if not exists idx_access_requests_member on public.xc_access_requests(member_id);
create index if not exists idx_access_requests_code on public.xc_access_requests(access_code);

alter table public.xc_events
  add column if not exists allocation integer,
  add column if not exists release_number integer default 1,
  add column if not exists approval_mode text default 'auto' check (approval_mode in ('auto', 'manual')),
  add column if not exists waitlist_enabled boolean default false,
  add column if not exists access_status_override text,
  add column if not exists featured boolean default false,
  add column if not exists member_only boolean default false,
  add column if not exists vip_only boolean default false,
  add column if not exists announcement_text text;

alter table public.xc_clubs
  add column if not exists gallery_urls text[] default '{}';
