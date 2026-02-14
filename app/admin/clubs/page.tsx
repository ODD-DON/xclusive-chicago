"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Club {
  id: string
  name: string
  address: string
  available_dates: string[]
}

const DAYS = ["Thursday", "Friday", "Saturday", "Sunday"]

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ClubsAdmin() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [deletingClub, setDeletingClub] = useState<Club | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    available_dates: [] as string[],
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchClubs()
  }, [])

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push("/admin/login")
      return
    }
  }

  async function fetchClubs() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase.from("clubs").select("*").order("name")

      if (error) throw error
      setClubs(data || [])
    } catch (error) {
      console.error("Error fetching clubs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const currentDays = prev.available_dates
      return {
        ...prev,
        available_dates: currentDays.includes(day) ? currentDays.filter((d) => d !== day) : [...currentDays, day],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Not authenticated")
      }

      if (editingClub) {
        const { error } = await supabase
          .from("clubs")
          .update({
            name: formData.name,
            address: formData.address,
            available_dates: formData.available_dates,
          })
          .eq("id", editingClub.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("clubs").insert([
          {
            name: formData.name,
            address: formData.address,
            available_dates: formData.available_dates,
          },
        ])

        if (error) throw error
      }

      setFormData({ name: "", address: "", available_dates: [] })
      setEditingClub(null)
      fetchClubs()
    } catch (error) {
      console.error("Error saving club:", error)
      alert("Error saving club. Please make sure you are logged in and try again.")
    }
  }

  const handleEdit = (club: Club) => {
    setEditingClub(club)
    setFormData({
      name: club.name,
      address: club.address,
      available_dates: club.available_dates,
    })
  }

  const handleDelete = async () => {
    if (!deletingClub) return

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Not authenticated")
      }

      const { error } = await supabase.from("clubs").delete().eq("id", deletingClub.id)

      if (error) throw error
      fetchClubs()
      setDeletingClub(null)
    } catch (error) {
      console.error("Error deleting club:", error)
      alert("Error deleting club. Please make sure you are logged in and try again.")
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clubs Management</h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Club
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClub ? "Edit Club" : "Add New Club"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Club Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>Available Days</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={formData.available_dates.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label htmlFor={day}>{day}</Label>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              {editingClub ? "Update Club" : "Add Club"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Available Days</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.map((club) => (
            <TableRow key={club.id}>
              <TableCell>{club.name}</TableCell>
              <TableCell>{club.address}</TableCell>
              <TableCell>{club.available_dates.join(", ")}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(club)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Club</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Club Name</Label>
                          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <Label>Available Days</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {DAYS.map((day) => (
                              <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                  id={day}
                                  checked={formData.available_dates.includes(day)}
                                  onCheckedChange={() => handleDayToggle(day)}
                                />
                                <Label htmlFor={day}>{day}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          Update Club
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="icon" onClick={() => setDeletingClub(club)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Club</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete {deletingClub?.name}? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingClub(null)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

