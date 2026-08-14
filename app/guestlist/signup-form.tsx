'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Users, Sparkles, Wine, Minus, Plus, Info, Bus, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Event, Club } from '@/lib/types'
import { formatPhoneInput } from '@/lib/phone'

interface SignupFormProps {
  event: Event & { club: Club }
  referredBy?: string | null
}

interface FormData {
  firstName: string
  lastName: string
  phone: string
  smsConsent: boolean
  friendCount: number
  wantsVip: boolean
  vipGroupSize: number
  vipBudget: string
  vipNotes: string
  celebrationType: string
  celebrationOther: string
  interestedInPartyBus: boolean
  interestedInBoatDay: boolean
}

export function SignupForm({ event, referredBy }: SignupFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    smsConsent: false,
    friendCount: 0,
    wantsVip: false,
    vipGroupSize: 4,
    vipBudget: '',
    vipNotes: '',
    celebrationType: '',
    celebrationOther: '',
    interestedInPartyBus: false,
    interestedInBoatDay: false,
  })

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Please enter your full name')
      return
    }

    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    if (!form.smsConsent) {
      toast.error('Please agree to receive SMS updates')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/guestlist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          clubId: event.club_id,
          eventDate: event.event_date,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.replace(/\D/g, ''),
          friendCount: form.friendCount,
          referredBy: referredBy || null,
          bottleService: form.wantsVip,
          bottleBudget: form.wantsVip ? form.vipBudget : null,
          celebrationType: form.celebrationType || null,
          celebrationOther: form.celebrationOther || null,
          vipRequest: form.wantsVip
            ? {
                groupSize: form.vipGroupSize,
                budget: form.vipBudget,
                notes: form.vipNotes,
              }
            : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      // Redirect to confirmation page with pass token and friend count
      router.push(`/guestlist/confirmed?token=${data.passToken}&friends=${form.friendCount}`)
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Referral Notice */}
      {referredBy && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gold/10 border border-gold/20 rounded-xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-sm font-medium text-gold">You were invited!</p>
            <p className="text-xs text-muted-foreground">{"You're"} joining a {"friend's"} group</p>
          </div>
        </motion.div>
      )}

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => updateForm({ firstName: e.target.value })}
              placeholder="First"
              className="pl-10 bg-card border-border/50 focus:border-gold/50"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => updateForm({ lastName: e.target.value })}
            placeholder="Last"
            className="bg-card border-border/50 focus:border-gold/50"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-3">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateForm({ phone: formatPhoneInput(e.target.value) })}
            placeholder="312-555-0123"
            className="pl-10 bg-card border-border/50 focus:border-gold/50"
            required
          />
        </div>
        
        {/* SMS Consent Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer group p-3 -mx-3 rounded-lg hover:bg-muted/30 active:bg-muted/50 transition-colors">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={form.smsConsent}
              onChange={(e) => updateForm({ smsConsent: e.target.checked })}
              className="peer sr-only"
            />
            <div className="w-6 h-6 rounded-md border-2 border-border bg-card peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center">
              {form.smsConsent && (
                <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-foreground leading-snug flex-1">
            I agree to receive SMS updates from Xclusive Chicago
          </span>
        </label>

        {/* Compliance Text */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          By submitting your phone number, you agree to receive SMS messages from Xclusive Chicago 
          related to guestlist confirmations, reminders, and event updates. Message frequency may vary. 
          Message & data rates may apply. Reply STOP to opt out.
        </p>
        
        {/* Privacy + Terms Links */}
        <p className="text-xs text-muted-foreground">
          <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a>
          {' | '}
          <a href="/terms-and-conditions" className="text-gold hover:underline">Terms & Conditions</a>
        </p>
      </div>

      {/* Inviting Friends - Only show if not referred */}
      {!referredBy && (
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <Users className="w-5 h-5 text-gold mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Inviting friends?</p>
              <p className="text-sm text-muted-foreground">
                {"We'll"} give you a link to share after you sign up
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateForm({ friendCount: Math.max(0, form.friendCount - 1) })}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-lg font-semibold">{form.friendCount}</span>
              <button
                type="button"
                onClick={() => updateForm({ friendCount: Math.min(20, form.friendCount + 1) })}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {form.friendCount === 0 ? 'Just me tonight' : `${form.friendCount} friend${form.friendCount > 1 ? 's' : ''}`}
            </span>
          </div>

          {form.friendCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-border/50"
            >
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <span className="text-foreground font-medium">Each person needs their own pass.</span>
                  {" "}After you sign up, share your invite link so your friends can get theirs.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Celebration */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          Celebrating something?
        </Label>
        <Select
          value={form.celebrationType}
          onValueChange={(value) => updateForm({ celebrationType: value })}
        >
          <SelectTrigger className="bg-card border-border/50">
            <SelectValue placeholder="Select occasion (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="birthday">Birthday</SelectItem>
            <SelectItem value="bachelorette">Bachelorette Party</SelectItem>
            <SelectItem value="bachelor">Bachelor Party</SelectItem>
            <SelectItem value="promotion">Promotion / New Job</SelectItem>
            <SelectItem value="graduation">Graduation</SelectItem>
            <SelectItem value="anniversary">Anniversary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {form.celebrationType === 'other' && (
          <Input
            value={form.celebrationOther}
            onChange={(e) => updateForm({ celebrationOther: e.target.value })}
            placeholder="What are you celebrating?"
            className="bg-card border-border/50 focus:border-gold/50"
          />
        )}
      </div>

      {/* VIP / Bottle Service */}
      <div className="bg-card border border-border/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wine className="w-5 h-5 text-gold" />
            <div>
              <p className="font-medium">Interested in VIP?</p>
              <p className="text-sm text-muted-foreground">
                Request bottle service for your group
              </p>
            </div>
          </div>
          <Switch
            checked={form.wantsVip}
            onCheckedChange={(checked) => updateForm({ wantsVip: checked })}
          />
        </div>

        <AnimatePresence>
          {form.wantsVip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-border/50"
            >
              <div className="space-y-2">
                <Label>Group Size</Label>
                <Select
                  value={form.vipGroupSize.toString()}
                  onValueChange={(value) =>
                    updateForm({ vipGroupSize: parseInt(value) })
                  }
                >
                  <SelectTrigger className="bg-muted border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 4, 6, 8, 10, 12, 15, 20].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} people
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Budget Range</Label>
                <Select
                  value={form.vipBudget}
                  onValueChange={(value) => updateForm({ vipBudget: value })}
                >
                  <SelectTrigger className="bg-muted border-border/50">
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                    <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                    <SelectItem value="2000-5000">$2,000 - $5,000</SelectItem>
                    <SelectItem value="5000+">$5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Special Requests</Label>
                <Textarea
                  value={form.vipNotes}
                  onChange={(e) => updateForm({ vipNotes: e.target.value })}
                  placeholder="Any special requests or preferences..."
                  className="bg-muted border-border/50 focus:border-gold/50 min-h-[80px]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interest in Premium Experiences - Optional */}
      <div className="bg-card/50 border border-border/30 rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-3">
          Interested in premium experiences? <span className="text-muted-foreground/60">(optional)</span>
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={form.interestedInPartyBus}
                onChange={(e) => updateForm({ interestedInPartyBus: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border border-border bg-background peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center">
                {form.interestedInPartyBus && (
                  <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <Bus className="w-4 h-4 text-gold/70" />
            <span className="text-sm">Party Bus</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={form.interestedInBoatDay}
                onChange={(e) => updateForm({ interestedInBoatDay: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border border-border bg-background peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center">
                {form.interestedInBoatDay && (
                  <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <Ship className="w-4 h-4 text-gold/70" />
            <span className="text-sm">Boat Day</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold hover:bg-gold-light text-background font-medium py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <Spinner className="w-5 h-5" />
            <span>Securing your spot...</span>
          </div>
        ) : (
          'Get My Pass'
        )}
      </Button>

    </form>
  )
}
