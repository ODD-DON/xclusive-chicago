-- Party Bus and Boat Day forms collect several fields (trip type, package,
-- pricing estimate, time slot, amenities, occasion, etc.) that don't have
-- dedicated columns on xc_experience_inquiries and were being silently
-- dropped before the insert. Rather than adding a column per field per
-- experience type, store the remainder as JSON.
alter table public.xc_experience_inquiries
  add column if not exists details jsonb;
