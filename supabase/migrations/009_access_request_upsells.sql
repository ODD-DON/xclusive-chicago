-- Migration: capture celebration type + boat/party bus/bottle service interest on access requests

alter table public.xc_access_requests
  add column if not exists celebration_type text,
  add column if not exists celebration_other text,
  add column if not exists bottle_service_interest boolean not null default false,
  add column if not exists interest_boat boolean not null default false,
  add column if not exists interest_party_bus boolean not null default false;
