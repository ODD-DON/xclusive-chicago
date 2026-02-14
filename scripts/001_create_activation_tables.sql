-- Migration: Guest List Activation System
-- Creates tables for venue-based event registrations with geolocation activation
-- All tables use xc_ prefix for shared Supabase database

-- Table 1: Venues with geolocation data
CREATE TABLE IF NOT EXISTS xc_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  vibe_text text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  geofence_miles numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

-- Table 2: Events linking venues to specific dates
CREATE TABLE IF NOT EXISTS xc_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES xc_venues(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, event_date)
);

-- Table 3: Registrations with activation tracking
CREATE TABLE IF NOT EXISTS xc_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES xc_events(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES xc_venues(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  men_count int,
  women_count int,
  total_count int,
  bottle_service boolean DEFAULT false,
  bottle_budget text,
  instagram text,
  interest_limo boolean DEFAULT false,
  interest_boat boolean DEFAULT false,
  celebration_type text,
  celebration_other text,
  voucher_code text UNIQUE NOT NULL,
  qr_token text UNIQUE NOT NULL,
  status text CHECK (status IN ('REGISTERED', 'ACTIVATED', 'EXPIRED')) DEFAULT 'REGISTERED',
  activated_at timestamptz,
  activation_lat double precision,
  activation_lng double precision,
  activation_distance_miles numeric,
  activation_accuracy_meters numeric,
  activation_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_voucher ON xc_registrations(voucher_code);
CREATE INDEX IF NOT EXISTS idx_registrations_token ON xc_registrations(qr_token);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON xc_registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON xc_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON xc_events(event_date);

-- Insert sample venues for Chicago
INSERT INTO xc_venues (name, address, vibe_text, lat, lng, geofence_miles)
VALUES 
  ('Studio Paris', '59 W Hubbard St, Chicago, IL 60654', 'Upscale nightclub with VIP bottle service and top DJs', 41.8897, -87.6287, 0.5),
  ('Sound-Bar', '226 W Ontario St, Chicago, IL 60654', 'Multi-room EDM club with world-class sound system', 41.8932, -87.6351, 0.5),
  ('The Mid', '306 N Halsted St, Chicago, IL 60661', 'House music haven in the West Loop', 41.8877, -87.6476, 0.5),
  ('Prysm', '1543 N Kingsbury St, Chicago, IL 60642', 'Luxury nightclub with cutting-edge production', 41.9104, -87.6546, 0.5)
ON CONFLICT DO NOTHING;
