import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials, formatPrice } from '@/lib/utils'

interface BarberCardProps {
  barber: {
    id: string
    profile_image_url: string | null
    rating: number
    total_reviews: number
    bio: string | null
    instagram_handle: string | null
    users: { full_name: string; email: string }
    services: Array<{
      id: string
      name: string
      price: number
      duration_minutes: number
      is_active: boolean
    }>
    barber_media: Array<{ id: string; media_url: string; media_type: string }>
  }
}

export function BarberCard({ barber }: BarberCardProps) {
  const activeServices = barber.services?.filter((s) => s.is_active) ?? []
  const minPrice = activeServices.length > 0
    ? Math.min(...activeServices.map((s) => s.price))
    : null
  const previewImage = barber.barber_media?.find((m) => m.media_type === 'image')

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Preview Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden">
        {previewImage ? (
          <Image
            src={previewImage.media_url}
            alt={`${barber.users.full_name} portfolio`}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="h-20 w-20">
              {barber.profile_image_url && (
                <AvatarImage src={barber.profile_image_url} />
              )}
              <AvatarFallback className="text-2xl bg-orange-200 text-orange-600">
                {getInitials(barber.users.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow">
              {barber.profile_image_url && (
                <AvatarImage src={barber.profile_image_url} />
              )}
              <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
                {getInitials(barber.users.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{barber.users.full_name}</h3>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{barber.rating?.toFixed(1) ?? '0.0'}</span>
                <span className="text-gray-400">({barber.total_reviews})</span>
              </div>
            </div>
          </div>
        </div>

        {barber.bio && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{barber.bio}</p>
        )}

        {/* Services Preview */}
        {activeServices.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {activeServices.slice(0, 3).map((service) => (
              <Badge key={service.id} variant="secondary" className="text-xs">
                {service.name}
              </Badge>
            ))}
            {activeServices.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{activeServices.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {minPrice !== null && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-3.5 w-3.5" />
              <span>From {formatPrice(minPrice)}</span>
            </div>
          )}
          <Link href={`/barbers/${barber.id}`} className="ml-auto">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
