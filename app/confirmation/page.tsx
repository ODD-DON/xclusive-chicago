"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { RegistrationWithVenue } from "@/lib/activationTypes"
import QRCode from "react-qr-code"
import Link from "next/link"

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const voucherCode = searchParams.get("code")
  const [registration, setRegistration] = useState<RegistrationWithVenue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (voucherCode) {
      fetchRegistration()
    }
  }, [voucherCode])

  async function fetchRegistration() {
    try {
      const { data, error } = await supabase
        .from("xc_registrations")
        .select(
          `
          *,
          venue:xc_venues(*)
        `
        )
        .eq("voucher_code", voucherCode)
        .single()

      if (error) throw error
      setRegistration(data as any)
    } catch (err) {
      console.error("[v0] Error fetching registration:", err)
      setError("Registration not found")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Registration Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "Invalid voucher code"}</p>
          <Link href="/register">
            <Button>Create New Registration</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const activationUrl = `${window.location.origin}/activate/${registration.qr_token}`

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Registration Complete!</h1>
          <p className="text-muted-foreground">
            You're on the list for {registration.venue.name}
          </p>
        </div>

        <Card className="p-6 md:p-8 space-y-6">
          {/* Voucher Code */}
          <div className="text-center border-b pb-6">
            <p className="text-sm text-muted-foreground mb-2">Your Voucher Code</p>
            <div className="text-4xl font-bold tracking-wider font-mono bg-muted px-6 py-4 rounded-lg inline-block">
              {registration.voucher_code}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Save this code for entry</p>
          </div>

          {/* QR Code */}
          <div className="text-center border-b pb-6">
            <p className="text-sm text-muted-foreground mb-4">Activation QR Code</p>
            <div className="bg-white p-6 rounded-lg inline-block">
              <QRCode value={activationUrl} size={200} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 max-w-sm mx-auto">
              Scan this QR code when you arrive at the venue to activate your guest list entry
            </p>
          </div>

          {/* Registration Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Registration Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">
                  {registration.first_name} {registration.last_name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{registration.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{registration.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Party Size</p>
                <p className="font-medium">{registration.total_count || "Not specified"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Venue</p>
                <p className="font-medium">{registration.venue.name}</p>
                {registration.venue.address && (
                  <p className="text-xs text-muted-foreground mt-1">{registration.venue.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">Next Steps:</h4>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>Save this page or take a screenshot of your voucher code</li>
              <li>Arrive at the venue on your event date between 6 PM - 12 AM</li>
              <li>Scan the QR code or enter your voucher code to activate your entry</li>
              <li>You must be within 0.5 miles of the venue to activate</li>
            </ol>
          </div>

          <div className="flex gap-4">
            <Link href="/register" className="flex-1">
              <Button variant="outline" className="w-full">
                New Registration
              </Button>
            </Link>
            <Button 
              className="flex-1"
              onClick={() => window.print()}
            >
              Print Confirmation
            </Button>
          </div>
        </Card>

        {/* Status Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-card border rounded-full px-4 py-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium">Status: {registration.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
