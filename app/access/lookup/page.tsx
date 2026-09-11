'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Search, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { formatPhoneInput } from '@/lib/phone'

interface FoundRequest {
  accessCode: string
  status: string
  eventTitle: string
  clubName: string | null
  eventDate: string | null
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  waitlisted: 'Waitlisted',
  denied: 'Not approved',
}

export default function LookupPage() {
  const [phone, setPhone] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<FoundRequest[] | null>(null)

  const handleSearch = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      toast.error('Enter a valid phone number')
      return
    }
    setIsSearching(true)
    setResults(null)
    try {
      const response = await fetch('/api/access/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Something went wrong')

      if (data.requests.length === 1) {
        window.location.href = `/access/${data.requests[0].accessCode}`
        return
      }
      setResults(data.requests)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/guestlist"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guestlist
          </Link>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h1 className="text-xl font-semibold mb-1">Find Your Ticket</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Lost the link? Enter the phone number you used to request access.
          </p>

          <div className="flex gap-2 mb-2">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="312-555-0123"
              className="bg-muted border-border/50"
              autoFocus
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-gold hover:bg-gold-light text-background shrink-0"
            >
              {isSearching ? <Spinner className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {results && results.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              No requests found for that number. Double check it, or head back to the guestlist to request access.
            </p>
          )}

          {results && results.length > 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Your requests</p>
              {results.map((r) => (
                <Link
                  key={r.accessCode}
                  href={`/access/${r.accessCode}`}
                  className="block bg-muted/40 hover:bg-muted rounded-xl p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{r.eventTitle}</p>
                    <span className="text-xs text-gold shrink-0">{STATUS_LABEL[r.status] || r.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {r.clubName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {r.clubName}
                      </span>
                    )}
                    {r.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(r.eventDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
