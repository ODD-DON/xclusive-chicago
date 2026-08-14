-- Migration: track when an admin has actually viewed a lead, so the admin
-- nav can flash a "new" indicator on VIP Requests / Experiences until the
-- admin opens that page. Null = never viewed.

alter table public.xc_vip_inquiries
  add column if not exists viewed_at timestamptz;

alter table public.xc_experience_inquiries
  add column if not exists viewed_at timestamptz;
