'use client'

import { format, parseISO } from 'date-fns'
import {
  Wine,
  Phone,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Download,
  Mail,
  Instagram,
  MapPin,
  Plane,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { VipInquiry } from '@/lib/types'

interface VipContentProps {
  requests: any[]
  inquiries: VipInquiry[]
}

export function VipContent({ requests, inquiries }: VipContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light mb-2">VIP Requests</h1>
        <p className="text-muted-foreground">Bottle service inquiries, day-of and planned in advance</p>
      </div>

      <Tabs defaultValue="inquiries">
        <TabsList>
          <TabsTrigger value="inquiries">Advance Inquiries ({inquiries.length})</TabsTrigger>
          <TabsTrigger value="requests">Day-Of Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <InquiryExportButton inquiries={inquiries} />
          </div>
          {inquiries.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="py-12 text-center">
                <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No advance inquiries yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id} className="bg-card border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-medium text-lg">
                            {inquiry.first_name} {inquiry.last_name}
                          </h3>
                          <Badge className="bg-gold/20 text-gold border-0">
                            <Wine className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                          {inquiry.out_of_town && (
                            <Badge variant="outline" className="border-gold/30 text-gold">
                              <Plane className="w-3 h-3 mr-1" />
                              Out of town
                            </Badge>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{formatPhone(inquiry.phone)}</span>
                          </div>
                          {inquiry.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>{inquiry.email}</span>
                            </div>
                          )}
                          {inquiry.instagram && (
                            <a
                              href={`https://instagram.com/${inquiry.instagram.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-gold hover:underline"
                            >
                              <Instagram className="w-4 h-4" />
                              <span>@{inquiry.instagram.replace(/^@/, '')}</span>
                            </a>
                          )}
                          {inquiry.party_size && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{inquiry.party_size} people</span>
                            </div>
                          )}
                          {inquiry.budget && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                              <span>{inquiry.budget}</span>
                            </div>
                          )}
                          {inquiry.target_date && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{inquiry.target_date}</span>
                            </div>
                          )}
                          {inquiry.venue_preference && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{inquiry.venue_preference}</span>
                            </div>
                          )}
                        </div>

                        {inquiry.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="flex items-start gap-2 text-sm">
                              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <p className="text-muted-foreground">{inquiry.notes}</p>
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
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <ExportButton requests={requests} />
          </div>
          {requests.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="py-12 text-center">
                <Wine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No VIP requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request: any) => (
                <Card key={request.id} className="bg-card border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{request.name}</h3>
                          <Badge className="bg-gold/20 text-gold border-0">
                            <Wine className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{formatPhone(request.phone)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{request.group_size} people</span>
                          </div>
                          {request.budget && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                              <span>{request.budget}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {request.event?.club?.name} -{' '}
                              {request.event?.event_date
                                ? format(parseISO(request.event.event_date), 'EEE, MMM d')
                                : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="flex items-start gap-2 text-sm">
                              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <p className="text-muted-foreground">{request.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right text-xs text-muted-foreground">
                        <p>Requested</p>
                        <p>{format(new Date(request.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InquiryExportButton({ inquiries }: { inquiries: VipInquiry[] }) {
  const exportCSV = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Instagram',
      'Target Date',
      'Party Size',
      'Budget',
      'Venue Preference',
      'Out of Town',
      'Notes',
      'Requested At',
    ]
    const rows = inquiries.map((inq) => [
      inq.first_name,
      inq.last_name,
      inq.phone,
      inq.email || '',
      inq.instagram || '',
      inq.target_date || '',
      inq.party_size || '',
      inq.budget || '',
      inq.venue_preference || '',
      inq.out_of_town ? 'Yes' : 'No',
      inq.notes || '',
      format(new Date(inq.created_at), 'yyyy-MM-dd HH:mm'),
    ])

    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xclusive-vip-inquiries-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={exportCSV} variant="outline" className="border-border/50">
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  )
}

function ExportButton({ requests }: { requests: any[] }) {
  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Group Size', 'Budget', 'Club', 'Date', 'Notes', 'Requested At']
    const rows = requests.map((req) => [
      req.name,
      req.phone,
      req.group_size,
      req.budget || '',
      req.event?.club?.name || '',
      req.event?.event_date || '',
      req.notes || '',
      format(new Date(req.created_at), 'yyyy-MM-dd HH:mm'),
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xclusive-vip-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <Button onClick={exportCSV} variant="outline" className="border-border/50">
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  )
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}
