'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Calendar, MapPin, LogOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { formatPhoneInput } from '@/lib/phone'

interface GuestRequest {
  accessCode: string
  status: string
  guestCount: number
  eventTitle: string
  clubName: string | null
  eventDate: string | null
}

interface AccountData {
  found: boolean
  firstName: string | null
  upcoming: GuestRequest[]
  past: GuestRequest[]
}

const STORAGE_KEY = 'xc_guest_phone'

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-gold/20 text-gold',
  pending: 'bg-muted text-muted-foreground',
  waitlisted: 'bg-muted text-muted-foreground',
  denied: 'bg-destructive/20 text-destructive',
}

export default function MyAccessPage() {
  const [phone, setPhone] = useState('')
  const [storedPhone, setStoredPhone] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<AccountData | null>(null)

  const fetchAccount = async (digits: string) => {
    try {
      const response = await fetch('/api/access/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Something went wrong')
      setData(json)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      // Private browsing / storage disabled -- just show the login form.
    }
    if (saved) {
      setStoredPhone(saved)
      fetchAccount(saved).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleLogin = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      toast.error('Enter a valid phone number')
      return
    }
    setIsSubmitting(true)
    await fetchAccount(digits)
    setIsSubmitting(false)
    setStoredPhone(digits)
    try {
      localStorage.setItem(STORAGE_KEY, digits)
    } catch {
      // Fine if it can't persist -- they'll just need to log in again next visit.
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // no-op
    }
    setStoredPhone(null)
    setData(null)
    setPhone('')
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          {storedPhone && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-6 h-6" />
          </div>
        ) : !storedPhone ? (
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h1 className="text-xl font-semibold mb-1">My Access</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Log in with the phone number you used to request access, and see everything you&apos;ve got with
              Xclusive in one place.
            </p>
            <div className="flex gap-2">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="312-555-0123"
                className="bg-muted border-border/50"
                autoFocus
              />
              <Button
                onClick={handleLogin}
                disabled={isSubmitting}
                className="bg-gold hover:bg-gold-light text-background shrink-0"
              >
                {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Log In'}
              </Button>
            </div>
          </div>
        ) : !data ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-6 h-6" />
          </div>
        ) : !data.found ? (
          <div className="bg-card border border-border/50 rounded-2xl p-6 text-center">
            <h1 className="text-xl font-semibold mb-1">No Access Yet</h1>
            <p className="text-sm text-muted-foreground mb-5">
              We don&apos;t have any requests for that number. Head to the guestlist to request access.
            </p>
            <Link href="/guestlist">
              <Button className="bg-gold hover:bg-gold-light text-background">Go to Guestlist</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold">
                {data.firstName ? `Welcome back, ${data.firstName}` : 'My Access'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Everything you&apos;ve got with Xclusive Chicago.</p>
            </div>

            <RequestSection title="Upcoming" requests={data.upcoming} emptyLabel="No upcoming access yet." />
            <RequestSection title="Past" requests={data.past} emptyLabel="No past access on file." />
          </div>
        )}
      </div>
    </main>
  )
}

function RequestSection({
  title,
  requests,
  emptyLabel,
}: {
  title: string
  requests: GuestRequest[]
  emptyLabel: string
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      {requests.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-xl p-4 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <Link
              key={r.accessCode}
              href={`/access/${r.accessCode}`}
              className="block bg-card border border-border/50 hover:border-gold/40 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{r.eventTitle}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLES[r.status] || 'bg-muted text-muted-foreground'}`}>
                  {r.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                {r.clubName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {r.clubName}
                  </span>
                )}
                {r.eventDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(r.eventDate), 'MMM d, yyyy')}
                  </span>
                )}
                {r.guestCount > 1 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {r.guestCount} people
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
