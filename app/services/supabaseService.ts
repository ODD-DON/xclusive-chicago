import { supabase } from "@/lib/supabaseClient"

interface Guest {
  id: string
  firstName: string
  lastName: string
  phone: string
  menCount: number
  womenCount: number
  bottleService: boolean
  date: string
  celebration?: string
  clubId: string
  clubName: string
  checkedIn: boolean
  checkInTime?: string
  createdAt: string
  voucherCode: string
  club?: Club | null
}

interface Club {
  id: string
  name: string
  address: string
  availableDates: string[]
}

export const addGuest = async (
  guestData: Omit<Guest, "id" | "checkedIn" | "createdAt" | "voucherCode" | "clubName">,
): Promise<string> => {
  const voucherCode = generateVoucherCode()

  const { data, error } = await supabase
    .from("guests")
    .insert({
      first_name: guestData.firstName,
      last_name: guestData.lastName,
      phone: guestData.phone,
      men_count: guestData.menCount,
      women_count: guestData.womenCount,
      bottle_service: guestData.bottleService,
      date: guestData.date,
      celebration: guestData.celebration,
      club_id: guestData.clubId,
      voucher_code: voucherCode,
    })
    .select()

  if (error) {
    console.error("Error adding guest:", error)
    throw new Error(`Failed to add guest: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned after adding guest")
  }

  return data[0].id
}

export const getGuestById = async (id: string): Promise<Guest | null> => {
  try {
    const { data: guestData, error: guestError } = await supabase
      .from("guests_with_club_names")
      .select("*")
      .eq("id", id)
      .single()

    if (guestError) {
      console.error("Supabase error fetching guest:", guestError)
      throw new Error(`Failed to fetch guest: ${guestError.message}`)
    }

    if (!guestData) {
      console.error("No guest found with id:", id)
      return null
    }

    const guest = transformGuest(guestData)

    // Fetch club details
    const { data: clubData, error: clubError } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", guestData.club_id)
      .single()

    if (clubError) {
      console.error("Supabase error fetching club:", clubError)
      throw new Error(`Failed to fetch club: ${clubError.message}`)
    }

    guest.club = clubData ? transformClub(clubData) : null

    return guest
  } catch (error) {
    console.error("Error in getGuestById:", error)
    throw error
  }
}

export const getGuestByVoucherCode = async (voucherCode: string): Promise<Guest | null> => {
  try {
    const { data: guestData, error: guestError } = await supabase
      .from("guests_with_club_names")
      .select("*")
      .eq("voucher_code", voucherCode)
      .single()

    if (guestError) {
      console.error("Supabase error fetching guest by voucher code:", guestError)
      throw new Error(`Failed to fetch guest by voucher code: ${guestError.message}`)
    }

    if (!guestData) {
      console.error("No guest found with voucher code:", voucherCode)
      return null
    }

    const guest = transformGuest(guestData)

    // Fetch club details
    const { data: clubData, error: clubError } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", guestData.club_id)
      .single()

    if (clubError) {
      console.error("Supabase error fetching club:", clubError)
      throw new Error(`Failed to fetch club: ${clubError.message}`)
    }

    guest.club = clubData ? transformClub(clubData) : null

    return guest
  } catch (error) {
    console.error("Error in getGuestByVoucherCode:", error)
    throw error
  }
}

export const updateGuestCheckIn = async (guestId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("guests")
    .update({ checked_in: true, check_in_time: new Date().toISOString() })
    .eq("id", guestId)

  if (error) {
    console.error("Error updating guest check-in:", error)
    throw new Error(`Failed to update guest check-in: ${error.message}`)
  }

  return true
}

export const getClubsByDate = async (fullDate: string): Promise<Club[]> => {
  const dayName = fullDate.split(" ")[0]
  const { data, error } = await supabase.from("clubs").select("*").contains("available_dates", [dayName])

  if (error) {
    console.error("Error fetching clubs:", error)
    throw error
  }

  return data.map(transformClub)
}

function generateVoucherCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function transformGuest(data: any): Guest {
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    menCount: data.men_count,
    womenCount: data.women_count,
    bottleService: data.bottle_service,
    date: data.date,
    celebration: data.celebration,
    clubId: data.club_id,
    clubName: data.club_name,
    checkedIn: data.checked_in,
    checkInTime: data.check_in_time,
    createdAt: data.created_at,
    voucherCode: data.voucher_code,
  }
}

function transformClub(data: any): Club {
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    availableDates: data.available_dates,
  }
}

