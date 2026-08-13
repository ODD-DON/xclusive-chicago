-- Migration: Fix xc_registrations schema to match actual app behavior
--
-- Live audit (2026-08-13) found xc_registrations has 0 rows, ever, because
-- every insert from app/api/guestlist/register/route.ts fails for three
-- independent reasons:
--   1. voucher_code is NOT NULL with no default; the app never sets it
--      (voucher codes were never implemented as a feature).
--   2. status has a CHECK constraint requiring uppercase
--      'REGISTERED'/'ACTIVATED'/'EXPIRED', but the app writes lowercase
--      'registered'/'activated', matching the lowercase convention used
--      everywhere else in the app (xc_events.guestlist_status, the admin
--      guest list UI, etc).
--   3. email is NOT NULL, but the signup form never collects an email.
--
-- Safe to run with zero data loss: xc_registrations has no rows yet.

ALTER TABLE public.xc_registrations
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.xc_registrations
  ALTER COLUMN voucher_code DROP NOT NULL;

ALTER TABLE public.xc_registrations
  DROP CONSTRAINT IF EXISTS xc_registrations_status_check;

ALTER TABLE public.xc_registrations
  ALTER COLUMN status SET DEFAULT 'registered';

UPDATE public.xc_registrations
  SET status = lower(status)
  WHERE status IS NOT NULL;

ALTER TABLE public.xc_registrations
  ADD CONSTRAINT xc_registrations_status_check
  CHECK (status = ANY (ARRAY['registered'::text, 'activated'::text, 'expired'::text]));
