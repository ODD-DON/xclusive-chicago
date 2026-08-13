-- Migration: venue profile fields for the new /venues/[slug] page

alter table public.xc_clubs
  add column if not exists neighborhood text,
  add column if not exists dress_code text;
