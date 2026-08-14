'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Plus, Building2, MapPin, MoreVertical, Pencil, Trash2, Power, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Club, ClubSize } from '@/lib/types'

interface ClubsContentProps {
  initialClubs: Club[]
}

const SIZE_LABELS: Record<ClubSize, { label: string; capacity: string }> = {
  intimate: { label: 'Intimate', capacity: '< 200' },
  medium: { label: 'Medium', capacity: '200-500' },
  large: { label: 'Large', capacity: '500-1000' },
  mega: { label: 'Mega', capacity: '1000+' },
}

export function ClubsContent({ initialClubs }: ClubsContentProps) {
  const router = useRouter()
  const [clubs, setClubs] = useState(initialClubs)
  const [search, setSearch] = useState('')

  const visibleClubs = clubs.filter((club) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [club.name, club.address, club.neighborhood].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  const toggleActive = async (club: Club) => {
    try {
      const response = await fetch('/api/admin/clubs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: club.id,
          is_active: !club.is_active,
        }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setClubs((prev) =>
        prev.map((c) => (c.id === club.id ? { ...c, is_active: !c.is_active } : c))
      )
      toast.success(club.is_active ? 'Club deactivated' : 'Club activated')
    } catch {
      toast.error('Failed to update club')
    }
  }

  const deleteClub = async (club: Club) => {
    if (!confirm(`Are you sure you want to delete "${club.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/clubs?id=${club.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      setClubs((prev) => prev.filter((c) => c.id !== club.id))
      toast.success('Club deleted')
    } catch {
      toast.error('Failed to delete club')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light mb-2">Clubs</h1>
          <p className="text-muted-foreground">Manage your venues and schedules</p>
        </div>
        <Button asChild className="bg-gold hover:bg-gold-light text-background">
          <Link href="/admin/clubs/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Club
          </Link>
        </Button>
      </div>

      {clubs.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name or address"
            className="pl-9 bg-muted border-border/50"
          />
        </div>
      )}

      {clubs.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No clubs yet</p>
            <Button asChild variant="outline">
              <Link href="/admin/clubs/new">Add your first club</Link>
            </Button>
          </CardContent>
        </Card>
      ) : visibleClubs.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">No clubs match &quot;{search}&quot;</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleClubs.map((club) => (
            <motion.div key={club.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`bg-card border-border/50 overflow-hidden ${!club.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex">
                    <Link href={`/admin/clubs/${club.id}`} className="w-32 h-32 shrink-0 relative bg-muted">
                      {club.image_url ? (
                        <Image src={club.image_url} alt={club.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 p-5 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <Link href={`/admin/clubs/${club.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-lg hover:text-gold transition-colors">{club.name}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                club.is_active ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {club.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {club.address && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{club.address}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 text-sm mb-3">
                            {club.size && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />
                                <span>{SIZE_LABELS[club.size].label} ({SIZE_LABELS[club.size].capacity})</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {club.music_styles?.map((style) => (
                              <span key={style} className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                                {style}
                              </span>
                            ))}
                          </div>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/clubs/${club.id}`)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(club)}>
                              <Power className="w-4 h-4 mr-2" />
                              {club.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteClub(club)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
