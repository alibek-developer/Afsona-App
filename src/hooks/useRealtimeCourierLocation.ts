import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface CourierLocation {
  id: string
  courier_id: string
  order_id: string
  lat: number
  lng: number
  updated_at: string
}

export const useRealtimeCourierLocation = (orderId?: string) => {
  const [location, setLocation] = useState<CourierLocation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    // Initial fetch
    fetchLocation()

    // Setup realtime subscription
    const subscription = supabase
      .channel(`courier_location_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courier_locations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Realtime courier location update:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setLocation(payload.new as CourierLocation)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  const fetchLocation = async () => {
    if (!orderId) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('courier_locations')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching courier location:', error)
        return
      }

      setLocation(data)
    } catch (error) {
      console.error('Error in fetchLocation:', error)
    } finally {
      setLoading(false)
    }
  }

  return { location, loading }
}
