import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

// Pages
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import TeamsPage from './pages/TeamsPage'
import ProfilePage from './pages/ProfilePage'
import RouteMakerPage from './pages/RouteMakerPage'

// Components
import Navigation from './components/Navigation'
import LoadingScreen from './components/LoadingScreen'

// Hooks
import { useAppStore } from './stores/appStore'
import { useNostrStore } from './stores/nostrStore'
import { useGeolocationStore } from './stores/geolocationStore'

function App() {
  const { isLoading, initialize } = useAppStore()
  const { connect } = useNostrStore()
  const { requestPermissions } = useGeolocationStore()

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize app state
        await initialize()
        
        // Connect to Nostr relays
        await connect()
        
        // Request location permissions on native platforms
        if (Capacitor.isNativePlatform()) {
          await requestPermissions()
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    initApp()
  }, [initialize, connect, requestPermissions])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grounded-500 to-grounded-700">
      <div className="safe-area-top">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/route-maker" element={<RouteMakerPage />} />
        </Routes>
      </div>
      <div className="safe-area-bottom">
        <Navigation />
      </div>
    </div>
  )
}

export default App