-- The venue's own ticketing (DICE) has had outages, so XCLUSIVE now issues
-- its own door credential per access request instead of depending on it.
-- checked_in_at records the actual door scan; access_code (already unique,
-- already the guest's own URL slug) doubles as the ticket/QR identifier so
-- no new token column is needed.
alter table public.xc_access_requests add column if not exists checked_in_at timestamptz;
alter table public.xc_access_requests add column if not exists checked_in_by text;
