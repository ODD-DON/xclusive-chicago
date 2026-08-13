'use client'

import { useState, useMemo } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Registration, Club, Event } from '@/lib/types'

interface GuestsContentProps {
  registrations: (Registration & { club: { name: string; address: string }; event: Event })[]
  clubs: { id: string; name: string }[]
  eventDates: string[]
}

export function GuestsContent({ registrations, clubs, eventDates }: GuestsContentProps) {
  const [search, setSearch] = useState('')
  const [clubFilter, setClubFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const today = new Date()

  const filtered = useMemo(() => {
    return registrations.filter((reg) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const fullName = `${reg.first_name} ${reg.last_name}`.toLowerCase()
        const phone = reg.phone?.toLowerCase() || ''
        const email = reg.email?.toLowerCase() || ''
        if (
          !fullName.includes(searchLower) &&
          !phone.includes(searchLower) &&
          !email.includes(searchLower)
        ) {
          return false
        }
      }

      // Club filter
      if (clubFilter !== 'all' && reg.club_id !== clubFilter) {
        return false
      }

      // Date filter
      if (dateFilter !== 'all' && reg.event_date !== dateFilter) {
        return false
      }

      // Status filter
      if (statusFilter === 'activated' && !reg.activated_at) {
        return false
      }
      if (statusFilter === 'opened' && (!reg.pass_opened_at || reg.activated_at)) {
        return false
      }
      if (statusFilter === 'registered' && (reg.pass_opened_at || reg.activated_at)) {
        return false
      }

      return true
    })
  }, [registrations, search, clubFilter, dateFilter, statusFilter])

  // Stats - Updated for new journey tracking
  const stats = useMemo(() => {
    const todayRegs = registrations.filter((r) =>
      isSameDay(parseISO(r.event_date), today)
    )
    return {
      total: registrations.length,
      opened: registrations.filter((r) => r.pass_opened_at).length,
      activated: registrations.filter((r) => r.activated_at).length,
      today: todayRegs.length,
      todayActivated: todayRegs.filter((r) => r.activated_at).length,
      showRate: todayRegs.length > 0 
        ? Math.round((todayRegs.filter((r) => r.activated_at).length / todayRegs.length) * 100)
        : 0,
    }
  }, [registrations, today])

  const exportCSV = () => {
    const headers = [
      'Name',
      'Phone',
      'Email',
      'Club',
      'Date',
      'Group Size',
      'Status',
      'Signed Up',
      'Pass Opened',
      'Activated At',
      'Distance (mi)',
    ]
    const rows = filtered.map((reg) => [
      `${reg.first_name} ${reg.last_name}`,
      reg.phone,
      reg.email || '',
      reg.club?.name || '',
      format(parseISO(reg.event_date), 'yyyy-MM-dd'),
      reg.total_count || 1,
      reg.activated_at ? 'Activated' : reg.pass_opened_at ? 'Opened' : 'Registered',
      format(new Date(reg.created_at), 'yyyy-MM-dd HH:mm'),
      reg.pass_opened_at ? format(new Date(reg.pass_opened_at), 'yyyy-MM-dd HH:mm') : '',
      reg.activated_at ? format(new Date(reg.activated_at), 'yyyy-MM-dd HH:mm') : '',
      reg.activation_distance_miles?.toFixed(2) || '',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xclusive-guests-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-light mb-2">Guests</h1>
          <p className="text-muted-foreground">
            {stats.total} registrations ({stats.unlocked} unlocked)
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="border-border/50">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Signed Up</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{stats.opened}</p>
            <p className="text-sm text-muted-foreground">Opened Pass</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-green-500">{stats.activated}</p>
            <p className="text-sm text-muted-foreground">Activated (Billable)</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 border-gold/30">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-gold">{stats.today}</p>
            <p className="text-sm text-muted-foreground">Tonight&apos;s List</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{stats.showRate}%</p>
            <p className="text-sm text-muted-foreground">Show Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="pl-10 bg-card border-border/50"
          />
        </div>

        <Select value={clubFilter} onValueChange={setClubFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border/50">
            <SelectValue placeholder="All Clubs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clubs</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border/50">
            <SelectValue placeholder="All Dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            {eventDates.map((date) => (
              <SelectItem key={date} value={date}>
                {format(parseISO(date), 'EEE, MMM d')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-card border-border/50">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="activated">Activated</SelectItem>
            <SelectItem value="opened">Opened Pass</SelectItem>
            <SelectItem value="registered">Registered Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Guest list */}
      {filtered.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No guests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => {
            const isToday = isSameDay(parseISO(reg.event_date), today)

            return (
              <Card
                key={reg.id}
                className={`bg-card border-border/50 ${
                  isToday ? 'border-gold/30' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {reg.first_name} {reg.last_name}
                        </h3>
                        {reg.activated_at ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/20 text-green-500 border-0"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Activated
                          </Badge>
                        ) : reg.pass_opened_at ? (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-0">
                            <Clock className="w-3 h-3 mr-1" />
                            Opened Pass
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
                            <Clock className="w-3 h-3 mr-1" />
                            Registered
                          </Badge>
                        )}
                        {isToday && (
                          <Badge className="bg-gold/20 text-gold border-0">Tonight</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{reg.club?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{formatPhone(reg.phone)}</span>
                        </div>
                        {reg.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{reg.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span>
                          {format(parseISO(reg.event_date), 'EEE, MMM d')}
                        </span>
                        {reg.total_count > 1 && (
                          <span>Group of {reg.total_count}</span>
                        )}
                        {reg.bottle_service && (
                          <span className="text-gold">VIP Interest</span>
                        )}
                        {reg.celebration_type && (
                          <span className="capitalize">{reg.celebration_type}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground space-y-1">
                      <div>
                        <p className="text-muted-foreground/60">Signed up</p>
                        <p>{format(new Date(reg.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                      {reg.pass_opened_at && (
                        <div>
                          <p className="text-blue-400/80">Opened</p>
                          <p>{format(new Date(reg.pass_opened_at), 'h:mm a')}</p>
                        </div>
                      )}
                      {reg.activated_at && (
                        <div>
                          <p className="text-green-500">Activated</p>
                          <p>{format(new Date(reg.activated_at), 'h:mm a')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
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
