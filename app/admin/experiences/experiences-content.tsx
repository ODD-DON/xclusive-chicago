'use client'

import { format } from 'date-fns'
import { Bus, Ship, Phone, MessageCircle, Mail, Instagram, Users, Calendar, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ExperienceInquiry } from '@/lib/types'

interface ExperiencesContentProps {
  inquiries: ExperienceInquiry[]
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

export function ExperiencesContent({ inquiries }: ExperiencesContentProps) {
  const partyBus = inquiries.filter((i) => i.experience_type === 'party_bus')
  const boatDay = inquiries.filter((i) => i.experience_type === 'boat_day')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light mb-2">Experiences</h1>
        <p className="text-muted-foreground">Party Bus and Boat Day inquiries</p>
      </div>

      <Tabs defaultValue="party_bus">
        <TabsList>
          <TabsTrigger value="party_bus">Party Bus ({partyBus.length})</TabsTrigger>
          <TabsTrigger value="boat_day">Boat Day ({boatDay.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="party_bus" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <ExportButton inquiries={partyBus} label="party-bus" />
          </div>
          <InquiryList inquiries={partyBus} emptyLabel="No Party Bus inquiries yet" />
        </TabsContent>

        <TabsContent value="boat_day" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <ExportButton inquiries={boatDay} label="boat-day" />
          </div>
          <InquiryList inquiries={boatDay} emptyLabel="No Boat Day inquiries yet" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InquiryList({ inquiries, emptyLabel }: { inquiries: ExperienceInquiry[]; emptyLabel: string }) {
  if (inquiries.length === 0) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">{emptyLabel}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => {
        const Icon = EXPERIENCE_ICONS[inquiry.experience_type] || Bus
        const digits = inquiry.phone.replace(/\D/g, '')
        const details = inquiry.details || {}
        const detailEntries = Object.entries(details).filter(([, v]) => v != null && v !== '')

        return (
          <Card key={inquiry.id} className="bg-card border-border/50">
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

                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {formatPhone(inquiry.phone)}
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
                    {inquiry.email && (
                      <a href={`mailto:${inquiry.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
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
                        {inquiry.flexible_dates ? ' (flexible)' : ''}
                      </div>
                    )}
                    {inquiry.cruise_type && (
                      <div className="text-muted-foreground">Cruise type: {inquiry.cruise_type}</div>
                    )}
                    {inquiry.departure_location && (
                      <div className="text-muted-foreground">Departs: {inquiry.departure_location}</div>
                    )}
                    {inquiry.budget_range && <div className="text-muted-foreground">Budget: {inquiry.budget_range}</div>}
                  </div>

                  {detailEntries.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3 bg-muted/40 rounded-lg p-3">
                      {detailEntries.map(([key, value]) => (
                        <div key={key} className="text-muted-foreground">
                          <span className="text-foreground">{formatDetailKey(key)}:</span> {formatDetailValue(value)}
                        </div>
                      ))}
                    </div>
                  )}

                  {inquiry.special_requests && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">{inquiry.special_requests}</p>
                      </div>
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
      })}
    </div>
  )
}

function ExportButton({ inquiries, label }: { inquiries: ExperienceInquiry[]; label: string }) {
  const exportCsv = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Instagram',
      'Preferred Date',
      'Flexible Dates',
      'Group Size',
      'Budget',
      'Special Requests',
      'Details',
      'Requested At',
    ]
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const rows = inquiries.map((i) => [
      i.first_name,
      i.last_name,
      formatPhone(i.phone),
      i.email || '',
      i.instagram ? `@${i.instagram.replace(/^@/, '')}` : '',
      i.preferred_date || '',
      i.flexible_dates ? 'Yes' : 'No',
      i.group_size != null ? String(i.group_size) : '',
      i.budget_range || i.bottle_budget || '',
      i.special_requests || '',
      i.details ? JSON.stringify(i.details) : '',
      format(new Date(i.created_at), 'yyyy-MM-dd HH:mm'),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xclusive-${label}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={exportCsv} variant="outline" className="border-border/50">
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  )
}
