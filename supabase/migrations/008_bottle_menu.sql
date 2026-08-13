-- Migration: per-venue bottle service menu photos

alter table public.xc_clubs
  add column if not exists bottle_menu_urls text[] default '{}';
