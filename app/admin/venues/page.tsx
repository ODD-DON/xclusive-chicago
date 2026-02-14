"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Venue } from "@/lib/activationTypes"
import Link from "next/link"

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    vibe_text: "",
    lat: "",
    lng: "",
    geofence_miles: "0.5",
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
    } finally {
      setLoading(false)
    }
  }

  function openDialog(venue?: Venue) {
    if (venue) {
      setEditingVenue(venue)
      setFormData({
        name: venue.name,
        address: venue.address || "",
        vibe_text: venue.vibe_text || "",
        lat: venue.lat.toString(),
        lng: venue.lng.toString(),
        geofence_miles: venue.geofence_miles.toString(),
      })
    } else {
      setEditingVenue(null)
      setFormData({
        name: "",
        address: "",
        vibe_text: "",
        lat: "",
        lng: "",
        geofence_miles: "0.5",
      })
    }
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editingVenue) {
        const { error } = await supabase
          .from("xc_venues")
          .update({
            name: formData.name,
            address: formData.address || null,
            vibe_text: formData.vibe_text || null,
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
            geofence_miles: parseFloat(formData.geofence_miles),
          })
          .eq("id", editingVenue.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("xc_venues").insert([
          {
            name: formData.name,
            address: formData.address || null,
            vibe_text: formData.vibe_text || null,
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
            geofence_miles: parseFloat(formData.geofence_miles),
          },
        ])

        if (error) throw error
      }

      setDialogOpen(false)
      fetchVenues()
    } catch (err) {
      console.error("[v0] Error saving venue:", err)
      alert("Failed to save venue")
    }
  }

  async function handleDelete(venue: Venue) {
    if (!confirm(`Are you sure you want to delete ${venue.name}?`)) return

    try {
      const { error } = await supabase.from("xc_venues").delete().eq("id", venue.id)
      if (error) throw error
      fetchVenues()
    } catch (err) {
      console.error("[v0] Error deleting venue:", err)
      alert("Failed to delete venue")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading venues...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Venues</h1>
            <p className="text-muted-foreground mt-1">Manage nightclub venues and locations</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/admin/registrations">
              <Button variant="outline">Registrations</Button>
            </Link>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>Add Venue</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingVenue ? "Edit Venue" : "Add New Venue"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Venue Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Studio Paris"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="59 W Hubbard St, Chicago, IL 60654"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vibe">Vibe Description</Label>
                    <Textarea
                      id="vibe"
                      value={formData.vibe_text}
                      onChange={(e) => setFormData({ ...formData, vibe_text: e.target.value })}
                      placeholder="Upscale nightclub with VIP bottle service..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        placeholder="41.8897"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        placeholder="-87.6287"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="geofence">Geofence Radius (miles)</Label>
                    <Input
                      id="geofence"
                      type="number"
                      step="0.1"
                      value={formData.geofence_miles}
                      onChange={(e) => setFormData({ ...formData, geofence_miles: e.target.value })}
                      placeholder="0.5"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingVenue ? "Update" : "Create"} Venue
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Card key={venue.id} className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">{venue.name}</h3>
                {venue.address && <p className="text-sm text-muted-foreground">{venue.address}</p>}
              </div>

              {venue.vibe_text && (
                <p className="text-sm text-muted-foreground line-clamp-2">{venue.vibe_text}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="font-mono">
                    {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Geofence:</span>
                  <span>{venue.geofence_miles} miles</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openDialog(venue)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(venue)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}

          {venues.length === 0 && (
            <Card className="p-12 col-span-full text-center">
              <p className="text-muted-foreground mb-4">No venues added yet</p>
              <Button onClick={() => openDialog()}>Add Your First Venue</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
