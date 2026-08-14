'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, parseISO, isSameDay } from 'date-fns'
import { ArrowRight, Bus, Ship, Wine, Calendar, MapPin, Users, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Event, Club, CLUB_SIZE_LABELS } from '@/lib/types'
import { computeAccessStatus, ACCESS_STATUS_LABELS } from '@/lib/access-status'

interface HomeContentProps {
  events: (Event & { club: Club | null })[]
  approvedCounts: Record<string, number>
}

export function HomeContent({ events, approvedCounts }: HomeContentProps) {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0413-EY8gcYW36JtVI9VDr3juVAZ8gu1Y18.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <section className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-40 h-40 mx-auto mb-8"
          >
            <Image
              src="/logo.png"
              alt="XCLUSIVE Chicago"
              fill
              className="object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              priority
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gold text-sm tracking-[0.2em] uppercase mb-6"
          >
            Chicago Nightlife
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-3xl md:text-5xl font-light tracking-tight mb-6 leading-tight text-balance"
          >
            Chicago Nightlife.
            <span className="block text-gold-gradient font-medium mt-2">Xclusive Access.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/80 text-lg mb-10 max-w-lg mx-auto leading-relaxed text-balance"
          >
            Discover selected events, guest lists, and private releases across Chicago. Members request
            access first.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/guestlist">
              <Button
                size="lg"
                className="group bg-gold hover:bg-gold-light text-background font-medium text-lg px-10 py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
              >
                Explore Access
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-12 text-xs text-white/70 tracking-wide"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Complimentary Access
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Limited Allocations
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Member Access
            </span>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative z-10 py-20 px-4 bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">Right Now</p>
            <h2 className="text-2xl md:text-3xl font-light">
              Current <span className="text-gold-gradient font-medium">Releases</span>
            </h2>
          </motion.div>

          {events.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-2xl p-8 text-center max-w-lg mx-auto">
              <Calendar className="w-10 h-10 text-gold mx-auto mb-4" />
              <h3 className="font-medium mb-2">No releases posted yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                New releases go up weekly, so if you&apos;re local, check back soon. Coming in from out of town and
                need something locked in before your trip? Don&apos;t wait on a release — book VIP table access in
                advance instead.
              </p>
              <Link href="/experiences/vip-tables">
                <Button className="bg-gold hover:bg-gold-light text-background">
                  <Plane className="w-4 h-4 mr-2" />
                  Plan Ahead with VIP Tables
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {events.map((event, index) => {
                  const dateObj = parseISO(event.event_date)
                  const isToday = isSameDay(dateObj, new Date())
                  const venueName = event.club?.name || event.scraped_venue_name
                  const neighborhood = event.club?.neighborhood
                  const sizeLabel = event.club?.size ? CLUB_SIZE_LABELS[event.club.size] : null
                  const image = event.use_venue_branding
                    ? event.club?.image_url || event.image_url
                    : event.image_url || event.club?.image_url
                  const status = computeAccessStatus(event, approvedCounts[event.id] || 0)

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    >
                      <Link href="/guestlist" className="block group">
                        <div className="flex gap-4 bg-card border border-border/50 rounded-2xl p-3 h-full transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                            {image ? (
                              <Image src={image} alt={event.title || 'Event'} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gold/20 to-transparent" />
                            )}
                          </div>
                          <div className="min-w-0 flex flex-col justify-center">
                            <p className="text-sm font-semibold text-gold flex items-center gap-1.5 mb-1">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              {isToday ? 'Tonight' : format(dateObj, 'EEEE, MMM d')}
                            </p>
                            <h3 className="font-medium truncate group-hover:text-gold transition-colors">
                              {event.use_venue_branding && venueName ? venueName : event.title}
                            </h3>
                            {venueName && !event.use_venue_branding && (
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {venueName}
                                {neighborhood && ` · ${neighborhood}`}
                              </p>
                            )}
                            {sizeLabel && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3 shrink-0" />
                                {sizeLabel.label} ({sizeLabel.capacity})
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground mt-1">{ACCESS_STATUS_LABELS[status]}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Coming from out of town?</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Don&apos;t see a release for your date yet — releases go up weekly, but you can lock in VIP
                    table access now instead of waiting.
                  </p>
                </div>
                <Link href="/experiences/vip-tables" className="shrink-0 w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto border-gold/30 text-gold hover:bg-gold/10">
                    Plan Ahead
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="relative z-10 py-20 px-4 bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">Upgrade Your Night</p>
            <h2 className="text-2xl md:text-3xl font-light">
              Premium <span className="text-gold-gradient font-medium">Experiences</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Bus,
                title: 'Party Buses',
                description: 'Roll up in style with your crew. Premium sound, lights, and vibes.',
                cta: 'View Party Buses',
                href: '/experiences/party-bus',
              },
              {
                icon: Ship,
                title: 'Boat Days',
                description: 'Lake Michigan never looked this good. Day parties on the water.',
                cta: 'Book a Boat Day',
                href: '/experiences/boat-day',
              },
              {
                icon: Wine,
                title: 'VIP Tables',
                description: 'Skip the line. Premium bottle service at top venues.',
                cta: 'VIP Experiences',
                href: '/experiences/vip-tables',
              },
            ].map((experience, index) => (
              <motion.div
                key={experience.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={experience.href} className="block group">
                  <div className="bg-card border border-border/50 rounded-2xl p-6 h-full transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                      <experience.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 group-hover:text-gold transition-colors">
                      {experience.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{experience.description}</p>
                    <span className="text-gold text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      {experience.cta}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8 px-4 bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
            </div>
            <span>XCLUSIVE Chicago</span>
          </div>
          <p>&copy; {new Date().getFullYear()} All rights reserved</p>
        </div>
      </footer>
    </main>
  )
}

