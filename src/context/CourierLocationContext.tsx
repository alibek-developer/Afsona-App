import * as Location from 'expo-location'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { supabase } from '../lib/supabase'

// ==================== TYPES ====================
export interface CourierLocation {
  id?: string
  courier_id: string
  order_id: string
  lat: number
  lng: number
  updated_at: string
}

interface CourierLocationContextType {
  currentLocation: CourierLocation | null
  isTracking: boolean
  startTracking: (orderId: string) => void
  stopTracking: () => void
  updateLocation: (lat: number, lng: number) => Promise<void>
}

// ==================== CONTEXT ====================
const CourierLocationContext = createContext<CourierLocationContextType | undefined>(undefined)

// ==================== PROVIDER ====================
export const CourierLocationProvider = ({ 
  children,
  courierId 
}: { 
  children: React.ReactNode
  courierId: string 
}) => {
  const [currentLocation, setCurrentLocation] = useState<CourierLocation | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const trackingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const appState = useRef(AppState.currentState)

  // Location tracking interval (every 5-10 seconds)
  const LOCATION_UPDATE_INTERVAL = 8000 // 8 seconds

  // Start tracking
  const startTracking = useCallback((orderId: string) => {
    setCurrentOrderId(orderId)
    setIsTracking(true)
    console.log('🚀 Location tracking started for order:', orderId)
  }, [])

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false)
    setCurrentOrderId(null)
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current)
      trackingInterval.current = null
    }
    console.log('🛑 Location tracking stopped')
  }, [])

  // Update location in Supabase
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    if (!currentOrderId) return

    const locationData: CourierLocation = {
      courier_id: courierId,
      order_id: currentOrderId,
      lat,
      lng,
      updated_at: new Date().toISOString(),
    }

    try {
      // Upsert location (insert or update)
      const { error } = await supabase
        .from('courier_locations')
        .upsert(locationData, {
          onConflict: 'courier_id,order_id',
        })

      if (error) {
        console.error('Error updating location:', error)
        return
      }

      setCurrentLocation(locationData)
      console.log('📍 Location updated:', lat, lng)
    } catch (error) {
      console.error('Error in updateLocation:', error)
    }
  }, [currentOrderId, courierId])

  // Get current location and update
  const getAndUpdateLocation = useCallback(async () => {
    if (!isTracking || !currentOrderId) return

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.log('Location permission not granted')
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const { latitude, longitude } = location.coords
      await updateLocation(latitude, longitude)
    } catch (error) {
      console.error('Error getting location:', error)
    }
  }, [isTracking, currentOrderId, updateLocation])

  // Start interval when tracking is enabled
  useEffect(() => {
    if (isTracking && currentOrderId) {
      // Initial location update
      getAndUpdateLocation()

      // Set up interval
      trackingInterval.current = setInterval(() => {
        getAndUpdateLocation()
      }, LOCATION_UPDATE_INTERVAL)
    }

    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current)
      }
    }
  }, [isTracking, currentOrderId, getAndUpdateLocation])

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (isTracking && currentOrderId) {
          getAndUpdateLocation()
        }
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [isTracking, currentOrderId, getAndUpdateLocation])

  const contextValue = {
    currentLocation,
    isTracking,
    startTracking,
    stopTracking,
    updateLocation,
  }

  return (
    <CourierLocationContext.Provider
      value={contextValue}
    >
      {children}
    </CourierLocationContext.Provider>
  )
}

// ==================== HOOK ====================
export const useCourierLocation = () => {
  const context = useContext(CourierLocationContext)
  if (context === undefined) {
    throw new Error('useCourierLocation must be used within a CourierLocationProvider')
  }
  return context
}