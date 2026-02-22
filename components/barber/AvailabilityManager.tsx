'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { BarberAvailability } from '@/types/database.types'

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

interface AvailabilityManagerProps {
  barberId: string
  initialAvailability: BarberAvailability[]
}

export function AvailabilityManager({ barberId, initialAvailability }: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<BarberAvailability[]>(initialAvailability)
  const [saving, setSaving] = useState<number | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const getDay = (dayOfWeek: number) =>
    availability.find((a) => a.day_of_week === dayOfWeek)

  const toggleDay = async (dayOfWeek: number) => {
    setSaving(dayOfWeek)
    const existing = getDay(dayOfWeek)

    try {
      if (existing) {
        const { data, error } = await supabase
          .from('barber_availability')
          .update({ is_available: !existing.is_available })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        setAvailability((prev) =>
          prev.map((a) => (a.id === existing.id ? data : a))
        )
      } else {
        // Create with default hours
        const { data, error } = await supabase
          .from('barber_availability')
          .insert({
            barber_id: barberId,
            day_of_week: dayOfWeek,
            start_time: '09:00',
            end_time: '17:00',
            is_available: true,
          })
          .select()
          .single()

        if (error) throw error
        setAvailability((prev) => [...prev, data])
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const updateTime = async (
    dayOfWeek: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    const existing = getDay(dayOfWeek)
    if (!existing) return

    const { data, error } = await supabase
      .from('barber_availability')
      .update({ [field]: value + ':00' })
      .eq('id', existing.id)
      .select()
      .single()

    if (!error && data) {
      setAvailability((prev) => prev.map((a) => (a.id === existing.id ? data : a)))
      toast({ title: 'Hours saved', description: `${DAYS[dayOfWeek]?.label} updated` })
    }
  }

  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const dayAvail = getDay(day.value)
        const isActive = dayAvail?.is_available ?? false

        return (
          <Card
            key={day.value}
            className={cn(!isActive && 'opacity-60')}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg font-medium text-sm transition-all',
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                  disabled={saving === day.value}
                >
                  {saving === day.value ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    day.label
                  )}
                </button>

                {isActive && dayAvail && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1">
                      <Input
                        type="time"
                        defaultValue={dayAvail.start_time.slice(0, 5)}
                        className="h-8 text-sm w-28"
                        onBlur={(e) => updateTime(day.value, 'start_time', e.target.value)}
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <Input
                        type="time"
                        defaultValue={dayAvail.end_time.slice(0, 5)}
                        className="h-8 text-sm w-28"
                        onBlur={(e) => updateTime(day.value, 'end_time', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {!isActive && (
                  <span className="text-sm text-gray-400">Unavailable</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <p className="text-xs text-gray-400 mt-2">
        Click a day to toggle availability. Update hours by changing the time fields.
      </p>
    </div>
  )
}
