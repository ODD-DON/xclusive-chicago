export const APP_ID = 'xclusive_chicago'

export const CLUB_SIZES = ['intimate', 'medium', 'large', 'mega'] as const
export type ClubSize = (typeof CLUB_SIZES)[number]

export const CLUB_SIZE_LABELS: Record<ClubSize, { label: string; capacity: string }> = {
  intimate: { label: 'Intimate', capacity: '< 200' },
  medium: { label: 'Medium', capacity: '200-500' },
  large: { label: 'Large', capacity: '500-1000' },
  mega: { label: 'Mega', capacity: '1000+' },
}

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
  gallery_urls: string[] | null
  bottle_menu_urls: string[] | null
  neighborhood: string | null
  dress_code: string | null
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
  club_id: string | null
  venue_id: string | null
  schedule_id: string | null
  event_date: string
  title: string | null
  unlock_time: string | null
  cutoff_time: string | null
  is_active: boolean
  guestlist_status: GuestlistStatus
  created_at: string
  source_url: string | null
  source_platform: string | null
  ticket_url: string | null
  tables_url: string | null
  image_url: string | null
  description: string | null
  scraped_venue_name: string | null
  scraped_venue_address: string | null
  allocation: number | null
  release_number: number
  approval_mode: 'auto' | 'manual'
  waitlist_enabled: boolean
  access_status_override: string | null
  featured: boolean
  member_only: boolean
  vip_only: boolean
  announcement_text: string | null
  use_venue_branding: boolean
  club?: Club
}

export type AccessStatus =
  | 'ACCESS_OPEN'
  | 'LIMITED_ACCESS'
  | 'FINAL_RELEASE'
  | 'SOLD_OUT'
  | 'WAITLIST'
  | 'ACCESS_CLOSED'
  | 'COMING_SOON'

export interface Member {
  id: string
  app_id: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  instagram: string | null
  sms_consent: boolean
  email_consent: boolean
  source: string | null
  member_status: string
  created_at: string
}

export type AccessRequestStatus = 'pending' | 'approved' | 'waitlisted' | 'denied'

export const CELEBRATION_TYPES = ['Birthday', 'Bachelorette', 'Bachelor', 'Anniversary', 'Just a Night Out', 'Other'] as const
export type CelebrationType = (typeof CELEBRATION_TYPES)[number]

export interface AccessRequest {
  id: string
  app_id: string
  member_id: string
  event_id: string
  guest_count: number
  status: AccessRequestStatus
  access_code: string
  requested_at: string
  approved_at: string | null
  rsvp_completed_at: string | null
  celebration_type: string | null
  celebration_other: string | null
  bottle_service_interest: boolean
  interest_boat: boolean
  interest_party_bus: boolean
  referred_by_code: string | null
  visitor_city: string | null
  visitor_region: string | null
  member?: Member
  event?: Event & { club: Club | null }
}

export interface ExperienceInquiry {
  id: string
  app_id: string
  experience_type: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  instagram: string | null
  preferred_date: string | null
  flexible_dates: boolean
  group_size: number | null
  pickup_location: string | null
  dropoff_location: string | null
  duration_hours: number | null
  cruise_type: string | null
  departure_location: string | null
  venue_preference: string | null
  bottle_budget: string | null
  special_requests: string | null
  budget_range: string | null
  how_heard: string | null
  details: Record<string, unknown> | null
  status: string
  notes: string | null
  visitor_city: string | null
  visitor_region: string | null
  viewed_at: string | null
  created_at: string
  updated_at: string
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

export interface VipInquiry {
  id: string
  app_id: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  instagram: string | null
  target_date: string | null
  party_size: number | null
  budget: string | null
  venue_preference: string | null
  out_of_town: boolean
  home_city: string | null
  celebration_type: string | null
  celebration_other: string | null
  sms_consent: boolean
  notes: string | null
  status: string
  visitor_city: string | null
  visitor_region: string | null
  viewed_at: string | null
  created_at: string
}
