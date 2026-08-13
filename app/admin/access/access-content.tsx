'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Check, X, Clock, Users, Phone, Mail, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { AccessRequest, Member } from '@/lib/types'

interface AccessContentProps {
  accessRequests: AccessRequest[]
  members: Member[]
}

// Clusters requests that share an invite link (referred_by_code) together,
// leader first then followers by request time, groups ordered by most recent activity.
function groupRequests(list: AccessRequest[]): AccessRequest[][] {
  const clusters = new Map<string, AccessRequest[]>()
  list.forEach((r) => {
    const key = r.referred_by_code || r.access_code
    if (!clusters.has(key)) clusters.set(key, [])
    clusters.get(key)!.push(r)
  })

  const groups = Array.from(clusters.values()).map((members) =>
    [...members].sort((a, b) => new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime()),
  )

  groups.sort((a, b) => {
    const aMax = Math.max(...a.map((m) => new Date(m.requested_at).getTime()))
    const bMax = Math.max(...b.map((m) => new Date(m.requested_at).getTime()))
    return bMax - aMax
  })

  return groups
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-500',
  approved: 'bg-green-500/20 text-green-500',
  waitlisted: 'bg-muted text-muted-foreground',
  denied: 'bg-red-500/20 text-red-500',
}

export function AccessContent({ accessRequests: initialRequests, members }: AccessContentProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: status as AccessRequest['status'] } : r))
      )
      toast.success(`Marked ${status}`)
      router.refresh()
    } catch {
      toast.error('Failed to update request')
    }
  }

  const visibleRequests = filter === 'pending' ? requests.filter((r) => r.status === 'pending') : requests

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light mb-2">Access</h1>
        <p className="text-muted-foreground">Review access requests and see who&apos;s on the list</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-gold hover:bg-gold-light text-background' : ''}
            >
              Pending ({requests.filter((r) => r.status === 'pending').length})
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-gold hover:bg-gold-light text-background' : ''}
            >
              All ({requests.length})
            </Button>
          </div>

          {visibleRequests.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                {filter === 'pending' ? 'No pending requests' : 'No access requests yet'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupRequests(visibleRequests).map((group) => (
                <div
                  key={group[0].id}
                  className={group.length > 1 ? 'space-y-2 border-l-2 border-gold/40 pl-3' : ''}
                >
                  {group.length > 1 && (
                    <p className="text-xs font-medium text-gold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Group of {group.length}
                    </p>
                  )}
                  <div className="space-y-2">
                    {group.map((req) => (
                      <Card key={req.id} className="bg-card border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-medium">
                                  {req.member?.first_name} {req.member?.last_name}
                                </h3>
                                <Badge className={`${STATUS_STYLES[req.status]} border-0`}>{req.status}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{formatPhone(req.member?.phone || '')}</span>
                                </div>
                                {req.member?.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{req.member.email}</span>
                                  </div>
                                )}
                                {req.member?.instagram && (
                                  <a
                                    href={`https://instagram.com/${req.member.instagram.replace(/^@/, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 text-gold hover:underline"
                                  >
                                    <Instagram className="w-3.5 h-3.5" />
                                    <span>@{req.member.instagram.replace(/^@/, '')}</span>
                                  </a>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{req.guest_count} {req.guest_count === 1 ? 'guest' : 'guests'}</span>
                                </div>
                              </div>
                              <p className="text-sm">
                                {req.event?.title} &middot; {req.event?.club?.name}
                                {req.event?.event_date && ` · ${format(parseISO(req.event.event_date), 'MMM d')}`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Requested {format(new Date(req.requested_at), 'MMM d, h:mm a')}
                              </p>
                            </div>

                            {req.status === 'pending' && (
                              <div className="flex gap-2 shrink-0">
                                <Button size="sm" onClick={() => updateStatus(req.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white">
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-3 pt-4">
          {members.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">No members yet</CardContent>
            </Card>
          ) : (
            members.map((member) => (
              <Card key={member.id} className="bg-card border-border/50">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                      <span>{formatPhone(member.phone)}</span>
                      {member.email && <span>{member.email}</span>}
                      {member.instagram && <span>@{member.instagram.replace(/^@/, '')}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p className="capitalize">{member.member_status}</p>
                    <p>Joined {format(new Date(member.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}
