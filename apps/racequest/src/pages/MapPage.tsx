import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import { MapPin, Navigation, Layers, Search } from 'lucide-react'
import { useGeolocationStore } from '../stores/geolocationStore'
import { useAppStore } from '../stores/appStore'
import type { Route, Checkpoint } from '../types'

// Sample data for demonstration
const sampleRoutes: Route[] = [
  {
    id: 'winterberg-demo',
    name: 'Winterberg Demo Route',
    description: 'A sample ski route for testing',
    mode: 'ski',
    polyline: [
      { lat: 51.1820, lng: 8.4870 },
      { lat: 51.1825, lng: 8.4875 },
      { lat: 51.1830, lng: 8.4880 },
      { lat: 51.1835, lng: 8.4885 }
    ],
    distance_m: 1200,
    elevation_gain_m: 150,
    difficulty: 'intermediate',
    checkpoints: [
      {
        id: 'cp001',
        lat: 51.1822,
        lng: 8.4872,
        radius_m: 30,
        name: 'Start Point',
        actions: [{ type: 'geofence' }, { type: 'nfc', tag_id: 'tag001' }],
        state: 'locked'
      },
      {
        id: 'cp002',
        lat: 51.1828,
        lng: 8.4878,
        radius_m: 25,
        name: 'Mid Station',
        actions: [{ type: 'geofence' }, { type: 'nfc', tag_id: 'tag002' }],
        state: 'locked'
      }
    ],
    created_by: 'demo-user',
    created_at: Date.now()
  }
]

// Component to handle map updates
function MapUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  
  return null
}

export default function MapPage() {
  const { currentPosition, hasPermission, requestPermissions, startTracking } = useGeolocationStore()
  const { selectedRoute, setSelectedRoute } = useAppStore()
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([51.1820, 8.4870])
  const [routes] = useState<Route[]>(sampleRoutes)
  const [, setSelectedCheckpoint] = useState<Checkpoint | null>(null)
  const [showRoutes, setShowRoutes] = useState(true)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    // Initialize location tracking
    const initLocation = async () => {
      if (!hasPermission) {
        await requestPermissions()
      }
      await startTracking()
    }
    
    initLocation()
  }, [hasPermission, requestPermissions, startTracking])

  useEffect(() => {
    // Update map center when current position changes
    if (currentPosition) {
      const { latitude, longitude } = currentPosition.coords
      setMapCenter([latitude, longitude])
    }
  }, [currentPosition])

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route)
    // Center map on route
    if (route.polyline.length > 0) {
      const firstPoint = route.polyline[0]
      setMapCenter([firstPoint.lat, firstPoint.lng])
    }
  }

  const handleCheckpointClick = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint)
  }

  const getCurrentLocationIcon = () => {
    return new (window as any).L.DivIcon({
      html: `
        <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg">
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        </div>
      `,
      className: 'current-location-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    })
  }

  const getCheckpointIcon = (checkpoint: Checkpoint) => {
    const color = checkpoint.state === 'active' ? 'green' : 
                  checkpoint.state === 'seen' ? 'yellow' : 'red'
    
    return new (window as any).L.DivIcon({
      html: `
        <div class="w-8 h-8 bg-${color}-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
      `,
      className: 'checkpoint-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
  }

  return (
    <div className="relative h-screen">
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={15}
        className="h-full w-full"
        ref={mapRef}
      >
        <MapUpdater center={mapCenter} />
        
        {/* Base Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current Location */}
        {currentPosition && 
         currentPosition.coords.latitude !== undefined && 
         currentPosition.coords.longitude !== undefined &&
         !isNaN(currentPosition.coords.latitude) &&
         !isNaN(currentPosition.coords.longitude) && (
          <Marker
            position={[currentPosition.coords.latitude, currentPosition.coords.longitude]}
            icon={getCurrentLocationIcon()}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
                <p className="text-sm text-gray-600">
                  Accuracy: ±{Math.round(currentPosition.coords.accuracy || 0)}m
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Routes */}
        {showRoutes && routes.map(route => (
          <div key={route.id}>
            {/* Route Polyline */}
            <Polyline
              positions={route.polyline
                .filter(p => p.lat !== undefined && p.lng !== undefined && !isNaN(p.lat) && !isNaN(p.lng))
                .map(p => [p.lat, p.lng] as LatLngExpression)
              }
              color={selectedRoute?.id === route.id ? '#0ea5e9' : '#6b7280'}
              weight={selectedRoute?.id === route.id ? 4 : 2}
              opacity={0.8}
              eventHandlers={{
                click: () => handleRouteSelect(route)
              }}
            />
            
            {/* Checkpoints */}
            {route.checkpoints
              .filter(checkpoint => 
                checkpoint.lat !== undefined && 
                checkpoint.lng !== undefined && 
                !isNaN(checkpoint.lat) && 
                !isNaN(checkpoint.lng)
              )
              .map(checkpoint => (
                <Marker
                  key={checkpoint.id}
                  position={[checkpoint.lat, checkpoint.lng]}
                  icon={getCheckpointIcon(checkpoint)}
                  eventHandlers={{
                    click: () => handleCheckpointClick(checkpoint)
                  }}
                >
                  <Popup>
                    <div className="min-w-48">
                      <h3 className="font-semibold text-lg">{checkpoint.name || 'Checkpoint'}</h3>
                      {checkpoint.description && (
                        <p className="text-sm text-gray-600 mb-2">{checkpoint.description}</p>
                      )}
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Status:</span> {checkpoint.state}</p>
                        <p><span className="font-medium">Radius:</span> {checkpoint.radius_m}m</p>
                        <p><span className="font-medium">Actions:</span> {checkpoint.actions.map(a => a.type).join(', ')}</p>
                      </div>
                      {checkpoint.state === 'seen' && (
                        <button className="mt-2 w-full bg-grounded-500 text-white py-2 px-4 rounded-lg text-sm font-medium">
                          Tap NFC to Activate
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </div>
        ))}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <button
          onClick={() => {
            if (currentPosition) {
              setMapCenter([currentPosition.coords.latitude, currentPosition.coords.longitude])
            }
          }}
          className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          disabled={!currentPosition}
        >
          <Navigation className="w-5 h-5 text-grounded-600" />
        </button>
        
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow ${
            showRoutes ? 'bg-grounded-500 text-white' : 'bg-white text-grounded-600'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-20 z-[1000]">
        <div className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search routes, locations..."
            className="flex-1 outline-none text-gray-700"
          />
        </div>
      </div>

      {/* Route Info Panel */}
      {selectedRoute && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-xl shadow-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{selectedRoute.name}</h3>
                <p className="text-sm text-gray-600">{selectedRoute.description}</p>
              </div>
              <button
                onClick={() => setSelectedRoute(undefined)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-grounded-600">
                  {(selectedRoute.distance_m / 1000).toFixed(1)}km
                </div>
                <div className="text-xs text-gray-600">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-grounded-600">
                  {selectedRoute.elevation_gain_m}m
                </div>
                <div className="text-xs text-gray-600">Elevation</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-grounded-600">
                  {selectedRoute.checkpoints.length}
                </div>
                <div className="text-xs text-gray-600">Checkpoints</div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 bg-grounded-500 text-white py-2 px-4 rounded-lg font-medium">
                Start Route
              </button>
              <button className="flex-1 border border-grounded-500 text-grounded-500 py-2 px-4 rounded-lg font-medium">
                Join Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Request */}
      {!hasPermission && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-grounded-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Location Access Required
              </h3>
              <p className="text-gray-600 mb-4">
                RaceQuest needs location access to track your progress and verify checkpoint visits.
              </p>
              <button
                onClick={requestPermissions}
                className="w-full bg-grounded-500 text-white py-2 px-4 rounded-lg font-medium"
              >
                Enable Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}