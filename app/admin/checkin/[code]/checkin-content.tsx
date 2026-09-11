'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Users, Calendar, MapPin, XCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import type { AccessRequest } from '@/lib/types'

interface Props {
  accessRequest: (AccessRequest & { checked_in_at: string | null }) | null
}

export function CheckinContent({ accessRequest }: Props) {
  const [request, setRequest] = useState(accessRequest)
  const [isChecking, setIsChecking] = useState(false)

  if (!request) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="bg-card border-destructive/30">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-destructive/70 mx-auto mb-3" />
            <p className="font-medium">Ticket not found</p>
            <p className="text-sm text-muted-foreground mt-1">This QR code doesn&apos;t match any access request.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { member, event, guest_count, status, checked_in_at, celebration_type, celebration_other } = request
  const club = event?.club

  const handleCheckIn = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: request.access_code }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to check in')
      setRequest({ ...request, checked_in_at: data.checkedInAt })
      toast.success(`${member?.first_name} checked in`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check in')
    } finally {
      setIsChecking(false)
    }
  }

  const notApproved = status !== 'approved'

  return (
    <div className="max-w-md mx-auto py-8">
      <Card
        className={
          checked_in_at
            ? 'bg-gold/5 border-gold/40'
            : notApproved
              ? 'bg-card border-destructive/30'
              : 'bg-card border-border/50'
        }
      >
        <CardContent className="p-6 text-center space-y-4">
          {checked_in_at ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-gold mx-auto" />
              <div>
                <p className="text-xl font-semibold text-gold-gradient">Checked In</p>
                <p className="text-sm text-muted-foreground mt-1">at {format(new Date(checked_in_at), 'h:mm a')}</p>
              </div>
            </>
          ) : notApproved ? (
            <>
              <XCircle className="w-14 h-14 text-destructive/70 mx-auto" />
              <div>
                <p className="text-xl font-semibold">Not Approved</p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">Status: {status}</p>
              </div>
            </>
          ) : null}

          <div className="pt-2 border-t border-border/30 text-left space-y-2">
            <p className="font-medium text-lg text-center">
              {member?.first_name} {member?.last_name}
            </p>
            {guest_count > 1 && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>Party of {guest_count}</span>
              </div>
            )}
            {event && (
              <>
                <div className="flex items-center gap-2 text-sm justify-center">
                  <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>
                    {event.title} · {format(parseISO(event.event_date), 'MMM d')}
                  </span>
                </div>
                {club?.name && (
                  <div className="flex items-center gap-2 text-sm justify-center text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{club.name}</span>
                  </div>
                )}
              </>
            )}
            {celebration_type && (
              <div className="flex items-center gap-2 text-sm justify-center text-gold">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{celebration_type === 'Other' ? celebration_other : celebration_type}</span>
              </div>
            )}
          </div>

          {!checked_in_at && !notApproved && (
            <Button
              onClick={handleCheckIn}
              disabled={isChecking}
              className="w-full bg-gold hover:bg-gold-light text-background font-medium py-6 text-base"
            >
              {isChecking ? <Spinner className="w-5 h-5" /> : 'Check In'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
