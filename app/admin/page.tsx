"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AdminHub() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log("Checking authentication...")
    checkAuth()
  }, [])

  async function checkAuth() {
    console.log("Checking authentication chechauth...")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.replace("/admin/login")
    } else {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Hub</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Guests</CardTitle>
            <CardDescription>Manage and view guest information</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/guests">
              <Button className="w-full">View Guests</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clubs</CardTitle>
            <CardDescription>Manage club information and availability</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/clubs">
              <Button className="w-full">Manage Clubs</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>View system analytics and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/analytics">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

