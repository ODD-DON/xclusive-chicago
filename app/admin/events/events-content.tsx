'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { format, parseISO, isSameDay } from 'date-fns'
import {
  Plus,
  Calendar,
  Users,
  Link2,
  MoreVertical,
  Trash2,
  Pencil,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Event, Club } from '@/lib/types'

interface EventsContentProps {
  events: (Event & { club: Club | null })[]
  clubs: Club[]
  registrationCounts: Record<string, number>
}

interface ReviewForm {
  title: string
  eventDate: string
  eventTime: string
  imageUrl: string
  description: string
  clubId: string
  ticketUrl: string
  sourceUrl: string
  sourcePlatform: string
  scrapedVenueName: string
  scrapedVenueAddress: string
}

const emptyReviewForm: ReviewForm = {
  title: '',
  eventDate: '',
  eventTime: '',
  imageUrl: '',
  description: '',
  clubId: '',
  ticketUrl: '',
  sourceUrl: '',
  sourcePlatform: '',
  scrapedVenueName: '',
  scrapedVenueAddress: '',
}

export function EventsContent({
  events: initialEvents,
  clubs,
  registrationCounts,
}: EventsContentProps) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mode, setMode] = useState<'link' | 'manual'>('link')
  const [linkUrl, setLinkUrl] = useState('')
  const [isFetchingLink, setIsFetchingLink] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<ReviewForm>(emptyReviewForm)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const resetDialog = () => {
    setMode('link')
    setLinkUrl('')
    setHasFetched(false)
    setForm(emptyReviewForm)
    setEditingEventId(null)
  }

  const openDialog = () => {
    resetDialog()
    setIsDialogOpen(true)
  }

  const openEditDialog = (event: Event & { club: Club | null }) => {
    setMode('manual')
    setLinkUrl('')
    setForm({
      title: event.title || '',
      eventDate: event.event_date,
      eventTime: event.unlock_time ? event.unlock_time.slice(0, 5) : '',
      imageUrl: event.image_url || '',
      description: event.description || '',
      clubId: event.club_id || '',
      ticketUrl: event.ticket_url || '',
      sourceUrl: event.source_url || '',
      sourcePlatform: event.source_platform || '',
      scrapedVenueName: event.scraped_venue_name || '',
      scrapedVenueAddress: event.scraped_venue_address || '',
    })
    setHasFetched(true)
    setEditingEventId(event.id)
    setIsDialogOpen(true)
  }

  const fetchLinkDetails = async () => {
    if (!linkUrl.trim()) {
      toast.error('Paste an event link first')
      return
    }

    setIsFetchingLink(true)
    try {
      const response = await fetch('/api/admin/events/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch event details')
      }

      const { scraped, matchedClubId } = data
      const startDate = scraped.startDate ? new Date(scraped.startDate) : null

      setForm({
        title: scraped.name || '',
        eventDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        eventTime: startDate ? format(startDate, 'HH:mm') : '',
        imageUrl: scraped.image || '',
        description: scraped.description || '',
        clubId: matchedClubId || '',
        ticketUrl: scraped.ticketUrl || '',
        sourceUrl: scraped.sourceUrl || '',
        sourcePlatform: scraped.sourcePlatform || '',
        scrapedVenueName: scraped.venueName || '',
        scrapedVenueAddress: scraped.venueAddress || '',
      })
      setHasFetched(true)
      toast.success('Event details pulled in — review before saving')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch event details')
    } finally {
      setIsFetchingLink(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim() || !form.eventDate) {
      toast.error('Name and date are required')
      return
    }

    setIsSubmitting(true)

    const payload = {
      title: form.title.trim(),
      club_id: form.clubId || null,
      event_date: form.eventDate,
      unlock_time: form.eventTime ? `${form.eventTime}:00` : null,
      image_url: form.imageUrl || null,
      description: form.description || null,
      ticket_url: form.ticketUrl || null,
      source_url: form.sourceUrl || null,
      source_platform: form.sourcePlatform || null,
      scraped_venue_name: form.scrapedVenueName || null,
      scraped_venue_address: form.scrapedVenueAddress || null,
    }

    try {
      const response = editingEventId
        ? await fetch('/api/admin/events', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingEventId, ...payload }),
          })
        : await fetch('/api/admin/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save event')
      }

      toast.success(editingEventId ? 'Event updated' : 'Event added')
      setIsDialogOpen(false)
      resetDialog()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleActive = async (event: Event) => {
    try {
      const response = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          is_active: !event.is_active,
        }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, is_active: !e.is_active } : e
        )
      )
      toast.success(event.is_active ? 'Event deactivated' : 'Event activated')
    } catch {
      toast.error('Failed to update event')
    }
  }

  const deleteEvent = async (event: Event) => {
    const count = registrationCounts[event.id] || 0
    if (count > 0) {
      toast.error(`Cannot delete event with ${count} registrations`)
      return
    }

    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/admin/events?id=${event.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      toast.success('Event deleted')
    } catch {
      toast.error('Failed to delete event')
    }
  }

  // Group events by date
  const eventsByDate: Record<string, (Event & { club: Club | null })[]> = {}
  events.forEach((event) => {
    const date = event.event_date
    if (!eventsByDate[date]) eventsByDate[date] = []
    eventsByDate[date].push(event)
  })

  // Use state for today to avoid hydration mismatch
  const [today] = useState(() => new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-light mb-2">Events</h1>
          <p className="text-muted-foreground">Paste a ticket link each week to add an event</p>
        </div>
        <Button onClick={openDialog} className="bg-gold hover:bg-gold-light text-background">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No upcoming events</p>
            <Button onClick={openDialog} variant="outline">
              Add your first event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(eventsByDate).map(([date, dateEvents]) => {
            const dateObj = parseISO(date)
            const isToday = isSameDay(dateObj, today)

            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-medium">
                    {format(dateObj, 'EEEE, MMMM d')}
                  </h2>
                  {isToday && (
                    <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full">
                      Tonight
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  {dateEvents.map((event) => {
                    const regCount = registrationCounts[event.id] || 0
                    const thumbnail = event.image_url || event.club?.image_url
                    const venueName = event.club?.name || event.scraped_venue_name

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card
                          className={`bg-card border-border/50 ${
                            !event.is_active ? 'opacity-60' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {thumbnail && (
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                                  <Image src={thumbnail} alt={event.title || 'Event'} fill className="object-cover" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-medium truncate">{event.title}</h3>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      event.is_active
                                        ? 'bg-green-500/20 text-green-500'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {event.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                  {!event.club_id && (
                                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Needs venue match
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  {venueName && <span>{venueName}</span>}
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>
                                      {regCount} {regCount === 1 ? 'request' : 'requests'}
                                    </span>
                                  </div>
                                  {event.ticket_url && (
                                    <a
                                      href={event.ticket_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 hover:text-gold transition-colors"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>Ticket link</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${event.is_active ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    {event.is_active ? 'Shown' : 'Hidden'}
                                  </span>
                                  <Switch
                                    checked={event.is_active}
                                    onCheckedChange={() => toggleActive(event)}
                                    className="data-[state=checked]:bg-green-500"
                                  />
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditDialog(event)}>
                                      <Pencil className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => deleteEvent(event)}
                                      className="text-destructive"
                                      disabled={regCount > 0}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEventId ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>

          {mode === 'link' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event link</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://link.dice.fm/... or https://speakeasygo.com/event/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="bg-muted border-border/50"
                  />
                  <Button type="button" onClick={fetchLinkDetails} disabled={isFetchingLink}>
                    {isFetchingLink ? <Spinner className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('manual')
                    setHasFetched(true)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Skip the link, enter manually
                </button>
              </div>

              {hasFetched && (
                <ReviewFields
                  form={form}
                  setForm={setForm}
                  clubs={clubs}
                  imagePreview={mode === 'link'}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <ReviewFields form={form} setForm={setForm} clubs={clubs} imagePreview={false} />
              <button
                type="button"
                onClick={() => {
                  setMode('link')
                  setHasFetched(false)
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Use a link instead
              </button>
            </div>
          )}

          {hasFetched && (
            <form onSubmit={handleSubmit} className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gold hover:bg-gold-light text-background"
              >
                {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Save Event'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReviewFields({
  form,
  setForm,
  clubs,
  imagePreview,
}: {
  form: ReviewForm
  setForm: (form: ReviewForm) => void
  clubs: Club[]
  imagePreview: boolean
}) {
  return (
    <div className="space-y-4">
      {imagePreview && form.imageUrl && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
          <Image src={form.imageUrl} alt={form.title} fill className="object-cover" />
        </div>
      )}

      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="bg-muted border-border/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            className="bg-muted border-border/50"
          />
        </div>
        <div className="space-y-2">
          <Label>Doors / Start Time</Label>
          <Input
            type="time"
            value={form.eventTime}
            onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
            className="bg-muted border-border/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Venue
          {form.scrapedVenueName && !form.clubId && (
            <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/30">
              scraped as "{form.scrapedVenueName}" — no match found
            </Badge>
          )}
        </Label>
        <Select value={form.clubId} onValueChange={(value) => setForm({ ...form, clubId: value })}>
          <SelectTrigger className="bg-muted border-border/50">
            <SelectValue placeholder="Select a club (or leave unmatched for now)" />
          </SelectTrigger>
          <SelectContent>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className="bg-muted border-border/50"
        />
      </div>

      <div className="space-y-2">
        <Label>Ticket / RSVP link</Label>
        <Input
          value={form.ticketUrl}
          onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })}
          className="bg-muted border-border/50"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="bg-muted border-border/50"
          rows={3}
        />
      </div>
    </div>
  )
}
