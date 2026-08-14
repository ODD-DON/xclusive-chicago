'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
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
  Clock,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { Event, Club } from '@/lib/types'
import { computeAccessStatus, remainingPasses, ACCESS_STATUS_LABELS, effectiveCutoffTime } from '@/lib/access-status'

interface EventsContentProps {
  events: (Event & { club: Club | null })[]
  pastEvents: (Event & { club: Club | null })[]
  clubs: Club[]
  requestCounts: Record<string, number>
  approvedCounts: Record<string, number>
  todayStr: string
}

interface ReviewForm {
  title: string
  eventDate: string
  eventTime: string
  cutoffTime: string
  imageUrl: string
  description: string
  clubId: string
  ticketUrl: string
  tablesUrl: string
  sourceUrl: string
  sourcePlatform: string
  scrapedVenueName: string
  scrapedVenueAddress: string
  allocation: string
  releaseNumber: string
  approvalMode: 'auto' | 'manual'
  waitlistEnabled: boolean
  featured: boolean
  memberOnly: boolean
  vipOnly: boolean
  announcementText: string
  accessStatusOverride: string
  useVenueBranding: boolean
}

const emptyReviewForm: ReviewForm = {
  title: '',
  eventDate: '',
  eventTime: '',
  cutoffTime: '',
  imageUrl: '',
  description: '',
  clubId: '',
  ticketUrl: '',
  tablesUrl: '',
  sourceUrl: '',
  sourcePlatform: '',
  scrapedVenueName: '',
  scrapedVenueAddress: '',
  allocation: '',
  releaseNumber: '1',
  approvalMode: 'auto',
  waitlistEnabled: false,
  featured: false,
  memberOnly: false,
  vipOnly: false,
  announcementText: '',
  accessStatusOverride: '',
  useVenueBranding: false,
}

export function EventsContent({
  events: initialEvents,
  pastEvents: initialPastEvents,
  clubs,
  requestCounts,
  approvedCounts,
  todayStr,
}: EventsContentProps) {
  const router = useRouter()
  const [events, setEvents] = useState([...initialEvents, ...initialPastEvents])
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
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
      cutoffTime: event.cutoff_time ? event.cutoff_time.slice(0, 5) : '',
      imageUrl: event.image_url || '',
      description: event.description || '',
      clubId: event.club_id || '',
      ticketUrl: event.ticket_url || '',
      tablesUrl: event.tables_url || '',
      sourceUrl: event.source_url || '',
      sourcePlatform: event.source_platform || '',
      scrapedVenueName: event.scraped_venue_name || '',
      scrapedVenueAddress: event.scraped_venue_address || '',
      allocation: event.allocation != null ? String(event.allocation) : '',
      releaseNumber: String(event.release_number || 1),
      approvalMode: event.approval_mode || 'auto',
      waitlistEnabled: !!event.waitlist_enabled,
      featured: !!event.featured,
      memberOnly: !!event.member_only,
      vipOnly: !!event.vip_only,
      announcementText: event.announcement_text || '',
      accessStatusOverride: event.access_status_override || '',
      useVenueBranding: !!event.use_venue_branding,
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
      const matchedClub = matchedClubId ? clubs.find((c) => c.id === matchedClubId) : null

      setForm({
        title: scraped.name || '',
        eventDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        eventTime: startDate ? format(startDate, 'HH:mm') : '',
        cutoffTime: matchedClub?.default_cutoff_time ? matchedClub.default_cutoff_time.slice(0, 5) : '',
        imageUrl: scraped.image || '',
        description: scraped.description || '',
        clubId: matchedClubId || '',
        ticketUrl: scraped.ticketUrl || '',
        tablesUrl: '',
        sourceUrl: scraped.sourceUrl || '',
        sourcePlatform: scraped.sourcePlatform || '',
        scrapedVenueName: scraped.venueName || '',
        scrapedVenueAddress: scraped.venueAddress || '',
        allocation: '',
        releaseNumber: '1',
        approvalMode: 'auto',
        waitlistEnabled: false,
        featured: false,
        memberOnly: false,
        vipOnly: false,
        announcementText: '',
        accessStatusOverride: '',
        useVenueBranding: false,
      })
      setHasFetched(true)
      toast.success('Event details pulled in, review before saving')
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
      cutoff_time: form.cutoffTime ? `${form.cutoffTime}:00` : null,
      image_url: form.imageUrl || null,
      description: form.description || null,
      ticket_url: form.ticketUrl || null,
      tables_url: form.tablesUrl || null,
      source_url: form.sourceUrl || null,
      source_platform: form.sourcePlatform || null,
      scraped_venue_name: form.scrapedVenueName || null,
      scraped_venue_address: form.scrapedVenueAddress || null,
      allocation: form.allocation ? parseInt(form.allocation, 10) : null,
      release_number: parseInt(form.releaseNumber, 10) || 1,
      approval_mode: form.approvalMode,
      waitlist_enabled: form.waitlistEnabled,
      featured: form.featured,
      member_only: form.memberOnly,
      vip_only: form.vipOnly,
      announcement_text: form.announcementText || null,
      access_status_override: form.accessStatusOverride || null,
      use_venue_branding: form.useVenueBranding,
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
    const count = requestCounts[event.id] || 0
    if (count > 0) {
      toast.error(`Cannot delete event with ${count} access requests`)
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

  // Split into upcoming/past by the (Chicago-local) server-computed today,
  // then group the visible tab's events by date
  const visibleEvents = events.filter((e) => (tab === 'upcoming' ? e.event_date >= todayStr : e.event_date < todayStr))

  const eventsByDate: Record<string, (Event & { club: Club | null })[]> = {}
  visibleEvents.forEach((event) => {
    const date = event.event_date
    if (!eventsByDate[date]) eventsByDate[date] = []
    eventsByDate[date].push(event)
  })
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => (tab === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a)))

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

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'upcoming' | 'past')}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {visibleEvents.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {tab === 'upcoming' ? 'No upcoming events' : 'No past events yet'}
            </p>
            {tab === 'upcoming' && (
              <Button onClick={openDialog} variant="outline">
                Add your first event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dateEvents = eventsByDate[date]
            const dateObj = parseISO(date)
            const isToday = date === todayStr

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
                    const regCount = requestCounts[event.id] || 0
                    const approvedCount = approvedCounts[event.id] || 0
                    const cutoffTime = effectiveCutoffTime(event, event.club)
                    const status = computeAccessStatus({ ...event, cutoff_time: cutoffTime }, approvedCount)
                    const remaining = remainingPasses(event, approvedCount)
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
                                  <Badge variant="outline" className="text-xs">
                                    {ACCESS_STATUS_LABELS[status]}
                                  </Badge>
                                  {event.use_venue_branding && (
                                    <Badge variant="outline" className="text-xs border-gold/30 text-gold">
                                      Venue Branding
                                    </Badge>
                                  )}
                                  {cutoffTime && (
                                    <Badge variant="outline" className="text-xs border-gold/30 text-gold">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Free until {formatShortTime(cutoffTime)}
                                      {!event.cutoff_time && event.club?.default_cutoff_time && ' (venue default)'}
                                    </Badge>
                                  )}
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
                                      {remaining != null ? ` · ${remaining} remaining` : ''}
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
        <DialogContent className="max-h-[85dvh] overflow-y-auto overflow-x-hidden">
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
  const selectedClub = clubs.find((c) => c.id === form.clubId)
  const selectedClubPhotos = selectedClub
    ? ([selectedClub.image_url, ...(selectedClub.gallery_urls || [])].filter(Boolean) as string[])
    : []

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
        <Label>Complimentary Access Cutoff (optional)</Label>
        <Input
          type="time"
          value={form.cutoffTime}
          onChange={(e) => setForm({ ...form, cutoffTime: e.target.value })}
          className="bg-muted border-border/50"
        />
        <p className="text-xs text-muted-foreground">Members using this access get in complimentary before this time</p>
      </div>

      <div className="space-y-2">
        <Label>
          Venue
          {form.scrapedVenueName && !form.clubId && (
            <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/30">
              scraped as "{form.scrapedVenueName}", no match found
            </Badge>
          )}
        </Label>
        <Select
          value={form.clubId}
          onValueChange={(value) => {
            const club = clubs.find((c) => c.id === value)
            setForm({
              ...form,
              clubId: value,
              // Auto-fill from the venue's standing rule, but never clobber
              // a cutoff the admin already typed in for this event.
              cutoffTime:
                !form.cutoffTime && club?.default_cutoff_time ? club.default_cutoff_time.slice(0, 5) : form.cutoffTime,
            })
          }}
        >
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

      {selectedClub && (
        <label className="flex items-start justify-between gap-3 text-sm bg-card border border-border/50 rounded-lg p-3 cursor-pointer">
          <div>
            <span className="font-medium">Use Venue Info</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              For generic recurring nights with no unique flyer. Shows {selectedClub.name}&apos;s cover photo and
              name instead of this event&apos;s title/image, so the pitch reads as &quot;access to this club&quot;
              rather than &quot;access to this specific night.&quot;
            </p>
          </div>
          <Switch
            checked={form.useVenueBranding}
            onCheckedChange={(v) =>
              setForm({
                ...form,
                useVenueBranding: v,
                imageUrl: v && selectedClub.image_url ? selectedClub.image_url : form.imageUrl,
              })
            }
          />
        </label>
      )}

      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="Paste the event flyer URL, or pick a venue photo below"
          className="bg-muted border-border/50"
        />
        {selectedClubPhotos.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-muted-foreground">Or use a venue photo</p>
            <div className="flex gap-2 overflow-x-auto">
              {selectedClubPhotos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: photo })}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    form.imageUrl === photo ? 'border-gold' : 'border-transparent hover:border-border'
                  }`}
                >
                  <Image src={photo} alt={`Venue photo ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
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
        <Label>Bottle Service / Tables link (optional)</Label>
        <Input
          value={form.tablesUrl}
          onChange={(e) => setForm({ ...form, tablesUrl: e.target.value })}
          className="bg-muted border-border/50"
        />
        <p className="text-xs text-muted-foreground">
          If the venue has its own tables/bottle-service booking link, the guest "Bottle Service" button will send guests there instead of the built-in request form
        </p>
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

      <div className="pt-2 border-t border-border/30">
        <h4 className="text-sm font-medium mb-3">Access Settings</h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Allocation (optional)</Label>
            <Input
              type="number"
              min="0"
              placeholder="Uncapped"
              value={form.allocation}
              onChange={(e) => setForm({ ...form, allocation: e.target.value })}
              className="bg-muted border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Release Number</Label>
            <Input
              type="number"
              min="1"
              value={form.releaseNumber}
              onChange={(e) => setForm({ ...form, releaseNumber: e.target.value })}
              className="bg-muted border-border/50"
            />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <Label>Approval</Label>
          <Select
            value={form.approvalMode}
            onValueChange={(value: 'auto' | 'manual') => setForm({ ...form, approvalMode: value })}
          >
            <SelectTrigger className="bg-muted border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automatically approve access</SelectItem>
              <SelectItem value="manual">Manually approve access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 mb-4">
          <Label>Access Status Override (optional)</Label>
          <Select
            value={form.accessStatusOverride || 'auto'}
            onValueChange={(value) => setForm({ ...form, accessStatusOverride: value === 'auto' ? '' : value })}
          >
            <SelectTrigger className="bg-muted border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (based on allocation)</SelectItem>
              <SelectItem value="ACCESS_OPEN">Access Open</SelectItem>
              <SelectItem value="LIMITED_ACCESS">Limited Access</SelectItem>
              <SelectItem value="FINAL_RELEASE">Final Access</SelectItem>
              <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
              <SelectItem value="WAITLIST">Waitlist</SelectItem>
              <SelectItem value="ACCESS_CLOSED">Access Closed</SelectItem>
              <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 mb-4">
          <Label>Announcement Text (optional)</Label>
          <Input
            placeholder="e.g. Members get first access to this one"
            value={form.announcementText}
            onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
            className="bg-muted border-border/50"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>Waitlist when sold out</span>
            <Switch checked={form.waitlistEnabled} onCheckedChange={(v) => setForm({ ...form, waitlistEnabled: v })} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Featured</span>
            <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Member only</span>
            <Switch checked={form.memberOnly} onCheckedChange={(v) => setForm({ ...form, memberOnly: v })} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>VIP only</span>
            <Switch checked={form.vipOnly} onCheckedChange={(v) => setForm({ ...form, vipOnly: v })} />
          </label>
        </div>
      </div>
    </div>
  )
}

function formatShortTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return minutes === 0 ? `${hour12}${ampm}` : `${hour12}:${minutes.toString().padStart(2, '0')}${ampm}`
}
