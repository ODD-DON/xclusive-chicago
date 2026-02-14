import { createPagesServerClient } from "@supabase/ssr"
import type { NextApiRequest, NextApiResponse } from "next"

export const createServerSupabaseClient = (req: NextApiRequest, res: NextApiResponse) =>
  createPagesServerClient({ req, res })
