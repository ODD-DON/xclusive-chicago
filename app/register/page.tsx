"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateVoucherCode, generateQRToken, isValidEmail, isValidPhone } from "@/lib/activationUtils"
import type { Venue } from "@/lib/activationTypes"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    selectedVenueId: "",
    eventDate: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    menCount: "",
    womenCount: "",
    bottleService: false,
    bottleBudget: "",
    instagram: "",
    interestLimo: false,
    interestBoat: false,
    celebrationType: "",
    celebrationOther: "",
  })

  useEffect(() => {
    fetchVenues()
  }, [])

  async function fetchVenues() {
    try {
      const { data, error } = await supabase.from("xc_venues").select("*").order("name")
      if (error) throw error
      setVenues(data || [])
    } catch (err) {
      console.error("[v0] Error fetching venues:", err)
      setError("Failed to load venues")
    }
  }

  function validateStep1() {
    if (!formData.selectedVenueId) {
      setError("Please select a venue")
      return false
    }
    if (!formData.eventDate) {
      setError("Please select an event date")
      return false
    }
    setError("")
    return true
  }

  function validateStep2() {
    if (!formData.firstName.trim()) {
      setError("First name is required")
      return false
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required")
      return false
    }
    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (!isValidPhone(formData.phone)) {
      setError("Please enter a valid 10-digit phone number")
      return false
    }
    setError("")
    return true
  }

  async function handleSubmit() {
    if (!validateStep2()) return

    setLoading(true)
    setError("")

    try {
      // Create or get event
      const { data: existingEvent } = await supabase
        .from("xc_events")
        .select("id")
        .eq("venue_id", formData.selectedVenueId)
        .eq("event_date", formData.eventDate)
        .single()

      let eventId = existingEvent?.id

      if (!eventId) {
        const { data: newEvent, error: eventError } = await supabase
          .from("xc_events")
          .insert({
            venue_id: formData.selectedVenueId,
            event_date: formData.eventDate,
          })
          .select("id")
          .single()

        if (eventError) throw eventError
        eventId = newEvent.id
      }

      // Generate unique codes
      const voucherCode = generateVoucherCode()
      const qrToken = generateQRToken()

      // Create registration
      const totalCount = (parseInt(formData.menCount) || 0) + (parseInt(formData.womenCount) || 0)

      const { data: registration, error: regError } = await supabase
        .from("xc_registrations")
        .insert({
          event_id: eventId,
          venue_id: formData.selectedVenueId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          men_count: parseInt(formData.menCount) || null,
          women_count: parseInt(formData.womenCount) || null,
          total_count: totalCount || null,
          bottle_service: formData.bottleService,
          bottle_budget: formData.bottleBudget || null,
          instagram: formData.instagram || null,
          interest_limo: formData.interestLimo,
          interest_boat: formData.interestBoat,
          celebration_type: formData.celebrationType || null,
          celebration_other: formData.celebrationOther || null,
          voucher_code: voucherCode,
          qr_token: qrToken,
          status: "REGISTERED",
        })
        .select("id, voucher_code")
        .single()

      if (regError) throw regError

      // Redirect to confirmation page with voucher code
      router.push(`/confirmation?code=${registration.voucher_code}`)
    } catch (err: any) {
      console.error("[v0] Error creating registration:", err)
      setError(err.message || "Failed to create registration")
    } finally {
      setLoading(false)
    }
  }

  const selectedVenue = venues.find((v) => v.id === formData.selectedVenueId)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-balance mb-2">Xclusive Chicago</h1>
          <p className="text-muted-foreground">Reserve your spot at Chicago's finest venues</p>
        </div>

        <Card className="p-6 md:p-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                1
              </div>
              <span className="text-sm font-medium">Venue</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                2
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                3
              </div>
              <span className="text-sm font-medium">Extras</span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Venue Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="venue" className="text-base font-medium mb-3 block">
                  Select Venue
                </Label>
                <Select value={formData.selectedVenueId} onValueChange={(val) => setFormData({ ...formData, selectedVenueId: val })}>
                  <SelectTrigger id="venue">
                    <SelectValue placeholder="Choose a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        <div>
                          <div className="font-medium">{venue.name}</div>
                          {venue.vibe_text && <div className="text-xs text-muted-foreground">{venue.vibe_text}</div>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVenue?.address && <p className="text-sm text-muted-foreground mt-2">{selectedVenue.address}</p>}
              </div>

              <div>
                <Label htmlFor="eventDate" className="text-base font-medium mb-3 block">
                  Event Date
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <Button className="w-full" size="lg" onClick={() => validateStep1() && setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="menCount">Men Count</Label>
                  <Input
                    id="menCount"
                    type="number"
                    min="0"
                    value={formData.menCount}
                    onChange={(e) => setFormData({ ...formData, menCount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="womenCount">Women Count</Label>
                  <Input
                    id="womenCount"
                    type="number"
                    min="0"
                    value={formData.womenCount}
                    onChange={(e) => setFormData({ ...formData, womenCount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => validateStep2() && setStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Additional Options */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bottleService"
                    checked={formData.bottleService}
                    onCheckedChange={(checked) => setFormData({ ...formData, bottleService: !!checked })}
                  />
                  <Label htmlFor="bottleService" className="font-normal cursor-pointer">
                    Interested in bottle service
                  </Label>
                </div>

                {formData.bottleService && (
                  <div>
                    <Label htmlFor="bottleBudget">Bottle Service Budget</Label>
                    <Select value={formData.bottleBudget} onValueChange={(val) => setFormData({ ...formData, bottleBudget: val })}>
                      <SelectTrigger id="bottleBudget">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$500-$1000">$500 - $1,000</SelectItem>
                        <SelectItem value="$1000-$2500">$1,000 - $2,500</SelectItem>
                        <SelectItem value="$2500-$5000">$2,500 - $5,000</SelectItem>
                        <SelectItem value="$5000+">$5,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="instagram">Instagram Handle (Optional)</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@yourusername"
                />
              </div>

              <div className="space-y-3">
                <Label>Additional Interests</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="interestLimo"
                      checked={formData.interestLimo}
                      onCheckedChange={(checked) => setFormData({ ...formData, interestLimo: !!checked })}
                    />
                    <Label htmlFor="interestLimo" className="font-normal cursor-pointer">
                      Limo service
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="interestBoat"
                      checked={formData.interestBoat}
                      onCheckedChange={(checked) => setFormData({ ...formData, interestBoat: !!checked })}
                    />
                    <Label htmlFor="interestBoat" className="font-normal cursor-pointer">
                      Boat party
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="celebration">Celebrating Something Special? (Optional)</Label>
                <Select value={formData.celebrationType} onValueChange={(val) => setFormData({ ...formData, celebrationType: val })}>
                  <SelectTrigger id="celebration">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Birthday">Birthday</SelectItem>
                    <SelectItem value="Bachelor/Bachelorette">Bachelor/Bachelorette</SelectItem>
                    <SelectItem value="Anniversary">Anniversary</SelectItem>
                    <SelectItem value="Corporate Event">Corporate Event</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.celebrationType === "Other" && (
                <div>
                  <Label htmlFor="celebrationOther">Please Specify</Label>
                  <Input
                    id="celebrationOther"
                    value={formData.celebrationOther}
                    onChange={(e) => setFormData({ ...formData, celebrationOther: e.target.value })}
                    placeholder="Tell us about your celebration"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={loading}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Complete Registration"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
