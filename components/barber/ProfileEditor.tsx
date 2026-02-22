'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Upload, Loader2, Plus, Trash2, Instagram } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { User, BarberProfile } from '@/types/database.types'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  instagram_handle: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

interface ProfileEditorProps {
  user: User
  barberProfile: BarberProfile
}

export function ProfileEditor({ user, barberProfile }: ProfileEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState(barberProfile.profile_image_url)
  const [mediaFiles, setMediaFiles] = useState<Array<{ url: string; type: 'image' | 'video'; tag?: string }>>([])
  const profileImageRef = useRef<HTMLInputElement>(null)
  const mediaUploadRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name,
      phone: user.phone ?? '',
      bio: barberProfile.bio ?? '',
      instagram_handle: barberProfile.instagram_handle ?? '',
    },
  })

  const uploadProfileImage = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `barbers/${barberProfile.id}/profile.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('barber-media')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('barber-media')
        .getPublicUrl(filePath)

      const { error } = await supabase
        .from('barber_profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', barberProfile.id)

      if (error) throw error

      setProfileImageUrl(publicUrl)
      toast({ title: 'Profile photo updated' })
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const uploadMedia = async (file: File) => {
    const isVideo = file.type.startsWith('video/')
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `barbers/${barberProfile.id}/portfolio/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('barber-media')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('barber-media')
      .getPublicUrl(filePath)

    await supabase.from('barber_media').insert({
      barber_id: barberProfile.id,
      media_url: publicUrl,
      media_type: isVideo ? 'video' : 'image',
    })

    return publicUrl
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        const url = await uploadMedia(file)
        setMediaFiles((prev) => [
          ...prev,
          { url, type: file.type.startsWith('video/') ? 'video' : 'image' },
        ])
      }
      toast({ title: 'Media uploaded successfully' })
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true)
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({ full_name: data.full_name, phone: data.phone ?? null })
        .eq('id', user.id)

      if (userError) throw userError

      const { error: profileError } = await supabase
        .from('barber_profiles')
        .update({
          bio: data.bio ?? null,
          instagram_handle: data.instagram_handle ?? null,
        })
        .eq('id', barberProfile.id)

      if (profileError) throw profileError

      toast({ title: 'Profile updated!' })
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {profileImageUrl && <AvatarImage src={profileImageUrl} />}
            <AvatarFallback className="text-xl bg-orange-100 text-orange-600">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={profileImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadProfileImage(file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => profileImageRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Change Photo
            </Button>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" {...register('phone')} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <Label htmlFor="instagram_handle">Instagram Handle</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="instagram_handle"
                  {...register('instagram_handle')}
                  placeholder="yourusername"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Tell customers about yourself, your experience, specialties..."
                rows={4}
              />
              {errors.bio && (
                <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Portfolio Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={mediaUploadRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleMediaUpload}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => mediaUploadRef.current?.click()}
            disabled={uploading}
            className="w-full border-dashed h-20"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Upload className="h-5 w-5 mr-2" />
            )}
            Upload Photos & Videos
          </Button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Upload photos and videos of your work to attract customers
          </p>
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {mediaFiles.map((item, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  {item.type === 'image' ? (
                    <Image src={item.url} alt="Portfolio" fill className="object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
