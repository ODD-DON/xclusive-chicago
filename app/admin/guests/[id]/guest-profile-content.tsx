'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Phone,
  Mail,
  Instagram,
  Copy,
  Check,
  X,
  Clock,
  Wine,
  Sparkles,
  Users,
  MessageSquare,
  Pencil,
  Trash2,
  Globe,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
  Ticket,
  Bus,
  Ship,
  PartyPopper,
  DollarSign,
  MapPin,
  Calendar,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { AccessRequest, Member, VipInquiry, ExperienceInquiry } from '@/lib/types'

interface Props {
  phone: string
  member: Member | null
  accessRequests: AccessRequest[]
  vipInquiries: VipInquiry[]
  experienceInquiries: ExperienceInquiry[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-500',
  approved: 'bg-green-500/20 text-green-500',
  waitlisted: 'bg-muted text-muted-foreground',
  denied: 'bg-red-500/20 text-red-500',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  party_bus: 'Party Bus',
  boat_day: 'Boat Day',
}

const EXPERIENCE_ICONS: Record<string, typeof Bus> = {
  party_bus: Bus,
  boat_day: Ship,
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

function copyToClipboard(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error('Could not copy'))
}

function formatDetailKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function formatDetailValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value == null || value === '') return '—'
  return String(value)
}

export function GuestProfileContent({
  phone,
  member: initialMember,
  accessRequests: initialRequests,
  vipInquiries,
  experienceInquiries,
}: Props) {
  const router = useRouter()
  const [member, setMember] = useState(initialMember)
  const [requests, setRequests] = useState(initialRequests)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [form, setForm] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    phone: member?.phone || phone,
    email: member?.email || '',
    instagram: member?.instagram || '',
  })

  // Everyone shares a phone number even when there's no xc_members row (a
  // guest who only ever submitted a VIP or experience inquiry) -- fall back
  // to whichever source actually has their name/contact info.
  const fallbackSource = vipInquiries[0] || experienceInquiries[0]
  const displayName = member
    ? `${member.first_name} ${member.last_name}`
    : fallbackSource
      ? `${fallbackSource.first_name} ${fallbackSource.last_name}`
      : formatPhone(phone)
  const displayEmail = member?.email || fallbackSource?.email || null
  const displayInstagram = member?.instagram || fallbackSource?.instagram || null

  const isBachelorette =
    requests.some((r) => r.celebration_type === 'Bachelorette') ||
    vipInquiries.some((i) => i.celebration_type === 'Bachelorette') ||
    experienceInquiries.some((i) => (i.details as Record<string, unknown> | null)?.celebrationType === 'Bachelorette')

  const openEdit = () => {
    if (!member) return
    setForm({
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone,
      email: member.email || '',
      instagram: member.instagram || '',
    })
    setIsEditOpen(true)
  }

  const saveEdit = async () => {
    if (!member) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, ...form }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update guest')
      setMember(data.member)
      setIsEditOpen(false)
      toast.success('Guest updated')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update guest')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteMember = async () => {
    if (!member) return
    if (!confirm(`Delete ${member.first_name} ${member.last_name}? This can't be undone.`)) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/members?id=${member.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete guest')
      toast.success('Guest deleted')
      router.push('/admin/guests')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete guest')
      setIsDeleting(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!response.ok) throw new Error('Failed to update')
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as AccessRequest['status'] } : r)))
      toast.success(`Marked ${status}`)
      router.refresh()
    } catch {
      toast.error('Failed to update request')
    }
  }

  const approvedCount = requests.filter((r) => r.status === 'approved').length
  const bottleInterestCount =
    requests.filter((r) => r.bottle_service_interest).length + vipInquiries.length
  const allDates = [
    ...requests.map((r) => r.requested_at),
    ...vipInquiries.map((i) => i.created_at),
    ...experienceInquiries.map((i) => i.created_at),
    ...(member ? [member.created_at] : []),
  ]
  const firstSeen = allDates.length ? allDates.reduce((earliest, d) => (d < earliest ? d : earliest)) : null

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/admin/guests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Guests
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-light mb-1 flex items-center gap-2 flex-wrap">
            {displayName}
            {isBachelorette && (
              <Badge className="bg-gold/20 text-gold border-0">
                <PartyPopper className="w-3 h-3 mr-1" />
                Bachelorette
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            {member ? (
              <>
                Member since {format(new Date(member.created_at), 'MMMM d, yyyy')} &middot; Joined via{' '}
                {member.source || 'unknown'}
              </>
            ) : (
              'No guestlist signup yet -- known from VIP/experience inquiries only'
            )}
          </p>
        </div>
        {member && (
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="capitalize">{member.member_status}</Badge>
            <Button size="sm" variant="outline" onClick={openEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={deleteMember}
              disabled={isDeleting || requests.length > 0}
              title={requests.length > 0 ? "Can't delete a guest with request history" : undefined}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{formatPhone(phone)}</span>
            </div>
            <div className="flex items-center gap-1">
              <a href={`sms:${phone}`} className="p-1 text-gold hover:text-gold-light transition-colors" title="Text">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a href={`tel:${phone}`} className="p-1 text-gold hover:text-gold-light transition-colors" title="Call">
                <Phone className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(phone, 'Phone')}
                className="p-1 text-muted-foreground hover:text-gold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {displayEmail && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{displayEmail}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(displayEmail, 'Email')}
                className="p-1 text-muted-foreground hover:text-gold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {displayInstagram && (
            <div className="flex items-center justify-between gap-2">
              <a
                href={`https://instagram.com/${displayInstagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-gold hover:underline"
              >
                <Instagram className="w-4 h-4" />
                <span>@{displayInstagram.replace(/^@/, '')}</span>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(`@${displayInstagram.replace(/^@/, '')}`, 'Handle')}
                className="p-1 text-muted-foreground hover:text-gold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {member && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
              <Badge variant="outline" className={member.sms_consent ? 'border-green-500/30 text-green-500' : 'text-muted-foreground'}>
                <MessageSquare className="w-3 h-3 mr-1" />
                SMS {member.sms_consent ? 'opted in' : 'not opted in'}
              </Badge>
              <Badge variant="outline" className={member.email_consent ? 'border-green-500/30 text-green-500' : 'text-muted-foreground'}>
                <Mail className="w-3 h-3 mr-1" />
                Email {member.email_consent ? 'opted in' : 'not opted in'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Guestlist Requests" value={requests.length} />
        <StatTile label="Approved" value={approvedCount} tone="text-green-500" />
        <StatTile label="Bottle Interest" value={bottleInterestCount} tone="text-gold" />
        <StatTile label="First Seen" value={firstSeen ? format(new Date(firstSeen), 'MMM d, yyyy') : '—'} isText />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5" />
          Guestlist History ({requests.length})
        </p>
        {requests.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">No guestlist requests yet</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const rsvpNotStarted = req.status === 'approved' && !req.rsvp_completed_at
              const rsvpOpened = req.status === 'approved' && !!req.rsvp_completed_at
              return (
                <Card key={req.id} className="bg-card border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium">{req.event?.title || 'Unknown event'}</p>
                          <Badge className={`${STATUS_STYLES[req.status]} border-0`}>{req.status}</Badge>
                          {rsvpNotStarted && (
                            <Badge className="border-0 bg-amber-500/20 text-amber-500">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              RSVP not started
                            </Badge>
                          )}
                          {rsvpOpened && (
                            <Badge
                              className="border-0 bg-blue-500/20 text-blue-400"
                              title="They clicked the RSVP link -- we have no way to confirm they finished it"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              RSVP link opened
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {req.event?.club?.name}
                          {req.event?.event_date && ` · ${format(parseISO(req.event.event_date), 'MMM d, yyyy')}`}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {req.guest_count} {req.guest_count === 1 ? 'guest' : 'guests'}
                          </span>
                          {req.celebration_type && (
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {req.celebration_type === 'Other' ? req.celebration_other : req.celebration_type}
                            </span>
                          )}
                          {req.bottle_service_interest && (
                            <span className="flex items-center gap-1 text-gold">
                              <Wine className="w-3 h-3" />
                              Bottle service interest
                            </span>
                          )}
                          {req.visitor_city && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {req.visitor_city}
                              {req.visitor_region ? `, ${req.visitor_region}` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Requested {format(new Date(req.requested_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => updateStatus(req.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'denied')}>
                            <X className="w-4 h-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Wine className="w-3.5 h-3.5" />
          VIP Inquiries ({vipInquiries.length})
        </p>
        {vipInquiries.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">No VIP inquiries yet</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {vipInquiries.map((inq) => (
              <Card key={inq.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {inq.party_size && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {inq.party_size} people
                      </span>
                    )}
                    {inq.budget && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {inq.budget}
                      </span>
                    )}
                    {inq.target_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {inq.target_date}
                      </span>
                    )}
                    {inq.venue_preference && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {inq.venue_preference}
                      </span>
                    )}
                    {(inq.home_city || inq.visitor_city) && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {inq.home_city || inq.visitor_city}
                        {!inq.home_city && ' (detected)'}
                      </span>
                    )}
                    {inq.celebration_type && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {inq.celebration_type === 'Other' ? inq.celebration_other : inq.celebration_type}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(inq.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  {inq.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">{inq.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Bus className="w-3.5 h-3.5" />
          Experience Inquiries ({experienceInquiries.length})
        </p>
        {experienceInquiries.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">No Party Bus / Boat Day inquiries yet</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {experienceInquiries.map((inq) => {
              const Icon = EXPERIENCE_ICONS[inq.experience_type] || Bus
              const details = inq.details || {}
              const detailEntries = Object.entries(details).filter(([, v]) => v != null && v !== '')
              return (
                <Card key={inq.id} className="bg-card border-border/50">
                  <CardContent className="p-4">
                    <Badge className="bg-gold/20 text-gold border-0 mb-2">
                      <Icon className="w-3 h-3 mr-1" />
                      {EXPERIENCE_LABELS[inq.experience_type] || inq.experience_type}
                    </Badge>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {inq.group_size != null && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {inq.group_size} people
                        </span>
                      )}
                      {inq.preferred_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {inq.preferred_date}
                          {inq.flexible_dates ? ' (flexible)' : ''}
                        </span>
                      )}
                      {inq.departure_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Departs: {inq.departure_location}
                        </span>
                      )}
                      {inq.visitor_city && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {inq.visitor_city} (detected)
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(inq.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    {detailEntries.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-3 bg-muted/40 rounded-lg p-3">
                        {detailEntries.map(([key, value]) => (
                          <div key={key} className="text-muted-foreground">
                            <span className="text-foreground">{formatDetailKey(key)}:</span> {formatDetailValue(value)}
                          </div>
                        ))}
                      </div>
                    )}
                    {inq.special_requests && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-muted-foreground">{inq.special_requests}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {member && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editInstagram">Instagram</Label>
                <Input
                  id="editInstagram"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@handle"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={isSaving} className="bg-gold hover:bg-gold-light text-background">
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function StatTile({ label, value, tone, isText }: { label: string; value: number | string; tone?: string; isText?: boolean }) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`${isText ? 'text-sm' : 'text-2xl'} font-light ${tone || ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
