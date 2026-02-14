"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { calculateDistance, isWithinEventWindow } from "@/lib/activationUtils"
import type { RegistrationWithVenue } from "@/lib/activationTypes"

export default function ActivatePage() {
  const params = useParams()
  const token = params.token as string
  const [registration, setRegistration] = useState<RegistrationWithVenue | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState("")

  useEffect(() => {
    if (token) {
      fetchRegistration()
    }
  }, [token])

  useEffect(() => {
    requestLocation()
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        console.log("[v0] User location obtained:", position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        setLocationError(`Location access denied: ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  async function fetchRegistration() {
    try {
      const { data, error } = await supabase
        .from("xc_registrations")
        .select(
          `
          *,
          venue:xc_venues(*),
          event:xc_events(*)
        `
        )
        .eq("qr_token", token)
        .single()

      if (error) throw error
      setRegistration(data as any)
      console.log("[v0] Registration loaded:", data)
    } catch (err) {
      console.error("[v0] Error fetching registration:", err)
      setError("Invalid QR code or registration not found")
    } finally {
      setLoading(false)
    }
  }

  async function handleActivate() {
    if (!registration || !userLocation) return

    setActivating(true)
    setError("")

    try {
      // Check if already activated
      if (registration.status === "ACTIVATED") {
        setError("This guest list entry has already been activated")
        setActivating(false)
        return
      }

      // Check if expired
      if (registration.status === "EXPIRED") {
        setError("This guest list entry has expired")
        setActivating(false)
        return
      }

      // Check event time window (6pm - 11:59pm on event date)
      const eventDate = (registration as any).event?.event_date
      if (!eventDate) {
        setError("Event date not found")
        setActivating(false)
        return
      }

      if (!isWithinEventWindow(eventDate)) {
        setError("Activation is only available on the event date between 6 PM and 12 AM")
        setActivating(false)
        return
      }

      // Check geofence
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        registration.venue.lat,
        registration.venue.lng
      )

      console.log("[v0] Distance from venue:", distance, "miles")

      if (distance > registration.venue.geofence_miles) {
        setError(
          `You must be within ${registration.venue.geofence_miles} mile(s) of ${registration.venue.name} to activate. You are currently ${distance.toFixed(2)} miles away.`
        )
        setActivating(false)
        return
      }

      // Calculate expiration time (2 hours from activation)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 2)

      // Update registration status
      const { error: updateError } = await supabase
        .from("xc_registrations")
        .update({
          status: "ACTIVATED",
          activated_at: new Date().toISOString(),
          activation_lat: userLocation.lat,
          activation_lng: userLocation.lng,
          activation_distance_miles: distance,
          activation_expires_at: expiresAt.toISOString(),
        })
        .eq("id", registration.id)

      if (updateError) throw updateError

      console.log("[v0] Registration activated successfully")
      setSuccess(true)
    } catch (err: any) {
      console.error("[v0] Error activating registration:", err)
      setError(err.message || "Failed to activate registration")
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading registration...</p>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid QR Code</h1>
          <p className="text-muted-foreground">{error || "Registration not found"}</p>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Activated!</h1>
          <p className="text-muted-foreground mb-6">
            Your guest list entry for {registration.venue.name} is now active
          </p>
          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <p className="font-medium mb-1">Valid for 2 hours</p>
            <p className="text-muted-foreground">Show this screen to the door staff for entry</p>
          </div>
          <div className="mt-6 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">
                {registration.first_name} {registration.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Party Size:</span>
              <span className="font-medium">{registration.total_count || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code:</span>
              <span className="font-medium font-mono">{registration.voucher_code}</span>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const eventDate = (registration as any).event?.event_date
  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, registration.venue.lat, registration.venue.lng)
    : null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Activate Guest List</h1>
          <p className="text-muted-foreground">Verify your location to activate entry</p>
        </div>

        <Card className="p-6 md:p-8 space-y-6">
          {/* Registration Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">{registration.venue.name}</h3>
              {registration.venue.address && <p className="text-sm text-muted-foreground">{registration.venue.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">
                  {registration.first_name} {registration.last_name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Voucher Code</p>
                <p className="font-medium font-mono">{registration.voucher_code}</p>
              </div>
              {registration.total_count && (
                <div>
                  <p className="text-muted-foreground">Party Size</p>
                  <p className="font-medium">{registration.total_count}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{registration.status}</p>
              </div>
            </div>
          </div>

          {/* Location Status */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="font-semibold">Location Verification</h4>

            {locationError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
                {locationError}
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={requestLocation}>
                  Try Again
                </Button>
              </div>
            )}

            {!locationError && !userLocation && (
              <div className="bg-muted/50 p-4 rounded-lg text-sm">
                <p className="text-muted-foreground">Requesting location access...</p>
              </div>
            )}

            {userLocation && distance !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Distance from Venue:</span>
                  <span className={`font-medium ${distance <= registration.venue.geofence_miles ? "text-green-600" : "text-destructive"}`}>
                    {distance.toFixed(2)} miles
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Required Distance:</span>
                  <span className="font-medium">Within {registration.venue.geofence_miles} mile(s)</span>
                </div>

                {distance <= registration.venue.geofence_miles ? (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-4 py-2 rounded text-sm">
                    ✓ You are within range to activate
                  </div>
                ) : (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded text-sm">
                    You are too far from the venue to activate
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">{error}</div>
          )}

          {/* Activate Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleActivate}
            disabled={!userLocation || activating || registration.status === "ACTIVATED"}
          >
            {activating ? "Activating..." : registration.status === "ACTIVATED" ? "Already Activated" : "Activate Guest List Entry"}
          </Button>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
            <h5 className="font-semibold">Activation Requirements:</h5>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Must be within {registration.venue.geofence_miles} mile(s) of the venue</li>
              <li>Must activate between 6 PM - 12 AM on event date</li>
              <li>Entry valid for 2 hours after activation</li>
              <li>Location services must be enabled</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
