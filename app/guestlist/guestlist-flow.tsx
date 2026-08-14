'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, isSameDay } from 'date-fns'
import { ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Sparkles, Wine, Ship, Bus, Check, ChevronRight, Users, Plane, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Event, Club, CELEBRATION_TYPES, CLUB_SIZE_LABELS } from '@/lib/types'
import {
  computeAccessStatus,
  remainingPasses,
  ctaLabelForStatus,
  ACCESS_STATUS_LABELS,
  ACCESS_STATUS_STYLES,
  isStatusActionable,
  effectiveCutoffTime,
} from '@/lib/access-status'

interface EventFeedProps {
  events: (Event & { club: Club | null })[]
  approvedCounts: Record<string, number>
  referredBy?: string | null
  initialEventId?: string | null
}

export function EventFeed({ events, approvedCounts, referredBy, initialEventId }: EventFeedProps) {
  const [accessEvent, setAccessEvent] = useState<(Event & { club: Club | null }) | null>(null)
  const [accessIsWaitlist, setAccessIsWaitlist] = useState(false)

  useEffect(() => {
    if (!initialEventId) return
    const match = events.find((e) => e.id === initialEventId)
    if (match) {
      setAccessEvent(match)
      setAccessIsWaitlist(computeAccessStatus(match, approvedCounts[match.id] || 0) === 'WAITLIST')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEventId])

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 relative">
                <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
              </div>
              <span className="font-medium text-gold-gradient">Xclusive Access</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-light mb-2">Current Releases</h1>
          <p className="text-muted-foreground">Request access, or reserve bottle service</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-medium mb-2">No releases posted yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              New releases go up weekly, so if you&apos;re local, check back soon. Coming in from out of town and
              need something locked in before your trip? Don&apos;t wait on a release — book VIP table access in
              advance instead.
            </p>
            <Link href="/experiences/vip-tables">
              <Button className="bg-gold hover:bg-gold-light text-background">
                <Plane className="w-4 h-4 mr-2" />
                Plan Ahead with VIP Tables
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Coming from out of town?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Don&apos;t see a release for your date yet — releases go up weekly, but you can lock in VIP table
                  access now instead of waiting.
                </p>
              </div>
              <Link href="/experiences/vip-tables" className="shrink-0 w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-gold/30 text-gold hover:bg-gold/10">
                  Plan Ahead
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>

            {events.map((event) => {
              const dateObj = parseISO(event.event_date)
              const isToday = isSameDay(dateObj, new Date())
              const venueName = event.club?.name || event.scraped_venue_name
              const venueAddress = event.club?.address || event.scraped_venue_address
              const neighborhood = event.club?.neighborhood
              const sizeLabel = event.club?.size ? CLUB_SIZE_LABELS[event.club.size] : null
              const image = event.use_venue_branding
                ? event.club?.image_url || event.image_url
                : event.image_url || event.club?.image_url
              const cutoffTime = effectiveCutoffTime(event, event.club)
              const approvedCount = approvedCounts[event.id] || 0
              const status = computeAccessStatus({ ...event, cutoff_time: cutoffTime }, approvedCount)
              const remaining = remainingPasses(event, approvedCount)
              const actionable = isStatusActionable(status)

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-gold/40 transition-all duration-300 [backface-visibility:hidden]"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden">
                    {image ? (
                      <>
                        <Image src={image} alt={event.title || 'Event'} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold/20 via-gold/10 to-transparent flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-gold/40" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 text-sm font-semibold bg-background/90 backdrop-blur-sm text-gold px-3 py-1.5 rounded-full border border-gold/30">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {isToday ? 'Tonight' : format(dateObj, 'EEE, MMM d')}
                      </span>
                    </div>

                    {event.unlock_time && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium bg-background/90 backdrop-blur-sm text-foreground px-2.5 py-1.5 rounded-full border border-border/30">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(event.unlock_time)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-base font-bold text-gold flex items-center gap-1.5 mb-1.5">
                        <Calendar className="w-4 h-4 shrink-0" />
                        {isToday ? 'Tonight' : format(dateObj, 'EEEE, MMMM d')}
                      </p>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {event.use_venue_branding && venueName ? venueName : event.title}
                        </h3>
                        <StatusBadge status={status} />
                      </div>
                      {venueName && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {event.club?.slug ? (
                            <Link
                              href={`/venues/${event.club.slug}`}
                              className="flex items-center gap-0.5 min-w-0 text-gold underline-offset-2 hover:underline active:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="truncate">
                                {event.use_venue_branding ? venueAddress || venueName : venueName}
                                {!event.use_venue_branding && venueAddress ? ` · ${venueAddress}` : ''}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            </Link>
                          ) : (
                            <span className="truncate">
                              {event.use_venue_branding ? venueAddress || venueName : venueName}
                              {!event.use_venue_branding && venueAddress ? ` · ${venueAddress}` : ''}
                            </span>
                          )}
                        </div>
                      )}
                      {(neighborhood || sizeLabel) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-muted-foreground text-sm mt-0.5">
                          {neighborhood && (
                            <span className="flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 shrink-0" />
                              {neighborhood}
                            </span>
                          )}
                          {sizeLabel && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              Venue Size: {sizeLabel.label} ({sizeLabel.capacity} capacity)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {cutoffTime && (
                      <div className="flex items-center gap-1.5 text-sm text-gold">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Complimentary access before {formatTime(cutoffTime)}</span>
                      </div>
                    )}

                    {remaining != null && actionable && (
                      <p className="text-xs text-muted-foreground">
                        {remaining} {remaining === 1 ? 'pass' : 'passes'} remaining
                      </p>
                    )}

                    {event.announcement_text && (
                      <p className="text-sm text-gold">{event.announcement_text}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        className="flex-1 bg-gold hover:bg-gold-light text-background disabled:opacity-50 h-12 text-base rounded-lg"
                        disabled={!actionable}
                        onClick={() => {
                          setAccessEvent(event)
                          setAccessIsWaitlist(status === 'WAITLIST')
                        }}
                      >
                        {ctaLabelForStatus(status)}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-border/30 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p className="font-medium text-foreground">SMS Consent</p>
          <p>
            When you tap Request Access on an event above, the form asks for your phone number and includes an
            unchecked box reading &quot;I agree to receive SMS updates from Xclusive Chicago.&quot; You must actively
            check this box before you can continue. By checking it and submitting your phone number, you agree to
            receive SMS messages from Xclusive Chicago related to your access request, confirmations, and event
            updates. Message frequency may vary. Message &amp; data rates may apply. Reply STOP to opt out, HELP for
            help.
          </p>
          <p>
            <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
            {' | '}
            <Link href="/terms-and-conditions" className="text-gold hover:underline">Terms &amp; Conditions</Link>
          </p>
        </div>
      </div>

      <RequestAccessDialog
        event={accessEvent}
        onClose={() => setAccessEvent(null)}
        referredBy={referredBy}
        isWaitlist={accessIsWaitlist}
      />
    </main>
  )
}

function StatusBadge({ status }: { status: ReturnType<typeof computeAccessStatus> }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${ACCESS_STATUS_STYLES[status] || 'bg-muted text-muted-foreground'}`}>
      {ACCESS_STATUS_LABELS[status]}
    </span>
  )
}

function RequestAccessDialog({
  event,
  onClose,
  referredBy,
  isWaitlist,
}: {
  event: (Event & { club: Club | null }) | null
  onClose: () => void
  referredBy?: string | null
  isWaitlist?: boolean
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [guestCount, setGuestCount] = useState('1')
  const [smsConsent, setSmsConsent] = useState(false)
  const [celebrationType, setCelebrationType] = useState('')
  const [celebrationOther, setCelebrationOther] = useState('')
  const [bottleServiceInterest, setBottleServiceInterest] = useState(false)
  const [bottleBudget, setBottleBudget] = useState('')
  const [interestBoat, setInterestBoat] = useState(false)
  const [interestPartyBus, setInterestPartyBus] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const bottleMenuUrls = event?.club?.bottle_menu_urls || []
  const totalSteps = 4

  const reset = () => {
    setStep(0)
    setDirection(1)
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setInstagram('')
    setGuestCount('1')
    setSmsConsent(false)
    setCelebrationType('')
    setCelebrationOther('')
    setBottleServiceInterest(false)
    setBottleBudget('')
    setInterestBoat(false)
    setInterestPartyBus(false)
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 200)
  }

  const canContinue = () => {
    if (step === 0) return !!firstName.trim() && !!lastName.trim()
    if (step === 1) return !!phone.replace(/\D/g, '').match(/^\d{10,}$/) && !!instagram.trim() && smsConsent
    return true
  }

  const goNext = () => {
    if (!canContinue()) {
      if (step === 0) {
        toast.error('Tell us your name')
      } else if (step === 1) {
        toast.error(
          !phone.replace(/\D/g, '').match(/^\d{10,}$/)
            ? 'Enter a valid phone number'
            : !instagram.trim()
              ? 'Enter your Instagram handle'
              : 'Please agree to receive SMS updates to continue',
        )
      }
      return
    }
    setDirection(1)
    setStep((s) => Math.min(totalSteps - 1, s + 1))
  }

  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  const handleSubmit = async () => {
    if (!event || !canContinue()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/access/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          email: email.trim() || null,
          instagram: instagram.trim().replace(/^@/, ''),
          guestCount: parseInt(guestCount, 10),
          smsConsent,
          celebrationType: celebrationType || null,
          celebrationOther: celebrationType === 'Other' ? celebrationOther.trim() || null : null,
          bottleServiceInterest,
          bottleBudget: bottleServiceInterest ? bottleBudget || null : null,
          interestBoat,
          interestPartyBus,
          referredBy: referredBy || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit your request')
      }

      router.push(`/access/${data.accessCode}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Request Xclusive Access</DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <p className="text-sm text-muted-foreground -mt-2">
            {isWaitlist
              ? <>You&apos;re joining the waitlist for {event?.title}. We&apos;ll reach out if a spot opens up.</>
              : <>You&apos;ve been invited to request complimentary access to {event?.title}.</>}
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? 'w-6 bg-gold' : i < step ? 'w-1.5 bg-gold/50' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="min-h-[260px] overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {step === 0 && (
                <>
                  <StepHeading title="Who's coming?" subtitle="Let's start with you." />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        autoFocus
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-muted border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-muted border-border/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Guests</Label>
                    <div className="flex items-center justify-between gap-4 bg-muted border border-border/50 rounded-lg px-3 h-9 w-full">
                      <button
                        type="button"
                        onClick={() => setGuestCount((c) => String(Math.max(1, parseInt(c, 10) - 1)))}
                        disabled={parseInt(guestCount, 10) <= 1}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none hover:bg-background/60 disabled:opacity-30 transition-colors shrink-0"
                      >
                        −
                      </button>
                      <span className="text-center text-sm">
                        {guestCount} {parseInt(guestCount, 10) === 1 ? 'guest' : 'guests'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuestCount((c) => String(Math.min(8, parseInt(c, 10) + 1)))}
                        disabled={parseInt(guestCount, 10) >= 8}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none hover:bg-background/60 disabled:opacity-30 transition-colors shrink-0"
                      >
                        +
                      </button>
                    </div>
                    {parseInt(guestCount, 10) > 1 && (
                      <div className="bg-gold/10 border border-gold/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">
                          Access is granted per person. For the fastest approval, have everyone in your group
                          request their own access instead of one person requesting for the group — you&apos;ll get
                          a link to share with them once you submit.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <StepHeading title="How can we reach you?" subtitle="For your access code and any updates." />
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      autoFocus
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(312) 555-0123"
                      className="bg-muted border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@yourhandle"
                      className="bg-muted border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted border-border/50" />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group p-3 -mx-3 rounded-lg hover:bg-muted/30 active:bg-muted/50 transition-colors">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={smsConsent}
                        onChange={(e) => setSmsConsent(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded-md border-2 border-border bg-card peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center shrink-0">
                        {smsConsent && (
                          <svg className="w-3.5 h-3.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-foreground leading-snug flex-1">
                      I agree to receive SMS updates from Xclusive Chicago
                    </span>
                  </label>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By submitting your phone number, you agree to receive SMS messages from Xclusive Chicago
                    related to your access request, confirmations, and event updates. Message frequency may vary.
                    Message &amp; data rates may apply. Reply STOP to opt out.
                  </p>

                  <p className="text-xs text-muted-foreground">
                    <Link href="/privacy" target="_blank" className="text-gold hover:underline">Privacy Policy</Link>
                    {' | '}
                    <Link href="/terms-and-conditions" target="_blank" className="text-gold hover:underline">Terms &amp; Conditions</Link>
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <StepHeading title="Anything to celebrate?" subtitle="Optional, but it helps us take care of you." />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CELEBRATION_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCelebrationType((c) => (c === type ? '' : type))}
                        className={`px-3 py-2.5 rounded-lg text-sm border text-center transition-colors ${
                          celebrationType === type
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border/50 text-muted-foreground hover:border-gold/30'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {celebrationType === 'Other' && (
                    <Input
                      value={celebrationOther}
                      onChange={(e) => setCelebrationOther(e.target.value)}
                      placeholder="Tell us what you're celebrating"
                      className="bg-muted border-border/50"
                    />
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <StepHeading title="Want to upgrade the night?" subtitle="Optional. We'll follow up on the details." />
                  <div className="grid grid-cols-3 gap-2">
                    <UpsellChip
                      icon={Wine}
                      label="Bottle Service"
                      active={bottleServiceInterest}
                      onClick={() => setBottleServiceInterest((v) => !v)}
                    />
                    <UpsellChip icon={Ship} label="Boat Party" active={interestBoat} onClick={() => setInterestBoat((v) => !v)} />
                    <UpsellChip
                      icon={Bus}
                      label="Party Bus"
                      active={interestPartyBus}
                      onClick={() => setInterestPartyBus((v) => !v)}
                    />
                  </div>
                  {bottleServiceInterest && bottleMenuUrls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Bottle service menu for {event?.club?.name} &middot; tap to view
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {bottleMenuUrls.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setLightboxUrl(url)}
                            className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-muted cursor-pointer"
                          >
                            <Image src={url} alt="Bottle service menu" fill className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {bottleServiceInterest && (
                    <div className="space-y-2">
                      <Label>Budget for bottle service (optional)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['$500-1000', '$1000-2500', '$2500-5000', '$5000+'].map((range) => (
                          <button
                            key={range}
                            type="button"
                            onClick={() => setBottleBudget((b) => (b === range ? '' : range))}
                            className={`px-3 py-2.5 rounded-lg text-sm border text-center transition-colors ${
                              bottleBudget === range
                                ? 'border-gold bg-gold/10 text-gold'
                                : 'border-border/50 text-muted-foreground hover:border-gold/30'
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={goBack} className="h-12 px-4 text-base text-muted-foreground">
              Back
            </Button>
          )}
          {step < totalSteps - 1 ? (
            <Button type="button" onClick={goNext} className="flex-1 h-12 text-base rounded-lg bg-gold hover:bg-gold-light text-background">
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex-1 h-12 text-base rounded-lg bg-gold hover:bg-gold-light text-background"
            >
              {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Request Access'}
            </Button>
          )}
        </div>
      </DialogContent>

      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-lg p-2 bg-transparent border-none shadow-none" showCloseButton={false}>
          <DialogTitle className="sr-only">Bottle service menu</DialogTitle>
          {lightboxUrl && (
            <button type="button" onClick={() => setLightboxUrl(null)} className="relative w-full aspect-square">
              <Image src={lightboxUrl} alt="Bottle service menu" fill className="object-contain rounded-lg" />
            </button>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  )
}

function UpsellChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-medium transition-colors ${
        active ? 'border-gold bg-gold/10 text-gold' : 'border-border/50 text-muted-foreground hover:border-gold/30'
      }`}
    >
      {active && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-gold flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-background" />
        </span>
      )}
      <Icon className="w-5 h-5" />
      <span className="text-center leading-tight">{label}</span>
    </button>
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}
