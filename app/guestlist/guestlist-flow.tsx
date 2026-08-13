'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, isSameDay, startOfDay, addDays, isAfter, isBefore, getDay } from 'date-fns'
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight, Sparkles, Users, Music, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Event, Club } from '@/lib/types'

interface GuestlistFlowProps {
  events: (Event & { club: Club })[]
  referredBy?: string | null
}

type Step = 'date' | 'club' | 'signup'

export function GuestlistFlow({ events, referredBy }: GuestlistFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<(Event & { club: Club }) | null>(null)
  const [showComingSoonMessage, setShowComingSoonMessage] = useState<string | null>(null)

  // Filter and group events for the next 2 weeks (Thu-Sat only)
  const eventsByDate = useMemo(() => {
    const today = startOfDay(new Date())
    const twoWeeksOut = addDays(today, 14)
    
    const grouped: Record<string, (Event & { club: Club })[]> = {}
    
    events.forEach((event) => {
      const eventDate = startOfDay(parseISO(event.event_date))
      const eventDayOfWeek = getDay(eventDate) // 0=Sun, 4=Thu, 5=Fri, 6=Sat
      
      // Only include events that are:
      // 1. Today or in the future
      // 2. Within 2 weeks from now
      // 3. On Thu (4), Fri (5), or Sat (6)
      const isWeekendDay = eventDayOfWeek >= 4 && eventDayOfWeek <= 6
      const isFutureOrToday = isSameDay(eventDate, today) || isAfter(eventDate, today)
      const isWithin2Weeks = isBefore(eventDate, twoWeeksOut) || isSameDay(eventDate, twoWeeksOut)
      
      if (isWeekendDay && isFutureOrToday && isWithin2Weeks) {
        const date = event.event_date
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(event)
      }
    })
    return grouped
  }, [events])
  
  // Get status for a date based on events - use the "best" status available
  const getDateStatus = (date: string): 'confirmed' | 'coming_soon' | 'sold_out' => {
    const dateEvents = eventsByDate[date] || []
    // If any event is confirmed, the date is confirmed
    if (dateEvents.some(e => e.guestlist_status === 'confirmed')) return 'confirmed'
    // If any event is coming_soon, show that
    if (dateEvents.some(e => e.guestlist_status === 'coming_soon')) return 'coming_soon'
    // Otherwise sold out
    return 'sold_out'
  }

  // Get unique dates
  const availableDates = useMemo(() => {
    return Object.keys(eventsByDate).sort()
  }, [eventsByDate])

  // Get clubs for selected date
  const clubsForDate = useMemo(() => {
    if (!selectedDate) return []
    return eventsByDate[selectedDate] || []
  }, [selectedDate, eventsByDate])

  const handleDateSelect = (date: string) => {
    const status = getDateStatus(date)
    
    if (status === 'sold_out') {
      // Don't do anything for sold out dates
      return
    }
    
    if (status === 'coming_soon') {
      // Show the coming soon message
      setShowComingSoonMessage(date)
      return
    }
    
    // Confirmed - proceed to club selection
    setShowComingSoonMessage(null)
    setSelectedDate(date)
    setStep('club')
  }

  const handleClubSelect = (event: Event & { club: Club }) => {
    // Redirect to the form page with event ID
    const params = new URLSearchParams({ event: event.id })
    if (referredBy) params.append('ref', referredBy)
    router.push(`/guestlist/form?${params.toString()}`)
  }

  const handleBack = () => {
    if (step === 'club') {
      setSelectedDate(null)
      setStep('date')
    } else if (step === 'signup') {
      setSelectedEvent(null)
      setStep('club')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          {step !== 'date' ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 relative">
                <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
              </div>
              <span className="font-medium text-gold-gradient">Guest List</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between w-full">
          {['date', 'club', 'signup'].map((s, index) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all shrink-0 ${
                  step === s
                    ? 'bg-gold text-background'
                    : index < ['date', 'club', 'signup'].indexOf(step)
                    ? 'bg-gold/20 text-gold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < ['date', 'club', 'signup'].indexOf(step)
                      ? 'bg-gold/40'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          {step === 'date' && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-light mb-2">
                  Upcoming Nights
                </h1>
                <p className="text-muted-foreground">
                  Select a night to see available venues
                </p>
              </div>

              {availableDates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    We&apos;re adding new dates soon. Check back for the latest lineup.
                  </p>
                  <div className="bg-card border border-border/50 rounded-xl p-4 max-w-sm mx-auto">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-gold font-medium">Pro tip:</span> Follow us on Instagram for early access and announcements.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDates.map((date) => {
                    const dateObj = parseISO(date)
                    const isToday = isSameDay(dateObj, new Date())
                    const clubCount = eventsByDate[date].length
                    const status = getDateStatus(date)
                    const isClickable = status === 'confirmed'
                    const isComingSoon = status === 'coming_soon'
                    const isSoldOut = status === 'sold_out'

                    return (
                      <div key={date}>
                        <motion.button
                          onClick={() => handleDateSelect(date)}
                          whileHover={isClickable ? { scale: 1.01 } : {}}
                          whileTap={isClickable ? { scale: 0.99 } : {}}
                          disabled={isSoldOut}
                          className={`w-full text-left bg-card border rounded-xl p-4 transition-all ${
                            isSoldOut 
                              ? 'border-border/30 opacity-60 cursor-not-allowed' 
                              : isComingSoon
                              ? 'border-amber-500/30 hover:border-amber-500/50 cursor-pointer'
                              : 'border-border/50 hover:border-gold/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${
                                isSoldOut 
                                  ? 'bg-muted' 
                                  : isComingSoon 
                                  ? 'bg-amber-500/10' 
                                  : 'bg-gold/10'
                              }`}>
                                <span className={`text-xs uppercase font-medium ${
                                  isSoldOut 
                                    ? 'text-muted-foreground' 
                                    : isComingSoon 
                                    ? 'text-amber-500' 
                                    : 'text-gold'
                                }`}>
                                  {format(dateObj, 'EEE')}
                                </span>
                                <span className={`text-xl font-semibold ${
                                  isSoldOut ? 'text-muted-foreground' : 'text-foreground'
                                }`}>
                                  {format(dateObj, 'd')}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-medium ${isSoldOut ? 'text-muted-foreground' : ''}`}>
                                    {format(dateObj, 'EEEE, MMMM d')}
                                  </span>
                                  {isToday && !isSoldOut && (
                                    <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full">
                                      Tonight
                                    </span>
                                  )}
                                  {/* Status Badge */}
                                  {status === 'confirmed' && (
                                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Confirmed
                                    </span>
                                  )}
                                  {status === 'coming_soon' && (
                                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Coming Soon
                                    </span>
                                  )}
                                  {status === 'sold_out' && (
                                    <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full">
                                      Sold Out
                                    </span>
                                  )}
                                </div>
                                <span className={`text-sm ${isSoldOut ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                                  {isSoldOut 
                                    ? 'Guest list full' 
                                    : isComingSoon 
                                    ? 'Details dropping soon'
                                    : `${clubCount} ${clubCount === 1 ? 'venue' : 'venues'} available`
                                  }
                                </span>
                              </div>
                            </div>
                            {!isSoldOut && (
                              <ChevronRight className={`w-5 h-5 ${isComingSoon ? 'text-amber-500' : 'text-muted-foreground'}`} />
                            )}
                          </div>
                        </motion.button>
                        
                        {/* Coming Soon Message */}
                        {showComingSoonMessage === date && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4"
                          >
                            <p className="text-sm text-amber-200">
                              Details dropping soon — check back Monday for venue info and signups.
                            </p>
                            <button 
                              onClick={() => setShowComingSoonMessage(null)}
                              className="text-xs text-amber-500 mt-2 hover:underline"
                            >
                              Got it
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {step === 'club' && selectedDate && (
            <motion.div
              key="club"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div className="flex items-center gap-2 text-gold mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-light mb-2">
                  Choose your venue
                </h1>
                <p className="text-muted-foreground">
                  Select a club to join the guest list
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {clubsForDate.map((event) => {
                  const sizeLabels: Record<string, string> = {
                    intimate: 'Intimate',
                    medium: 'Medium',
                    large: 'Large',
                    mega: 'Mega Club',
                  }
                  
                  return (
                    <motion.button
                      key={event.id}
                      onClick={() => handleClubSelect(event)}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="group w-full text-left bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)] transition-all duration-300"
                    >
                      {/* Club Image - Full Width at Top */}
                      <div className="relative w-full aspect-[16/10] overflow-hidden">
                        {event.club.image_url ? (
                          <>
                            <Image
                              src={event.club.image_url}
                              alt={event.club.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gold/20 via-gold/10 to-transparent flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-gold/40" />
                          </div>
                        )}
                        
                        {/* Cutoff badge on image */}
                        {event.cutoff_time && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium bg-background/90 backdrop-blur-sm text-gold px-2.5 py-1.5 rounded-full border border-gold/20">
                            <Clock className="w-3 h-3" />
                            <span>Until {formatTime(event.cutoff_time)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Club Info - Below Image */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-semibold group-hover:text-gold transition-colors">
                            {event.club.name}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        
                        {event.club.address && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{event.club.address}</span>
                          </div>
                        )}
                        
                        {/* Size & Music Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          {event.club.size && (
                            <div className="flex items-center gap-1 text-xs text-foreground/80 bg-muted px-2.5 py-1 rounded-full">
                              <Users className="w-3 h-3" />
                              <span>{sizeLabels[event.club.size] || event.club.size}</span>
                            </div>
                          )}
                          {event.club.music_styles && event.club.music_styles.length > 0 && (
                            <>
                              {event.club.music_styles.slice(0, 3).map((style) => (
                                <div
                                  key={style}
                                  className="flex items-center gap-1 text-xs text-gold/90 bg-gold/10 px-2.5 py-1 rounded-full"
                                >
                                  <Music className="w-3 h-3" />
                                  <span>{style}</span>
                                </div>
                              ))}
                              {event.club.music_styles.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{event.club.music_styles.length - 3} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}


        </AnimatePresence>
      </div>
    </main>
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}
