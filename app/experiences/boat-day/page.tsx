'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Ship, Users, Sun, Waves, Clock, Check, Music, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { CELEBRATION_TYPES } from '@/lib/types'
import { formatPhoneInput } from '@/lib/phone'

const CRUISE_TYPES = [
  { 
    value: 'public_day_party', 
    label: 'Public Day Party', 
    description: 'Join other groups for a day party on the lake',
    icon: Music,
  },
  { 
    value: 'sunset_cruise', 
    label: 'Sunset Cruise', 
    description: 'Golden hour views of the skyline',
    icon: Sun,
  },
  { 
    value: 'private_charter', 
    label: 'Private Charter', 
    description: 'Book the whole boat for your group',
    icon: Ship,
  },
]

const TIME_SLOTS = [
  { value: 'morning', label: '11am - 2pm', description: 'Morning cruise' },
  { value: 'afternoon', label: '2pm - 5pm', description: 'Afternoon party' },
  { value: 'sunset', label: '5pm - 8pm', description: 'Sunset cruise' },
  { value: 'evening', label: '8pm - 11pm', description: 'Night cruise' },
]

const AMENITY_OPTIONS = [
  { value: 'open_bar', label: 'Open Bar' },
  { value: 'dj', label: 'DJ / Sound System' },
  { value: 'catering', label: 'Food / Catering' },
  { value: 'decorations', label: 'Decorations' },
]

export default function BoatDayPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    instagram: '',
    preferredDate: '',
    flexibleDates: false,
    groupSize: 15,
    cruiseType: '',
    timeSlot: '',
    departureLocation: 'Navy Pier',
    amenities: [] as string[],
    celebrationType: '',
    celebrationOther: '',
    homeCity: '',
    specialRequests: '',
  })

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!form.cruiseType) {
      toast.error('Please select a cruise type')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/experiences/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceType: 'boat_day',
          ...form,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit')

      setIsSubmitted(true)
      toast.success('Request submitted!')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPrivateCharter = form.cruiseType === 'private_charter'

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-gold" />
            </div>
            <h1 className="text-2xl font-medium mb-3">Request Received!</h1>
            <p className="text-muted-foreground mb-8">
              We&apos;ll text you within 24 hours with boat day availability and pricing.
            </p>
            <Link href="/">
              <Button variant="outline" className="rounded-full">
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="XCLUSIVE" width={32} height={32} className="object-contain" />
            <span className="font-medium">Boat Day</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Ship className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-3">
            Boat <span className="text-gold-gradient font-medium">Days</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Lake Michigan never looked this good. Day parties on the water with the best views of the Chicago skyline.
          </p>
          <p className="text-gold text-sm mt-3">Season: May - September</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: Sun, label: 'Day & Sunset cruises' },
            { icon: Waves, label: 'Skyline views' },
            { icon: Users, label: '10-150+ guests' },
            { icon: Clock, label: '3-4 hour cruises' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="bg-card border border-border/50 rounded-xl p-4 text-center"
            >
              <feature.icon className="w-5 h-5 text-gold mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{feature.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6"
        >
          <div className="text-center mb-2">
            <h2 className="text-xl font-medium">Book a Boat Day</h2>
            <p className="text-sm text-muted-foreground">Fill out the details and we&apos;ll text you with options</p>
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateForm({ firstName: e.target.value })}
                placeholder="First name"
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateForm({ lastName: e.target.value })}
                placeholder="Last name"
                className="bg-background"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm({ phone: formatPhoneInput(e.target.value) })}
                placeholder="312-555-0123"
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="you@email.com"
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={form.instagram}
              onChange={(e) => updateForm({ instagram: e.target.value })}
              placeholder="@username"
              className="bg-background"
            />
          </div>

          {/* Group Size -- always asked, not gated behind cruise type */}
          <div className="border-t border-border/30 pt-6">
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-5">
              <Label className="text-center block mb-4">How many people in your group?</Label>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => updateForm({ groupSize: Math.max(1, form.groupSize - 1) })}
                  className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center hover:border-gold/50 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center min-w-[80px]">
                  <span className="text-4xl font-medium text-gold">{form.groupSize}</span>
                  <p className="text-xs text-muted-foreground mt-1">guests</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm({ groupSize: Math.min(200, form.groupSize + 1) })}
                  className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center hover:border-gold/50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Occasion -- always asked, not gated behind cruise type */}
          <div>
            <Label className="mb-3 block">What&apos;s the occasion?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CELEBRATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateForm({ celebrationType: form.celebrationType === type ? '' : type })}
                  className={`px-3 py-2.5 rounded-lg text-sm border text-center transition-colors ${
                    form.celebrationType === type
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border/50 text-muted-foreground hover:border-gold/30'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {form.celebrationType === 'Other' && (
              <Input
                value={form.celebrationOther}
                onChange={(e) => updateForm({ celebrationOther: e.target.value })}
                placeholder="Tell us what you're celebrating"
                className="bg-background mt-3"
              />
            )}
          </div>

          {/* Home City -- optional, not gated behind cruise type */}
          <div className="space-y-2">
            <Label htmlFor="homeCity">Traveling in for this? (optional)</Label>
            <Input
              id="homeCity"
              value={form.homeCity}
              onChange={(e) => updateForm({ homeCity: e.target.value })}
              placeholder="Which city are you coming from?"
              className="bg-background"
            />
          </div>

          {/* Cruise Type Selection */}
          <div className="border-t border-border/30 pt-6">
            <h3 className="font-medium mb-4">What type of cruise?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {CRUISE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateForm({ cruiseType: type.value })}
                  className={`p-5 rounded-xl border text-left transition-all ${
                    form.cruiseType === type.value
                      ? 'border-gold bg-gold/10'
                      : 'border-border/50 hover:border-gold/30'
                  }`}
                >
                  <type.icon className={`w-6 h-6 mb-3 ${form.cruiseType === type.value ? 'text-gold' : 'text-muted-foreground'}`} />
                  <p className={`font-medium ${form.cruiseType === type.value ? 'text-gold' : ''}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields based on Cruise Type */}
          <AnimatePresence mode="wait">
            {form.cruiseType && (
              <motion.div
                key="cruise_details"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                {/* Event Details */}
                <div className="border-t border-border/30 pt-6">
                  <h3 className="font-medium mb-4">When do you want to go?</h3>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={form.preferredDate}
                      onChange={(e) => updateForm({ preferredDate: e.target.value })}
                      className="bg-background"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={form.flexibleDates}
                      onChange={(e) => updateForm({ flexibleDates: e.target.checked })}
                      className="w-4 h-4 rounded border-border accent-gold"
                    />
                    <span className="text-sm text-muted-foreground">I&apos;m flexible on dates</span>
                  </label>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="departureLocation">Departure Location</Label>
                    <Input
                      id="departureLocation"
                      value={form.departureLocation}
                      onChange={(e) => updateForm({ departureLocation: e.target.value })}
                      placeholder="Navy Pier, Burnham Harbor, etc."
                      className="bg-background"
                    />
                  </div>

                  {/* Time Slot */}
                  <div className="mt-4">
                    <Label className="mb-3 block">Preferred Time</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => updateForm({ timeSlot: slot.value })}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            form.timeSlot === slot.value
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-border/50 hover:border-gold/30'
                          }`}
                        >
                          <p className="font-medium text-sm">{slot.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{slot.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Private Charter: Amenities */}
                {isPrivateCharter && (
                  <div className="border-t border-border/30 pt-6">
                    <h3 className="font-medium mb-4">Tell us about your event</h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-3 block">What amenities do you need?</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {AMENITY_OPTIONS.map((amenity) => (
                            <label
                              key={amenity.value}
                              className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
                                form.amenities.includes(amenity.value)
                                  ? 'border-gold bg-gold/10'
                                  : 'border-border/50 hover:border-gold/30'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.amenities.includes(amenity.value)}
                                onChange={() => toggleAmenity(amenity.value)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                form.amenities.includes(amenity.value)
                                  ? 'border-gold bg-gold'
                                  : 'border-border'
                              }`}>
                                {form.amenities.includes(amenity.value) && (
                                  <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm">{amenity.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

          {/* Special Requests */}
          <div className="border-t border-border/30 pt-6">
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests or Notes</Label>
              <Textarea
                id="specialRequests"
                value={form.specialRequests}
                onChange={(e) => updateForm({ specialRequests: e.target.value })}
                placeholder="Anything else we should know? Dietary restrictions, specific requests, etc."
                className="bg-background min-h-[100px]"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold hover:bg-gold-light text-background font-medium py-6 rounded-full"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Spinner className="w-5 h-5" />
                <span>Submitting...</span>
              </div>
            ) : (
              'Request Boat Day'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We&apos;ll text you within 24 hours with availability and pricing
          </p>
        </motion.form>
      </div>
    </main>
  )
}
