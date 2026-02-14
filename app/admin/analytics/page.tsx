"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { startOfWeek, endOfWeek, format } from "date-fns"
import { formatToCst } from "@/utils/dateUtils"

interface AnalyticsData {
  totalGuests: number
  checkedInGuests: number
  bottleServiceRequests: number
  clubStats: {
    [key: string]: {
      totalGuests: number
      checkedInGuests: number
    }
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push("/admin/login")
      return
    }
  }

  async function fetchAnalytics() {
    try {
      const currentDate = new Date()
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)

      const { data: guests, error: guestsError } = await supabase
        .from("guests")
        .select("*")
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"))

      if (guestsError) throw guestsError

      const { data: clubs, error: clubsError } = await supabase.from("clubs").select("id, name")

      if (clubsError) throw clubsError

      const analyticsData: AnalyticsData = {
        totalGuests: guests.length,
        checkedInGuests: guests.filter((g) => g.checked_in).length,
        bottleServiceRequests: guests.filter((g) => g.bottle_service).length,
        clubStats: {},
      }

      clubs.forEach((club) => {
        const clubGuests = guests.filter((g) => g.club_id === club.id)
        analyticsData.clubStats[club.name] = {
          totalGuests: clubGuests.length,
          checkedInGuests: clubGuests.filter((g) => g.checked_in).length,
        }
      })

      setAnalyticsData(analyticsData)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Real-Time Analytics</h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Guests This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analyticsData?.totalGuests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Checked-In Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analyticsData?.checkedInGuests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bottle Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analyticsData?.bottleServiceRequests}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Club Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(analyticsData?.clubStats || {}).map(([clubName, stats]) => (
          <Card key={clubName}>
            <CardHeader>
              <CardTitle>{clubName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total Guests: {stats.totalGuests}</p>
              <p>Checked-In: {stats.checkedInGuests}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p>Last Updated: {formatToCst(new Date())}</p>
    </div>
  )
}

