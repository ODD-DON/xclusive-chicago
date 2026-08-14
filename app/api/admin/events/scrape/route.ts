import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Depth-first search through parsed JSON-LD for a schema.org Event node
// (Event, MusicEvent, SocialEvent, etc. all share the same base fields).
function findEventNode(data: unknown): any {
  if (!data) return null
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findEventNode(item)
      if (found) return found
    }
    return null
  }
  if (typeof data !== 'object') return null
  const node = data as Record<string, unknown>
  const type = node['@type']
  if (type && (Array.isArray(type) ? type.some((t) => /event/i.test(String(t))) : /event/i.test(String(type)))) {
    return node
  }
  if (node['@graph']) {
    return findEventNode(node['@graph'])
  }
  return null
}

function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1].trim()))
    } catch {
      // skip malformed blocks
    }
  }
  return blocks
}

function extractMetaTag(html: string, property: string): string | null {
  const re = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
  const match = html.match(re)
  if (match) return match[1]
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i')
  const match2 = html.match(re2)
  return match2 ? match2[1] : null
}

function formatAddress(address: unknown): string | null {
  if (!address) return null
  if (typeof address === 'string') return address
  const addr = address as Record<string, unknown>
  return (
    [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode]
      .filter(Boolean)
      .join(', ') || null
  )
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      redirect: 'follow',
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch that link (${res.status})` }, { status: 502 })
    }

    const html = await res.text()

    let eventNode: Record<string, any> | null = null
    for (const block of extractJsonLd(html)) {
      eventNode = findEventNode(block)
      if (eventNode) break
    }

    let name: string | null = eventNode?.name || null
    let startDate: string | null = eventNode?.startDate || null
    let image: string | null = null
    let description: string | null = eventNode?.description || null
    let venueName: string | null = null
    let venueAddress: string | null = null
    // Always the exact link the admin pasted -- never the post-redirect
    // URL or the platform's own "clean" canonical URL from its page
    // metadata. Referral/tracking query params (dice_id, utm_*, Branch
    // attribution, etc.) only work if this is byte-for-byte what was
    // pasted; DICE's JSON-LD offers.url strips all of that.
    const ticketUrl: string = url

    if (eventNode) {
      const img = eventNode.image
      image = Array.isArray(img) ? img[0] : typeof img === 'string' ? img : img?.url || null

      const location = eventNode.location
      if (location) {
        venueName = location.name || null
        venueAddress = formatAddress(location.address)
      }
    }

    // Fall back to Open Graph tags for anything JSON-LD didn't provide,
    // so platforms without structured Event data still work partially.
    if (!name) name = extractMetaTag(html, 'og:title')
    if (!image) image = extractMetaTag(html, 'og:image')
    if (!description) description = extractMetaTag(html, 'og:description')

    if (!name) {
      return NextResponse.json(
        { error: "Could not find event details on that page" },
        { status: 422 }
      )
    }

    // Auto-match the scraped venue name against existing clubs.
    let matchedClubId: string | null = null
    let matchedClubName: string | null = null
    if (venueName) {
      const supabase = createServiceClient()
      const { data: clubs } = await supabase
        .from('xc_clubs')
        .select('id, name')
        .eq('app_id', APP_ID)

      const normalizedVenue = venueName.toLowerCase().trim()
      const match = clubs?.find((c) => {
        const clubName = c.name.toLowerCase().trim()
        return (
          clubName === normalizedVenue ||
          clubName.includes(normalizedVenue) ||
          normalizedVenue.includes(clubName)
        )
      })
      if (match) {
        matchedClubId = match.id
        matchedClubName = match.name
      }
    }

    return NextResponse.json({
      scraped: {
        name,
        startDate,
        image,
        description,
        venueName,
        venueAddress,
        ticketUrl,
        sourceUrl: url,
        sourcePlatform: parsedUrl.hostname.replace(/^www\./, '').split('.')[0],
      },
      matchedClubId,
      matchedClubName,
    })
  } catch (error) {
    console.error('Event scrape error:', error)
    return NextResponse.json({ error: 'Failed to fetch event details' }, { status: 500 })
  }
}
