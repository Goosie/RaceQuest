import { create } from 'zustand'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { GeolocationStore, LatLng, Checkpoint } from '../types'

interface GeolocationStoreImpl extends GeolocationStore {
  // Additional state
  nearbyCheckpoints: Checkpoint[]
  triggeredCheckpoints: Set<string>
  
  // Actions
  checkProximity: (checkpoints: Checkpoint[]) => Promise<void>
  triggerCheckpoint: (checkpoint: Checkpoint) => Promise<void>
  clearTriggeredCheckpoints: () => void
  
  // Background tracking
  startBackgroundTracking: () => Promise<void>
  stopBackgroundTracking: () => void
}

// const PROXIMITY_CHECK_INTERVAL = 5000 // 5 seconds
const MIN_ACCURACY_METERS = 50

export const useGeolocationStore = create<GeolocationStoreImpl>((set, get) => ({
  currentPosition: undefined,
  watchId: undefined,
  hasPermission: false,
  isTracking: false,
  nearbyCheckpoints: [],
  triggeredCheckpoints: new Set(),

  requestPermissions: async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Request location permissions
        const locationPermission = await Geolocation.requestPermissions()
        
        // Request notification permissions
        const notificationPermission = await LocalNotifications.requestPermissions()
        
        const hasLocationPermission = locationPermission.location === 'granted'
        const hasNotificationPermission = notificationPermission.display === 'granted'
        
        set({ hasPermission: hasLocationPermission && hasNotificationPermission })
        return hasLocationPermission && hasNotificationPermission
      } else {
        // Web permissions
        if ('geolocation' in navigator) {
          try {
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject)
            })
            set({ hasPermission: true })
            return true
          } catch (error) {
            console.error('Geolocation permission denied:', error)
            set({ hasPermission: false })
            return false
          }
        }
        return false
      }
    } catch (error) {
      console.error('Failed to request permissions:', error)
      set({ hasPermission: false })
      return false
    }
  },

  getCurrentPosition: async () => {
    const { hasPermission } = get()
    
    if (!hasPermission) {
      throw new Error('Location permission not granted')
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      })
      
      // Convert Capacitor Position to GeolocationPosition
      const geoPosition: GeolocationPosition = {
        coords: {
          ...position.coords,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
          toJSON: () => position.coords
        },
        timestamp: position.timestamp,
        toJSON: () => position
      }
      
      set({ currentPosition: geoPosition })
      return geoPosition
    } catch (error) {
      console.error('Failed to get current position:', error)
      throw error
    }
  },

  startTracking: async () => {
    const { hasPermission, isTracking } = get()
    
    if (!hasPermission) {
      throw new Error('Location permission not granted')
    }
    
    if (isTracking) {
      return
    }

    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000
        },
        (position) => {
          if (position) {
            // Convert Capacitor Position to GeolocationPosition
            const geoPosition: GeolocationPosition = {
              coords: {
                ...position.coords,
                altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
                toJSON: () => position.coords
              },
              timestamp: position.timestamp,
              toJSON: () => position
            }
            set({ currentPosition: geoPosition })
            
            // Check proximity to checkpoints
            const { nearbyCheckpoints } = get()
            if (nearbyCheckpoints.length > 0) {
              get().checkProximity(nearbyCheckpoints)
            }
          }
        }
      )
      
      set({ watchId: watchId, isTracking: true })
    } catch (error) {
      console.error('Failed to start tracking:', error)
      throw error
    }
  },

  stopTracking: () => {
    const { watchId } = get()
    
    if (watchId !== undefined) {
      Geolocation.clearWatch({ id: watchId })
      set({ watchId: undefined, isTracking: false })
    }
  },

  startBackgroundTracking: async () => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Background tracking only available on native platforms')
      return
    }

    try {
      // This would use @capacitor-community/background-geolocation
      // For now, we'll use regular tracking with background mode
      await get().startTracking()
      
      console.log('Background tracking started')
    } catch (error) {
      console.error('Failed to start background tracking:', error)
      throw error
    }
  },

  stopBackgroundTracking: () => {
    get().stopTracking()
    console.log('Background tracking stopped')
  },

  checkProximity: async (checkpoints: Checkpoint[]) => {
    const { currentPosition, triggeredCheckpoints } = get()
    
    if (!currentPosition) {
      return
    }

    const { latitude, longitude, accuracy } = currentPosition.coords
    
    // Skip if accuracy is too poor
    if (accuracy && accuracy > MIN_ACCURACY_METERS) {
      return
    }

    const currentLatLng: LatLng = { lat: latitude, lng: longitude }
    
    for (const checkpoint of checkpoints) {
      // Skip if already triggered
      if (triggeredCheckpoints.has(checkpoint.id)) {
        continue
      }
      
      // Calculate distance using Haversine formula
      const distance = calculateDistance(currentLatLng, {
        lat: checkpoint.lat,
        lng: checkpoint.lng
      })
      
      // Check if within geofence radius
      if (distance <= checkpoint.radius_m) {
        await get().triggerCheckpoint(checkpoint)
      }
    }
  },

  triggerCheckpoint: async (checkpoint: Checkpoint) => {
    const { triggeredCheckpoints } = get()
    
    // Mark as triggered
    const newTriggered = new Set(triggeredCheckpoints)
    newTriggered.add(checkpoint.id)
    set({ triggeredCheckpoints: newTriggered })
    
    try {
      // Show local notification
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Checkpoint Reached!',
            body: `You've reached ${checkpoint.name || 'a checkpoint'}. Tap your NFC to activate!`,
            id: parseInt(checkpoint.id.slice(-6), 16), // Convert to number
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              checkpoint_id: checkpoint.id,
              action: 'activate_checkpoint'
            }
          }
        ]
      })
      
      console.log(`Checkpoint ${checkpoint.id} triggered`)
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  },

  clearTriggeredCheckpoints: () => {
    set({ triggeredCheckpoints: new Set() })
  }
}))

// Haversine distance calculation
function calculateDistance(pos1: LatLng, pos2: LatLng): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRadians(pos2.lat - pos1.lat)
  const dLng = toRadians(pos2.lng - pos1.lng)
  const lat1 = toRadians(pos1.lat)
  const lat2 = toRadians(pos2.lat)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}