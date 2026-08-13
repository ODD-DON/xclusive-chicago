-- Migration: Lock down RLS across all xc_ tables
--
-- Live audit (2026-08-13) found pg_policies granting roles={public} full
-- read/write on xc_registrations, xc_vip_requests, xc_guests, and
-- xc_experience_inquiries, and a public "ALL" policy on xc_clubs — anyone
-- with the anon key (shipped in every browser bundle) could read every
-- guest's PII or edit/delete clubs directly via the Supabase REST API,
-- bypassing the app entirely.
--
-- All legitimate app writes now go through a server-only service-role
-- client (see lib/supabase/service.ts) that bypasses RLS after passing
-- the /admin auth middleware, so these tables no longer need public or
-- broad "authenticated" (any user in this shared Supabase project)
-- policies. Admin-scoped SELECT/write policies below are defense in
-- depth in case a valid admin session token is ever used directly
-- against the REST API instead of through the app.

create or replace function public.is_xc_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.xc_admin_users where id = auth.uid()
  );
$$;

-- xc_clubs: keep public SELECT (guest-facing browsing), admin-only writes
drop policy if exists "Allow public full access to xc_clubs" on public.xc_clubs;
drop policy if exists "xc_clubs_admin_write" on public.xc_clubs;
create policy "xc_clubs_admin_write" on public.xc_clubs
  for all using (public.is_xc_admin()) with check (public.is_xc_admin());

-- xc_events: keep public SELECT, admin-only writes (was any "authenticated" user)
drop policy if exists "Allow authenticated full access to xc_events" on public.xc_events;
drop policy if exists "xc_events_admin_write" on public.xc_events;
create policy "xc_events_admin_write" on public.xc_events
  for all using (public.is_xc_admin()) with check (public.is_xc_admin());

-- xc_schedules: unused by app code today, same tightening for consistency
drop policy if exists "Allow authenticated full access to xc_schedules" on public.xc_schedules;
drop policy if exists "xc_schedules_admin_write" on public.xc_schedules;
create policy "xc_schedules_admin_write" on public.xc_schedules
  for all using (public.is_xc_admin()) with check (public.is_xc_admin());

-- xc_registrations: guest PII, no public access at all
drop policy if exists "Allow public insert to xc_registrations" on public.xc_registrations;
drop policy if exists "Allow public read access to xc_registrations" on public.xc_registrations;
drop policy if exists "Allow public update to xc_registrations" on public.xc_registrations;
drop policy if exists "xc_registrations_admin_select" on public.xc_registrations;
create policy "xc_registrations_admin_select" on public.xc_registrations
  for select using (public.is_xc_admin());

-- xc_vip_requests: bottle service budgets/notes, no public access
drop policy if exists "xc_vip_requests_insert" on public.xc_vip_requests;
drop policy if exists "xc_vip_requests_select" on public.xc_vip_requests;
drop policy if exists "xc_vip_requests_admin_select" on public.xc_vip_requests;
create policy "xc_vip_requests_admin_select" on public.xc_vip_requests
  for select using (public.is_xc_admin());

-- xc_guests: orphaned table (unreferenced by app code), lock to admin only
drop policy if exists "Allow authenticated delete on xc_guests" on public.xc_guests;
drop policy if exists "Allow public insert to xc_guests" on public.xc_guests;
drop policy if exists "Allow public read access to xc_guests" on public.xc_guests;
drop policy if exists "Allow public update to xc_guests" on public.xc_guests;
drop policy if exists "xc_guests_admin_all" on public.xc_guests;
create policy "xc_guests_admin_all" on public.xc_guests
  for all using (public.is_xc_admin()) with check (public.is_xc_admin());

-- xc_venues: currently has RLS disabled entirely; enable with public read
alter table public.xc_venues enable row level security;
drop policy if exists "xc_venues_public_read" on public.xc_venues;
create policy "xc_venues_public_read" on public.xc_venues
  for select using (true);

-- xc_experience_inquiries: leads with name/phone/email, no public access
drop policy if exists "Allow public insert on xc_experience_inquiries" on public.xc_experience_inquiries;
drop policy if exists "Allow public select on xc_experience_inquiries" on public.xc_experience_inquiries;
drop policy if exists "Allow public update on xc_experience_inquiries" on public.xc_experience_inquiries;
drop policy if exists "xc_experience_inquiries_admin_select" on public.xc_experience_inquiries;
create policy "xc_experience_inquiries_admin_select" on public.xc_experience_inquiries
  for select using (public.is_xc_admin());
