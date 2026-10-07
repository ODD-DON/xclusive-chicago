'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Clock, LogOut, MapPin, Phone, Ticket } from 'lucide-react'
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
  imageUrl: string | null
  doorsTime: string | null
}

interface AccountData {
  found: boolean
  firstName: string | null
  upcoming: GuestRequest[]
  past: GuestRequest[]
}

const STORAGE_KEY = 'xc_guest_phone'

const STATUS_LABELS: Record<string, string> = {
  approved: 'On the list',
  pending: 'Pending',
  waitlisted: 'Waitlist',
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-gold text-background',
  pending: 'bg-muted text-muted-foreground',
  waitlisted: 'bg-muted text-muted-foreground',
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

function Brand() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative w-20 h-20 mb-3 drop-shadow-[0_0_20px_rgba(212,175,55,0.35)]">
        <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" priority />
      </div>
      <p className="text-gold-gradient text-xs font-semibold tracking-[0.4em]">XCLUSIVE CHICAGO</p>
    </div>
  )
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
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="w-full max-w-md mx-auto">
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

        <Brand />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-6 h-6" />
          </div>
        ) : !storedPhone ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-gold/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.08)]"
          >
            <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center mb-4">
              <Ticket className="w-5 h-5 text-gold" />
            </div>
            <h1 className="text-2xl font-semibold mb-1">My Access</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Enter the phone number you signed up with to pull up your tickets.
            </p>
            <div className="relative mb-3">
              <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="312-555-0123"
                className="bg-muted border-border/50 h-12 pl-10 text-base"
                autoFocus
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full h-12 text-base bg-gold hover:bg-gold-light text-background"
            >
              {isSubmitting ? <Spinner className="w-4 h-4" /> : 'View My Tickets'}
            </Button>
          </motion.div>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">
                {data.firstName ? `Welcome back, ${data.firstName}` : 'My Access'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Tap a ticket to show it at the door.</p>
            </div>

            <RequestSection title="Upcoming" requests={data.upcoming} emptyLabel="No upcoming access yet." />
            {data.past.length > 0 && <RequestSection title="Past" requests={data.past} past />}

            <Link href="/guestlist" className="block">
              <Button variant="outline" className="w-full h-12 border-gold/40 text-gold hover:bg-gold/10">
                Find More Events
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  )
}

function RequestSection({
  title,
  requests,
  emptyLabel,
  past = false,
}: {
  title: string
  requests: GuestRequest[]
  emptyLabel?: string
  past?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gold uppercase tracking-[0.25em] mb-3">{title}</p>
      {requests.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-xl p-5 text-sm text-muted-foreground text-center">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const date = r.eventDate ? parseISO(r.eventDate) : null
            const isOn = r.status === 'approved' && !past
            return (
              <Link
                key={r.accessCode}
                href={`/access/${r.accessCode}`}
                className={`group flex items-center gap-3 bg-card border rounded-2xl p-3 transition-colors ${
                  isOn ? 'border-gold/40 hover:border-gold/70' : 'border-border/50 hover:border-gold/30'
                } ${past ? 'opacity-60' : ''}`}
              >
                <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/40">
                  {r.imageUrl ? (
                    <Image
                      src={r.imageUrl}
                      alt={r.eventTitle}
                      fill
                      className={`object-cover ${past ? 'grayscale' : ''}`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-gold/60" />
                    </div>
                  )}
                  {date && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 text-center py-0.5">
                      <p className="text-[10px] font-semibold text-gold uppercase tracking-wider leading-tight">
                        {format(date, 'EEE MMM d')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{r.eventTitle}</p>
                  <div className="space-y-0.5 text-xs text-muted-foreground mt-1">
                    {r.clubName && (
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {r.clubName}
                      </p>
                    )}
                    {r.doorsTime && !past && (
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        Doors {formatTime(r.doorsTime)}
                      </p>
                    )}
                  </div>
                  {!past && (
                    <span
                      className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[r.status] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold shrink-0 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
