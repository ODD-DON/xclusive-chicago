'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Bus, Ship, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-24 h-24 relative animate-pulse">
          <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0413-EY8gcYW36JtVI9VDr3juVAZ8gu1Y18.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Logo */}
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

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gold text-sm tracking-[0.2em] uppercase mb-6"
          >
            Chicago · Members Only
          </motion.p>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-3xl md:text-5xl font-light tracking-tight mb-6 leading-tight text-balance"
          >
            Some nights are different.
            <span className="block text-gold-gradient font-medium mt-2">
              This is one of them.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/80 text-lg mb-10 max-w-lg mx-auto leading-relaxed text-balance"
          >
            Xclusive is a private guestlist for Chicago&apos;s most in-demand nights. 
            Members get in — everyone else waits.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Link href="/guestlist">
              <Button
                size="lg"
                className="group bg-gold hover:bg-gold-light text-background font-medium text-lg px-10 py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
              >
                Request Access
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Bottom badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-12 text-xs text-white/70 tracking-wide"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Complimentary Entry
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Limited Spots
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Members Only
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* Premium Experiences Section */}
      <section className="relative z-10 py-20 px-4 bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">
              Upgrade Your Night
            </p>
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
                description: 'Skip the crowd. Premium bottle service at top venues.',
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
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      {experience.description}
                    </p>
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

      {/* Footer */}
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
