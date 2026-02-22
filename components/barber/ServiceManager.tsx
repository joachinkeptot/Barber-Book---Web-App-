'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit, Trash2, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import type { Service } from '@/types/database.types'

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.number().min(1, 'Price must be at least $1'),
  duration_minutes: z.number().min(15, 'Duration must be at least 15 minutes'),
})

type ServiceForm = z.infer<typeof serviceSchema>

interface ServiceManagerProps {
  barberId: string
  initialServices: Service[]
}

export function ServiceManager({ barberId, initialServices }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
  })

  const openAddDialog = () => {
    setEditingService(null)
    reset({ name: '', description: '', price: 0, duration_minutes: 30 })
    setDialogOpen(true)
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setValue('name', service.name)
    setValue('description', service.description ?? '')
    setValue('price', service.price)
    setValue('duration_minutes', service.duration_minutes)
    setDialogOpen(true)
  }

  const onSubmit = async (data: ServiceForm) => {
    setLoading(true)
    try {
      if (editingService) {
        const { data: updated, error } = await supabase
          .from('services')
          .update(data)
          .eq('id', editingService.id)
          .select()
          .single()

        if (error) throw error
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)))
        toast({ title: 'Service updated' })
      } else {
        const { data: created, error } = await supabase
          .from('services')
          .insert({ ...data, barber_id: barberId, is_active: true })
          .select()
          .single()

        if (error) throw error
        setServices((prev) => [...prev, created])
        toast({ title: 'Service added' })
      }

      setDialogOpen(false)
      reset()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (service: Service) => {
    const { data: updated, error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id)
      .select()
      .single()

    if (!error && updated) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)))
    }
  }

  const deleteService = async (serviceId: string) => {
    const { error } = await supabase.from('services').delete().eq('id', serviceId)
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      toast({ title: 'Service deleted' })
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openAddDialog} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
          <p className="mb-3">No services yet. Add your first service to get started.</p>
          <Button onClick={openAddDialog} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className={!service.is_active ? 'opacity-60' : ''}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>{service.duration_minutes} min</span>
                      <span className="font-semibold text-orange-500">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(service)}
                      className="h-8 w-8 p-0"
                    >
                      {service.is_active ? (
                        <X className="h-3.5 w-3.5" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(service)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteService(service.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input id="name" placeholder="e.g., Haircut, Fade, Beard Trim" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the service..."
                {...register('description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="25.00"
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  placeholder="30"
                  {...register('duration_minutes', { valueAsNumber: true })}
                />
                {errors.duration_minutes && (
                  <p className="text-sm text-destructive mt-1">{errors.duration_minutes.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingService ? 'Save Changes' : 'Add Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
