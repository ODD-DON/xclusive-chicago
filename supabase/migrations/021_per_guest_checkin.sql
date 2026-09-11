-- One ticket per guest, not one ticket for the whole party -- a guest_count
-- of 3 now needs 3 independently scannable, independently checked-in
-- tickets. Replaces the party-level checked_in_at/checked_in_by (never used
-- in production -- migration 020 shipped same day) with a jsonb array of
-- individual check-in events, one per guest slot (1..guest_count).
alter table public.xc_access_requests drop column if exists checked_in_at;
alter table public.xc_access_requests drop column if exists checked_in_by;
alter table public.xc_access_requests add column if not exists checked_in_guests jsonb not null default '[]'::jsonb;
