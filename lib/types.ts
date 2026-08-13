export const APP_ID = 'xclusive_chicago'

export const CLUB_SIZES = ['intimate', 'medium', 'large', 'mega'] as const
export type ClubSize = (typeof CLUB_SIZES)[number]

export const MUSIC_STYLES = [
  'House',
  'Techno',
  'Hip-Hop',
  'R&B',
  'EDM',
  'Latin',
  'Top 40',
  'Open Format',
  'Afrobeats',
  'Reggaeton',
  'Disco',
  'Live DJ',
] as const
export type MusicStyle = (typeof MUSIC_STYLES)[number]

export interface Club {
  id: string
  app_id: string
  name: string
  slug: string
  address: string
  lat: number
  lng: number
  geofence_miles: number
  image_url: string | null
  description: string | null
  is_active: boolean
  recurring_days: number[] | null
  available_dates: string[] | null
  default_unlock_time: string | null
  default_cutoff_time: string | null
  size: ClubSize | null
  music_styles: MusicStyle[] | null
  created_at: string
}

export type GuestlistStatus = 'confirmed' | 'coming_soon' | 'sold_out'

export interface Event {
  id: string
  app_id: string
  club_id: string
  venue_id: string | null
  schedule_id: string | null
  event_date: string
  title: string | null
  unlock_time: string | null
  cutoff_time: string | null
  is_active: boolean
  guestlist_status: GuestlistStatus
  created_at: string
  club?: Club
}

export interface Schedule {
  id: string
  app_id: string
  club_id: string
  day_of_week: number
  label: string | null
  unlock_time: string | null
  cutoff_time: string | null
  is_active: boolean
  created_at: string
}

export interface Registration {
  id: string
  app_id: string
  event_id: string
  club_id: string
  venue_id: string | null
  event_date: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  instagram: string | null
  women_count: number
  men_count: number
  total_count: number
  bottle_service: boolean
  bottle_budget: string | null
  celebration_type: string | null
  celebration_other: string | null
  interest_limo: boolean
  interest_boat: boolean
  voucher_code: string | null
  pass_token: string
  qr_token: string | null
  status: string
  activated_at: string | null
  activation_lat: number | null
  activation_lng: number | null
  activation_distance_miles: number | null
  activation_accuracy_meters: number | null
  activation_expires_at: string | null
  created_at: string
  club?: Club
  event?: Event
}

export interface VipRequest {
  id: string
  app_id: string
  event_id: string
  registration_id: string | null
  name: string
  phone: string
  group_size: number
  budget: string | null
  notes: string | null
  created_at: string
}

export interface Venue {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  geofence_miles: number
  vibe_text: string | null
  created_at: string
}
