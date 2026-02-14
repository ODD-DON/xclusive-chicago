/**
 * Utility functions for guest list activation system
 */

// Generate a unique 6-digit alphanumeric voucher code
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar chars (I, O, 1, 0)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Generate a unique QR token
export function generateQRToken(): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(value: number): number {
  return (value * Math.PI) / 180
}

// Check if a location is within the geofence
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number,
  geofenceRadius: number
): boolean {
  const distance = calculateDistance(userLat, userLng, venueLat, venueLng)
  return distance <= geofenceRadius
}

// Check if current time is within the event window
export function isWithinEventWindow(eventDate: string): boolean {
  const event = new Date(eventDate)
  const now = new Date()
  
  // Event day: 6pm - 11:59pm
  const eventStart = new Date(event)
  eventStart.setHours(18, 0, 0, 0)
  
  const eventEnd = new Date(event)
  eventEnd.setHours(23, 59, 59, 999)
  
  return now >= eventStart && now <= eventEnd
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number (10 digits)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10
}
