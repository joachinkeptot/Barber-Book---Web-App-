import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Star, Instagram, Clock, DollarSign, Camera } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials, formatPrice } from '@/lib/utils'

export const revalidate = 60

interface Props {
  params: { barberId: string }
}

export default async function BarberProfilePage({ params }: Props) {
  const supabase = await createClient()

  const { data: barber } = await supabase
    .from('barber_profiles')
    .select(`
      *,
      users!inner(id, full_name, email, phone),
      services(*, is_active),
      barber_media(*),
      reviews(*, users!customer_id(full_name))
    `)
    .eq('id', params.barberId)
    .single()

  if (!barber) notFound()

  const activeServices = barber.services?.filter((s: any) => s.is_active) ?? []
  const reviews = barber.reviews ?? []
  const media = barber.barber_media ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600" />
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              {barber.profile_image_url && (
                <AvatarImage src={barber.profile_image_url} alt={barber.users.full_name} />
              )}
              <AvatarFallback className="text-2xl bg-orange-100 text-orange-600">
                {getInitials(barber.users.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold">{barber.users.full_name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="ml-1 font-medium">{barber.rating?.toFixed(1) ?? '0.0'}</span>
                      <span className="text-gray-400 ml-1">({barber.total_reviews} reviews)</span>
                    </div>
                    {barber.instagram_handle && (
                      <a
                        href={`https://instagram.com/${barber.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-pink-500 hover:text-pink-600"
                      >
                        <Instagram className="h-4 w-4 mr-1" />
                        @{barber.instagram_handle}
                      </a>
                    )}
                  </div>
                </div>
                <Link href={`/book?barberId=${barber.id}`}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {barber.bio && (
            <p className="text-gray-600 text-sm leading-relaxed">{barber.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="services">
        <TabsList className="mb-6">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          {activeServices.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {activeServices.map((service: any) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-500">
                          {formatPrice(service.price)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Deposit: {formatPrice(service.price * 0.5)}
                        </div>
                      </div>
                    </div>
                    <Link href={`/book?barberId=${barber.id}&serviceId=${service.id}`} className="mt-3 block">
                      <Button
                        size="sm"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Book This Service
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No services listed yet</p>
            </div>
          )}
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          {media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {media.map((item: any) => (
                <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  {item.media_type === 'image' ? (
                    <Image
                      src={item.media_url}
                      alt="Portfolio"
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <video
                      src={item.media_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                  {item.service_tag && (
                    <Badge className="absolute top-2 left-2 text-xs bg-black/60">
                      {item.service_tag}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No portfolio photos yet</p>
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{review.users?.full_name ?? 'Anonymous'}</p>
                        <div className="flex text-yellow-400 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No reviews yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
