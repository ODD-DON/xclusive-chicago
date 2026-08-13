'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { SignupForm } from '../signup-form'
import { Event, Club } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/spinner'

export default function GuestlistFormPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8 text-gold" />
      </main>
    }>
      <GuestlistFormContent />
    </Suspense>
  )
}

function GuestlistFormContent() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event')
  const referredBy = searchParams.get('ref')

  const [event, setEvent] = useState<(Event & { club: Club }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setError('No event selected')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('xc_events')
        .select(`
          *,
          club:xc_clubs(*)
        `)
        .eq('id', eventId)
        .single()

      if (fetchError || !data) {
        setError('Event not found')
        setLoading(false)
        return
      }

      setEvent(data as Event & { club: Club })
      setLoading(false)
    }

    loadEvent()
  }, [eventId])

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8 text-gold" />
      </main>
    )
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">{error || 'Event not found'}</h1>
          <Link href="/guestlist" className="text-gold hover:underline">
            ← Back to guestlist
          </Link>
        </div>
      </main>
    )
  }

  const eventDate = parseISO(event.event_date)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/guestlist"
            className="w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-medium">Complete Your Registration</h1>
            <p className="text-sm text-muted-foreground">Step 3 of 3</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Event Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-8"
        >
          {/* Club Image */}
          {event.club.image_url && (
            <div className="relative h-32 w-full">
              <Image
                src={event.club.image_url}
                alt={event.club.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            </div>
          )}

          <div className="p-4 -mt-8 relative">
            <h2 className="text-xl font-semibold mb-3">{event.club.name}</h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-gold" />
                <span>{format(eventDate, 'EEEE, MMMM d')}</span>
              </div>

              {event.club.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span>{event.club.address}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-gold" />
                <span>
                  Free entry before{' '}
                  <span className="text-gold font-medium">
                    {event.cutoff_time || event.club.default_cutoff_time || '11:00 PM'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SignupForm event={event} referredBy={referredBy} />
        </motion.div>
      </div>
    </main>
  )
}
