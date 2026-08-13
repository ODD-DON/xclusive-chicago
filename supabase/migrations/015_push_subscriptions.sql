-- Migration: web push subscriptions for admin notifications (bottle service,
-- boat day, party bus interest, VIP inquiries).

create table if not exists public.xc_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  app_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.xc_push_subscriptions enable row level security;

-- No public policies: only the service role reads/writes this.
