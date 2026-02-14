"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function TestSupabase() {
  const [message, setMessage] = useState("Testing Supabase connection...")

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.from("guests").select("*").limit(1)

        if (error) {
          throw error
        }

        setMessage("Successfully connected to Supabase!")
      } catch (error) {
        console.error("Error:", error)
        setMessage("Failed to connect to Supabase. Check console for details.")
      }
    }

    testConnection()
  }, [])

  return (
    <div>
      <h1>Supabase Connection Test</h1>
      <p>{message}</p>
    </div>
  )
}

