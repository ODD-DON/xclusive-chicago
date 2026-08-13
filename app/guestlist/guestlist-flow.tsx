'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, parseISO, isSameDay } from 'date-fns'
import { ArrowLeft, Calendar, MapPin, Clock, Sparkles, Wine, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Event, Club } from '@/lib/types'

interface EventFeedProps {
  events: (Event & { club: Club | null })[]
}

export function EventFeed({ events }: EventFeedProps) {
  const [vipEvent, setVipEvent] = useState<(Event & { club: Club | null }) | null>(null)

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
              <span className="font-medium text-gold-gradient">Guest List</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-light mb-2">Upcoming Nights</h1>
          <p className="text-muted-foreground">Tap in for tickets, or request bottle service</p>
        </div>

        {events.length === 0 ? (
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
          <div className="space-y-4">
            {events.map((event) => {
              const dateObj = parseISO(event.event_date)
              const isToday = isSameDay(dateObj, new Date())
              const venueName = event.club?.name || event.scraped_venue_name
              const venueAddress = event.club?.address || event.scraped_venue_address
              const image = event.image_url || event.club?.image_url
              const ticketUrl = event.ticket_url || event.source_url

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-gold/40 transition-all duration-300"
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

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-medium bg-background/90 backdrop-blur-sm text-gold px-2.5 py-1.5 rounded-full border border-gold/20">
                      <Calendar className="w-3 h-3" />
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
                      <h3 className="text-lg font-semibold mb-1">{event.title}</h3>
                      {venueName && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {venueName}
                            {venueAddress ? ` · ${venueAddress}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {event.cutoff_time && (
                      <div className="flex items-center gap-1.5 text-sm text-gold">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Free entry before {formatTime(event.cutoff_time)} with this link</span>
                      </div>
                    )}

                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      {ticketUrl ? (
                        <Button asChild className="flex-1 bg-gold hover:bg-gold-light text-background">
                          <a href={ticketUrl} target="_blank" rel="noreferrer">
                            Get Tickets
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      ) : null}
                      {event.tables_url ? (
                        <Button asChild variant="outline" className="flex-1 border-gold/30 text-gold hover:bg-gold/10">
                          <a href={event.tables_url} target="_blank" rel="noreferrer">
                            <Wine className="w-4 h-4 mr-2" />
                            Bottle Service
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
                          onClick={() => setVipEvent(event)}
                        >
                          <Wine className="w-4 h-4 mr-2" />
                          Bottle Service
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <VipRequestDialog event={vipEvent} onClose={() => setVipEvent(null)} />
    </main>
  )
}

function VipRequestDialog({
  event,
  onClose,
}: {
  event: (Event & { club: Club | null }) | null
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [groupSize, setGroupSize] = useState('4')
  const [budget, setBudget] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const reset = () => {
    setName('')
    setPhone('')
    setGroupSize('4')
    setBudget('')
    setNotes('')
    setSubmitted(false)
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return

    if (!name.trim() || !phone.replace(/\D/g, '').match(/^\d{10,}$/)) {
      toast.error('Enter your name and a valid phone number')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/vip/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          name: name.trim(),
          phone,
          groupSize: parseInt(groupSize, 10),
          budget,
          notes,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit')

      setSubmitted(true)
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bottle Service — {event?.title}</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6">
            <Wine className="w-10 h-10 text-gold mx-auto mb-3" />
            <p className="font-medium mb-1">Request sent</p>
            <p className="text-sm text-muted-foreground">We&apos;ll text you shortly to lock it in.</p>
            <Button className="mt-6 w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(312) 555-0123"
                className="bg-muted border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Group Size</Label>
              <Select value={groupSize} onValueChange={setGroupSize}>
                <SelectTrigger className="bg-muted border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} people
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget (optional)</Label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger className="bg-muted border-border/50">
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$300-500">$300-500</SelectItem>
                  <SelectItem value="$500-1000">$500-1000</SelectItem>
                  <SelectItem value="$1000-2000">$1000-2000</SelectItem>
                  <SelectItem value="$2000+">$2000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-muted border-border/50" rows={2} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gold hover:bg-gold-light text-background">
              {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Request Bottle Service'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}
