-- Migration: optional Instagram handle on members

alter table public.xc_members
  add column if not exists instagram text;
