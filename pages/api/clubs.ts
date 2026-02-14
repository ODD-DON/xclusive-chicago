import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, error: "Method not allowed" });
    }

    const { date } = req.query;

    // Validate and extract date from format "DayOfWeek (MM/DD/YYYY)"
    if (!date || typeof date !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Missing or invalid date parameter" });
    }

    const match = date.match(/\((\d{2}\/\d{2}\/\d{4})\)/);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid date format" });
    }

    const extractedDate = match[1]; // Extracted "MM/DD/YYYY"
    const parsedDate = new Date(extractedDate);

    if (isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid date value" });
    }

    const dayName = parsedDate.toLocaleDateString("en-US", { weekday: "long" });

    // Query Supabase
    const { data: clubs, error } = await supabase
      .from("xc_clubs")
      .select("*")
      .contains("available_dates", [dayName]);

    if (error) {
      return res
        .status(500)
        .json({ success: false, error: "Database query failed" });
    }

    return res.status(200).json({ success: true, clubs });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}
