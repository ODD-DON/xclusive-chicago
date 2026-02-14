"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { RegistrationWithVenue } from "@/lib/activationTypes"
import Link from "next/link"

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationWithVenue[]>([])
  const [filteredData, setFilteredData] = useState<RegistrationWithVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    activated: 0,
    expired: 0,
  })

  useEffect(() => {
    fetchRegistrations()
  }, [])

  useEffect(() => {
    filterData()
  }, [registrations, searchTerm, statusFilter])

  async function fetchRegistrations() {
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
        .order("created_at", { ascending: false })

      if (error) throw error

      const registrationsWithVenue = data as any[]
      setRegistrations(registrationsWithVenue)

      // Calculate stats
      const total = registrationsWithVenue.length
      const registered = registrationsWithVenue.filter((r) => r.status === "REGISTERED").length
      const activated = registrationsWithVenue.filter((r) => r.status === "ACTIVATED").length
      const expired = registrationsWithVenue.filter((r) => r.status === "EXPIRED").length

      setStats({ total, registered, activated, expired })
    } catch (err) {
      console.error("[v0] Error fetching registrations:", err)
    } finally {
      setLoading(false)
    }
  }

  function filterData() {
    let filtered = [...registrations]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter.toUpperCase())
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.first_name.toLowerCase().includes(term) ||
          r.last_name.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.phone.includes(term) ||
          r.voucher_code.toLowerCase().includes(term) ||
          r.venue?.name.toLowerCase().includes(term)
      )
    }

    setFilteredData(filtered)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "REGISTERED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "ACTIVATED":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "EXPIRED":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
      default:
        return "bg-muted"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading registrations...</p>
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
            <h1 className="text-4xl font-bold tracking-tight">Registrations</h1>
            <p className="text-muted-foreground mt-1">Manage all guest list registrations</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/admin/venues">
              <Button variant="outline">Venues</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Registered</div>
            <div className="text-3xl font-bold text-blue-600">{stats.registered}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Activated</div>
            <div className="text-3xl font-bold text-green-600">{stats.activated}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Expired</div>
            <div className="text-3xl font-bold text-gray-600">{stats.expired}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, phone, or voucher code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="activated">Activated</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchRegistrations}>
              Refresh
            </Button>
          </div>
        </Card>

        {/* Registrations Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Voucher Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Guest</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Venue</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Party Size</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((reg) => (
                    <tr key={reg.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{reg.voucher_code}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">
                            {reg.first_name} {reg.last_name}
                          </div>
                          {reg.instagram && <div className="text-xs text-muted-foreground">{reg.instagram}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{reg.venue?.name || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div>{reg.email}</div>
                          <div className="text-muted-foreground">{reg.phone}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {reg.total_count ? (
                            <div>
                              {reg.total_count} total
                              {(reg.men_count || reg.women_count) && (
                                <div className="text-xs text-muted-foreground">
                                  {reg.men_count}M / {reg.women_count}W
                                </div>
                              )}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={getStatusColor(reg.status)}>
                          {reg.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {new Date(reg.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/registrations/${reg.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          Showing {filteredData.length} of {registrations.length} registrations
        </div>
      </div>
    </div>
  )
}
