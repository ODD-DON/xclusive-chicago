-- Migration: let a generic recurring night use the venue's own photo/name instead
-- of a one-off event flyer -- "come to this club" instead of "come to this event"

alter table public.xc_events
  add column if not exists use_venue_branding boolean not null default false;
