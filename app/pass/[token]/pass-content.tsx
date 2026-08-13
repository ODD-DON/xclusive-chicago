'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns'
import {
  Lock,
  Unlock,
  Calendar,
  MapPin,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import type { Registration, Club, Event } from '@/lib/types'
import QRCode from 'react-qr-code'

interface Props {
  registration: Registration & { club: Club; event: Event }
}

type PassState = 'locked' | 'active' | 'unlocked' | 'expired'

export function PassContent({ registration }: Props) {
  const [passState, setPassState] = useState<PassState>('locked')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [countdown, setCountdown] = useState<string>('')
  const [currentRegistration, setCurrentRegistration] = useState(registration)

  // Determine pass state based on times
  const determinePassState = useCallback(() => {
    const now = new Date()
    const eventDate = parseISO(currentRegistration.event_date)
    
    // Parse unlock and cutoff times
    const unlockTime = currentRegistration.event?.unlock_time || '21:00:00'
    const cutoffTime = currentRegistration.event?.cutoff_time || '23:30:00'
    
    const [unlockHours, unlockMinutes] = unlockTime.split(':').map(Number)
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number)
    
    const unlockDateTime = new Date(eventDate)
    unlockDateTime.setHours(unlockHours, unlockMinutes, 0, 0)
    
    const cutoffDateTime = new Date(eventDate)
    cutoffDateTime.setHours(cutoffHours, cutoffMinutes, 0, 0)
    // If cutoff is before unlock (e.g., 1 AM), it's the next day
    if (cutoffHours < unlockHours) {
      cutoffDateTime.setDate(cutoffDateTime.getDate() + 1)
    }

    // Already unlocked
    if (currentRegistration.activated_at) {
      return 'unlocked'
    }

    // Before unlock window
    if (isBefore(now, unlockDateTime)) {
      return 'locked'
    }

    // After cutoff
    if (isAfter(now, cutoffDateTime)) {
      return 'expired'
    }

    // In the active window
    return 'active'
  }, [currentRegistration])

  // Track pass opened (first view)
  useEffect(() => {
    fetch('/api/pass/opened', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passToken: registration.pass_token }),
    }).catch(() => {}) // Silently fail
  }, [registration.pass_token])

  // Update countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const eventDate = parseISO(currentRegistration.event_date)
      const unlockTime = currentRegistration.event?.unlock_time || '21:00:00'
      const [unlockHours, unlockMinutes] = unlockTime.split(':').map(Number)
      
      const unlockDateTime = new Date(eventDate)
      unlockDateTime.setHours(unlockHours, unlockMinutes, 0, 0)

      if (isBefore(now, unlockDateTime)) {
        const diff = unlockDateTime.getTime() - now.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m`)
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`)
        } else {
          setCountdown(`${minutes}m ${seconds}s`)
        }
      } else {
        setCountdown('')
      }

      setPassState(determinePassState())
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [currentRegistration, determinePassState])

  const handleUnlock = async () => {
    setIsUnlocking(true)

    try {
      // Request geolocation
      let lat: number | null = null
      let lng: number | null = null
      let accuracy: number | null = null

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          })
        })
        lat = position.coords.latitude
        lng = position.coords.longitude
        accuracy = position.coords.accuracy
      } catch {
        // Location denied, continue without it
        toast.info('Location unavailable, but pass will still unlock')
      }

      // Call unlock API
      const response = await fetch('/api/pass/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passToken: currentRegistration.pass_token,
          lat,
          lng,
          accuracy,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlock pass')
      }

      // Update local state
      setCurrentRegistration({
        ...currentRegistration,
        activated_at: new Date().toISOString(),
        activation_lat: lat,
        activation_lng: lng,
        activation_accuracy_meters: accuracy,
        activation_distance_miles: data.distance,
      })

      setPassState('unlocked')
      toast.success('Pass unlocked successfully!')
    } catch (error) {
      console.error('[v0] Unlock error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to unlock pass')
    } finally {
      setIsUnlocking(false)
    }
  }

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  const totalGuests = currentRegistration.total_count || (currentRegistration.women_count + currentRegistration.men_count) || 1

  return (
    <main className="min-h-screen bg-background">
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-8">
        {/* Pass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative bg-card border rounded-3xl overflow-hidden ${
            passState === 'unlocked'
              ? 'border-gold/50 shadow-[0_0_40px_rgba(212,175,55,0.2)]'
              : passState === 'expired'
              ? 'border-destructive/30'
              : 'border-border/50'
          }`}
        >
          {/* Header with logo */}
          <div className="relative px-6 pt-6 pb-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative">
                  <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Guest Pass
                  </p>
                  <p className="font-medium text-gold-gradient">XCLUSIVE</p>
                </div>
              </div>
              <PassStatusBadge state={passState} />
            </div>
          </div>

          {/* Guest info */}
          <div className="px-6 py-5 border-b border-border/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <User className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="font-medium text-lg">
                  {currentRegistration.first_name} {currentRegistration.last_name}
                </p>
                {totalGuests > 1 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>+{totalGuests - 1} guest{totalGuests > 2 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gold" />
                <span>{format(parseISO(currentRegistration.event_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gold" />
                <span>{currentRegistration.club.name}</span>
              </div>
              {currentRegistration.event?.cutoff_time && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gold" />
                  <span>
                    Complimentary access until {formatTime(currentRegistration.event.cutoff_time)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code / Status section */}
          <div className="px-6 py-6">
            <AnimatePresence mode="wait">
              {passState === 'locked' && (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 animate-shimmer" />
                    <Lock className="w-12 h-12 text-muted-foreground relative z-10" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">
                    Pass unlocks at {formatTime(currentRegistration.event?.unlock_time || '21:00:00')}
                  </p>
                  {countdown && (
                    <div className="bg-gold/10 rounded-xl px-4 py-3 inline-block">
                      <p className="text-xs text-muted-foreground mb-1">Countdown</p>
                      <p className="text-2xl font-mono text-gold">{countdown}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {passState === 'active' && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-gold/10 flex items-center justify-center animate-glow">
                    <Unlock className="w-12 h-12 text-gold animate-pulse-gold" />
                  </div>
                  <p className="text-gold font-medium mb-4">
                    Your pass is ready to unlock!
                  </p>
                  <Button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="bg-gold hover:bg-gold-light text-background font-medium px-8 py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                  >
                    {isUnlocking ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="w-5 h-5" />
                        <span>Unlocking...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Unlock className="w-5 h-5" />
                        <span>Unlock My Pass</span>
                      </div>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <Navigation className="w-3 h-3" />
                    Location will be used for verification
                  </p>
                </motion.div>
              )}

              {passState === 'unlocked' && (
                <motion.div
                  key="unlocked"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="bg-white p-4 rounded-2xl inline-block mb-4">
                    <QRCode
                      value={currentRegistration.qr_token || currentRegistration.pass_token}
                      size={160}
                      level="H"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gold mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Pass Verified</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Show this QR code at the door
                  </p>
                  {currentRegistration.activation_distance_miles !== null && (
                    <div className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Navigation className="w-3 h-3" />
                      <span>
                        {currentRegistration.activation_distance_miles < 1
                          ? 'Near venue'
                          : `${currentRegistration.activation_distance_miles.toFixed(1)} miles from venue`}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {passState === 'expired' && (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-destructive/70" />
                  </div>
                  <p className="text-destructive font-medium mb-2">Pass Expired</p>
                  <p className="text-sm text-muted-foreground">
                    The complimentary access window has closed
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Celebration badge */}
          {currentRegistration.celebration_type && (
            <div className="px-6 pb-6">
              <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-xs text-muted-foreground">Celebrating</p>
                  <p className="text-sm font-medium capitalize">
                    {currentRegistration.celebration_type === 'other'
                      ? currentRegistration.celebration_other
                      : currentRegistration.celebration_type}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Decorative notches */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />
        </motion.div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Keep this page open to show at the door
        </motion.p>
      </div>
    </main>
  )
}

function PassStatusBadge({ state }: { state: PassState }) {
  const config = {
    locked: {
      label: 'Locked',
      className: 'bg-muted text-muted-foreground',
    },
    active: {
      label: 'Ready',
      className: 'bg-gold/20 text-gold animate-pulse-gold',
    },
    unlocked: {
      label: 'Verified',
      className: 'bg-gold/20 text-gold',
    },
    expired: {
      label: 'Expired',
      className: 'bg-destructive/20 text-destructive',
    },
  }

  const { label, className } = config[state]

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
