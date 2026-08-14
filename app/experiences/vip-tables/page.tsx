'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Wine, Users, Crown, Sparkles, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { CELEBRATION_TYPES } from '@/lib/types'

const BUDGET_OPTIONS = ['$500-1000', '$1000-2500', '$2500-5000', '$5000+']

export default function VipTablesPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [partySize, setPartySize] = useState('')
  const [budget, setBudget] = useState('')
  const [venuePreference, setVenuePreference] = useState('')
  const [outOfTown, setOutOfTown] = useState(false)
  const [homeCity, setHomeCity] = useState('')
  const [celebrationType, setCelebrationType] = useState('')
  const [celebrationOther, setCelebrationOther] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim() || phone.replace(/\D/g, '').length < 10) {
      toast.error('Enter your name and a valid phone number')
      return
    }

    if (!instagram.trim()) {
      toast.error('Enter your Instagram handle')
      return
    }

    if (!smsConsent) {
      toast.error('Please agree to receive SMS updates to continue')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/vip-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          email: email.trim() || null,
          instagram: instagram.trim(),
          targetDate: targetDate.trim() || null,
          partySize: partySize || null,
          budget: budget || null,
          venuePreference: venuePreference.trim() || null,
          outOfTown,
          homeCity: outOfTown ? homeCity.trim() || null : null,
          celebrationType: celebrationType || null,
          celebrationOther: celebrationType === 'Other' ? celebrationOther.trim() || null : null,
          smsConsent,
          notes: notes.trim() || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit')

      setSubmitted(true)
      toast.success("Request sent, we'll be in touch")
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gold/10 flex items-center justify-center">
            <Wine className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-4">
            VIP <span className="text-gold-gradient font-medium">Tables</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Skip the crowd. Premium bottle service at Chicago&apos;s top venues with dedicated servers and the best
            spots in the house.
          </p>
          <p className="text-sm text-gold mt-3 max-w-md mx-auto">
            Planning ahead or coming from out of town? Lock in your table now &mdash; you don&apos;t need to wait for
            a specific night to be announced.
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

        {/* Inquiry Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border/50 rounded-2xl p-6"
        >
          {submitted ? (
            <div className="text-center py-6">
              <Wine className="w-10 h-10 text-gold mx-auto mb-3" />
              <p className="font-medium mb-1">Request sent</p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll reach out to lock in the details, no need to wait for the night to be announced.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-medium">Request a table</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-muted border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-muted border-border/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(312) 555-0123"
                    className="bg-muted border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle"
                    className="bg-muted border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted border-border/50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Target date or weekend</Label>
                  <Input
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    placeholder="e.g. Weekend of Sept 20, or a specific date"
                    className="bg-muted border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Party Size</Label>
                  <Input
                    type="number"
                    min="1"
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    placeholder="e.g. 8"
                    className="bg-muted border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Venue (optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={venuePreference}
                    onChange={(e) => setVenuePreference(e.target.value)}
                    placeholder="No preference, or name a venue"
                    className="pl-9 bg-muted border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Budget</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_OPTIONS.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setBudget((b) => (b === range ? '' : range))}
                      className={`px-3 py-2.5 rounded-lg text-sm border text-center transition-colors ${
                        budget === range
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border/50 text-muted-foreground hover:border-gold/30'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={outOfTown}
                    onChange={(e) => setOutOfTown(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded border border-border bg-background peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center">
                    {outOfTown && (
                      <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm">I&apos;m coming from out of town</span>
              </label>

              {outOfTown && (
                <Input
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  placeholder="Which city are you traveling from?"
                  className="bg-muted border-border/50"
                />
              )}

              <div className="space-y-2">
                <Label>Celebrating something? (optional)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CELEBRATION_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCelebrationType((c) => (c === type ? '' : type))}
                      className={`px-3 py-2.5 rounded-lg text-sm border text-center transition-colors ${
                        celebrationType === type
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border/50 text-muted-foreground hover:border-gold/30'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {celebrationType === 'Other' && (
                  <Input
                    value={celebrationOther}
                    onChange={(e) => setCelebrationOther(e.target.value)}
                    placeholder="Tell us what you're celebrating"
                    className="bg-muted border-border/50"
                  />
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer group p-3 -mx-3 rounded-lg hover:bg-muted/30 active:bg-muted/50 transition-colors">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-border bg-card peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center shrink-0">
                    {smsConsent && (
                      <svg className="w-3.5 h-3.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-foreground leading-snug flex-1">
                  I agree to receive SMS updates from Xclusive Chicago
                </span>
              </label>

              <p className="text-xs text-muted-foreground leading-relaxed">
                By submitting your phone number, you agree to receive SMS messages from Xclusive Chicago related to
                your table request and booking details. Message frequency may vary. Message &amp; data rates may
                apply. Reply STOP to opt out.
              </p>

              <p className="text-xs text-muted-foreground">
                <Link href="/privacy" target="_blank" className="text-gold hover:underline">
                  Privacy Policy
                </Link>
                {' | '}
                <Link href="/terms-and-conditions" target="_blank" className="text-gold hover:underline">
                  Terms &amp; Conditions
                </Link>
              </p>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else we should know"
                  className="bg-muted border-border/50 min-h-[70px]"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold hover:bg-gold-light text-background font-medium py-6 rounded-full"
              >
                {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Request a Table'}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  )
}
