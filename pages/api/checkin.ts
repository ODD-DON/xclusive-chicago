import type { NextApiRequest, NextApiResponse } from "next"
import { createServerSupabaseClient } from "../../lib/supabaseServer"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const supabase = createServerSupabaseClient(req, res)

  const { voucherCode } = req.body

  try {
    // First, get the guest by voucher code
    const { data: guest, error: fetchError } = await supabase
      .from("xc_guests")
      .select("*")
      .eq("voucher_code", voucherCode)
      .single()

    if (fetchError) throw fetchError

    if (!guest) {
      return res.status(404).json({ success: false, message: "Guest not found" })
    }

    if (guest.checked_in) {
      return res.status(400).json({ success: false, message: "Guest already checked in" })
    }

    // Update the guest's check-in status
    const { data, error: updateError } = await supabase
      .from("xc_guests")
      .update({ checked_in: true, check_in_time: new Date().toISOString() })
      .eq("id", guest.id)
      .select()

    if (updateError) throw updateError

    res.status(200).json({ success: true, guestId: guest.id })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

