'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bus, Users, Clock, Music, Sparkles, Check, MapPin, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'

// Pricing tiers
const PACKAGES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Premium sound system & LED lights',
    basePrice: 600,
    pricePerHour: 150,
    features: ['Sound system', 'LED lights', 'AC/Heat', 'Professional driver'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Everything standard + upgraded amenities',
    basePrice: 900,
    pricePerHour: 200,
    features: ['Everything in Standard', 'Fog machine', 'Laser lights', 'Bluetooth aux', 'Coolers included'],
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'The ultimate party bus experience',
    basePrice: 1400,
    pricePerHour: 300,
    features: ['Everything in Premium', 'Pole', 'Strobe lights', 'Red carpet arrival', 'Complimentary champagne'],
  },
]

const DURATION_OPTIONS = [
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
  { value: 5, label: '5 hours' },
  { value: 6, label: '6+ hours' },
]

type TripType = 'pickup_dropoff' | 'duration_cruise' | null

export default function PartyBusPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [tripType, setTripType] = useState<TripType>(null)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    instagram: '',
    preferredDate: '',
    flexibleDates: false,
    groupSize: 10,
    // Pickup & Dropoff fields
    pickupLocation: '',
    pickupTime: '',
    destination: '',
    returnLocation: '',
    returnTime: '',
    // Duration cruise fields
    cruisePickupLocation: '',
    durationHours: 4,
    returnToSame: true,
    differentReturnLocation: '',
    // General
    specialRequests: '',
  })

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!selectedPackage || !tripType) return null

    const pkg = PACKAGES.find((p) => p.id === selectedPackage)
    if (!pkg) return null

    let totalPrice = pkg.basePrice
    if (tripType === 'duration_cruise') {
      // Add hourly rate for duration trips
      const extraHours = Math.max(0, form.durationHours - 3) // First 3 hours included in base
      totalPrice += extraHours * pkg.pricePerHour
    }

    const perPerson = form.groupSize > 0 ? totalPrice / form.groupSize : totalPrice

    return {
      total: totalPrice,
      perPerson: Math.ceil(perPerson),
      package: pkg,
    }
  }, [selectedPackage, tripType, form.durationHours, form.groupSize])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!tripType) {
      toast.error('Please select a trip type')
      return
    }

    if (!selectedPackage) {
      toast.error('Please select a package')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/experiences/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceType: 'party_bus',
          tripType,
          selectedPackage,
          estimatedTotal: pricing?.total,
          estimatedPerPerson: pricing?.perPerson,
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
            <p className="text-muted-foreground mb-4">
              We&apos;ll text you within 24 hours with availability and final pricing.
            </p>
            {pricing && (
              <div className="bg-card border border-border/50 rounded-xl p-4 mb-8 text-left">
                <p className="text-sm text-muted-foreground mb-2">Your estimate:</p>
                <p className="text-2xl font-medium text-gold">${pricing.total}</p>
                <p className="text-sm text-muted-foreground">
                  ~${pricing.perPerson}/person for {form.groupSize} guests
                </p>
              </div>
            )}
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
            <span className="font-medium">Party Bus</span>
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
            <Bus className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-3">
            Party <span className="text-gold-gradient font-medium">Bus</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Roll up in style with your crew. Premium sound systems, LED lights, and the best vibes in Chicago.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: Users, label: 'Up to 40 guests' },
            { icon: Music, label: 'Premium sound' },
            { icon: Sparkles, label: 'LED lighting' },
            { icon: Clock, label: '3-6+ hours' },
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
            <h2 className="text-xl font-medium">Request a Quote</h2>
            <p className="text-sm text-muted-foreground">Fill out the details and we&apos;ll text you with options</p>
          </div>

          {/* Group Size - First thing we ask */}
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
                onClick={() => updateForm({ groupSize: Math.min(50, form.groupSize + 1) })}
                className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center hover:border-gold/50 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Trip Type Selection */}
          <div>
            <h3 className="font-medium mb-4">What type of trip?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTripType('pickup_dropoff')}
                className={`p-5 rounded-xl border text-left transition-all ${
                  tripType === 'pickup_dropoff'
                    ? 'border-gold bg-gold/10'
                    : 'border-border/50 hover:border-gold/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className={`w-5 h-5 ${tripType === 'pickup_dropoff' ? 'text-gold' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${tripType === 'pickup_dropoff' ? 'text-gold' : ''}`}>
                    Pickup & Dropoff
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Take us from point A to point B
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTripType('duration_cruise')}
                className={`p-5 rounded-xl border text-left transition-all ${
                  tripType === 'duration_cruise'
                    ? 'border-gold bg-gold/10'
                    : 'border-border/50 hover:border-gold/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className={`w-5 h-5 ${tripType === 'duration_cruise' ? 'text-gold' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${tripType === 'duration_cruise' ? 'text-gold' : ''}`}>
                    Duration Trip
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cruise around for a set number of hours
                </p>
              </button>
            </div>
          </div>

          {/* Duration Selection (only for duration trips) */}
          <AnimatePresence>
            {tripType === 'duration_cruise' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="font-medium mb-4">How long?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateForm({ durationHours: option.value })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        form.durationHours === option.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border/50 hover:border-gold/30'
                      }`}
                    >
                      <p className="font-medium text-sm">{option.label}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Package Selection */}
          {tripType && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-medium mb-4">Choose your package</h3>
              <div className="space-y-4">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage === pkg.id
                  let pkgTotal = pkg.basePrice
                  if (tripType === 'duration_cruise') {
                    const extraHours = Math.max(0, form.durationHours - 3)
                    pkgTotal += extraHours * pkg.pricePerHour
                  }
                  const perPerson = form.groupSize > 0 ? Math.ceil(pkgTotal / form.groupSize) : pkgTotal

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`w-full p-5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-gold bg-gold/10'
                          : 'border-border/50 hover:border-gold/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className={`font-medium text-lg ${isSelected ? 'text-gold' : ''}`}>
                            {pkg.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-medium ${isSelected ? 'text-gold' : ''}`}>
                            ${perPerson}
                          </p>
                          <p className="text-xs text-muted-foreground">/person</p>
                        </div>
                      </div>
                      
                      {/* Total breakdown */}
                      <div className="bg-background/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            ${perPerson}/person x {form.groupSize} guests
                          </span>
                          <span className="font-medium">${pkgTotal} total</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2">
                        {pkg.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-xs bg-background/50 text-muted-foreground px-2 py-1 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Live Pricing Summary - Sticky on mobile */}
          <AnimatePresence>
            {pricing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Your estimate</span>
                  <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                    {pricing.package.name}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-medium text-gold">${pricing.perPerson}</p>
                    <p className="text-sm text-muted-foreground">/person</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium">${pricing.total}</p>
                    <p className="text-sm text-muted-foreground">total for {form.groupSize}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trip Details */}
          <AnimatePresence mode="wait">
            {tripType === 'pickup_dropoff' && (
              <motion.div
                key="pickup_dropoff"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border/30 pt-6 space-y-4"
              >
                <h3 className="font-medium mb-4">Trip Details</h3>
                
                <div className="bg-background/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-gold text-sm font-medium">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs">1</div>
                    Pickup
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickupLocation">Pickup Location *</Label>
                      <Input
                        id="pickupLocation"
                        value={form.pickupLocation}
                        onChange={(e) => updateForm({ pickupLocation: e.target.value })}
                        placeholder="Address or neighborhood"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickupTime">Pickup Time</Label>
                      <Input
                        id="pickupTime"
                        type="time"
                        value={form.pickupTime}
                        onChange={(e) => updateForm({ pickupTime: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-background/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-gold text-sm font-medium">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs">2</div>
                    Destination
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Where are we taking you? *</Label>
                    <Input
                      id="destination"
                      value={form.destination}
                      onChange={(e) => updateForm({ destination: e.target.value })}
                      placeholder="Club, venue, or address"
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="bg-background/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-gold text-sm font-medium">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs">3</div>
                    Return (Optional)
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="returnLocation">Return Location</Label>
                      <Input
                        id="returnLocation"
                        value={form.returnLocation}
                        onChange={(e) => updateForm({ returnLocation: e.target.value })}
                        placeholder="Same as pickup or different"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnTime">Return Time</Label>
                      <Input
                        id="returnTime"
                        type="time"
                        value={form.returnTime}
                        onChange={(e) => updateForm({ returnTime: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tripType === 'duration_cruise' && (
              <motion.div
                key="duration_cruise"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border/30 pt-6 space-y-4"
              >
                <h3 className="font-medium mb-4">Trip Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="cruisePickupLocation">Pickup Location</Label>
                  <Input
                    id="cruisePickupLocation"
                    value={form.cruisePickupLocation}
                    onChange={(e) => updateForm({ cruisePickupLocation: e.target.value })}
                    placeholder="Where should we pick you up?"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-3 mt-4">
                  <Label>Return to same location?</Label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border/50 hover:border-gold/30 transition-all">
                    <input
                      type="radio"
                      name="returnOption"
                      checked={form.returnToSame}
                      onChange={() => updateForm({ returnToSame: true })}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-sm">Yes, return to pickup location</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border/50 hover:border-gold/30 transition-all">
                    <input
                      type="radio"
                      name="returnOption"
                      checked={!form.returnToSame}
                      onChange={() => updateForm({ returnToSame: false })}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-sm">No, drop us somewhere else</span>
                  </label>
                  {!form.returnToSame && (
                    <div className="space-y-2 pl-7">
                      <Input
                        value={form.differentReturnLocation}
                        onChange={(e) => updateForm({ differentReturnLocation: e.target.value })}
                        placeholder="Return location"
                        className="bg-background"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contact Info */}
          <div className="border-t border-border/30 pt-6">
            <h3 className="font-medium mb-4">Contact Info</h3>
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

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm({ phone: e.target.value })}
                  placeholder="(312) 555-0123"
                  className="bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred Date</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => updateForm({ preferredDate: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={form.flexibleDates}
                onChange={(e) => updateForm({ flexibleDates: e.target.checked })}
                className="w-4 h-4 rounded border-border accent-gold"
              />
              <span className="text-sm text-muted-foreground">I&apos;m flexible on dates</span>
            </label>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests (optional)</Label>
            <Textarea
              id="specialRequests"
              value={form.specialRequests}
              onChange={(e) => updateForm({ specialRequests: e.target.value })}
              placeholder="Birthday, bachelorette, specific stops along the way, etc."
              rows={3}
              className="bg-background resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || !tripType || !selectedPackage}
            className="w-full bg-gold hover:bg-gold-light text-background font-medium py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Spinner className="w-5 h-5" />
                <span>Submitting...</span>
              </div>
            ) : pricing ? (
              `Request Quote · $${pricing.perPerson}/person`
            ) : (
              'Request Quote'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We&apos;ll text you within 24 hours to confirm availability and finalize details.
          </p>
        </motion.form>
      </div>
    </main>
  )
}
