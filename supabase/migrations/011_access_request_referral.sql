-- Migration: track which access request (by access_code) a guest was invited through,
-- so a group sharing one invite link can be identified together in admin.

alter table public.xc_access_requests
  add column if not exists referred_by_code text;

create index if not exists xc_access_requests_referred_by_code_idx
  on public.xc_access_requests (referred_by_code);
