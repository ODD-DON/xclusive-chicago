'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Wine, Users, Crown, Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VipTablesPage() {
  const handleInquire = () => {
    window.location.href = 'sms:+13125551234?body=Hey! I\'m interested in VIP table service with Xclusive Chicago.'
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
            </div>
            <span className="font-medium">VIP Tables</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gold/10 flex items-center justify-center">
            <Wine className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-4">
            VIP <span className="text-gold-gradient font-medium">Tables</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Skip the crowd. Premium bottle service at Chicago&apos;s top venues with dedicated servers and the best spots in the house.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {[
            { icon: Crown, title: 'Premium Locations', description: 'Best tables at top clubs' },
            { icon: Users, title: 'Dedicated Server', description: 'Personal attention all night' },
            { icon: Sparkles, title: 'Full Experience', description: 'Sparklers, mixers, and more' },
          ].map((feature) => (
            <div key={feature.title} className="bg-card border border-border/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-medium mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-medium mb-4">Table packages</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border/30">
              <div>
                <p className="font-medium">Standard Table</p>
                <p className="text-sm text-muted-foreground">4-6 guests, 1 bottle</p>
              </div>
              <p className="text-gold font-medium">From $500</p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/30">
              <div>
                <p className="font-medium">Premium Table</p>
                <p className="text-sm text-muted-foreground">6-10 guests, 2 bottles</p>
              </div>
              <p className="text-gold font-medium">From $1,000</p>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium">VIP Section</p>
                <p className="text-sm text-muted-foreground">10-20 guests, 4+ bottles</p>
              </div>
              <p className="text-gold font-medium">From $2,500</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Prices vary by venue and date. Contact us for exact pricing.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Button
            onClick={handleInquire}
            size="lg"
            className="bg-gold hover:bg-gold-light text-background font-medium px-10 py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Text Us to Book
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Or DM us on Instagram <a href="https://instagram.com/xclusivechicago" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@xclusivechicago</a>
          </p>
        </motion.div>
      </div>
    </main>
  )
}
