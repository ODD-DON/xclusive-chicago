-- Migration: advance VIP/bottle-service inquiries, not tied to any specific
-- announced event/release. For out-of-town or big-spend guests who need to
-- lock in a night weeks ahead, before that week's lineup is even posted.

create table if not exists public.xc_vip_inquiries (
  id uuid primary key default gen_random_uuid(),
  app_id text not null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  instagram text,
  target_date text,
  party_size integer,
  budget text,
  venue_preference text,
  out_of_town boolean not null default false,
  notes text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.xc_vip_inquiries enable row level security;

-- No public policies: writes go through the service-role API route only.
