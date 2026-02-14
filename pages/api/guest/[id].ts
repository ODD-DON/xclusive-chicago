import type { NextApiRequest, NextApiResponse } from "next"
import { createServerSupabaseClient } from "../../../lib/supabaseServer"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const supabase = createServerSupabaseClient(req, res)

  const { id } = req.query

  try {
    const { data: guest, error: guestError } = await supabase.from("guests").select("*, clubs(*)").eq("id", id).single()

    if (guestError) throw guestError

    if (!guest) {
      return res.status(404).json({ success: false, message: "Guest not found" })
    }

    res.status(200).json({ success: true, guest })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

