'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, Upload, X, Music, Users, Lock, Clock, ImageIcon, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Club, CLUB_SIZES, CLUB_SIZE_LABELS, MUSIC_STYLES, ClubSize, MusicStyle } from '@/lib/types'
import { NotesEditor } from './notes-editor'

function FormSection({
  icon: Icon,
  title,
  description,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <Card className={accent ? 'bg-gold/5 border-gold/20' : 'bg-card border-border/50'}>
      <CardContent className="p-5 space-y-4">
        <div>
          <h2 className={`flex items-center gap-2 font-medium ${accent ? 'text-gold' : ''}`}>
            <Icon className="w-4 h-4" />
            {title}
          </h2>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

interface ClubFormProps {
  club?: Club
  initialNotes?: string
}

export function ClubForm({ club, initialNotes }: ClubFormProps) {
  const router = useRouter()
  const isEditing = !!club
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const menuInputRef = useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [isUploadingMenu, setIsUploadingMenu] = useState(false)

  const [form, setForm] = useState({
    name: club?.name || '',
    address: club?.address || '',
    neighborhood: club?.neighborhood || '',
    dressCode: club?.dress_code || '',
    description: club?.description || '',
    imageUrl: club?.image_url || '',
    galleryUrls: club?.gallery_urls || ([] as string[]),
    bottleMenuUrls: club?.bottle_menu_urls || ([] as string[]),
    size: (club?.size || 'medium') as ClubSize,
    musicStyles: (club?.music_styles as MusicStyle[]) || [],
    defaultCutoffTime: club?.default_cutoff_time ? club.default_cutoff_time.slice(0, 5) : '',
    // Only used pre-creation -- once a club exists, NotesEditor autosaves
    // itself directly and this field is never read again.
    adminNotes: initialNotes || '',
  })

  const toggleMusicStyle = (style: MusicStyle) => {
    setForm((prev) => ({
      ...prev,
      musicStyles: prev.musicStyles.includes(style)
        ? prev.musicStyles.filter((s) => s !== style)
        : [...prev.musicStyles, style],
    }))
  }

  const uploadOne = async (file: File) => {
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
    return url as string
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadOne(file)
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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setIsUploadingGallery(true)
    try {
      const urls = await Promise.all(files.map(uploadOne))
      setForm((prev) => ({ ...prev, galleryUrls: [...prev.galleryUrls, ...urls] }))
      toast.success(urls.length > 1 ? `${urls.length} photos added` : 'Photo added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const removeGalleryPhoto = (url: string) => {
    setForm((prev) => ({ ...prev, galleryUrls: prev.galleryUrls.filter((u) => u !== url) }))
  }

  const moveGalleryPhoto = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.galleryUrls]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, galleryUrls: next }
    })
  }

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setIsUploadingMenu(true)
    try {
      const urls = await Promise.all(files.map(uploadOne))
      setForm((prev) => ({ ...prev, bottleMenuUrls: [...prev.bottleMenuUrls, ...urls] }))
      toast.success(urls.length > 1 ? `${urls.length} menu photos added` : 'Menu photo added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploadingMenu(false)
      if (menuInputRef.current) menuInputRef.current.value = ''
    }
  }

  const removeMenuPhoto = (url: string) => {
    setForm((prev) => ({ ...prev, bottleMenuUrls: prev.bottleMenuUrls.filter((u) => u !== url) }))
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
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: club?.id,
          name: form.name.trim(),
          address: form.address.trim() || null,
          neighborhood: form.neighborhood.trim() || null,
          dress_code: form.dressCode.trim() || null,
          description: form.description.trim() || null,
          image_url: form.imageUrl || null,
          gallery_urls: form.galleryUrls,
          bottle_menu_urls: form.bottleMenuUrls,
          size: form.size,
          music_styles: form.musicStyles,
          default_cutoff_time: form.defaultCutoffTime ? `${form.defaultCutoffTime}:00` : null,
          // Editing an existing club: Team Notes autosaves through its own
          // route and shouldn't be re-sent (and possibly stomped) here.
          ...(isEditing ? {} : { admin_notes: form.adminNotes.trim() || null }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save club')
      }

      toast.success(isEditing ? 'Club updated' : 'Club created')
      router.push('/admin/clubs')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href="/admin/clubs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clubs
        </Link>
        <h1 className="text-2xl font-light">{isEditing ? `Edit ${club.name}` : 'Add Club'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          <div className="space-y-6 min-w-0">
            <FormSection icon={ImageIcon} title="Photos">
              <div className="space-y-2">
                <Label>Club Image</Label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {form.imageUrl ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                    <Image src={form.imageUrl} alt="Club preview" fill className="object-cover" />
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
                    className="w-full h-48 rounded-lg border-2 border-dashed border-border/50 hover:border-gold/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
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
                <Label>Atmosphere Photos</Label>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  {form.galleryUrls.map((url, index) => (
                    <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted group">
                      <Image src={url} alt="Venue atmosphere" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryPhoto(url)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moveGalleryPhoto(index, -1)}
                          disabled={index === 0}
                          className="flex-1 py-0.5 bg-background/80 hover:bg-background disabled:opacity-30 text-xs"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryPhoto(index, 1)}
                          disabled={index === form.galleryUrls.length - 1}
                          className="flex-1 py-0.5 bg-background/80 hover:bg-background disabled:opacity-30 text-xs"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border/50 hover:border-gold/50 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {isUploadingGallery ? <Spinner className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Extra photos so people can see the atmosphere. Select multiple at once, hover a photo to reorder.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Bottle Service Menu Photos</Label>
                <input
                  ref={menuInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMenuUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  {form.bottleMenuUrls.map((url) => (
                    <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <Image src={url} alt="Bottle service menu" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeMenuPhoto(url)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => menuInputRef.current?.click()}
                    disabled={isUploadingMenu}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border/50 hover:border-gold/50 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {isUploadingMenu ? <Spinner className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shown to guests who say they&apos;re interested in bottle service for this venue
                </p>
              </div>
            </FormSection>

            <FormSection icon={MapPin} title="Basic Info">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Neighborhood</Label>
                  <Input
                    id="neighborhood"
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Gold Coast"
                    className="bg-muted border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dressCode">Dress Code</Label>
                  <Input
                    id="dressCode"
                    value={form.dressCode}
                    onChange={(e) => setForm({ ...form, dressCode: e.target.value })}
                    placeholder="Upscale attire"
                    className="bg-muted border-border/50"
                  />
                </div>
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
            </FormSection>

            <FormSection icon={Sparkles} title="Vibe">
              <div className="space-y-2">
                <Label>Club Size</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      <div className="text-xs font-medium">{CLUB_SIZE_LABELS[size].label}</div>
                      <div className="text-[10px] opacity-70">{CLUB_SIZE_LABELS[size].capacity}</div>
                    </button>
                  ))}
                </div>
              </div>

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
            </FormSection>
          </div>

          <div className="space-y-6">
            <FormSection
              icon={Clock}
              title="Access Rules"
              description="Applied automatically to every new event added for this venue (e.g. free access until midnight). Each event can still override it individually."
              accent
            >
              <div className="space-y-2">
                <Label htmlFor="defaultCutoffTime">Default Free-Access Cutoff</Label>
                <Input
                  id="defaultCutoffTime"
                  type="time"
                  value={form.defaultCutoffTime}
                  onChange={(e) => setForm({ ...form, defaultCutoffTime: e.target.value })}
                  className="bg-background border-gold/20"
                />
              </div>
            </FormSection>

            <FormSection icon={Lock} title="Team Notes">
              {isEditing ? (
                <NotesEditor clubId={club.id} initialNotes={initialNotes} />
              ) : (
                <>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Save the club first, then Team Notes autosaves on its own from here.
                  </p>
                  <NotesEditor
                    value={form.adminNotes}
                    onChange={(value) => setForm({ ...form, adminNotes: value })}
                    placeholder="e.g. $10/guest after 20 guests, paid biweekly. Contact info, deal terms, whatever you need to remember."
                  />
                </>
              )}
            </FormSection>
          </div>
        </div>

        <div className="flex gap-3 pt-2 pb-8">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/admin/clubs')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gold hover:bg-gold-light text-background">
            {isSubmitting ? <Spinner className="w-4 h-4" /> : isEditing ? 'Save Changes' : 'Create Club'}
          </Button>
        </div>
      </form>
    </div>
  )
}
