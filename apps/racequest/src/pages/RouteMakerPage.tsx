import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import { Minus, Save, Trash2, Wand2, MapPin } from 'lucide-react'
import type { LatLng, Route, Checkpoint } from '../types'

// Component for handling map clicks
function MapClickHandler({ onMapClick, isDrawing }: { onMapClick: (latlng: LatLng) => void, isDrawing: boolean }) {
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    }
  })
  return null
}

export default function RouteMakerPage() {
  const [routeName, setRouteName] = useState('')
  const [routeDescription, setRouteDescription] = useState('')
  const [routeMode, setRouteMode] = useState<'ski' | 'walk' | 'run' | 'bike'>('walk')
  const [polyline, setPolyline] = useState<LatLng[]>([])
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [showAutoPlace, setShowAutoPlace] = useState(false)
  const [autoPlaceCount, setAutoPlaceCount] = useState(10)
  const [autoPlaceDistance, setAutoPlaceDistance] = useState(100)
  const [autoPlaceRadius, setAutoPlaceRadius] = useState(30)
  const [, setSelectedCheckpoint] = useState<Checkpoint | null>(null)
  const mapRef = useRef<any>(null)

  const mapCenter: LatLngExpression = polyline.length > 0 
    ? [polyline[0].lat, polyline[0].lng] 
    : [51.1820, 8.4870]

  const handleMapClick = (latlng: LatLng) => {
    if (isDrawing) {
      setPolyline(prev => [...prev, latlng])
    }
  }

  const undoLastPoint = () => {
    setPolyline(prev => prev.slice(0, -1))
  }

  const clearRoute = () => {
    setPolyline([])
    setCheckpoints([])
  }

  const finishDrawing = () => {
    setIsDrawing(false)
  }

  const autoPlaceCheckpoints = async () => {
    if (polyline.length < 2) {
      alert('Please draw a route first')
      return
    }

    // Calculate total route distance
    const totalDistance = calculateRouteDistance(polyline)
    const spacing = totalDistance / (autoPlaceCount + 1)

    const newCheckpoints: Checkpoint[] = []
    // let accumulatedDistance = 0

    for (let i = 1; i <= autoPlaceCount; i++) {
      const targetDistance = spacing * i
      const point = interpolatePointAtDistance(polyline, targetDistance)
      
      if (point) {
        newCheckpoints.push({
          id: `cp-${Date.now()}-${i}`,
          lat: point.lat,
          lng: point.lng,
          radius_m: autoPlaceRadius,
          name: `Checkpoint ${i}`,
          actions: [
            { type: 'geofence' },
            { type: 'nfc', tag_id: `tag-${i}` }
          ],
          state: 'locked'
        })
      }
    }

    setCheckpoints(newCheckpoints)
    setShowAutoPlace(false)
  }

  const saveRoute = async () => {
    if (!routeName.trim() || polyline.length < 2) {
      alert('Please provide a route name and draw a route')
      return
    }

    const route: Route = {
      id: `route-${Date.now()}`,
      name: routeName,
      description: routeDescription,
      mode: routeMode,
      polyline,
      distance_m: calculateRouteDistance(polyline),
      checkpoints,
      created_by: 'current-user', // Would be actual user pubkey
      created_at: Date.now()
    }

    // Here we would publish to Nostr
    console.log('Saving route:', route)
    
    // Reset form
    setRouteName('')
    setRouteDescription('')
    setPolyline([])
    setCheckpoints([])
    
    alert('Route saved successfully!')
  }

  const getCheckpointIcon = () => {
    return new (window as any).L.DivIcon({
      html: `
        <div class="w-8 h-8 bg-grounded-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center cursor-pointer">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
      `,
      className: 'checkpoint-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm safe-area-top z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Route Maker</h1>
          <p className="text-sm text-grounded-600">Create and design your own routes</p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={15}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onMapClick={handleMapClick} isDrawing={isDrawing} />
          
          {/* Route Polyline */}
          {polyline.length > 1 && (
            <Polyline
              positions={polyline.map(p => [p.lat, p.lng] as LatLngExpression)}
              color="#0ea5e9"
              weight={4}
              opacity={0.8}
            />
          )}
          
          {/* Route Points */}
          {polyline.map((point, index) => (
            <Marker
              key={index}
              position={[point.lat, point.lng]}
              icon={new (window as any).L.DivIcon({
                html: `
                  <div class="w-4 h-4 bg-grounded-500 border-2 border-white rounded-full shadow-lg">
                    <div class="text-xs text-white font-bold text-center leading-none">${index + 1}</div>
                  </div>
                `,
                className: 'route-point-marker',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
            />
          ))}
          
          {/* Checkpoints */}
          {checkpoints.map(checkpoint => (
            <Marker
              key={checkpoint.id}
              position={[checkpoint.lat, checkpoint.lng]}
              icon={getCheckpointIcon()}
              eventHandlers={{
                click: () => setSelectedCheckpoint(checkpoint)
              }}
            />
          ))}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-[1000] space-y-2">
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`p-3 rounded-lg shadow-lg transition-colors ${
              isDrawing 
                ? 'bg-grounded-500 text-white' 
                : 'bg-white text-grounded-600 hover:bg-grounded-50'
            }`}
          >
            <MapPin className="w-5 h-5" />
          </button>
          
          <button
            onClick={undoLastPoint}
            disabled={polyline.length === 0}
            className="p-3 bg-white text-grounded-600 rounded-lg shadow-lg hover:bg-grounded-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAutoPlace(true)}
            disabled={polyline.length < 2}
            className="p-3 bg-white text-grounded-600 rounded-lg shadow-lg hover:bg-grounded-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-5 h-5" />
          </button>
        </div>

        {/* Drawing Status */}
        {isDrawing && (
          <div className="absolute top-4 left-4 z-[1000]">
            <div className="bg-grounded-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">Drawing Mode Active</p>
              <p className="text-xs opacity-90">Tap on the map to add points</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="bg-white border-t border-gray-200 safe-area-bottom">
        <div className="px-4 py-4 space-y-4">
          {/* Route Info */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Route name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-grounded-500"
            />
            <select
              value={routeMode}
              onChange={(e) => setRouteMode(e.target.value as any)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-grounded-500"
            >
              <option value="walk">Walking</option>
              <option value="run">Running</option>
              <option value="bike">Cycling</option>
              <option value="ski">Skiing</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Route description (optional)"
            value={routeDescription}
            onChange={(e) => setRouteDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-grounded-500"
          />

          {/* Stats */}
          {polyline.length > 1 && (
            <div className="flex justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <span>Distance: {(calculateRouteDistance(polyline) / 1000).toFixed(2)}km</span>
              <span>Points: {polyline.length}</span>
              <span>Checkpoints: {checkpoints.length}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={clearRoute}
              disabled={polyline.length === 0}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Clear
            </button>
            
            {isDrawing ? (
              <button
                onClick={finishDrawing}
                className="flex-1 py-3 px-4 bg-grounded-500 text-white rounded-lg font-medium"
              >
                Finish Drawing
              </button>
            ) : (
              <button
                onClick={saveRoute}
                disabled={!routeName.trim() || polyline.length < 2}
                className="flex-1 py-3 px-4 bg-grounded-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Route
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-place Modal */}
      {showAutoPlace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-place Checkpoints</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of checkpoints
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={autoPlaceCount}
                  onChange={(e) => setAutoPlaceCount(parseInt(e.target.value) || 10)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-grounded-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum distance (meters)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={autoPlaceDistance}
                  onChange={(e) => setAutoPlaceDistance(parseInt(e.target.value) || 100)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-grounded-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Checkpoint radius (meters)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={autoPlaceRadius}
                  onChange={(e) => setAutoPlaceRadius(parseInt(e.target.value) || 30)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-grounded-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAutoPlace(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={autoPlaceCheckpoints}
                className="flex-1 py-2 px-4 bg-grounded-500 text-white rounded-lg font-medium"
              >
                Place Checkpoints
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility functions
function calculateRouteDistance(polyline: LatLng[]): number {
  if (polyline.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 1; i < polyline.length; i++) {
    totalDistance += haversineDistance(polyline[i - 1], polyline[i])
  }
  return totalDistance
}

function haversineDistance(pos1: LatLng, pos2: LatLng): number {
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

function interpolatePointAtDistance(polyline: LatLng[], targetDistance: number): LatLng | null {
  let accumulatedDistance = 0
  
  for (let i = 1; i < polyline.length; i++) {
    const segmentDistance = haversineDistance(polyline[i - 1], polyline[i])
    
    if (accumulatedDistance + segmentDistance >= targetDistance) {
      const ratio = (targetDistance - accumulatedDistance) / segmentDistance
      const lat = polyline[i - 1].lat + (polyline[i].lat - polyline[i - 1].lat) * ratio
      const lng = polyline[i - 1].lng + (polyline[i].lng - polyline[i - 1].lng) * ratio
      return { lat, lng }
    }
    
    accumulatedDistance += segmentDistance
  }
  
  return null
}