'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import {
  Check,
  Calendar,
  MapPin,
  Clock,
  Share2,
  Copy,
  MessageSquare,
  ArrowRight,
  Users,
  Info,
  Bus,
  Ship,
  Wine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Registration, Club, Event } from '@/lib/types'
import confetti from 'canvas-confetti'

interface Props {
  registration: Registration & { club: Club; event: Event }
  friendCount?: number
}

export function ConfirmationContent({ registration, friendCount = 0 }: Props) {
  const [copied, setCopied] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  useEffect(() => {
    // Fire confetti on mount
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#FFD700', '#FFF8DC'],
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#FFD700', '#FFF8DC'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const passUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/pass/${registration.pass_token}`
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/guestlist?ref=${registration.pass_token}`

  const handleCopyPass = () => {
    navigator.clipboard.writeText(passUrl)
    setCopied(true)
    toast.success('Pass link copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl)
    setInviteCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const handleShare = async () => {
    const shareData = {
      title: `Join me at ${registration.club.name}!`,
      text: `I'm on the guest list at ${registration.club.name} on ${format(parseISO(registration.event_date), 'EEEE, MMMM d')}! Request your access:`,
      url: inviteUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        handleCopyInvite()
      }
    } else {
      handleCopyInvite()
    }
  }

  const handleTextFriends = () => {
    const message = `I'm on the guest list at ${registration.club.name} on ${format(parseISO(registration.event_date), 'EEEE, MMMM d')}! Request your access here: ${inviteUrl}`
    window.location.href = `sms:?body=${encodeURIComponent(message)}`
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 relative">
                <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
              </div>
              <span className="font-medium text-gold-gradient">Confirmed</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Check className="w-10 h-10 text-gold" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-light mb-2">
            {"You're"} on the List!
          </h1>
          <p className="text-muted-foreground">
            {registration.first_name}, your spot is secured
          </p>
        </motion.div>

        {/* Event details card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-6"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(parseISO(registration.event_date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-medium">{registration.club.name}</p>
                {registration.club.address && (
                  <p className="text-sm text-muted-foreground">
                    {registration.club.address}
                  </p>
                )}
              </div>
            </div>

            {registration.event?.cutoff_time && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Complimentary Access Until</p>
                  <p className="font-medium text-gold">
                    {formatTime(registration.event.cutoff_time)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pass link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <Link href={`/pass/${registration.pass_token}`}>
            <Button className="w-full bg-gold hover:bg-gold-light text-background font-medium py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              View Your Pass
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Invite Friends Section - Prominent when friendCount > 0 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-2xl p-6 mb-6 ${
            friendCount > 0
              ? 'bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border-2 border-gold/30'
              : 'bg-card border border-border/50'
          }`}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              friendCount > 0 ? 'bg-gold/30' : 'bg-gold/10'
            }`}>
              <Users className={`w-5 h-5 ${friendCount > 0 ? 'text-gold' : 'text-gold/70'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                {friendCount > 0
                  ? `Invite Your ${friendCount} Friend${friendCount > 1 ? 's' : ''}`
                  : 'Invite Friends'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {friendCount > 0
                  ? 'Share this link so they can get their own passes'
                  : 'Share this event so your friends can join'}
              </p>
            </div>
          </div>

          {/* Important notice */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-3 mb-4">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-gold" />
            <p>
              <span className="text-foreground font-medium">Each person needs their own pass.</span>
              {' '}Your friends must sign up individually using your invite link.
            </p>
          </div>

          {/* Invite URL display */}
          <div className="bg-background/80 rounded-lg p-3 mb-4 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-transparent text-sm text-muted-foreground truncate outline-none"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyInvite}
              className="shrink-0 text-gold hover:text-gold hover:bg-gold/10"
            >
              <Copy className="w-4 h-4 mr-1" />
              {inviteCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-gold/30 hover:border-gold/50 hover:bg-gold/10"
              onClick={handleTextFriends}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Text Friends
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-gold/30 hover:border-gold/50 hover:bg-gold/10"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </motion.div>

        {/* Premium Upsell Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-card via-card to-gold/5 border border-border/50 rounded-2xl p-6 mb-6"
        >
          <div className="text-center mb-5">
            <p className="text-gold text-xs tracking-[0.2em] uppercase mb-2">
              Upgrade Your Night
            </p>
            <h3 className="font-medium text-lg">Want to go bigger?</h3>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: Bus,
                title: 'Party Bus',
                description: 'Split with friends, arrive in style',
                href: '/experiences/party-bus',
              },
              {
                icon: Ship,
                title: 'Boat Day',
                description: 'Lake Michigan day parties',
                href: '/experiences/boat-day',
              },
              {
                icon: Wine,
                title: 'VIP Table',
                description: 'Premium bottle service',
                href: '/experiences/vip-tables',
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-4 p-3 rounded-xl bg-background/50 hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-gold transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          {"You'll"} receive a text reminder on the day of the event
        </motion.p>
      </div>
    </main>
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}
