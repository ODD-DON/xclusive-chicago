import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { firstName, lastName, phone, menCount, womenCount, bottleService, date, celebration, clubId } = req.body

  const voucherCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  try {
    const { data, error } = await supabase
      .from("xc_guests")
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone,
        men_count: menCount,
        women_count: womenCount,
        bottle_service: bottleService,
        date,
        celebration,
        club_id: clubId,
        voucher_code: voucherCode,
      })
      .select()

    if (error) throw error

    res.status(200).json({ success: true, guestId: data[0].id, voucherCode })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

