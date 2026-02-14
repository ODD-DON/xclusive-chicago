interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  menCount: number
  womenCount: number
  bottleService: boolean
  date: string
  celebration?: string
  club: string
  checkedIn: boolean
  checkInTime?: string
  createdAt: string
  voucherCode: string
}

interface Club {
  id: string
  name: string
  address: string
  availableDates: string[]
}

const GUESTS_KEY = "guests"
const CLUBS_KEY = "clubs"

export const addGuest = (guestData: Omit<Guest, "id" | "checkedIn" | "createdAt" | "voucherCode">): string => {
  const guests = getGuests()
  const newGuest: Guest = {
    ...guestData,
    id: Date.now().toString(),
    checkedIn: false,
    createdAt: new Date().toISOString(),
    voucherCode: generateVoucherCode(),
  }
  guests.push(newGuest)
  localStorage.setItem(GUESTS_KEY, JSON.stringify(guests))
  return newGuest.id
}

export const getGuests = (): Guest[] => {
  const guestsJson = localStorage.getItem(GUESTS_KEY)
  return guestsJson ? JSON.parse(guestsJson) : []
}

export const getGuestById = (id: string): Guest | undefined => {
  const guests = getGuests()
  return guests.find((guest) => guest.id === id)
}

export const getGuestByName = (firstName: string, lastName: string, date: string): Guest | undefined => {
  const guests = getGuests()
  return guests.find(
    (guest) =>
      guest.firstName.toLowerCase() === firstName.toLowerCase() &&
      guest.lastName.toLowerCase() === lastName.toLowerCase() &&
      guest.date === date,
  )
}

export const updateGuestCheckIn = (guestId: string): boolean => {
  const guests = getGuests()
  const guestIndex = guests.findIndex((guest) => guest.id === guestId)
  if (guestIndex !== -1) {
    guests[guestIndex].checkedIn = true
    guests[guestIndex].checkInTime = new Date().toISOString()
    localStorage.setItem(GUESTS_KEY, JSON.stringify(guests))
    return true
  }
  return false
}

export const addClub = (clubData: Omit<Club, "id">): string => {
  const clubs = getClubs()
  const newClub: Club = {
    ...clubData,
    id: Date.now().toString(),
  }
  clubs.push(newClub)
  localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs))
  return newClub.id
}

export const getClubs = (): Club[] => {
  const clubsJson = localStorage.getItem(CLUBS_KEY)
  return clubsJson ? JSON.parse(clubsJson) : []
}

export const getClubsByDate = (fullDate: string): Club[] => {
  const dayName = fullDate.split(" ")[0]
  const clubs = getClubs()
  return clubs.filter((club) => club.availableDates.includes(dayName))
}

export const updateClub = (clubId: string, updatedData: Partial<Club>): boolean => {
  const clubs = getClubs()
  const index = clubs.findIndex((club) => club.id === clubId)
  if (index !== -1) {
    clubs[index] = { ...clubs[index], ...updatedData }
    localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs))
    return true
  }
  return false
}

export const deleteClub = (clubId: string): boolean => {
  const clubs = getClubs()
  const updatedClubs = clubs.filter((club) => club.id !== clubId)
  if (updatedClubs.length < clubs.length) {
    localStorage.setItem(CLUBS_KEY, JSON.stringify(updatedClubs))
    return true
  }
  return false
}

function generateVoucherCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const getGuestByVoucherCode = (voucherCode: string): Guest | undefined => {
  const guests = getGuests()
  return guests.find((guest) => guest.voucherCode === voucherCode)
}

