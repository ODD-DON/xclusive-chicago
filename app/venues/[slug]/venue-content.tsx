'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { format, parseISO, isSameDay } from 'date-fns'
import { ArrowLeft, MapPin, Users, Music, Shirt, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Club, Event, ClubSize } from '@/lib/types'
import { computeAccessStatus, ACCESS_STATUS_LABELS, ACCESS_STATUS_STYLES } from '@/lib/access-status'

const SWIPE_THRESHOLD = 50

function handleSwipe(info: PanInfo, onPrev: () => void, onNext: () => void) {
  if (info.offset.x > SWIPE_THRESHOLD) onPrev()
  else if (info.offset.x < -SWIPE_THRESHOLD) onNext()
}

interface Props {
  club: Club
  events: Event[]
  approvedCounts: Record<string, number>
}

const SIZE_LABELS: Record<ClubSize, string> = {
  intimate: 'Intimate',
  medium: 'Medium',
  large: 'Large',
  mega: 'Mega Club',
}

export function VenueContent({ club, events, approvedCounts }: Props) {
  const [heroIndex, setHeroIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const photos = [club.image_url, ...(club.gallery_urls || [])].filter(Boolean) as string[]
  const address = club.address || events.find((e) => e.scraped_venue_address)?.scraped_venue_address || null

  const goHero = (dir: 1 | -1) => setHeroIndex((i) => (i + dir + photos.length) % photos.length)
  const goLightbox = (dir: 1 | -1) =>
    setLightboxIndex((i) => (i == null ? i : (i + dir + photos.length) % photos.length))

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/guestlist" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-medium text-gold-gradient">{club.name}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-12">
        {photos.length > 0 && (
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.div
                key={heroIndex}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                drag={photos.length > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => handleSwipe(info, () => goHero(-1), () => goHero(1))}
                onClick={() => setLightboxIndex(heroIndex)}
              >
                <Image src={photos[heroIndex]} alt={club.name} fill className="object-cover pointer-events-none" priority />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => goHero(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 hover:bg-background transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => goHero(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 hover:bg-background transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === heroIndex ? 'w-4 bg-gold' : 'w-1.5 bg-background/70'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {photos.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border transition-colors ${i === heroIndex ? 'border-gold' : 'border-border/50 hover:border-gold/40'}`}
              >
                <Image src={photo} alt={`${club.name} photo ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="px-4 space-y-6 mt-2">
          <div>
            <h1 className="text-2xl font-light mb-2">{club.name}</h1>
            {club.neighborhood && <p className="text-sm text-muted-foreground">{club.neighborhood}</p>}
          </div>

          {club.description && (
            <p className="text-muted-foreground leading-relaxed">{club.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {club.music_styles && club.music_styles.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gold mb-2 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  Music
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {club.music_styles.map((style) => (
                    <span key={style} className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {club.size && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gold mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Size
                </p>
                <p className="text-sm text-muted-foreground">{SIZE_LABELS[club.size]}</p>
              </div>
            )}

            {address && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gold mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Address
                </p>
                <p className="text-sm text-muted-foreground">{address}</p>
              </div>
            )}

            {club.dress_code && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gold mb-2 flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  Dress Code
                </p>
                <p className="text-sm text-muted-foreground">{club.dress_code}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gold mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Xclusive Access
            </p>

            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No current releases at {club.name}. Check back soon, or explore other releases.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => {
                  const status = computeAccessStatus(event, approvedCounts[event.id] || 0)
                  const dateObj = parseISO(event.event_date)
                  const isToday = isSameDay(dateObj, new Date())

                  return (
                    <Link
                      key={event.id}
                      href="/guestlist"
                      className="flex items-center justify-between gap-3 bg-card border border-border/50 rounded-xl p-3 hover:border-gold/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {isToday ? 'Tonight' : format(dateObj, 'EEE, MMM d')}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${ACCESS_STATUS_STYLES[status] || 'bg-muted text-muted-foreground'}`}
                      >
                        {ACCESS_STATUS_LABELS[status]}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Access varies by event and availability.
            </p>
          </div>
        </div>
      </div>

      {lightboxIndex != null && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goLightbox(-1)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goLightbox(1)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <motion.div
            key={lightboxIndex}
            className="relative w-full max-w-lg aspect-square"
            onClick={(e) => e.stopPropagation()}
            drag={photos.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => handleSwipe(info, () => goLightbox(-1), () => goLightbox(1))}
          >
            <Image src={photos[lightboxIndex]} alt={club.name} fill className="object-contain pointer-events-none" />
          </motion.div>
        </div>
      )}
    </main>
  )
}
