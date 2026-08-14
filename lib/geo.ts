import { NextRequest } from 'next/server'

// Vercel stamps every incoming request with the visitor's approximate
// location via these headers -- free geo signal with zero guest-facing
// friction (unlike a form field, this captures every submission, not just
// ones where someone bothered to type their city). Only populated on
// Vercel's network; both come back null in local dev.
export function getVisitorGeo(request: NextRequest): { city: string | null; region: string | null } {
  const city = request.headers.get('x-vercel-ip-city')
  const region = request.headers.get('x-vercel-ip-country-region')

  return {
    city: city ? decodeURIComponent(city) : null,
    region: region || null,
  }
}
