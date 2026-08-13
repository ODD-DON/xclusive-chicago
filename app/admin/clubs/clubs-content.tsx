'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Plus,
  Building2,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Upload,
  X,
  Music,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Club, CLUB_SIZES, MUSIC_STYLES, ClubSize, MusicStyle } from '@/lib/types'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [clubs, setClubs] = useState(initialClubs)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    address: '',
    description: '',
    imageUrl: '' as string,
    size: 'medium' as ClubSize,
    musicStyles: [] as MusicStyle[],
  })

  const resetForm = () => {
    setForm({
      name: '',
      address: '',
      description: '',
      imageUrl: '',
      size: 'medium',
      musicStyles: [],
    })
    setEditingClub(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (club: Club) => {
    setEditingClub(club)
    setForm({
      name: club.name,
      address: club.address || '',
      description: club.description || '',
      imageUrl: club.image_url || '',
      size: club.size || 'medium',
      musicStyles: (club.music_styles as MusicStyle[]) || [],
    })
    setIsDialogOpen(true)
  }

  const toggleMusicStyle = (style: MusicStyle) => {
    setForm((prev) => ({
      ...prev,
      musicStyles: prev.musicStyles.includes(style)
        ? prev.musicStyles.filter((s) => s !== style)
        : [...prev.musicStyles, style],
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/clubs/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { url } = await response.json()
      setForm((prev) => ({ ...prev, imageUrl: url }))
      toast.success('Image uploaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Club name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/clubs', {
        method: editingClub ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClub?.id,
          name: form.name.trim(),
          address: form.address.trim() || null,
          description: form.description.trim() || null,
          image_url: form.imageUrl || null,
          size: form.size,
          music_styles: form.musicStyles,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save club')
      }

      toast.success(editingClub ? 'Club updated' : 'Club created')
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        prev.map((c) =>
          c.id === club.id ? { ...c, is_active: !c.is_active } : c
        )
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
        <Button onClick={openCreateDialog} className="bg-gold hover:bg-gold-light text-background">
          <Plus className="w-4 h-4 mr-2" />
          Add Club
        </Button>
      </div>

      {clubs.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No clubs yet</p>
            <Button onClick={openCreateDialog} variant="outline">
              Add your first club
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clubs.map((club) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`bg-card border-border/50 overflow-hidden ${
                  !club.is_active ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Image */}
                    <div className="w-32 h-32 shrink-0 relative bg-muted">
                      {club.image_url ? (
                        <Image
                          src={club.image_url}
                          alt={club.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-lg">{club.name}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                club.is_active
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-muted text-muted-foreground'
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
                              <span
                                key={style}
                                className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold"
                              >
                                {style}
                              </span>
                            ))}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(club)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(club)}>
                              <Power className="w-4 h-4 mr-2" />
                              {club.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteClub(club)}
                              className="text-destructive"
                            >
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClub ? 'Edit Club' : 'Add Club'}</DialogTitle>
            <DialogDescription>
              {editingClub ? 'Update the club details below.' : 'Fill in the details to add a new club.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Club Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {form.imageUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={form.imageUrl}
                    alt="Club preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-40 rounded-lg border-2 border-dashed border-border/50 hover:border-gold/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  {isUploading ? (
                    <Spinner className="w-6 h-6" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Upload image</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Club Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Club name"
                className="bg-muted border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, Chicago, IL"
                className="bg-muted border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="bg-muted border-border/50 min-h-[80px]"
              />
            </div>

            {/* Club Size */}
            <div className="space-y-2">
              <Label>Club Size</Label>
              <div className="grid grid-cols-4 gap-2">
                {CLUB_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setForm({ ...form, size })}
                    className={`p-3 rounded-lg text-center transition-all ${
                      form.size === size
                        ? 'bg-gold text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Users className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs font-medium">{SIZE_LABELS[size].label}</div>
                    <div className="text-[10px] opacity-70">{SIZE_LABELS[size].capacity}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Music Styles */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Music Styles
              </Label>
              <div className="flex flex-wrap gap-2">
                {MUSIC_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleMusicStyle(style)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      form.musicStyles.includes(style)
                        ? 'bg-gold text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gold hover:bg-gold-light text-background"
              >
                {isSubmitting ? (
                  <Spinner className="w-4 h-4" />
                ) : editingClub ? (
                  'Save Changes'
                ) : (
                  'Create Club'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
