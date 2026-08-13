-- Migration: celebration context + SMS consent on VIP inquiries, matching
-- the same fields already captured on xc_access_requests.

alter table public.xc_vip_inquiries
  add column if not exists celebration_type text,
  add column if not exists celebration_other text,
  add column if not exists sms_consent boolean not null default false;
