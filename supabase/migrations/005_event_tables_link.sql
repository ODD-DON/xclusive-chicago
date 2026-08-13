-- Migration: separate "bottle service / tables" link from the ticket link
--
-- Some source platforms (confirmed on SpeakEasy) expose a distinct URL for
-- booking a table/bottle service (e.g. ?modal=tables) separate from the
-- general ticket URL (?modal=tickets) for the same event. When present,
-- the guest-facing "Bottle Service" button should link straight there
-- instead of opening the in-app inquiry form.

alter table public.xc_events
  add column if not exists tables_url text;
