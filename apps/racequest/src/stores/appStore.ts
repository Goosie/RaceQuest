import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, AppNotification, Route, Team, Challenge, LatLng } from '../types'

interface AppStore extends AppState {
  // Actions
  initialize: () => Promise<void>
  setLoading: (loading: boolean) => void
  setCurrentUser: (user: AppState['currentUser']) => void
  setCurrentLocation: (location: LatLng) => void
  setSelectedRoute: (route: Route | undefined) => void
  setSelectedTeam: (team: Team | undefined) => void
  setSelectedChallenge: (challenge: Challenge | undefined) => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  reset: () => void
}

const initialState: AppState = {
  isLoading: true,
  currentUser: undefined,
  currentLocation: undefined,
  selectedRoute: undefined,
  selectedTeam: undefined,
  selectedChallenge: undefined,
  notifications: []
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      initialize: async () => {
        try {
          set({ isLoading: true })
          
          // Initialize app-specific logic here
          // For now, just simulate initialization
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          set({ isLoading: false })
        } catch (error) {
          console.error('Failed to initialize app:', error)
          set({ isLoading: false })
        }
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      setCurrentUser: (currentUser: AppState['currentUser']) => {
        set({ currentUser })
      },

      setCurrentLocation: (currentLocation: LatLng) => {
        set({ currentLocation })
      },

      setSelectedRoute: (selectedRoute: Route | undefined) => {
        set({ selectedRoute })
      },

      setSelectedTeam: (selectedTeam: Team | undefined) => {
        set({ selectedTeam })
      },

      setSelectedChallenge: (selectedChallenge: Challenge | undefined) => {
        set({ selectedChallenge })
      },

      addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: AppNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false
        }
        
        set(state => ({
          notifications: [newNotification, ...state.notifications]
        }))
      },

      markNotificationRead: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'grounded-app-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        selectedRoute: state.selectedRoute,
        selectedTeam: state.selectedTeam,
        selectedChallenge: state.selectedChallenge
      })
    }
  )
)