"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { CSVLink } from "react-csv"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"
import { Pagination } from "@/components/ui/pagination"
import Link from "next/link"
import { formatToCst,convertTimeToCst } from "@/utils/dateUtils"
import { ArrowUpDown } from "lucide-react"

interface Guest {
  id: string
  first_name: string
  last_name: string
  phone: string
  men_count: number
  women_count: number
  bottle_service: boolean
  date: string
  celebration?: string
  club_name: string
  checked_in: boolean
  check_in_time?: string
  created_at: string
  voucher_code: string
}

export default function GuestsAdmin() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [weeklyGuests, setWeeklyGuests] = useState<Guest[]>([])
  const [filters, setFilters] = useState({
    search: "",
    club: "all",
    date: "all",
    checkedIn: "all",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest; direction: "asc" | "desc" } | null>(null)
  const [viewMode, setViewMode] = useState<"weekly" | "full">("weekly")
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date()))
  const itemsPerPage = 50
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchGuests()
    fetchWeeklyGuests()
  }, [])

  useEffect(() => {
    if (viewMode === "weekly") {
      fetchWeeklyGuests()
    }
  }, [currentWeekStart, viewMode]) // Added viewMode to dependencies

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push("/admin/login")
      return
    }
  }

  async function fetchGuests() {
    setIsLoading(true)
    try {
      const { data, error, count } = await supabase
        .from("xc_guests_with_club_names")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      setGuests(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error("Error fetching guests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchWeeklyGuests() {
    setIsLoading(true)
    try {
      const weekStart = format(currentWeekStart, "yyyy-MM-dd")
      const weekEnd = format(endOfWeek(currentWeekStart), "yyyy-MM-dd")

      const { data, error } = await supabase
        .from("xc_guests_with_club_names")
        .select("*")
        .gte("created_at", weekStart)
        .lt("created_at", weekEnd)
        .order("created_at", { ascending: false })

      if (error) throw error

      setWeeklyGuests(data || [])
    } catch (error) {
      console.error("Error fetching weekly guests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sortedGuests = useMemo(() => {
    const guestsToSort = viewMode === "weekly" ? weeklyGuests : guests
    if (sortConfig !== null) {
      return [...guestsToSort].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }
    return guestsToSort
  }, [guests, weeklyGuests, viewMode, sortConfig])

  const filteredGuests = useMemo(() => {
    return sortedGuests.filter((guest) => {
      const matchesSearch =
        filters.search === "" ||
        guest.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        guest.last_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        guest.voucher_code.toLowerCase().includes(filters.search.toLowerCase())

      const matchesClub = filters.club === "all" || guest.club_name === filters.club
      const matchesDate = filters.date === "all" || guest.date === filters.date
      const matchesCheckedIn =
        filters.checkedIn === "all" ||
        (filters.checkedIn === "yes" && guest.checked_in) ||
        (filters.checkedIn === "no" && !guest.checked_in)

      return matchesSearch && matchesClub && matchesDate && matchesCheckedIn
    })
  }, [sortedGuests, filters])

  function handleFilterChange(filterName: string, value: string) {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
  }

  function formatCheckInTime(time: string | null): string {
    if (!time) return "Not checked in"
    return convertTimeToCst(time)
  }

  const uniqueClubs = Array.from(new Set(sortedGuests.map((guest) => guest.club_name)))
  const uniqueDates = Array.from(new Set(sortedGuests.map((guest) => guest.date)))

  const requestSort = (key: keyof Guest) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  function navigateWeek(direction: "prev" | "next") {
    setCurrentWeekStart((prev) => (direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)))
  }

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Guest List</h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
      </div>
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={viewMode} onValueChange={(value: "weekly" | "full") => setViewMode(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select view mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly View</SelectItem>
                <SelectItem value="full">Full Database</SelectItem>
              </SelectContent>
            </Select>
            {viewMode === "weekly" && (
              <>
                <Button onClick={() => navigateWeek("prev")}>Previous Week</Button>
                <span className="font-semibold">
                  Week of {format(currentWeekStart, "MMM d, yyyy")} -{" "}
                  {format(endOfWeek(currentWeekStart), "MMM d, yyyy")}
                </span>
                <Button onClick={() => navigateWeek("next")}>Next Week</Button>
              </>
            )}
          </div>
          <CSVLink
            data={filteredGuests}
            filename={`guest-list-${viewMode === "weekly" ? "weekly" : "full"}-${format(new Date(), "yyyy-MM-dd")}.csv`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Export to CSV
          </CSVLink>
        </div>
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by name or voucher code"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="max-w-xs"
          />
          <Select value={filters.club} onValueChange={(value) => handleFilterChange("club", value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by club" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clubs</SelectItem>
              {uniqueClubs.map((club) => (
                <SelectItem key={club} value={club}>
                  {club}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.date} onValueChange={(value) => handleFilterChange("date", value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {uniqueDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.checkedIn} onValueChange={(value) => handleFilterChange("checkedIn", value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by check-in status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Check-in Status</SelectItem>
              <SelectItem value="yes">Checked In</SelectItem>
              <SelectItem value="no">Not Checked In</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("first_name")}>
                  First Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("last_name")}>
                  Last Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("checked_in")}>
                  Checked In <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("club_name")}>
                  Club Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("check_in_time")}>
                  Check-in Time <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("phone")}>
                  Phone <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("date")}>
                  Date <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("men_count")}>
                  Group Size <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("bottle_service")}>
                  Bottle Service <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("voucher_code")}>
                  Voucher Code <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("celebration")}>
                  Celebration <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>{guest.first_name}</TableCell>
                <TableCell>{guest.last_name}</TableCell>
                <TableCell className={guest.checked_in ? "bg-green-200" : ""}>
                  {guest.checked_in ? "Yes" : "No"}
                </TableCell>
                <TableCell>{guest.club_name}</TableCell>
                <TableCell>{formatCheckInTime(guest.check_in_time)}</TableCell>
                <TableCell>{guest.phone}</TableCell>
                <TableCell>{guest.date}</TableCell>
                <TableCell>{guest.men_count + guest.women_count}</TableCell>
                <TableCell>{guest.bottle_service ? "Yes" : "No"}</TableCell>
                <TableCell>{guest.voucher_code}</TableCell>
                <TableCell>{guest.celebration || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {viewMode === "full" && (
        <div className="mt-4 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  )
}

