'use client'

import { format, parseISO } from 'date-fns'
import {
  PartyPopper,
  Phone,
  MessageCircle,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Instagram,
  MapPin,
  Wine,
  Ticket,
  Bus,
  Ship,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AccessRequestRow {
  id: string
  guest_count: number
  status: string
  requested_at: string
  member: {
    first_name: string
    last_name: string
    phone: string
    email: string | null
    instagram: string | null
  } | null
  event: {
    title: string | null
    event_date: string
    club: { name: string } | null
  } | null
}

interface VipInquiryRow {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  instagram: string | null
  target_date: string | null
  party_size: number | null
  budget: string | null
  venue_preference: string | null
  notes: string | null
  created_at: string
}

interface ExperienceInquiryRow {
  id: string
  experience_type: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  instagram: string | null
  preferred_date: string | null
  group_size: number | null
  special_requests: string | null
  created_at: string
}

interface Props {
  accessRequests: AccessRequestRow[]
  vipInquiries: VipInquiryRow[]
  experienceInquiries: ExperienceInquiryRow[]
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

// Phone number with one-tap call and text actions -- the actual point of
// flagging a high-incentive lead is being able to reach them immediately.
function ContactActions({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, '')
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Phone className="w-4 h-4" />
        {formatPhone(phone)}
      </span>
      <a href={`sms:${digits}`} className="flex items-center gap-1 text-gold hover:underline" title="Text">
        <MessageCircle className="w-3.5 h-3.5" />
        Text
      </a>
      <a href={`tel:${digits}`} className="flex items-center gap-1 text-gold hover:underline" title="Call">
        <Phone className="w-3.5 h-3.5" />
        Call
      </a>
    </div>
  )
}

export function BacheloretteContent({ accessRequests, vipInquiries, experienceInquiries }: Props) {
  const total = accessRequests.length + vipInquiries.length + experienceInquiries.length

  const combined = [
    ...accessRequests.map((r) => ({ type: 'guestlist' as const, date: r.requested_at, data: r })),
    ...vipInquiries.map((i) => ({ type: 'vip' as const, date: i.created_at, data: i })),
    ...experienceInquiries.map((e) => ({ type: 'experience' as const, date: e.created_at, data: e })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light mb-2 flex items-center gap-2">
          <PartyPopper className="w-6 h-6 text-gold" />
          Bachelorette Parties
        </h1>
        <p className="text-muted-foreground">
          Every guestlist RSVP and VIP table inquiry tagged as a bachelorette, all in one place — your
          highest-incentive leads.
        </p>
      </div>

      {total === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <PartyPopper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bachelorette parties yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {combined.map((item) => {
            if (item.type === 'guestlist') return <AccessRequestCard key={`ar-${item.data.id}`} request={item.data} />
            if (item.type === 'vip') return <VipInquiryCard key={`vip-${item.data.id}`} inquiry={item.data} />
            return <ExperienceInquiryCard key={`exp-${item.data.id}`} inquiry={item.data} />
          })}
        </div>
      )}
    </div>
  )
}

function AccessRequestCard({ request }: { request: AccessRequestRow }) {
  const member = request.member
  if (!member) return null

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-medium text-lg">
                {member.first_name} {member.last_name}
              </h3>
              <Badge className="bg-gold/20 text-gold border-0">
                <Ticket className="w-3 h-3 mr-1" />
                Guestlist RSVP
              </Badge>
              <Badge variant="outline" className="capitalize">
                {request.status}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <ContactActions phone={member.phone} />
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {member.email}
                </a>
              )}
              {member.instagram && (
                <a
                  href={`https://instagram.com/${member.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-gold hover:underline"
                >
                  <Instagram className="w-4 h-4" />@{member.instagram.replace(/^@/, '')}
                </a>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                {request.guest_count} people
              </div>
              {request.event && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {request.event.club?.name}
                  {' - '}
                  {request.event.event_date
                    ? format(parseISO(request.event.event_date), 'EEE, MMM d')
                    : 'N/A'}
                </div>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p>Requested</p>
            <p>{format(new Date(request.requested_at), 'MMM d, h:mm a')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function VipInquiryCard({ inquiry }: { inquiry: VipInquiryRow }) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-medium text-lg">
                {inquiry.first_name} {inquiry.last_name}
              </h3>
              <Badge className="bg-gold/20 text-gold border-0">
                <Wine className="w-3 h-3 mr-1" />
                VIP Table
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <ContactActions phone={inquiry.phone} />
              {inquiry.email && (
                <a
                  href={`mailto:${inquiry.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {inquiry.email}
                </a>
              )}
              {inquiry.instagram && (
                <a
                  href={`https://instagram.com/${inquiry.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-gold hover:underline"
                >
                  <Instagram className="w-4 h-4" />@{inquiry.instagram.replace(/^@/, '')}
                </a>
              )}
              {inquiry.party_size && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {inquiry.party_size} people
                </div>
              )}
              {inquiry.budget && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  {inquiry.budget}
                </div>
              )}
              {inquiry.target_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {inquiry.target_date}
                </div>
              )}
              {inquiry.venue_preference && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {inquiry.venue_preference}
                </div>
              )}
            </div>

            {inquiry.notes && (
              <div className="mt-3 p-3 bg-muted rounded-lg text-sm text-muted-foreground">{inquiry.notes}</div>
            )}
          </div>

          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p>Requested</p>
            <p>{format(new Date(inquiry.created_at), 'MMM d, h:mm a')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ExperienceInquiryCard({ inquiry }: { inquiry: ExperienceInquiryRow }) {
  const Icon = EXPERIENCE_ICONS[inquiry.experience_type] || Bus

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-medium text-lg">
                {inquiry.first_name} {inquiry.last_name}
              </h3>
              <Badge className="bg-gold/20 text-gold border-0">
                <Icon className="w-3 h-3 mr-1" />
                {EXPERIENCE_LABELS[inquiry.experience_type] || inquiry.experience_type}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <ContactActions phone={inquiry.phone} />
              {inquiry.email && (
                <a
                  href={`mailto:${inquiry.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {inquiry.email}
                </a>
              )}
              {inquiry.instagram && (
                <a
                  href={`https://instagram.com/${inquiry.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-gold hover:underline"
                >
                  <Instagram className="w-4 h-4" />@{inquiry.instagram.replace(/^@/, '')}
                </a>
              )}
              {inquiry.group_size != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {inquiry.group_size} people
                </div>
              )}
              {inquiry.preferred_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {inquiry.preferred_date}
                </div>
              )}
            </div>

            {inquiry.special_requests && (
              <div className="mt-3 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                {inquiry.special_requests}
              </div>
            )}
          </div>

          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p>Requested</p>
            <p>{format(new Date(inquiry.created_at), 'MMM d, h:mm a')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
