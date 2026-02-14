export interface Venue {
  id: string
  name: string
  address: string | null
  vibe_text: string | null
  lat: number
  lng: number
  geofence_miles: number
  created_at: string
}

export interface Event {
  id: string
  venue_id: string
  event_date: string
  title: string | null
  created_at: string
}

export interface Registration {
  id: string
  event_id: string
  venue_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  men_count: number | null
  women_count: number | null
  total_count: number | null
  bottle_service: boolean
  bottle_budget: string | null
  instagram: string | null
  interest_limo: boolean
  interest_boat: boolean
  celebration_type: string | null
  celebration_other: string | null
  voucher_code: string
  qr_token: string
  status: 'REGISTERED' | 'ACTIVATED' | 'EXPIRED'
  activated_at: string | null
  activation_lat: number | null
  activation_lng: number | null
  activation_distance_miles: number | null
  activation_accuracy_meters: number | null
  activation_expires_at: string | null
  created_at: string
}

export interface RegistrationWithVenue extends Registration {
  venue: Venue
}
