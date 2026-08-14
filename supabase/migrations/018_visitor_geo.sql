-- Migration: capture where inquiries/requests are actually coming from, for
-- ad geo-targeting decisions (e.g. "we get a lot of Miami leads, run ads
-- there"). Two kinds of location data:
--   visitor_city/visitor_region -- silently captured from Vercel's edge geo
--     headers on every submission, no guest-facing field, zero friction.
--   home_city -- self-reported, only asked on the travel-oriented forms
--     (VIP Tables, Party Bus, Boat Day), not the core guestlist RSVP.

alter table public.xc_access_requests
  add column if not exists visitor_city text,
  add column if not exists visitor_region text;

alter table public.xc_vip_inquiries
  add column if not exists visitor_city text,
  add column if not exists visitor_region text,
  add column if not exists home_city text;

alter table public.xc_experience_inquiries
  add column if not exists visitor_city text,
  add column if not exists visitor_region text;
