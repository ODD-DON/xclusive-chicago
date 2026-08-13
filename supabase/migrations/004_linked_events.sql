-- Migration: support events sourced from pasted ticket links (DICE, SpeakEasy, etc.)
--
-- Admin now creates events by pasting a link instead of relying on the old
-- recurring club/date auto-scheduler. These columns hold what gets scraped
-- from the link (schema.org JSON-LD Event data) so it can be reviewed/edited
-- before saving, and displayed on the guest-facing event feed.
--
-- club_id is already nullable, so events whose venue doesn't match an
-- existing club can still be saved (flagged for the admin to link/create
-- manually) — the scraped venue name/address are kept as a fallback display
-- and as a reference for that manual match.

alter table public.xc_events
  add column if not exists source_url text,
  add column if not exists source_platform text,
  add column if not exists ticket_url text,
  add column if not exists image_url text,
  add column if not exists description text,
  add column if not exists scraped_venue_name text,
  add column if not exists scraped_venue_address text;
