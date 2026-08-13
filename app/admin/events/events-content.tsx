'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format, parseISO, isSameDay } from 'date-fns'
import {
  Plus,
  Calendar,
  Users,
  Clock,
  RefreshCw,
  MoreVertical,
  Trash2,
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
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { Event, Club } from '@/lib/types'

interface EventsContentProps {
  events: (Event & { club: Club })[]
  clubs: Club[]
  registrationCounts: Record<string, number>
}

export function EventsContent({
  events: initialEvents,
  clubs,
  registrationCounts,
}: EventsContentProps) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    clubId: '',
    eventDate: '',
    unlockTime: '21:00',
    cutoffTime: '23:30',
  })

  const generateEvents = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/admin/events/generate', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate events')
      }

      toast.success(`Generated ${data.created} new events`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clubId || !form.eventDate) {
      toast.error('Please select a club and date')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: form.clubId,
          event_date: form.eventDate,
          unlock_time: form.unlockTime + ':00',
          cutoff_time: form.cutoffTime + ':00',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      toast.success('Event created')
      setIsDialogOpen(false)
      setForm({ clubId: '', eventDate: '', unlockTime: '21:00', cutoffTime: '23:30' })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create')
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
  const eventsByDate: Record<string, (Event & { club: Club })[]> = {}
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
          <p className="text-muted-foreground">Manage upcoming event dates</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={generateEvents}
            disabled={isGenerating}
            variant="outline"
            className="border-border/50"
          >
            {isGenerating ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Generate 8 Weeks
          </Button>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gold hover:bg-gold-light text-background"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No upcoming events</p>
            <Button onClick={generateEvents} variant="outline" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate from schedules'}
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
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-medium">{event.club?.name}</h3>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      event.is_active
                                        ? 'bg-green-500/20 text-green-500'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {event.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  {event.cutoff_time && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>
                                        Until {formatTime(event.cutoff_time)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>
                                      {regCount} {regCount === 1 ? 'guest' : 'guests'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Toggle Switch */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${event.is_active ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    {event.is_active ? 'Open' : 'Closed'}
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

      {/* Create Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Club</Label>
              <Select
                value={form.clubId}
                onValueChange={(value) => setForm({ ...form, clubId: value })}
              >
                <SelectTrigger className="bg-muted border-border/50">
                  <SelectValue placeholder="Select club" />
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
              <Label>Date</Label>
              <Input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="bg-muted border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unlock Time</Label>
                <Input
                  type="time"
                  value={form.unlockTime}
                  onChange={(e) => setForm({ ...form, unlockTime: e.target.value })}
                  className="bg-muted border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Cutoff Time</Label>
                <Input
                  type="time"
                  value={form.cutoffTime}
                  onChange={(e) => setForm({ ...form, cutoffTime: e.target.value })}
                  className="bg-muted border-border/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
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
                {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}
